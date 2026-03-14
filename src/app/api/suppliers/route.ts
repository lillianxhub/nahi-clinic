import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q");

        const where: Record<string, any> = {
            is_active: true,
            deleted_at: null,
        };

        if (q) {
            where.supplier_name = { contains: q };
        }

        const suppliers = await prisma.supplier.findMany({
            where,
            orderBy: { supplier_name: "asc" },
            take: 20, // Limit results for dropdowns
        });

        return NextResponse.json({ data: suppliers });
    } catch (error: any) {
        console.error("Get suppliers error:", error);
        return NextResponse.json(
            {
                message: "เกิดข้อผิดพลาดในการดึงข้อมูลซัพพลายเออร์",
                error: error.message,
            },
            { status: 500 },
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { supplier_name, contact } = body;

        if (!supplier_name || !supplier_name.trim()) {
            return NextResponse.json(
                { message: "กรุณาระบุชื่อซัพพลายเออร์" },
                { status: 400 },
            );
        }

        const supplier = await prisma.supplier.create({
            data: {
                supplier_name: supplier_name.trim(),
                contact: contact?.trim() || "N/A",
            },
        });

        return NextResponse.json({ data: supplier }, { status: 201 });
    } catch (error: any) {
        console.error("Create supplier error:", error);
        return NextResponse.json(
            {
                message: "เกิดข้อผิดพลาดในการสร้างซัพพลายเออร์",
                error: error.message,
            },
            { status: 500 },
        );
    }
}
