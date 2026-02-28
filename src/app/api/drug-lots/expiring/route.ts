import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/utils/pagination";

export async function GET(req: Request) {
    try {
        const searchParams = new URL(req.url).searchParams;
        const { skip, take } = getPagination(searchParams);
        const days = Number(searchParams.get("days")) || 30;

        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + days);

        const expiringLots = await prisma.drug_Lot.findMany({
            skip,
            take,
            where: {
                qty_remaining: { gt: 0 },
                expire_date: { lte: targetDate },
                is_active: true,
                deleted_at: null,
            },
            include: {
                drug: {
                    select: {
                        drug_name: true,
                        unit: true,
                    },
                },
            },
            orderBy: {
                expire_date: "asc",
            },
        });

        const total = await prisma.drug_Lot.count({
            where: {
                qty_remaining: { gt: 0 },
                expire_date: { lte: targetDate },
                is_active: true,
                deleted_at: null,
            },
        });

        return NextResponse.json({
            data: expiringLots,
            meta: { total },
        });
    } catch (error: any) {
        console.error("Fetch expiring lots error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 }
        );
    }
}
