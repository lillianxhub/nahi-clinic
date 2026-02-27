import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const categories = await prisma.drug_Category.findMany({
            where: { is_active: true, deleted_at: null },
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
