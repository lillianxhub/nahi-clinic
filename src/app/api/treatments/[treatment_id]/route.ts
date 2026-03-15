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
                                category: { select: { product_type: true } },
                                unit: true,
                            },
                        },
                        service: {
                            select: {
                                service_id: true,
                                service_name: true,
                                price: true,
                            },
                        },
                        income: true,
                    },
                },
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
    } catch (error: any) {
        console.error("Get treatment by id error:", error);
        return NextResponse.json(
            { message: error.message, stack: error.stack },
            { status: 500 },
        );
    }
}

export async function PATCH(req: Request, { params }: Params) {
    try {
        const { treatment_id } = await params;
        const body: CreateTreatmentDTO = await req.json();

        const validSmokingStatuses = ["none", "current", "ex", "occasional"];
        if (
            body.smoking_status &&
            !validSmokingStatuses.includes(body.smoking_status)
        ) {
            throw new Error("สถานะการสูบบุหรี่ไม่ถูกต้อง");
        }

        const validDrinkingStatuses = [
            "none",
            "social",
            "regular",
            "heavy",
            "ex",
        ];
        if (
            body.drinking_status &&
            !validDrinkingStatuses.includes(body.drinking_status)
        ) {
            throw new Error("สถานะการดื่มแอลกอฮอล์ไม่ถูกต้อง");
        }

        const result = await prisma.$transaction(
            async (tx) => {
                const existing = await tx.visit.findFirst({
                    where: { visit_id: treatment_id, deleted_at: null },
                    include: {
                        patient: { select: { birth_date: true } },
                        items: {
                            where: { is_active: true },
                            include: { stockUsage: true, income: true },
                        },
                    },
                });

                if (!existing) throw new Error("ไม่พบข้อมูลการรักษา");
                if (existing.status === "completed")
                    throw new Error("ไม่สามารถแก้ไขรายการที่เสร็จสิ้นแล้วได้");

                const isTransitioningToCompleted = body.status === "completed";

                // 1. Handle Item Updates
                let itemsToProcess = [];

                if (body.items && Array.isArray(body.items)) {
                    // Revert existing stock only if we are replacing items
                    for (const item of existing.items) {
                        for (const usage of item.stockUsage) {
                            await tx.inventoryLot.update({
                                where: { lot_id: usage.lot_id },
                                data: {
                                    qty_remaining: {
                                        increment: usage.quantity,
                                    },
                                },
                            });
                        }
                        // Delete related records
                        await tx.stockUsage.deleteMany({
                            where: { visit_item_id: item.visit_item_id },
                        });
                        await tx.income.deleteMany({
                            where: { visit_item_id: item.visit_item_id },
                        });
                    }
                    await tx.visitItem.deleteMany({
                        where: { visit_id: treatment_id },
                    });

                    // Create new items
                    for (const item of body.items) {
                        const qty = Number(item.quantity);
                        const price = Number(item.unit_price);

                        const visitItem = await tx.visitItem.create({
                            data: {
                                visit_id: treatment_id,
                                item_type: item.item_type,
                                product_id:
                                    item.item_type === "product"
                                        ? item.product_id
                                        : null,
                                service_id:
                                    item.item_type === "service"
                                        ? item.service_id
                                        : null,
                                quantity: qty,
                                unit_price: price,
                                description: item.description || "",
                            },
                        });
                        itemsToProcess.push({
                            ...item,
                            visit_item_id: visitItem.visit_item_id,
                        });
                    }
                } else {
                    // Use existing items for status transition processing
                    itemsToProcess = existing.items.map((item) => ({
                        visit_item_id: item.visit_item_id,
                        item_type: item.item_type,
                        product_id: item.product_id,
                        service_id: item.service_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        description: item.description,
                    }));
                }

                // 2. Update Visit
                let { age_years, age_months, age_days } = existing;
                if (existing.patient?.birth_date) {
                    const age = calculateAge(
                        new Date(existing.patient.birth_date),
                        body.visit_date
                            ? new Date(body.visit_date)
                            : existing.visit_date,
                    );
                    age_years = age.years;
                    age_months = age.months;
                    age_days = age.days;
                }

                const updatedVisit = await tx.visit.update({
                    where: { visit_id: treatment_id },
                    data: {
                        visit_date: body.visit_date
                            ? new Date(body.visit_date)
                            : undefined,
                        status: body.status || undefined,
                        symptom: body.symptom,
                        diagnosis: body.diagnosis,
                        note: body.note,
                        temperature:
                            body.temperature !== undefined
                                ? Number(body.temperature)
                                : undefined,
                        blood_pressure: body.blood_pressure,
                        heart_rate:
                            body.heart_rate !== undefined
                                ? Number(body.heart_rate)
                                : undefined,
                        weight:
                            body.weight !== undefined
                                ? Number(body.weight)
                                : undefined,
                        height:
                            body.height !== undefined
                                ? Number(body.height)
                                : undefined,
                        waistline:
                            body.waistline !== undefined
                                ? Number(body.waistline)
                                : undefined,
                        smoking_status:
                            body.smoking_status !== undefined
                                ? (body.smoking_status as any)
                                : undefined,
                        drinking_status:
                            body.drinking_status !== undefined
                                ? (body.drinking_status as any)
                                : undefined,
                        smoking_history:
                            body.smoking_history !== undefined
                                ? body.smoking_history || null
                                : undefined,
                        drinking_history:
                            body.drinking_history !== undefined
                                ? body.drinking_history || null
                                : undefined,
                        age_years,
                        age_months,
                        age_days,
                        updated_at: new Date(),
                    },
                });

                // 3. Process Stock and Income if Completed
                const isCompletedNow = updatedVisit.status === "completed";
                if (
                    isCompletedNow &&
                    (isTransitioningToCompleted ||
                        (body.items && Array.isArray(body.items)))
                ) {
                    for (const item of itemsToProcess) {
                        const qty = Number(item.quantity);
                        const price = Number(item.unit_price);

                        // Create Income
                        if (qty * price > 0) {
                            // Determine income type
                            let incomeType: any = "other";
                            if (item.item_type === "service") {
                                incomeType = "service";
                            } else if (item.product_id) {
                                const product = await tx.product.findUnique({
                                    where: { product_id: item.product_id },
                                    select: {
                                        category: {
                                            select: { product_type: true },
                                        },
                                    },
                                });
                                incomeType =
                                    product?.category.product_type || "other";
                            }

                            await tx.income.create({
                                data: {
                                    visit_item_id: item.visit_item_id,
                                    income_type: incomeType,
                                    amount: qty * price,
                                    payment_method:
                                        (body.payment_method as any) || "cash",
                                    receipt_no:
                                        body.receipt_no ||
                                        generateReceiptNo("รักษา"),
                                    income_date: updatedVisit.visit_date,
                                },
                            });
                        }

                        // Deduct Stock
                        if (item.product_id) {
                            const product = await tx.product.findUnique({
                                where: { product_id: item.product_id },
                                select: {
                                    category: {
                                        select: { product_type: true },
                                    },
                                },
                            });

                            if (
                                product &&
                                (product.category.product_type === "drug" ||
                                    product.category.product_type === "supply")
                            ) {
                                let remaining = qty;
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
                                    if (remaining === 0) break;
                                    const deduction = Math.min(
                                        lot.qty_remaining,
                                        remaining,
                                    );
                                    await tx.inventoryLot.update({
                                        where: { lot_id: lot.lot_id },
                                        data: {
                                            qty_remaining: {
                                                decrement: deduction,
                                            },
                                        },
                                    });
                                    await tx.stockUsage.create({
                                        data: {
                                            visit_item_id: item.visit_item_id,
                                            lot_id: lot.lot_id,
                                            quantity: deduction,
                                            used_at: updatedVisit.visit_date,
                                        },
                                    });
                                    remaining -= deduction;
                                }
                                if (remaining > 0)
                                    throw new Error(
                                        `สินค้า ${item.product_id} ไม่เพียงพอ (เหลือ ${remaining})`,
                                    );
                            }
                        }
                    }
                }
                return updatedVisit;
            },
            {
                timeout: 30000,
            },
        );

        return NextResponse.json({ data: result });
    } catch (error: any) {
        console.error("Patch treatment error:", error);
        return NextResponse.json(
            { message: error.message, stack: error.stack },
            { status: 500 },
        );
    }
}

