import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/utils/pagination";
import { getOrderBy } from "@/utils/prismaQuery";
import { generateReceiptNo } from "@/lib/utils";

export async function GET(req: Request) {
    try {
        const searchParams = new URL(req.url).searchParams;
        const { page, pageSize, skip, take } = getPagination(searchParams);
        const orderBy = getOrderBy(searchParams);

        const incomes = await prisma.income.findMany({
            skip,
            take,
            orderBy,
            where: { deleted_at: null },
            include: {
                visitItem: {
                    include: {
                        visit: {
                            include: {
                                patient: {
                                    select: {
                                        patient_id: true,
                                        first_name: true,
                                        last_name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const total = await prisma.income.count({
            where: { deleted_at: null },
        });
        const pageCount = Math.ceil(total / pageSize);

        return NextResponse.json({
            data: incomes,
            meta: { pagination: { page, pageSize, pageCount, total } },
        });
    } catch (error: any) {
        console.error("Get incomes error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
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

            if (!resolvedVisitId) {
                throw new Error(
                    "Visit ID or Patient ID is required to create income items",
                );
            }

            const createdIncomes = [];

            // Process VisitItems and Incomes
            if (body.items && Array.isArray(body.items)) {
                for (const item of body.items) {
                    const qty = Number(item.quantity);
                    const price = Number(item.unit_price);

                    // 1. Create VisitItem
                    const visitItem = await tx.visitItem.create({
                        data: {
                            visit_id: resolvedVisitId,
                            item_type: item.item_type, // 'product' or 'service'
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
                            description: item.description,
                        },
                    });

                    // 2. Create Income linked 1-1 with VisitItem
                    let incomeType: any = item.income_type || "other";
                    if (item.item_type === "service") {
                        incomeType = "service";
                    } else if (item.product_id) {
                        const product = await tx.product.findUnique({
                            where: { product_id: item.product_id },
                            select: {
                                category: { select: { product_type: true } },
                            },
                        });
                        incomeType = product?.category.product_type || "other";
                    }

                    const income = await tx.income.create({
                        data: {
                            visit_item_id: visitItem.visit_item_id,
                            income_type: incomeType,
                            amount: qty * price,
                            payment_method: body.payment_method,
                            receipt_no:
                                body.receipt_no || generateReceiptNo("รายรับ"),
                            income_date: body.income_date
                                ? new Date(body.income_date)
                                : new Date(),
                        },
                    });
                    createdIncomes.push(income);

                    // 3. Handle Stock Deduction if it's a product
                    if (item.item_type === "product" && item.product_id) {
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

                            await tx.inventoryLot.update({
                                where: { lot_id: lot.lot_id },
                                data: {
                                    qty_remaining: { decrement: deduction },
                                },
                            });

                            await tx.stockUsage.create({
                                data: {
                                    visit_item_id: visitItem.visit_item_id,
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
                }
            } else {
                // Handle single total income without items (Create a dummy VisitItem)
                // However, schema designs imply we should have items for tracking.
                // For now, let's create a generic VisitItem.
                const visitItem = await tx.visitItem.create({
                    data: {
                        visit_id: resolvedVisitId,
                        item_type: "service", // Default to service for generic income
                        quantity: 1,
                        unit_price: Number(body.amount),
                        description: "รายรับอื่นๆ/เหมาจ่าย",
                    },
                });

                const income = await tx.income.create({
                    data: {
                        visit_item_id: visitItem.visit_item_id,
                        income_type: body.income_type || "other",
                        amount: Number(body.amount),
                        payment_method: body.payment_method,
                        receipt_no:
                            body.receipt_no || generateReceiptNo("รายรับ"),
                        income_date: body.income_date
                            ? new Date(body.income_date)
                            : new Date(),
                    },
                });
                createdIncomes.push(income);
            }

            return createdIncomes;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error("Create income API Error:", error);
        return NextResponse.json(
            {
                message: error.message || "Internal Server Error",
                stack: error.stack,
            },
            { status: 500 },
        );
    }
}
