import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
    params: Promise<{
        product_id: string;
    }>;
};

export async function GET(req: Request, { params }: Params) {
    try {
        const { product_id } = await params;

        if (!product_id) {
            return NextResponse.json(
                { message: "product_id ไม่ถูกต้อง" },
                { status: 400 },
            );
        }

        const product = await prisma.product.findUnique({
            where: { product_id },
            include: {
                category: true,
                lots: {
                    where: { is_active: true, deleted_at: null },
                    orderBy: { expire_date: "asc" },
                },
            },
        });

        if (!product) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลสินค้า" },
                { status: 404 },
            );
        }

        const mappedProduct = {
            ...product,
            drug_id: product.product_id,
            drug_name: product.product_name,
            sell_price: product.lots?.[0]?.sell_price
                ? Number(product.lots[0].sell_price)
                : 0,
            status: product.is_active ? "active" : "inactive",
        };

        return NextResponse.json({ data: mappedProduct });
    } catch (error) {
        console.error("Get product detail error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
            { status: 500 },
        );
    }
}

export async function PATCH(req: Request, { params }: Params) {
    try {
        const { product_id } = await params;
        const body = await req.json();

        const updatedProduct = await prisma.product.update({
            where: { product_id },
            data: {
                product_name: body.product_name ?? body.drug_name,
                category_id: body.category_id,
                unit: body.unit,
                min_stock: body.min_stock,
                is_active: body.is_active,
                updated_at: new Date(),
            },
            include: {
                category: true,
            },
        });

        const mappedProduct = {
            ...updatedProduct,
            drug_id: updatedProduct.product_id,
            drug_name: updatedProduct.product_name,
            sell_price: 0, // Will be updated by client if needed or fetched from details
            status: updatedProduct.is_active ? "active" : "inactive",
        };

        return NextResponse.json({ data: mappedProduct });
    } catch (error: any) {
        console.error("Update product error:", error);
        return NextResponse.json(
            {
                message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลสินค้า",
                error: error.message,
            },
            { status: 500 },
        );
    }
}

export async function DELETE(req: Request, { params }: Params) {
    try {
        const { product_id } = await params;

        await prisma.product.update({
            where: { product_id },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        return NextResponse.json({ message: "ลบข้อมูลสินค้าสำเร็จ" });
    } catch (error: any) {
        console.error("Delete medicine error:", error);
        return NextResponse.json(
            {
                message: "เกิดข้อผิดพลาดในการลบข้อมูลยา",
                error: error.message,
            },
            { status: 500 },
        );
    }
}
