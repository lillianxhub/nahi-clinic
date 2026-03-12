import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateTreatmentDTO } from "@/interface/treatment";
import { generateReceiptNo, calculateAge, formatAge } from "@/lib/utils";

type Params = {
    params: Promise<{ treatment_id: string }>;
};

export async function GET(_: Request, { params }: Params) {
    try {
        const { treatment_id } = await params;

        const visit = await prisma.visit.findFirst({
            where: {
                visit_id: treatment_id,
                deleted_at: null,
            },
            include: {
                patient: {
                    select: {
                        patient_id: true,
                        hospital_number: true,
                        citizen_number: true,
                        first_name: true,
                        last_name: true,
                        allergy: true,
                    },
                },
                items: {
                    where: { is_active: true },
                    include: {
                        product: {
                            select: {
                                product_id: true,
                                product_name: true,
                                product_type: true,
                                unit: true,
                            },
                        },
                    },
                },
                income: true,
            },
        });

        if (!visit) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลการรักษา" },
                { status: 404 },
            );
        }

        const data = {
            ...visit,
            age_formatted: formatAge(
                visit.age_years || 0,
                visit.age_months || 0,
                visit.age_days || 0,
            ),
        };

        return NextResponse.json({ data });
    } catch (error) {
        console.error("Get treatment by id error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function PATCH(req: Request, { params }: Params) {
    try {
        const { treatment_id } = await params;
        const body: CreateTreatmentDTO = await req.json();

        if (body.heart_rate !== undefined && Number(body.heart_rate) <= 0) {
            throw new Error("heart rate ไม่ถูกต้อง");
        }

        if (body.weight !== undefined && Number(body.weight) <= 0) {
            throw new Error("น้ำหนักไม่ถูกต้อง");
        }

        if (body.height !== undefined && Number(body.height) <= 0) {
            throw new Error("ส่วนสูงไม่ถูกต้อง");
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Check if visit exists
            const existing = await tx.visit.findFirst({
                where: {
                    visit_id: treatment_id,
                    deleted_at: null,
                },
                include: {
                    patient: { select: { birth_date: true } },
                    stockUsages: { where: { deleted_at: null } },
                    items: { where: { is_active: true } },
                },
            });

            if (!existing) {
                throw new Error("ไม่พบข้อมูลการรักษา");
            }

            // 1.1 Block updates if already completed
            if (existing.status === "completed") {
                throw new Error("ไม่สามารถแก้ไขรายการที่เสร็จสิ้นแล้วได้");
            }

            const transitionToCompleted =
                body.status === "completed" && existing.status === "draft";

            // 2. Restore Stock ONLY if it was completed (though we block it now, older ones might have had it)
            // Actually, in the new logic, draft has NO stock usages, so this loop will just be empty.
            for (const usage of existing.stockUsages) {
                await tx.inventoryLot.update({
                    where: { lot_id: usage.lot_id },
                    data: {
                        qty_remaining: { increment: usage.quantity },
                    },
                });
            }

            // 3. Clean up existing items and stock usages ONLY if new items are provided
            if (body.items && body.items.length > 0) {
                await tx.stockUsage.deleteMany({
                    where: { visit_id: treatment_id },
                });
                await tx.visitItem.deleteMany({
                    where: { visit_id: treatment_id },
                });
            }

            // 4. Calculate Age if birth_date exists and visit_date changed (or always recalculate to be safe)
            let age_years = existing.age_years;
            let age_months = existing.age_months;
            let age_days = existing.age_days;

            if (existing.patient?.birth_date) {
                const targetVisitDate = body.visit_date
                    ? new Date(body.visit_date)
                    : existing.visit_date;
                const age = calculateAge(
                    new Date(existing.patient.birth_date),
                    targetVisitDate,
                );
                age_years = age.years;
                age_months = age.months;
                age_days = age.days;
            }
            const visit = await tx.visit.update({
                where: { visit_id: treatment_id },
                data: {
                    visit_date: body.visit_date
                        ? new Date(body.visit_date)
                        : undefined,
                    status: body.status ?? undefined,
                    symptom: body.symptom,
                    diagnosis: body.diagnosis,
                    note: body.note,
                    temperature: body.temperature
                        ? Number(body.temperature)
                        : null,
                    blood_pressure: body.blood_pressure,
                    heart_rate: body.heart_rate
                        ? Number(body.heart_rate)
                        : null,
                    weight: body.weight ? Number(body.weight) : null,
                    height: body.height ? Number(body.height) : null,
                    waistline: body.waistline ? Number(body.waistline) : null,
                    drinking_history: body.drinking_history,
                    age_years,
                    age_months,
                    age_days,
                    updated_at: new Date(),
                },
            });

            let totalAmount = 0;

            // 5. Process Items (New ones or Existing ones if transitioning to completed)
            const itemsToProcess =
                body.items && body.items.length > 0
                    ? body.items
                    : transitionToCompleted
                      ? existing.items.map((i) => ({
                            product_id: i.product_id,
                            quantity: Number(i.quantity),
                            unit_price: Number(i.unit_price),
                            instruction: i.description || "",
                        }))
                      : [];

            for (const item of itemsToProcess) {
                const qty = Number(item.quantity);
                const price = Number(item.unit_price);
                const totalPrice = qty * price;

                // Only sum up if we are actually replacing/creating new items
                if (body.items && body.items.length > 0) {
                    totalAmount += totalPrice;
                }

                const product = await tx.product.findUnique({
                    where: { product_id: item.product_id },
                    select: { product_type: true },
                });

                let usedLotId: string | null = null;

                // Stock deduction ONLY if transitioning to completed
                if (
                    transitionToCompleted &&
                    product &&
                    (product.product_type === "drug" ||
                        product.product_type === "supply")
                ) {
                    let remainingToDeduct = qty;

                    const lots = await tx.inventoryLot.findMany({
                        where: {
                            product_id: item.product_id,
                            qty_remaining: { gt: 0 },
                            is_active: true,
                            deleted_at: null,
                        },
                        orderBy: { expire_date: "asc" },
                    });

                    for (const lot of lots) {
                        if (remainingToDeduct === 0) break;

                        const deduction = Math.min(
                            lot.qty_remaining,
                            remainingToDeduct,
                        );

                        if (!usedLotId) usedLotId = lot.lot_id;

                        await tx.inventoryLot.update({
                            where: { lot_id: lot.lot_id },
                            data: {
                                qty_remaining: { decrement: deduction },
                            },
                        });

                        await tx.stockUsage.create({
                            data: {
                                visit_id: treatment_id,
                                lot_id: lot.lot_id,
                                quantity: deduction,
                                used_at: body.visit_date
                                    ? new Date(body.visit_date)
                                    : existing.visit_date,
                            },
                        });

                        remainingToDeduct -= deduction;
                    }

                    if (remainingToDeduct > 0) {
                        throw new Error(
                            `สินค้าในสต็อกไม่เพียงพอ (เหลือที่ต้องหักอีก ${remainingToDeduct} หน่วย)`,
                        );
                    }
                }

                // If new items were provided, create them.
                // If we're just transitioning existing items, update their lot_id.
                if (body.items && body.items.length > 0) {
                    await tx.visitItem.create({
                        data: {
                            visit_id: treatment_id,
                            product_id: item.product_id,
                            lot_id: usedLotId ?? undefined,
                            quantity: qty,
                            unit_price: price,
                            total_price: totalPrice,
                            description: item.instruction || "",
                        },
                    });
                } else if (transitionToCompleted && usedLotId) {
                    // Update existing item with the lot we just found
                    await tx.visitItem.updateMany({
                        where: {
                            visit_id: treatment_id,
                            product_id: item.product_id,
                        },
                        data: {
                            lot_id: usedLotId,
                        },
                    });
                }
            }

            // If no new items were provided, we still need totalAmount for income
            if (!body.items || body.items.length === 0) {
                totalAmount = existing.items.reduce(
                    (sum, item) => sum + Number(item.total_price),
                    0,
                );
            }

            // 6. Upsert Income record ONLY if completed
            if (
                (transitionToCompleted ||
                    (existing.status as any) === "completed") &&
                totalAmount > 0
            ) {
                await tx.income.upsert({
                    where: { visit_id: treatment_id },
                    update: {
                        amount: totalAmount,
                        payment_method: (body.payment_method || "cash") as any,
                        updated_at: new Date(),
                    },
                    create: {
                        visit: { connect: { visit_id: treatment_id } },
                        income_type: "service",
                        amount: totalAmount,
                        payment_method: (body.payment_method || "cash") as any,
                        receipt_no:
                            body.receipt_no || generateReceiptNo("รักษา"),
                        income_date: body.visit_date
                            ? new Date(body.visit_date)
                            : existing.visit_date,
                    },
                });
            }

            return visit;
        });

        return NextResponse.json({ data: result });
    } catch (error: any) {
        console.error("Patch treatment error:", error);
        return NextResponse.json(
            { message: error.message || "Internal server error" },
            { status: 500 },
        );
    }
}

