import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    startOfDay,
    endOfDay,
    startOfMonth,
    endOfMonth,
    subDays,
    subMonths,
    format,
    isSameMonth,
    isSameDay,
    addDays,
    addMonths,
} from "date-fns";
import { th } from "date-fns/locale";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const range = searchParams.get("range") || "year";
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        const now = new Date();
        let startDate: Date;
        let endDate: Date;
        let groupBy: "day" | "month" = "month";

        if (startDateParam && endDateParam) {
            startDate = startOfDay(new Date(startDateParam));
            endDate = endOfDay(new Date(endDateParam));
            const diffDays = Math.ceil(
                (endDate.getTime() - startDate.getTime()) /
                    (1000 * 60 * 60 * 24),
            );
            groupBy = diffDays > 60 ? "month" : "day";
        } else if (range === "week") {
            startDate = startOfDay(subDays(now, 6));
            endDate = endOfDay(now);
            groupBy = "day";
        } else if (range === "month") {
            startDate = startOfDay(subDays(now, 29));
            endDate = endOfDay(now);
            groupBy = "day";
        } else {
            startDate = startOfMonth(subMonths(now, 11));
            endDate = endOfMonth(now);
            groupBy = "month";
        }

        // Income: filter via visit.visit_date (no income_date field)
        const incomes = await prisma.income.findMany({
            where: {
                deleted_at: null,
                visit: {
                    visit_date: { gte: startDate, lte: endDate },
                    deleted_at: null,
                },
            },
            select: {
                amount: true,
                visit: { select: { visit_date: true } },
            },
        });

        // Expense: filter by created_at (no expense_date field)
        const expenses = await prisma.expense.findMany({
            where: {
                created_at: { gte: startDate, lte: endDate },
                deleted_at: null,
            },
            select: { amount: true, created_at: true },
        });

        const chartData = [];
        let currentLoop = startDate;

        while (currentLoop <= endDate) {
            let label = "";
            let incomeSum = 0;
            let expenseSum = 0;

            if (groupBy === "month") {
                label = format(currentLoop, "MMM", { locale: th });

                incomeSum = incomes
                    .filter((i) =>
                        isSameMonth(i.visit!.visit_date, currentLoop),
                    )
                    .reduce((sum, i) => sum + Number(i.amount), 0);

                expenseSum = expenses
                    .filter((e) => isSameMonth(e.created_at, currentLoop))
                    .reduce((sum, e) => sum + Number(e.amount), 0);

                currentLoop = addMonths(currentLoop, 1);
            } else {
                label = format(currentLoop, "d MMM", { locale: th });

                incomeSum = incomes
                    .filter((i) => isSameDay(i.visit!.visit_date, currentLoop))
                    .reduce((sum, i) => sum + Number(i.amount), 0);

                expenseSum = expenses
                    .filter((e) => isSameDay(e.created_at, currentLoop))
                    .reduce((sum, e) => sum + Number(e.amount), 0);

                currentLoop = addDays(currentLoop, 1);
            }

            chartData.push({
                name: label,
                income: incomeSum,
                expense: expenseSum,
            });
        }

        return NextResponse.json(chartData);
    } catch (error) {
        console.error("Error fetching finance chart data:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
