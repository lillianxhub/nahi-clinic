import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Procedures are now Products with product_type = 'service'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q");

        const where: any = {
            deleted_at: null,
            is_active: true,
            product_type: "service",
        };

        if (q) {
            where.product_name = { contains: q };
        }

        const data = await prisma.product.findMany({
            where,
            orderBy: { product_name: "asc" },
            include: {
                lots: {
                    where: { is_active: true, deleted_at: null },
                    select: { lot_id: true, sell_price: true },
                    orderBy: { created_at: "desc" },
                    take: 1, // latest lot price
                },
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
        const { procedure_name, product_name, price, category_id } = body;

        const name = product_name || procedure_name;
        if (!name) {
            return NextResponse.json(
                { message: "กรุณากรอกชื่อหัตถการ" },
                { status: 400 },
            );
        }

        const product = await prisma.product.create({
            data: {
                product_name: name,
                product_type: "service",
                unit: "ครั้ง",
                min_stock: 0,
                category_id: category_id || undefined,
            },
        });

        // If price given, create a InventoryLot to store the sell price
        if (price !== undefined) {
            await prisma.inventoryLot.create({
                data: {
                    product_id: product.product_id,
                    buy_unit: "ครั้ง",
                    conversion_factor: 1,
                    buy_price: 0,
                    sell_price: Number(price),
                    received_date: new Date(),
                    expire_date: new Date("2099-12-31"),
                    qty_received: 9999,
                    qty_remaining: 9999,
                },
            });
        }

        return NextResponse.json(product, { status: 201 });
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
