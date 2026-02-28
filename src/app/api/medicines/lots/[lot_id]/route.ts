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
            await tx.drug_Usage.deleteMany({ where: { lot_id: lot_id } });
            await tx.expense_Drug_Lot.deleteMany({ where: { lot_id: lot_id } });
            await tx.drug_Adjustment.deleteMany({ where: { lot_id: lot_id } });

            await tx.drug_Lot.delete({
                where: { lot_id: lot_id },
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
        const { qty_remaining, expire_date } = body;

        if (qty_remaining === undefined && !expire_date) {
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

        const updatedLot = await prisma.drug_Lot.update({
            where: { lot_id: lot_id },
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
