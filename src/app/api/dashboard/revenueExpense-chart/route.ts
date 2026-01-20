import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const revenue = await prisma.income.groupBy({
            by: ["income_date"],
            _sum: { amount: true },
            where: { is_active: true },
            orderBy: { income_date: "asc" },
            take: 7,
        });

        const expense = await prisma.expense.groupBy({
            by: ["expense_date"],
            _sum: { amount: true },
            where: { is_active: true },
            orderBy: { expense_date: "asc" },
            take: 7,
        });

        const revenueExpenseChart = revenue.map((r, index) => ({
            date: r.income_date.toLocaleDateString("th-TH"),
            รายรับ: Number(r._sum.amount ?? 0),
            รายจ่าย: Number(expense[index]?._sum.amount ?? 0),
        }));

        return NextResponse.json({
            data: revenueExpenseChart
        });
    } catch (error) {
        console.log("Revenue Expense Chart API Error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
