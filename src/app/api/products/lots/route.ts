import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/utils/pagination";

export async function GET(req: Request) {
    try {
        const searchParams = new URL(req.url).searchParams;
        const { page, pageSize, skip, take } = getPagination(searchParams);
        const orderBy = { created_at: "desc" as const };

        const druglots = await prisma.inventoryLot.findMany({
            skip,
            take,
            orderBy,
            where: { deleted_at: null },
            include: {
                product: {
                    select: {
                        product_id: true,
                        product_name: true,
                        unit: true,
                    },
                },
            },
        });

        const total = await prisma.inventoryLot.count({
            where: { deleted_at: null },
        });

        const pageCount = Math.ceil(total / pageSize);

        return NextResponse.json({
            data: druglots,
            meta: {
                pagination: { page, pageSize, pageCount, total },
            },
        });
    } catch (error: any) {
        console.error("Get drug lots error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 },
        );
    }
}
