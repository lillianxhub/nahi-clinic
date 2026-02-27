import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
    params: Promise<{
        lot_id: string;
    }>;
};

export async function PATCH(req: Request, { params }: Params) {
    try {
        const { lot_id } = await params;
        const body = await req.json();
        const { qty_remaining } = body;

        if (qty_remaining === undefined || qty_remaining < 0) {
            return NextResponse.json(
                { message: "จำนวนไม่ถูกต้อง" },
                { status: 400 },
            );
        }

        const updatedLot = await prisma.drug_Lot.update({
            where: { lot_id: lot_id },
            data: {
                qty_remaining: Number(qty_remaining),
                updated_at: new Date(),
            },
        });

        return NextResponse.json({ data: updatedLot });
    } catch (error: any) {
        console.error("Update lot error:", error);
        return NextResponse.json(
            {
                message: "เกิดข้อผิดพลาดในการแก้ไขจำนวนยา",
                error: error.message,
            },
            { status: 500 },
        );
    }
}
