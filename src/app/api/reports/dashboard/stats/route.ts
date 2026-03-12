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

        // Income has income_date field
        const todayIncome = await prisma.income.aggregate({
            _sum: { amount: true },
            where: {
                income_date: { gte: todayStart, lte: todayEnd },
                deleted_at: null,
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
    } catch (error: any) {
        console.error("Dashboard stat API Error", error);
        return NextResponse.json(
            { 
                message: error.message || "Internal Server Error",
                stack: error.stack
            },
            { status: 500 },
        );
    }
}
