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

        const incomes = await prisma.income.findMany({
            skip,
            take,
            orderBy,
            include,
            where: { deleted_at: null },
        });

        const total = await prisma.income.count({
            where: { deleted_at: null },
        });

        const pageCount = Math.ceil(total / pageSize);

        return NextResponse.json({
            data: incomes,
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
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const income = await prisma.income.create({
            data: {
                visit_id: body.visit_id,
                income_date: body.income_date,
                amount: body.amount,
                payment_method: body.payment_method,
                receipt_no: body.receipt_no,
            }
        })

        return NextResponse.json(income, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
