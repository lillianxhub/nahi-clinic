import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { getPagination } from "@/utils/pagination";
import { getOrderBy, getInclude } from "@/utils/prismaQuery";

export async function GET(req: Request) {
    try {
        const searchParams = new URL(req.url).searchParams;

        const { page, pageSize, skip, take } = getPagination(searchParams);

        const orderBy = getOrderBy(searchParams);
        const include = getInclude(searchParams, ["visits"]);

        const expenses = await prisma.expense.findMany({
            skip,
            take,
            orderBy,
            include,
            where: { deleted_at: null },
        });

        const total = await prisma.expense.count({
            where: { deleted_at: null },
        });

        const pageCount = Math.ceil(total / pageSize);

        return NextResponse.json({
            data: expenses,
            meta: {
                pagination: {
                    page,
                    pageSize,
                    pageCount,
                    total,
                },
            },
        });
    } catch (error: any) {
        console.error("Register error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { expense_type, amount, description, receipt_no, expense_date } =
            body;

        // Validations
        if (!amount || !expense_type) {
            return NextResponse.json(
                { error: "กรุณากรอกข้อมูลที่จำเป็น (ประเภท, จำนวนเงิน)" },
                { status: 400 },
            );
        }

        const newExpense = await prisma.expense.create({
            data: {
                expense_type,
                amount: Number(amount),
                description: description || undefined,
                receipt_no: receipt_no || undefined,
                expense_date: expense_date
                    ? new Date(expense_date)
                    : new Date(),
            },
        });

        return NextResponse.json(newExpense, { status: 201 });
    } catch (error: any) {
        console.error("Error creating expense:", error);
        return NextResponse.json(
            {
                message: error.message || "Internal Server Error",
                stack: error.stack,
            },
            { status: 500 },
        );
    }
}
