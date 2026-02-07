import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const filter = searchParams.get("filter") || "week";

        // 1. Set Date Range
        let startDate = new Date();
        let groupBy: "day" | "month" = "day";
        let count = 7;

        if (filter === "month") {
            startDate.setMonth(startDate.getMonth() - 1);
            groupBy = "day";
            count = 30; // โดยประมาณ
        } else if (filter === "year") {
            startDate.setFullYear(startDate.getFullYear() - 1);
            groupBy = "month";
            count = 12;
        } else {
            // week
            startDate.setDate(startDate.getDate() - 7);
            count = 7;
        }

        // 2. Fetch Data from Database
        const [revenue, expense] = await Promise.all([
            prisma.income.findMany({
                where: { is_active: true, income_date: { gte: startDate } },
                orderBy: { income_date: "asc" },
            }),
            prisma.expense.findMany({
                where: { is_active: true, expense_date: { gte: startDate } },
                orderBy: { expense_date: "asc" },
            }),
        ]);

        // 3. Create Skeleton Data (Zero Filling)
        const groupedData: Record<
            string,
            { date: string; รายรับ: number; รายจ่าย: number; rawDate: Date }
        > = {};

        for (let i = 0; i <= count; i++) {
            const d = new Date();
            if (groupBy === "day") {
                d.setDate(d.getDate() - (count - i));
            } else {
                d.setMonth(d.getMonth() - (count - i));
            }

            const key =
                groupBy === "day"
                    ? `${d.toLocaleDateString("th-TH", { month: "short" })} ${d.toLocaleDateString("th-TH", { day: "numeric" })}`
                    : d.toLocaleDateString("th-TH", {
                          month: "short",
                          year: "numeric",
                      });

            groupedData[key] = {
                date: key,
                รายรับ: 0,
                รายจ่าย: 0,
                rawDate: new Date(d), // Store for sorting
            };
        }

        // 4. Add Data from DB to Skeleton
        revenue.forEach((r) => {
            const date = r.income_date;
            const key =
                groupBy === "day"
                    ? `${date.toLocaleDateString("th-TH", { month: "short" })} ${date.toLocaleDateString("th-TH", { day: "numeric" })}`
                    : date.toLocaleDateString("th-TH", {
                          month: "short",
                          year: "numeric",
                      });

            if (groupedData[key]) {
                groupedData[key].รายรับ += Number(r.amount);
            }
        });

        expense.forEach((e) => {
            const date = e.expense_date;
            const key =
                groupBy === "day"
                    ? `${date.toLocaleDateString("th-TH", { month: "short" })} ${date.toLocaleDateString("th-TH", { day: "numeric" })}`
                    : date.toLocaleDateString("th-TH", {
                          month: "short",
                          year: "numeric",
                      });

            if (groupedData[key]) {
                groupedData[key].รายจ่าย += Number(e.amount);
            }
        });

        // 5. Convert to Array and sort by date
        const revenueExpenseChart = Object.values(groupedData)
            .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())
            .map(({ rawDate, ...rest }) => ({
                ...rest,
                fullDate: rawDate.toISOString(),
            }));

        return NextResponse.json({ data: revenueExpenseChart });
    } catch (error) {
        console.log("Revenue Expense Chart API Error", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
