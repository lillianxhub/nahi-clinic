import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/utils/pagination";

type Params = {
    params: Promise<{
        drug_id: string;
    }>;
};

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { drug_id } = await params;

        if (!drug_id) {
            return NextResponse.json(
                { message: "drug_id ไม่ถูกต้อง" },
                { status: 400 },
            );
        }

        const drugExists = await prisma.drug.findUnique({
            where: { drug_id },
        });

        if (!drugExists) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลยา" },
                { status: 404 },
            );
        }

        const { searchParams } = new URL(req.url);
        const { page, pageSize, skip, take } = getPagination(searchParams);

        const q = searchParams.get("q");
        const status = searchParams.get("status");

        const where: Record<string, any> = { drug_id, deleted_at: null };
        if (q) {
            where.lot_no = { contains: q };
        }

        // Apply status filter based on dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        if (status === "expired") {
            where.expire_date = { lt: today };
        } else if (status === "out_of_stock") {
            where.qty_remaining = 0;
            // Optionally, we might want to still show it in "out_of_stock" even if expired,
            // but usually expired overrides out of stock. For now, just qty=0.
        } else if (status === "expiring") {
            where.expire_date = {
                gte: today,
                lte: thirtyDaysFromNow,
            };
            where.qty_remaining = { gt: 0 };
        } else if (status === "normal") {
            where.expire_date = { gt: thirtyDaysFromNow };
            where.qty_remaining = { gt: 0 };
        }

        const [data, total] = await Promise.all([
            prisma.drug_Lot.findMany({
                skip,
                take,
                where,
                orderBy: {
                    expire_date: "asc",
                },
            }),
            prisma.drug_Lot.count({ where }),
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
    } catch (error: any) {
        console.error("Get medicine lots error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 },
        );
    }
}
