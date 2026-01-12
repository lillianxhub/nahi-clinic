import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const searchParams = new URL(req.url).searchParams;

        const page = Number(searchParams.get("page")) || 1;
        const pageSize = Number(searchParams.get("pageSize")) || 10;
        const skip = (page - 1) * pageSize;

        const patients = await prisma.patient.findMany({
            skip,
            take: pageSize,
            orderBy: {
                created_at: "desc",
            },
        });

        const total = await prisma.patient.count();

        return NextResponse.json({
            data: patients,
            meta: {
                pagination: {
                    page,
                    pageSize,
                    pageCount: Math.ceil(total / pageSize),
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
