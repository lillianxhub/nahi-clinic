import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            where: {
                is_active: true,
                category: { is: { product_type: "drug" } },
            },
            include: {
                _count: {
                    select: {
                        lots: {
                            where: { is_active: true, deleted_at: null },
                        },
                    },
                },
                lots: {
                    where: { is_active: true, deleted_at: null },
                    select: { qty_remaining: true },
                },
            },
        });

        const lowStock = products
            .map((product) => {
                const stock = product.lots.reduce(
                    (sum, lot) => sum + Number(lot.qty_remaining ?? 0),
                    0,
                );

                if (stock > product.min_stock) return null;

                return {
                    id: product.product_id,
                    name: product.product_name,
                    stock,
                    min: product.min_stock,
                };
            })
            .filter(Boolean);

        return NextResponse.json({ data: lowStock });
    } catch (error: any) {
        console.error("Low Stock Table API Error", error);
        return NextResponse.json(
            {
                message: error.message || "Internal Server Error",
                stack: error.stack,
            },
            { status: 500 },
        );
    }
}
