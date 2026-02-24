import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        let currentStart: Date;
        let currentEnd: Date;
        let prevStart: Date;
        let prevEnd: Date;

        if (startDateParam && endDateParam) {
            currentStart = new Date(startDateParam);
            currentEnd = new Date(endDateParam);
            currentEnd.setHours(23, 59, 59, 999);

            const diff = currentEnd.getTime() - currentStart.getTime();
            prevStart = new Date(currentStart.getTime() - diff - 1);
            prevEnd = new Date(currentStart.getTime() - 1);
        } else {
            const now = new Date();
            currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
            currentEnd = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0,
                23,
                59,
                59,
                999,
            );
            prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            prevEnd = new Date(
                now.getFullYear(),
                now.getMonth(),
                0,
                23,
                59,
                59,
                999,
            );
        }

        const [monthIncome, monthExpense, prevMonthIncome, prevMonthExpense] =
            await Promise.all([
                prisma.income.aggregate({
                    _sum: { amount: true },
                    where: {
                        income_date: {
                            gte: currentStart,
                            lte: currentEnd,
                        },
                        is_active: true,
                    },
                }),
                prisma.expense.aggregate({
                    _sum: { amount: true },
                    where: {
                        expense_date: {
                            gte: currentStart,
                            lte: currentEnd,
                        },
                        is_active: true,
                    },
                }),
                prisma.income.aggregate({
                    _sum: { amount: true },
                    where: {
                        income_date: { gte: prevStart, lte: prevEnd },
                        is_active: true,
                    },
                }),
                prisma.expense.aggregate({
                    _sum: { amount: true },
                    where: {
                        expense_date: {
                            gte: prevStart,
                            lte: prevEnd,
                        },
                        is_active: true,
                    },
                }),
            ]);

        const totalIncome = Number(monthIncome._sum.amount ?? 0);
        const totalExpense = Number(monthExpense._sum.amount ?? 0);
        const netProfit = totalIncome - totalExpense;
        const profitRate =
            totalIncome === 0
                ? 0
                : Number(((netProfit / totalIncome) * 100).toFixed(2));

        const prevTotalIncome = Number(prevMonthIncome._sum.amount ?? 0);
        const prevTotalExpense = Number(prevMonthExpense._sum.amount ?? 0);
        const prevNetProfit = prevTotalIncome - prevTotalExpense;

        let netProfitGrowth = "0";
        if (prevNetProfit !== 0) {
            netProfitGrowth = (
                ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) *
                100
            ).toFixed(1);
        } else if (netProfit > 0) {
            netProfitGrowth = "100";
        }

        return NextResponse.json({
            data: {
                monthIncome: totalIncome,
                monthExpense: totalExpense,
                netProfit,
                profitRate,
                prevMonthNetProfit: prevNetProfit,
                netProfitGrowth: parseFloat(netProfitGrowth),
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
