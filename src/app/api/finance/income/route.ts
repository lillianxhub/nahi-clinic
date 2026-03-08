import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateReceiptNo } from "@/lib/utils";

export async function GET(request: Request) {
    try {
        const now = new Date();
        const { searchParams } = new URL(request.url);
        const range = searchParams.get("range") || "month";
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        let startDate: Date;
        let endDate: Date;

        if (startDateParam && endDateParam) {
            startDate = new Date(startDateParam);
            endDate = new Date(endDateParam);
            endDate.setHours(23, 59, 59, 999);
        } else if (range === "year") {
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        } else if (range === "week") {
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
        } else {
            // Default to month
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
            endDate = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0,
                23,
                59,
                59,
            );
        }
        const visitDetails = await prisma.visit_Detail.findMany({
            where: {
                deleted_at: null,
                visit: {
                    incomes: {
                        some: {
                            income_date: {
                                gte: startDate,
                                lte: endDate,
                            },
                        },
                    },
                },
            },
            select: {
                item_type: true,
                unit_price: true,
                quantity: true,
            },
        });

        // 3. Sum amount by type
        const summary = {
            drug: 0,
            service: 0,
        };

        for (const item of visitDetails) {
            const amount = Number(item.unit_price) * item.quantity;
            if (item.item_type === "procedure") {
                summary.service += amount;
            } else {
                summary[item.item_type] += amount;
            }
        }

        const total = summary.drug + summary.service;

        // 4. Calculate proportion (%)
        const result = [
            {
                type: "drug",
                amount: summary.drug,
                percentage: total > 0 ? (summary.drug / total) * 100 : 0,
            },
            {
                type: "service",
                amount: summary.service,
                percentage: total > 0 ? (summary.service / total) * 100 : 0,
            },
        ];

        return NextResponse.json({
            data: result,
            meta: {
                month: now.getMonth() + 1,
                year: now.getFullYear(),
                totalAmount: total,
            },
        });
    } catch (error) {
        console.log("Dashboard stat API Error", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Fetch visit with patient info (supports visit-less purchases e.g. ซื้อยาเฉยๆ)
        let visit: {
            visit_id: string;
            patient: { first_name: string; last_name: string };
        } | null = null;
        if (body.visit_id) {
            visit = await prisma.visit.findUnique({
                where: { visit_id: body.visit_id },
                include: {
                    patient: { select: { first_name: true, last_name: true } },
                },
            });

            if (!visit) {
                return NextResponse.json(
                    { message: "Visit not found" },
                    { status: 404 },
                );
            }
        }

        // Validate patient when patient_id provided (for walk-in auto-visit)
        if (!body.visit_id && body.patient_id) {
            const patient = await prisma.patient.findUnique({
                where: { patient_id: body.patient_id },
                select: { first_name: true, last_name: true },
            });
            if (!patient) {
                return NextResponse.json(
                    { message: "Patient not found" },
                    { status: 404 },
                );
            }
            // Use patient info for description building (visit will be created inside tx)
            visit = { visit_id: "", patient };
        }

        if (!body.income_date) {
            return NextResponse.json(
                { message: "Income date is required" },
                { status: 400 },
            );
        } else if (!body.amount) {
            return NextResponse.json(
                { message: "Amount is required" },
                { status: 400 },
            );
        } else if (!body.payment_method) {
            return NextResponse.json(
                { message: "Payment method is required" },
                { status: 400 },
            );
        } else if (!body.income_category) {
            return NextResponse.json(
                { message: "Income category is required" },
                { status: 400 },
            );
        }

        // Build auto-description based on category + visit/patient
        const autoDescription =
            body.description ||
            (visit?.patient
                ? `${body.income_category}: ผู้ป่วย ${visit.patient.first_name} ${visit.patient.last_name}`
                : body.income_category);

        const result = await prisma.$transaction(async (tx) => {
            // 0. Auto-create walk-in visit if patient_id given but no visit_id
            let resolvedVisitId: string | undefined =
                body.visit_id || undefined;
            if (!resolvedVisitId && body.patient_id) {
                const walkInVisit = await tx.visit.create({
                    data: {
                        patient: { connect: { patient_id: body.patient_id } },
                        visit_date: new Date(body.income_date),
                        symptom: `${body.income_category} (walk-in)`,
                        note: `สร้างอัตโนมัติจากการบันทึกรายรับ ${body.income_category}`,
                    },
                });
                resolvedVisitId = walkInVisit.visit_id;
            }

            // 1. Create Income record
            const income = await tx.income.create({
                data: {
                    visit: resolvedVisitId
                        ? { connect: { visit_id: resolvedVisitId } }
                        : undefined,
                    income_date: new Date(body.income_date),
                    amount: body.amount,
                    payment_method: body.payment_method,
                    receipt_no:
                        body.receipt_no ||
                        generateReceiptNo(body.income_category),
                    description: autoDescription,
                    category: {
                        connectOrCreate: {
                            where: { category_name: body.income_category },
                            create: { category_name: body.income_category },
                        },
                    },
                },
            });

            // 2. Process Items if provided (for ค่ายา / ค่าบริการ)
            if (body.items && Array.isArray(body.items) && resolvedVisitId) {
                for (const item of body.items) {
                    // 2.1 Create Visit Detail
                    await tx.visit_Detail.create({
                        data: {
                            visit: { connect: { visit_id: resolvedVisitId } },
                            item_type: item.item_type,
                            drug: item.drug_id
                                ? { connect: { drug_id: item.drug_id } }
                                : undefined,
                            procedure: item.procedure_id
                                ? {
                                    connect: {
                                        procedure_id: item.procedure_id,
                                    },
                                }
                                : undefined,
                            description: item.description,
                            quantity: Number(item.quantity),
                            unit_price: Number(item.unit_price),
                        },
                    });

                    // 2.2 If it's a drug, handle FEFO stock deduction
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
                                    visit: {
                                        connect: { visit_id: resolvedVisitId },
                                    },
                                    lot: { connect: { lot_id: lot.lot_id } },
                                    quantity: deduction,
                                    used_at: new Date(body.income_date),
                                },
                            });

                            remainingToDeduct -= deduction;
                        }

                        if (remainingToDeduct > 0) {
                            throw new Error(
                                `ยา ${item.description} ในสต็อกไม่เพียงพอ (ขาดอีก ${remainingToDeduct} หน่วย)`,
                            );
                        }
                    }
                }
            }

            return income;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error("Create income API Error:", {
            message: error.message,
            stack: error.stack,
            body: request.body,
        });
        return NextResponse.json(
            { message: error.message || "Internal Server Error" },
            { status: 500 },
        );
    }
}
