import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
    params: Promise<{
        income_id: string;
    }>;
};

export async function GET(req: Request, { params }: Params) {
    try {
        const { income_id } = await params;

        const income = await prisma.income.findUnique({
            where: {
                income_id,
            },
            include: {
                category: true,
                visit: {
                    include: {
                        patient: true,
                        visitDetails: {
                            where: { is_active: true },
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

        // Prevent updating ID
        delete body.income_id;

        const updatedIncome = await prisma.$transaction(async (tx) => {
            // 1. If items are provided or category changed, we might need to handle stock
            if (body.items && Array.isArray(body.items)) {
                const currentIncome = await tx.income.findUnique({
                    where: { income_id },
                    include: { visit: true, category: true },
                });

                if (currentIncome?.visit_id) {
                    // 1.1 Revert previous stock deductions
                    const prevUsages = await tx.drug_Usage.findMany({
                        where: { visit_id: currentIncome.visit_id },
                    });

                    for (const usage of prevUsages) {
                        await tx.drug_Lot.update({
                            where: { lot_id: usage.lot_id },
                            data: {
                                qty_remaining: { increment: usage.quantity },
                            },
                        });
                    }

                    // 1.2 Delete old usages and details based on category
                    if (currentIncome.category?.category_name === "ค่ายา") {
                        await tx.drug_Usage.deleteMany({
                            where: { visit_id: currentIncome.visit_id },
                        });
                        await tx.visit_Detail.deleteMany({
                            where: {
                                visit_id: currentIncome.visit_id,
                                item_type: "drug"
                            },
                        });
                    } else if (currentIncome.category?.category_name === "ค่าบริการ") {
                        await tx.visit_Detail.deleteMany({
                            where: {
                                visit_id: currentIncome.visit_id,
                                item_type: "service"
                            },
                        });
                    }

                    // 1.3 Apply new items and deductions (FEFO)
                    for (const item of body.items) {
                        await tx.visit_Detail.create({
                            data: {
                                visit_id: currentIncome.visit_id,
                                item_type: item.item_type,
                                drug_id: item.drug_id,
                                procedure_id: item.procedure_id,
                                description: item.description,
                                quantity: Number(item.quantity),
                                unit_price: Number(item.unit_price),
                            },
                        });

                        if (item.item_type === "drug" && item.drug_id) {
                            let remainingToDeduct = Number(item.quantity);
                            const lots = await tx.drug_Lot.findMany({
                                where: {
                                    drug_id: item.drug_id,
                                    qty_remaining: { gt: 0 },
                                    is_active: true,
                                },
                                orderBy: { expire_date: "asc" },
                            });

                            for (const lot of lots) {
                                if (remainingToDeduct === 0) break;
                                const deduction = Math.min(
                                    lot.qty_remaining,
                                    remainingToDeduct,
                                );
                                await tx.drug_Lot.update({
                                    where: { lot_id: lot.lot_id },
                                    data: {
                                        qty_remaining: { decrement: deduction },
                                    },
                                });
                                await tx.drug_Usage.create({
                                    data: {
                                        visit_id: currentIncome.visit_id,
                                        lot_id: lot.lot_id,
                                        quantity: deduction,
                                        used_at: new Date(
                                            body.income_date ||
                                            currentIncome.income_date,
                                        ),
                                    },
                                });
                                remainingToDeduct -= deduction;
                            }

                            if (remainingToDeduct > 0) {
                                throw new Error(
                                    `ยา ${item.description} ในสต็อกไม่เพียงพอ`,
                                );
                            }
                        }
                    }
                }
            }

            // Remove items and income_category from body before updating Income model directly
            const { items, income_category, ...incomeData } = body;

            if (income_category) {
                const category = await tx.income_Category.findUnique({
                    where: { category_name: income_category }
                });
                if (category) {
                    // @ts-ignore
                    incomeData.category_id = category.category_id;
                }
            }

            return await tx.income.update({
                where: { income_id },
                data: {
                    ...incomeData,
                    updated_at: new Date(),
                },
                include: {
                    category: true,
                    visit: {
                        include: {
                            patient: true,
                            visitDetails: true,
                        },
                    },
                },
            });
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
                include: { visit: true, category: true },
            });

            if (!current) throw new Error("ไม่พบข้อมูลรายได้");

            const now = new Date();

            // 1. If linked to a visit, handle stock reversal and visit deletion
            if (current.visit_id) {
                if (current.category?.category_name === "ค่ายา") {
                    const usages = await tx.drug_Usage.findMany({
                        where: { visit_id: current.visit_id },
                    });

                    for (const usage of usages) {
                        await tx.drug_Lot.update({
                            where: { lot_id: usage.lot_id },
                            data: {
                                qty_remaining: { increment: usage.quantity },
                            },
                        });
                    }

                    await tx.visit_Detail.updateMany({
                        where: { visit_id: current.visit_id, item_type: 'drug' },
                        data: { deleted_at: now, is_active: false },
                    });

                    await tx.drug_Usage.updateMany({
                        where: { visit_id: current.visit_id },
                        data: { deleted_at: now, is_active: false },
                    });
                } else if (current.category?.category_name === "ค่าบริการ") {
                    await tx.visit_Detail.updateMany({
                        where: { visit_id: current.visit_id, item_type: 'service' },
                        data: { deleted_at: now, is_active: false },
                    });
                }

                // Soft delete Visit only if there are no other active incomes for it
                const otherActiveIncomes = await tx.income.count({
                    where: {
                        visit_id: current.visit_id,
                        income_id: { not: income_id },
                        deleted_at: null,
                        is_active: true
                    }
                });

                if (otherActiveIncomes === 0) {
                    await tx.visit.update({
                        where: { visit_id: current.visit_id },
                        data: { deleted_at: now, is_active: false },
                    });
                }
            }

            // 2. Soft delete the Income itself
            return await tx.income.update({
                where: { income_id },
                data: {
                    is_active: false,
                    deleted_at: now,
                },
            });
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
