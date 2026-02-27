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
            // Default to month
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

        // 1. Fetch summary total grouped by type
        const expenseGroups = await prisma.expense.groupBy({
            by: ["expense_type"],
            _sum: {
                amount: true,
            },
            where: {
                is_active: true,
                deleted_at: null,
                expense_date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        // 2. Calculate total sum for percentage calculation
        const totalAmount = expenseGroups.reduce((acc, curr) => {
            return acc + (Number(curr._sum.amount) || 0);
        }, 0);

        // 3. Format data to send back to Frontend
        const stats = expenseGroups.map((group) => {
            const amount = Number(group._sum.amount) || 0;
            const percentage =
                totalAmount > 0 ? (amount / totalAmount) * 100 : 0;

            return {
                type: group.expense_type,
                amount: amount,
                percentage: Math.round(percentage), // Round for cleaner display
            };
        });

        return NextResponse.json({
            total: totalAmount,
            data: stats,
        });
    } catch (error) {
        console.error("Error fetching expense stats:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { expense_date, expense_type, amount, description, receipt_no } =
            body;

        // 1. Validation: Check required fields
        if (!expense_date || !amount || !expense_type) {
            return NextResponse.json(
                {
                    error: "กรุณากรอกข้อมูลที่จำเป็น (วันที่, ประเภท, จำนวนเงิน)",
                },
                { status: 400 },
            );
        }

        // 2. Create new Expense entry in Database
        const newExpense = await prisma.expense.create({
            data: {
                expense_date: new Date(expense_date),
                expense_type: expense_type,
                amount: Number(amount),
                description: description || undefined,
                receipt_no: receipt_no || undefined,
                is_active: true,
            },
        });

        return NextResponse.json(newExpense, { status: 201 });
    } catch (error) {
        console.error("Error creating expense:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error },
            { status: 500 },
        );
    }
}
