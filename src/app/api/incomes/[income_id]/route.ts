import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
        });

        if (!income) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลรายได้" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: income });
    } catch (error: any) {
        console.error("Get patient by id error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 }
        );
    }
}
