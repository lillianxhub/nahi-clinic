import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getPagination } from "@/utils/pagination";
import { MEDICINE_ORDER_FIELDS } from "@/constants/medicine";

type MedicineOrderKey = keyof typeof MEDICINE_ORDER_FIELDS;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, pageSize, skip, take } = getPagination(searchParams);

    const orderKey = searchParams.get("orderBy");
    const direction = searchParams.get("order") === "desc" ? "desc" : "asc";

    let orderBy: Record<string, "asc" | "desc"> | undefined;

    if (orderKey && orderKey in MEDICINE_ORDER_FIELDS) {
      const key = orderKey as MedicineOrderKey;
      orderBy = {
        [MEDICINE_ORDER_FIELDS[key]]: direction,
      };
    }

    const [data, total, lowStockCount] = await Promise.all([
      prisma.drug.findMany({
        skip,
        take,
        orderBy,
        include: {
          category: true,
          lots: true,
        },
      }),

      prisma.drug.count(),

      (async () => {
        const drugs = await prisma.drug.findMany({
          select: {
            min_stock: true,
            lots: {
              select: { qty_remaining: true },
            },
          },
          where: { is_active: true },
        });

        return drugs.filter((drug) => {
          const totalQty = drug.lots.reduce(
            (sum, lot) => sum + lot.qty_remaining,
            0
          );
          return totalQty <= drug.min_stock;
        }).length;
      })(),
    ]);

    return NextResponse.json({
      data,
      summary: {
        lowStockCount,
      },
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount: Math.ceil(total / pageSize),
          total,
        },
      },
    });
  } catch (error: any) {
    console.error("Get medicine error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
      { status: 500 }
    );
  }
}
