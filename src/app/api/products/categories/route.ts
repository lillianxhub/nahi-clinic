import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const product_type = url.searchParams.get("product_type");

        const categories = await prisma.category.findMany({
            where: { 
                is_active: true, 
                deleted_at: null,
                ...(product_type ? { product_type: product_type as any } : {})
            },
            orderBy: { category_name: "asc" },
        });

        return NextResponse.json({ data: categories });
    } catch (error: any) {
        console.error("Get drug categories error:", error);
        return NextResponse.json(
            {
                message: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่ยา",
                error: error.message,
            },
            { status: 500 },
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { category_name, product_type } = body;

        if (!category_name || !category_name.trim()) {
            return NextResponse.json(
                { message: "กรุณาระบุชื่อหมวดหมู่" },
                { status: 400 },
            );
        }

        const category = await prisma.category.create({
            data: {
                category_name: category_name.trim(),
                product_type: product_type || "drug", // Ensure product_type is supplied
            },
        });

        return NextResponse.json({ data: category }, { status: 201 });
    } catch (error: any) {
        console.error("Create drug category error:", error);
        return NextResponse.json(
            {
                message: "เกิดข้อผิดพลาดในการสร้างหมวดหมู่ยา",
                error: error.message,
            },
            { status: 500 },
        );
    }
}
