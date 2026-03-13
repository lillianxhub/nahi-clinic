import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
    params: Promise<{ income_id: string }>;
};

export async function GET(req: Request, { params }: Params) {
    try {
        const { income_id } = await params;

        const income = await prisma.income.findUnique({
            where: { income_id },
            include: {
                visit: {
                    include: {
                        patient: true,
                        items: {
                            where: { is_active: true },
                            include: {
                                product: {
                                    select: {
                                        product_id: true,
                                        product_name: true,
                                        unit: true,
                                        category: {
                                            select: {
                                                product_type: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!income) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลรายได้" },
                { status: 404 },
            );
        }

        return NextResponse.json({ data: income });
    } catch (error: any) {
        console.error("Get income by id error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 },
        );
    }
}

export async function PATCH(req: Request, { params }: Params) {
    try {
        const { income_id } = await params;
        const body = await req.json();

        // Only update Income-model fields: amount, payment_method, receipt_no
        const { amount, payment_method, receipt_no } = body;

        const updatedIncome = await prisma.income.update({
            where: { income_id },
            data: {
                ...(amount !== undefined && { amount: Number(amount) }),
                ...(payment_method && { payment_method }),
                ...(receipt_no !== undefined && { receipt_no }),
                updated_at: new Date(),
            },
            include: {
                visit: {
                    include: {
                        patient: true,
                        items: { where: { is_active: true } },
                    },
                },
            },
        });

        return NextResponse.json({ data: updatedIncome });
    } catch (error: any) {
        console.error("Update income error:", error);
        return NextResponse.json(
            { message: "ไม่สามารถแก้ไขข้อมูลรายได้ได้", error: error.message },
            { status: 500 },
        );
    }
}

export async function DELETE(req: Request, { params }: Params) {
    try {
        const { income_id } = await params;

        const result = await prisma.$transaction(async (tx) => {
            const current = await tx.income.findUnique({
                where: { income_id },
                include: { visit: true },
            });

            if (!current) throw new Error("ไม่พบข้อมูลรายได้");

            const now = new Date();

            // 1. If linked to a visit, revert stock and soft-delete related records
            if (current.visit_id) {
                const usages = await tx.stockUsage.findMany({
                    where: { visit_id: current.visit_id, deleted_at: null },
                });

                for (const usage of usages) {
                    await tx.inventoryLot.update({
                        where: { lot_id: usage.lot_id },
                        data: { qty_remaining: { increment: usage.quantity } },
                    });
                }

                await tx.stockUsage.updateMany({
                    where: { visit_id: current.visit_id },
                    data: { deleted_at: now },
                });

                await tx.visitItem.updateMany({
                    where: { visit_id: current.visit_id },
                    data: { deleted_at: now, is_active: false },
                });

                await tx.visit.update({
                    where: { visit_id: current.visit_id },
                    data: { deleted_at: now, is_active: false },
                });
            }

            // 2. Soft delete Income
            await tx.income.update({
                where: { income_id },
                data: { deleted_at: now },
            });

            return { income_id };
        });

        return NextResponse.json({
            message: "ลบข้อมูลรายได้สำเร็จ",
            data: result,
        });
    } catch (error: any) {
        console.error("Delete income error:", error);
        return NextResponse.json(
            { message: "ไม่สามารถลบข้อมูลรายได้ได้", error: error.message },
            { status: 500 },
        );
    }
}
