import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            where: { is_active: true, product_type: "drug" },
            include: {
                lots: { where: { is_active: true, deleted_at: null } },
            },
        });

        const lowStock = products
            .map((product) => {
                const stock = product.lots.reduce(
                    (sum, lot) => sum + Number(lot.qty_remaining ?? 0),
                    0,
                );

                if (stock >= product.min_stock) return null;

                return {
                    id: product.product_id,
                    name: product.product_name,
                    stock,
                    min: product.min_stock,
                };
            })
            .filter(Boolean);

        return NextResponse.json({ data: lowStock });
    } catch (error) {
        console.log("Low Stock Table API Error", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
