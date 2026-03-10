import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const daysParam = searchParams.get("days");
        const days = daysParam ? parseInt(daysParam, 10) : 30;

        if (isNaN(days) || days < 0) {
            return NextResponse.json(
                { message: "รูปแบบจำนวนวันไม่ถูกต้อง" },
                { status: 400 },
            );
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + days);

        const expiringLots = await prisma.inventoryLot.findMany({
            where: {
                is_active: true,
                deleted_at: null,
                qty_remaining: { gt: 0 },
                expire_date: {
                    lte: targetDate,
                },
            },
            include: {
                product: {
                    select: {
                        product_id: true,
                        product_name: true,
                        unit: true,
                        category_id: true,
                        product_type: true,
                    },
                },
            },
            orderBy: {
                expire_date: "asc",
            },
        });

        return NextResponse.json({
            data: expiringLots,
            meta: {
                count: expiringLots.length,
                days_threshold: days,
            },
        });
    } catch (error: any) {
        console.error("Get expiring lots error:", error);
        return NextResponse.json(
            {
                message: "เกิดข้อผิดพลาดในการดึงข้อมูลยารอวันหมดอายุ",
                error: error.message,
            },
            { status: 500 },
        );
    }
}
