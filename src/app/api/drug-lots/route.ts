import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { getPagination } from "@/utils/pagination";
import { getOrderBy, getInclude } from "@/utils/prismaQuery";

export async function GET(req: Request) {
    try {
        const searchParams = new URL(req.url).searchParams;

        const { page, pageSize, skip, take } = getPagination(searchParams);

        const orderBy = getOrderBy(searchParams);
        const include = getInclude(searchParams, ["visits"]);

        const druglots = await prisma.drug_Lot.findMany({
            skip,
            take,
            orderBy,
            include,
            where: { deleted_at: null },
        });

        const total = await prisma.drug_Lot.count({
            where: { deleted_at: null },
        });

        const pageCount = Math.ceil(total / pageSize);

        return NextResponse.json({
            data: druglots,
            meta: {
                pagination: {
                    page,
                    pageSize,
                    pageCount,
                    total,
                },
            },
        });
    } catch (error: any) {
        console.error("Register error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 }
        );
    }
}
