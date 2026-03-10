import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/utils/pagination";
import { getOrderBy } from "@/utils/prismaQuery";

type Params = {
    params: Promise<{
        drug_id: string;
    }>;
};

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { drug_id: product_id } = await params;

        if (!product_id) {
            return NextResponse.json(
                { message: "product_id ไม่ถูกต้อง" },
                { status: 400 },
            );
        }

        const productExists = await prisma.product.findUnique({
            where: { product_id },
        });

        if (!productExists) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลยา" },
                { status: 404 },
            );
        }

        const { searchParams } = new URL(req.url);
        const { page, pageSize, skip, take } = getPagination(searchParams);

        const q = searchParams.get("q");
        const status = searchParams.get("status");

        const where: any = { product_id, deleted_at: null };
        if (q) {
            where.lot_no = { contains: q };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        if (status === "expired") {
            where.expire_date = { lt: today };
        } else if (status === "out_of_stock") {
            where.qty_remaining = 0;
        } else if (status === "expiring") {
            where.expire_date = { gte: today, lte: thirtyDaysFromNow };
            where.qty_remaining = { gt: 0 };
        } else if (status === "normal") {
            where.expire_date = { gt: thirtyDaysFromNow };
            where.qty_remaining = { gt: 0 };
        }

        const orderBy = getOrderBy(searchParams, "expire_date");

        const [data, total] = await Promise.all([
            prisma.inventoryLot.findMany({ skip, take, where, orderBy }),
            prisma.inventoryLot.count({ where }),
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
    } catch (error) {
        console.error("Get medicine lots error:", error);
        return NextResponse.json(
            {
                message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
