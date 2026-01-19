import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const drugs = await prisma.drug.findMany({
            where: { is_active: true },
            include: {
                lots: {
                    where: { is_active: true },
                },
            },
        });

        const lowStock = drugs
            .map((drug) => {
                const stock = drug.lots.reduce(
                    (sum, lot) => sum + Number(lot.qty_remaining ?? 0),
                    0
                );

                if (stock >= drug.min_stock) return null;

                return {
                    id: drug.drug_id,
                    name: drug.drug_name,
                    stock,
                    min: drug.min_stock,
                };
            })
            .filter(Boolean);

        return NextResponse.json({
            data: lowStock
        });
    } catch (error) {
        console.log("Low Stock Table API Error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