export async function DELETE(req: Request, { params }: Params) {
    try {
        const { treatment_id } = await params;

        const existing = await prisma.visit.findFirst({
            where: {
                visit_id: treatment_id,
                deleted_at: null,
            },
        });

        if (!existing) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลการรักษา" },
                { status: 404 },
            );
        }

        if (existing.status === "completed") {
            return NextResponse.json(
                { message: "ไม่สามารถลบรายการที่เสร็จสิ้นแล้วได้" },
                { status: 403 },
            );
        }

        const visit = await prisma.$transaction(async (tx) => {
            // 1. Get all stock usages for this visit
            const usages = await tx.stockUsage.findMany({
                where: { visit_id: treatment_id, deleted_at: null },
            });

            // 2. Revert stock for each usage
            for (const usage of usages) {
                await tx.inventoryLot.update({
                    where: { lot_id: usage.lot_id },
                    data: {
                        qty_remaining: { increment: usage.quantity },
                    },
                });
            }

            const now = new Date();

            // 3. Soft delete Visit
            const updatedVisit = await tx.visit.update({
                where: { visit_id: treatment_id },
                data: {
                    deleted_at: now,
                    is_active: false,
                },
            });

            // 4. Soft delete VisitItems
            await tx.visitItem.updateMany({
                where: { visit_id: treatment_id },
                data: {
                    deleted_at: now,
                    is_active: false,
                },
            });

            // 5. Soft delete StockUsages
            await tx.stockUsage.updateMany({
                where: { visit_id: treatment_id },
                data: { deleted_at: now },
            });

            await tx.income.updateMany({
                where: { visit_id: treatment_id },
                data: { deleted_at: now },
            });

            return updatedVisit;
        });

        return NextResponse.json({ data: visit });
    } catch (error) {
        console.error("Delete treatment error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 },
        );
    }
}
