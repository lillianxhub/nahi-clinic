import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    startOfDay,
    endOfDay,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    subDays,
    subMonths,
    subYears,
    format,
    isSameMonth,
    isSameDay,
    addDays,
    addMonths,
} from "date-fns";
import { th } from "date-fns/locale";

export async function GET(request: Request) {
    try {
        // 1. Receive filter from URL
        const { searchParams } = new URL(request.url);
        const range = searchParams.get("range") || "year";
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        const now = new Date();
        let startDate: Date;
        let endDate: Date;
        let groupBy: "day" | "month" = "month";

        // 2. Define time range based on filter
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

        // 3. Fetch Income data
        const incomes = await prisma.income.findMany({
            where: {
                income_date: { gte: startDate, lte: endDate },
                is_active: true,
                deleted_at: null,
            },
            select: { amount: true, income_date: true },
        });

        // 4. Fetch Expense data
        const expenses = await prisma.expense.findMany({
            where: {
                expense_date: { gte: startDate, lte: endDate },
                is_active: true,
                deleted_at: null,
            },
            select: { amount: true, expense_date: true },
        });

        // 5. Process data (Loop through time range)
        const chartData = [];
        let currentLoop = startDate;

        while (currentLoop <= endDate) {
            let label = "";
            let incomeSum = 0;
            let expenseSum = 0;

            if (groupBy === "month") {
                // --- Case: Group by month (for "Last 1 Year") ---
                label = format(currentLoop, "MMM", { locale: th }); // e.g., "Jan"

                incomeSum = incomes
                    .filter((i) => isSameMonth(i.income_date, currentLoop))
                    .reduce((sum, i) => sum + Number(i.amount), 0);

                expenseSum = expenses
                    .filter((e) => isSameMonth(e.expense_date, currentLoop))
                    .reduce((sum, e) => sum + Number(e.amount), 0);

                // Move to next month
                currentLoop = addMonths(currentLoop, 1);
            } else {
                // --- Case: Group by day (for "Last 7 Days" or "Last 1 Month") ---
                label = format(currentLoop, "d MMM", { locale: th });

                incomeSum = incomes
                    .filter((i) => isSameDay(i.income_date, currentLoop))
                    .reduce((sum, i) => sum + Number(i.amount), 0);

                expenseSum = expenses
                    .filter((e) => isSameDay(e.expense_date, currentLoop))
                    .reduce((sum, e) => sum + Number(e.amount), 0);

                // Move to next day
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
