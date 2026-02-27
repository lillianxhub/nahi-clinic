import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
    params: {
        income_id: string;
    };
};

export async function GET(req: Request, { params }: Params) {
    try {
        const { income_id } = await params;

        const income = await prisma.income.findUnique({
            where: {
                income_id,
            },
            include: {
                visit: {
                    include: {
                        patient: true,
                    },
                },
            },
        });

        if (!income) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลรายได้" },
                { status: 404 },
            );
        }

        return NextResponse.json({ data: income });
    } catch (error: any) {
        console.error("Get income by id error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 },
        );
    }
}

export async function PATCH(req: Request, { params }: Params) {
    try {
        const { income_id } = await params;
        const body = await req.json();

        // Prevent updating ID
        delete body.income_id;

        const updatedIncome = await prisma.income.update({
            where: { income_id },
            data: {
                ...body,
                updated_at: new Date(),
            },
        });

        return NextResponse.json({ data: updatedIncome });
    } catch (error: any) {
        console.error("Update income error:", error);
        return NextResponse.json(
            { message: "ไม่สามารถแก้ไขข้อมูลรายได้ได้", error: error.message },
            { status: 500 },
        );
    }
}

export async function DELETE(req: Request, { params }: Params) {
    try {
        const { income_id } = await params;

        await prisma.income.update({
            where: { income_id },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        return NextResponse.json({ message: "ลบข้อมูลรายได้สำเร็จ" });
    } catch (error: any) {
        console.error("Delete income error:", error);
        return NextResponse.json(
            { message: "ไม่สามารถลบข้อมูลรายได้ได้", error: error.message },
            { status: 500 },
        );
    }
}
