import { buildInclude } from "@/utils/buildInclude";
import { MEDICINE_INCLUDES, MEDICINE_ORDER_FIELDS } from "@/constants/medicine";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("pageSize") ?? 10);

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const include = buildInclude(MEDICINE_INCLUDES, searchParams.get("join"));

  type MedicineOrderKey = keyof typeof MEDICINE_ORDER_FIELDS;

  const orderKey = searchParams.get("orderBy");
  const direction = searchParams.get("order") === "desc" ? "desc" : "asc";

  let orderBy = undefined;

  if (orderKey && orderKey in MEDICINE_ORDER_FIELDS) {
    const key = orderKey as MedicineOrderKey;

    orderBy = {
      [MEDICINE_ORDER_FIELDS[key]]: direction,
    };
  }

  const [data, total] = await Promise.all([
    prisma.drug.findMany({
      include,
      orderBy,
      skip,
      take,
    }),
    prisma.drug.count(),
  ]);

  return NextResponse.json({
    data,
    meta: {
      pagination: {
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
        total,
      },
    },
  });
}
