import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const range = searchParams.get("range") || "month";
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        let startDate: Date;
        let endDate: Date;

        const now = new Date();
        if (startDateParam && endDateParam) {
            startDate = new Date(startDateParam);
            endDate = new Date(endDateParam);
            endDate.setHours(23, 59, 59, 999);
        } else if (range === "year") {
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        } else if (range === "week") {
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
            endDate = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0,
                23,
                59,
                59,
            );
        }

        // Filter by expense_date instead of created_at
        const expenseGroups = await prisma.expense.groupBy({
            by: ["expense_type"],
            _sum: { amount: true },
            where: {
                deleted_at: null,
                expense_date: { gte: startDate, lte: endDate },
            },
        });

        const totalAmount = expenseGroups.reduce(
            (acc, curr) => acc + (Number(curr._sum.amount) || 0),
            0,
        );

        const stats = expenseGroups.map((group) => {
            const amount = Number(group._sum.amount) || 0;
            const percentage =
                totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
            return {
                type: group.expense_type,
                amount,
                percentage: Math.round(percentage),
            };
        });

        return NextResponse.json({ total: totalAmount, data: stats });
    } catch (error: any) {
        console.error("Error fetching expense stats:", error);
        return NextResponse.json(
            {
                message: error.message || "Internal Server Error",
                stack: error.stack,
            },
            { status: 500 },
        );
    }
}
