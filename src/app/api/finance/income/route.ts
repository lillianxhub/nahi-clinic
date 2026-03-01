import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
            summary[item.item_type] += amount;
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

        if (body.visit_id) {
            const visit = await prisma.visit.findUnique({
                where: {
                    visit_id: body.visit_id,
                },
            });

            if (!visit) {
                return NextResponse.json(
                    { message: "Visit not found" },
                    { status: 404 },
                );
            }
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
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Income record
            const income = await tx.income.create({
                data: {
                    visit_id: body.visit_id,
                    income_date: new Date(body.income_date),
                    amount: body.amount,
                    payment_method: body.payment_method,
                    receipt_no: body.receipt_no,
                    income_category: body.income_category,
                },
            });

            // 2. Process Items if provided (especially for "ค่ายา")
            if (body.items && Array.isArray(body.items) && body.visit_id) {
                for (const item of body.items) {
                    // 2.1 Create Visit Detail
                    await tx.visit_Detail.create({
                        data: {
                            visit_id: body.visit_id,
                            item_type: item.item_type,
                            drug_id: item.drug_id,
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
                                    visit_id: body.visit_id,
                                    lot_id: lot.lot_id,
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
        console.error("Create income error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
