import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q");

        const where: any = {
            deleted_at: null,
            is_active: true,
        };

        if (q) {
            where.procedure_name = {
                contains: q,
            };
        }

        const data = await prisma.procedure.findMany({
            where,
            orderBy: {
                procedure_name: "asc",
            },
        });

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error("Get procedures error:", error);
        return NextResponse.json(
            {
                message: "เกิดข้อผิดพลาดในการดึงข้อมูลหัตถการ",
                error: error.message,
            },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { procedure_name, price } = body;

        if (!procedure_name || price === undefined) {
            return NextResponse.json(
                { message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                { status: 400 },
            );
        }

        const procedure = await prisma.procedure.create({
            data: {
                procedure_name,
                price: Number(price),
            },
        });

        return NextResponse.json(procedure, { status: 201 });
    } catch (error: any) {
        console.error("Create procedure error:", error);
        return NextResponse.json(
            {
                message: "เกิดข้อผิดพลาดในการเพิ่มหัตถการ",
                error: error.message,
            },
            { status: 500 },
        );
    }
}
