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

        // Get VisitItems within date range, joined via visit_date
        const visitItems = await prisma.visitItem.findMany({
            where: {
                is_active: true,
                deleted_at: null,
                visit: {
                    visit_date: { gte: startDate, lte: endDate },
                    deleted_at: null,
                },
            },
            select: {
                quantity: true,
                unit_price: true,
                total_price: true,
                product: { select: { product_type: true } },
            },
        });

        const summary = { drug: 0, service: 0, supply: 0 };

        for (const item of visitItems) {
            const amount = Number(item.total_price);
            const type = item.product?.product_type;
            if (type === "drug") summary.drug += amount;
            else if (type === "service") summary.service += amount;
            else if (type === "supply") summary.supply += amount;
        }

        const total = summary.drug + summary.service + summary.supply;

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
            {
                type: "supply",
                amount: summary.supply,
                percentage: total > 0 ? (summary.supply / total) * 100 : 0,
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
        console.log("Finance income GET API Error", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.amount) {
            return NextResponse.json(
                { message: "Amount is required" },
                { status: 400 },
            );
        }
        if (!body.payment_method) {
            return NextResponse.json(
                { message: "Payment method is required" },
                { status: 400 },
            );
        }

        let visit: { visit_id: string } | null = null;

        // Fetch or validate visit
        if (body.visit_id) {
            visit = await prisma.visit.findUnique({
                where: { visit_id: body.visit_id },
                select: { visit_id: true },
            });
            if (!visit) {
                return NextResponse.json(
                    { message: "Visit not found" },
                    { status: 404 },
                );
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            let resolvedVisitId: string | undefined =
                body.visit_id || undefined;

            // Auto-create walk-in visit if patient_id given but no visit_id
            if (!resolvedVisitId && body.patient_id) {
                const patient = await tx.patient.findUnique({
                    where: { patient_id: body.patient_id },
                    select: { first_name: true, last_name: true },
                });
                if (!patient) {
                    throw new Error("Patient not found");
                }
                const walkInVisit = await tx.visit.create({
                    data: {
                        patient: { connect: { patient_id: body.patient_id } },
                        visit_date: new Date(body.income_date || new Date()),
                        status: "completed",
                        symptom: "walk-in",
                        note: `สร้างอัตโนมัติจากการบันทึกรายรับ`,
                    },
                });
                resolvedVisitId = walkInVisit.visit_id;
            }

            // Create Income (1-1 with Visit)
            const income = await tx.income.create({
                data: {
                    ...(resolvedVisitId && {
                        visit: { connect: { visit_id: resolvedVisitId } },
                    }),
                    income_type: (body.income_type as any) || "other",
                    amount: Number(body.amount),
                    payment_method: body.payment_method,
                    receipt_no: body.receipt_no || generateReceiptNo("รายรับ"),
                    income_date: body.income_date
                        ? new Date(body.income_date)
                        : new Date(),
                },
            });

            // Process VisitItems if provided
            if (body.items && Array.isArray(body.items) && resolvedVisitId) {
                for (const item of body.items) {
                    const qty = Number(item.quantity);
                    const price = Number(item.unit_price);
                    const totalPrice = qty * price;

                    const product = await tx.product.findUnique({
                        where: { product_id: item.product_id },
                        select: { product_type: true },
                    });

                    let usedLotId: string | null = null;

                    if (
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
                                    visit_id: resolvedVisitId!,
                                    lot_id: lot.lot_id,
                                    quantity: deduction,
                                    used_at: new Date(),
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

                    await tx.visitItem.create({
                        data: {
                            visit_id: resolvedVisitId!,
                            product_id: item.product_id,
                            lot_id: usedLotId ?? undefined,
                            quantity: qty,
                            unit_price: price,
                            total_price: totalPrice,
                        },
                    });
                }
            }

            return income;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error("Create income API Error:", error.message);
        return NextResponse.json(
            { message: error.message || "Internal Server Error" },
            { status: 500 },
        );
    }
}
