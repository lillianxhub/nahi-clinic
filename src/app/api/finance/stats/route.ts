import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const now = new Date();
        const currentMonthStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
        );
        const currentMonthEnd = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
        );
        const prevMonthStart = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1,
        );
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const [monthIncome, monthExpense, prevMonthIncome, prevMonthExpense] =
            await Promise.all([
                prisma.income.aggregate({
                    _sum: { amount: true },
                    where: {
                        income_date: {
                            gte: currentMonthStart,
                            lte: currentMonthEnd,
                        },
                        is_active: true,
                    },
                }),
                prisma.expense.aggregate({
                    _sum: { amount: true },
                    where: {
                        expense_date: {
                            gte: currentMonthStart,
                            lte: currentMonthEnd,
                        },
                        is_active: true,
                    },
                }),
                prisma.income.aggregate({
                    _sum: { amount: true },
                    where: {
                        income_date: { gte: prevMonthStart, lte: prevMonthEnd },
                        is_active: true,
                    },
                }),
                prisma.expense.aggregate({
                    _sum: { amount: true },
                    where: {
                        expense_date: {
                            gte: prevMonthStart,
                            lte: prevMonthEnd,
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
