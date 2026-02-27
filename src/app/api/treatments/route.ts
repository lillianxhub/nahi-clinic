import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateTreatmentDTO } from "@/interface/treatment";

export async function GET(req: Request) {
    try {
        const searchParams = new URL(req.url).searchParams;
        const q = searchParams.get("q"); // search patient name
        const month = searchParams.get("month"); // optional: YYYY-MM
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const skip = (page - 1) * pageSize;

        const where: any = {
            deleted_at: null,
        };

        // filter by month
        if (month) {
            const start = new Date(`${month}-01`);
            const end = new Date(start);
            end.setMonth(end.getMonth() + 1);

            where.visit_date = {
                gte: start,
                lt: end,
            };
        }

        // search patient name
        if (q) {
            where.patient = {
                OR: [
                    { first_name: { contains: q } },
                    { last_name: { contains: q } },
                    { hospital_number: { contains: q } },
                ],
            };
        }

        const [visits, total] = await Promise.all([
            prisma.visit.findMany({
                where,
                orderBy: { visit_date: "desc" },
                include: {
                    patient: {
                        select: {
                            patient_id: true,
                            first_name: true,
                            last_name: true,
                            hospital_number: true,
                        },
                    },
                    visitDetails: true,
                },
                skip,
                take: pageSize,
            }),
            prisma.visit.count({ where }),
        ]);

        return NextResponse.json({
            data: visits,
            meta: {
                pagination: {
                    page,
                    pageSize,
                    pageCount: Math.ceil(total / pageSize),
                    total,
                },
            },
        });
    } catch (error: any) {
        console.error("Get treatments error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    try {
        const body: CreateTreatmentDTO = await req.json();

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Visit
            const visit = await tx.visit.create({
                data: {
                    patient_id: body.patient_id,
                    visit_date: new Date(body.visit_date),
                    symptom: body.symptom,
                    diagnosis: body.diagnosis,
                    note: body.note,
                },
            });

            let totalAmount = 0;

            // 2. Process Items
            for (const item of body.items) {
                // 2.1 Create Visit Detail
                await tx.visit_Detail.create({
                    data: {
                        visit_id: visit.visit_id,
                        item_type: item.item_type,
                        drug_id: item.drug_id,
                        description: item.description,
                        quantity: Number(item.quantity),
                        unit_price: Number(item.unit_price),
                    },
                });

                totalAmount += Number(item.quantity) * Number(item.unit_price);

                // 2.2 If it's a drug, handle FEFO stock deduction
                if (item.item_type === "drug" && item.drug_id) {
                    let remainingToDeduct = Number(item.quantity);

                    // Find lots with stock, ordered by expiry (FEFO)
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

                        // Update Lot
                        await tx.drug_Lot.update({
                            where: { lot_id: lot.lot_id },
                            data: {
                                qty_remaining: { decrement: deduction },
                            },
                        });

                        // Create Drug Usage history
                        await tx.drug_Usage.create({
                            data: {
                                visit_id: visit.visit_id,
                                lot_id: lot.lot_id,
                                quantity: deduction,
                                used_at: new Date(body.visit_date),
                            },
                        });

                        remainingToDeduct -= deduction;
                    }

                    if (remainingToDeduct > 0) {
                        throw new Error(
                            `ยาในสต็อกไม่เพียงพอ (เหลือที่ต้องหักอีก ${remainingToDeduct} หน่วย)`,
                        );
                    }
                }
            }

            // 3. Create Income record
            await tx.income.create({
                data: {
                    visit_id: visit.visit_id,
                    income_date: new Date(body.visit_date),
                    amount: totalAmount,
                    payment_method: body.payment_method as any,
                },
            });

            return visit;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error("Create treatment error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
