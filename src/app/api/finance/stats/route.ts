import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const monthIncome = await prisma.income.aggregate({
            _sum: { amount: true },
            where: {
                income_date: {
                    gte: new Date(
                        new Date().getFullYear(),
                        new Date().getMonth(),
                        1,
                    ),
                    lte: new Date(
                        new Date().getFullYear(),
                        new Date().getMonth() + 1,
                        0,
                    ),
                },
                is_active: true,
            },
        });

        const monthExpense = await prisma.expense.aggregate({
            _sum: { amount: true },
            where: {
                expense_date: {
                    gte: new Date(
                        new Date().getFullYear(),
                        new Date().getMonth(),
                        1,
                    ),
                    lte: new Date(
                        new Date().getFullYear(),
                        new Date().getMonth() + 1,
                        0,
                    ),
                },
                is_active: true,
            },
        });

        const totalIncome = Number(monthIncome._sum.amount ?? 0);
        const totalExpense = Number(monthExpense._sum.amount ?? 0);
        const netProfit = totalIncome - totalExpense;
        const profitRate =
            totalIncome === 0
                ? 0
                : Number(((netProfit / totalIncome) * 100).toFixed(2));

        return NextResponse.json({
            data: {
                monthIncome: totalIncome,
                monthExpense: totalExpense,
                netProfit,
                profitRate,
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
