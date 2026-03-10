import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { lot_id, reason } = body;

        if (!lot_id) {
            return NextResponse.json(
                { message: "กรุณาระบุ lot_id" },
                { status: 400 },
            );
        }

        const lot = await prisma.inventoryLot.findUnique({
            where: { lot_id },
        });

        if (!lot) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลล็อตยา" },
                { status: 404 },
            );
        }

        if (lot.qty_remaining <= 0) {
            return NextResponse.json(
                { message: "ล็อตยานี้ไม่มีคงเหลือแล้ว" },
                { status: 400 },
            );
        }

        const quantityLost = lot.qty_remaining;

        await prisma.$transaction([
            prisma.stockAdjustment.create({
                data: {
                    lot_id,
                    quantity_lost: quantityLost,
                    reason: reason || "หมดอายุ/ระงับการใช้งาน",
                },
            }),
            prisma.inventoryLot.update({
                where: { lot_id },
                data: { qty_remaining: 0, is_active: false },
            }),
        ]);

        return NextResponse.json({
            message: "บันทึกและปรับปรุงยอดคงเหลือสำเร็จ",
            data: { lot_id, quantity_lost: quantityLost },
        });
    } catch (error: any) {
        console.error("Stock adjustment error:", error);
        return NextResponse.json(
            {
                message: "เกิดข้อผิดพลาดในการปรับปรุงยอด",
                error: error.message,
            },
            { status: 500 },
        );
    }
}
