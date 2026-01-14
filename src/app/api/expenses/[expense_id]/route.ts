import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = {
    params: {
        expense_id: string;
    };
};

export async function GET(req: Request, { params }: Params) {
    try {
        const { expense_id } = await params;

        const expense = await prisma.expense.findUnique({
            where: {
                expense_id,
            },
        });

        if (!expense) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลรายจ่าย" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: expense });
    } catch (error: any) {
        console.error("Get patient by id error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 }
        );
    }
}
