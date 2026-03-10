import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
    params: Promise<{ lot_id: string }>;
};

export async function GET(req: Request, { params }: Params) {
    try {
        const { lot_id } = await params;

        const lot = await prisma.inventoryLot.findUnique({
            where: { lot_id },
            include: {
                product: {
                    select: {
                        product_id: true,
                        product_name: true,
                        unit: true,
                    },
                },
            },
        });

        if (!lot) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูล Lot" },
                { status: 404 },
            );
        }

        return NextResponse.json({ data: lot });
    } catch (error: any) {
        console.error("Get lot by id error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 },
        );
    }
}
