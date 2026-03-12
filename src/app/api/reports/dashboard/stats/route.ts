import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todayPatients = await prisma.visit.count({
            where: {
                visit_date: { gte: todayStart, lte: todayEnd },
                is_active: true,
            },
        });

        // Income has no income_date → filter via visit.visit_date
        const todayIncome = await prisma.income.aggregate({
            _sum: { amount: true },
            where: {
                visit: { visit_date: { gte: todayStart, lte: todayEnd } },
            },
        });

        // Products with product_type = drug
        const totalDrugStock = await prisma.product.count({
            where: { is_active: true, product_type: "drug" },
        });

        const products = await prisma.product.findMany({
            where: { is_active: true, product_type: "drug" },
            include: {
                lots: { where: { is_active: true } },
            },
        });

        const lowStockCount = products.filter((p) => {
            const totalStock = p.lots.reduce(
                (sum, lot) => sum + Number(lot.qty_remaining ?? 0),
                0,
            );
            return totalStock < p.min_stock;
        }).length;

        return NextResponse.json({
            data: {
                todayPatients,
                todayIncome: Number(todayIncome._sum.amount ?? 0),
                totalDrugStock,
                lowStockCount,
            },
        });
    } catch (error) {
        console.log("Dashboard stat API Error", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