export async function DELETE(_: Request, { params }: Params) {
    try {
        const { treatment_id } = await params;
        const result = await prisma.$transaction(async (tx) => {
            const existing = await tx.visit.findFirst({
                where: { visit_id: treatment_id, deleted_at: null },
                include: { items: { include: { stockUsage: true } } },
            });
            if (!existing) throw new Error("ไม่พบข้อมูลการรักษา");
            if (existing.status === "completed")
                throw new Error("ไม่สามารถลบรายการที่เสร็จสิ้นแล้วได้");

            for (const item of existing.items) {
                for (const usage of item.stockUsage) {
                    await tx.inventoryLot.update({
                        where: { lot_id: usage.lot_id },
                        data: { qty_remaining: { increment: usage.quantity } },
                    });
                }
            }

            const now = new Date();
            await tx.visit.update({
                where: { visit_id: treatment_id },
                data: { deleted_at: now, is_active: false },
            });
            await tx.visitItem.updateMany({
                where: { visit_id: treatment_id },
                data: { deleted_at: now, is_active: false },
            });

            const itemIds = existing.items.map((i) => i.visit_item_id);
            if (itemIds.length > 0) {
                await tx.stockUsage.updateMany({
                    where: { visit_item_id: { in: itemIds } },
                    data: { deleted_at: now },
                });
                await tx.income.updateMany({
                    where: { visit_item_id: { in: itemIds } },
                    data: { deleted_at: now },
                });
            }

            return { success: true };
        });
        return NextResponse.json({ data: result });
    } catch (error: any) {
        console.error("Delete treatment error:", error);
        return NextResponse.json(
            { message: error.message, stack: error.stack },
            { status: 500 },
        );
    }
}
