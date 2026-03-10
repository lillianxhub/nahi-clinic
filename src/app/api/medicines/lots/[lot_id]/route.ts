import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
    params: Promise<{
        lot_id: string;
    }>;
};

export async function DELETE(req: Request, { params }: Params) {
    try {
        const { lot_id } = await params;

        await prisma.$transaction(async (tx) => {
            const now = new Date();
            await tx.stockUsage.updateMany({
                where: { lot_id },
                data: { deleted_at: now },
            });
            await tx.stockAdjustment.updateMany({
                where: { lot_id },
                data: { deleted_at: now },
            });
            await tx.expenseInventoryLot.deleteMany({ where: { lot_id } });

            await tx.inventoryLot.update({
                where: { lot_id },
                data: { deleted_at: now, is_active: false },
            });
        });

        return NextResponse.json({ message: "ลบ Lot ยาสำเร็จ" });
    } catch (error: any) {
        console.error("Delete lot error:", error);
        return NextResponse.json(
            {
                message: `เกิดข้อผิดพลาดในการลบ Lot ยา: ${error.message || "ไม่ระบุสาเหตุ"}`,
                error: error.message,
                stack: error.stack,
                details: error,
            },
            { status: 500 },
        );
    }
}

export async function PATCH(req: Request, { params }: Params) {
    try {
        const { lot_id } = await params;
        const body = await req.json();
        const { qty_remaining, expire_date, sell_price, buy_price } = body;

        if (
            qty_remaining === undefined &&
            !expire_date &&
            sell_price === undefined &&
            buy_price === undefined
        ) {
            return NextResponse.json(
                { message: "ข้อมูลไม่ครบถ้วน" },
                { status: 400 },
            );
        }

        const dataToUpdate: any = { updated_at: new Date() };
        if (qty_remaining !== undefined && qty_remaining >= 0) {
            dataToUpdate.qty_remaining = Number(qty_remaining);
        }
        if (expire_date) {
            dataToUpdate.expire_date = new Date(expire_date);
        }
        if (sell_price !== undefined) {
            dataToUpdate.sell_price = Number(sell_price);
        }
        if (buy_price !== undefined) {
            dataToUpdate.buy_price = Number(buy_price);
        }

        const updatedLot = await prisma.inventoryLot.update({
            where: { lot_id },
            data: dataToUpdate,
        });

        return NextResponse.json({ data: updatedLot });
    } catch (error: any) {
        console.error("Update lot error:", error);
        return NextResponse.json(
            {
                message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล Lot ยา",
                error: error.message,
            },
            { status: 500 },
        );
    }
}
