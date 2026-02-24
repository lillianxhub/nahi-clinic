import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
                { status: 404 },
            );
        }

        return NextResponse.json({ data: expense });
    } catch (error: any) {
        console.error("Get expense by id error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 },
        );
    }
}

export async function PATCH(req: Request, { params }: Params) {
    try {
        const { expense_id } = await params;
        const body = await req.json();

        // Prevent updating ID
        delete body.expense_id;

        const updatedExpense = await prisma.expense.update({
            where: { expense_id },
            data: {
                ...body,
                updated_at: new Date(),
            },
        });

        return NextResponse.json({ data: updatedExpense });
    } catch (error: any) {
        console.error("Update expense error:", error);
        return NextResponse.json(
            { message: "ไม่สามารถแก้ไขข้อมูลรายจ่ายได้", error: error.message },
            { status: 500 },
        );
    }
}

export async function DELETE(req: Request, { params }: Params) {
    try {
        const { expense_id } = await params;

        await prisma.expense.update({
            where: { expense_id },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        return NextResponse.json({ message: "ลบข้อมูลรายจ่ายสำเร็จ" });
    } catch (error: any) {
        console.error("Delete expense error:", error);
        return NextResponse.json(
            { message: "ไม่สามารถลบข้อมูลรายจ่ายได้", error: error.message },
            { status: 500 },
        );
    }
}
