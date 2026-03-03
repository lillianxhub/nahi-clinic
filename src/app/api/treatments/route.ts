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
            const terms = q.split(/\s+/).filter(Boolean);
            if (terms.length > 0) {
                where.patient = {
                    AND: terms.map((term) => ({
                        OR: [
                            { first_name: { contains: term } },
                            { last_name: { contains: term } },
                            { hospital_number: { contains: term } },
                        ],
                    })),
                };
            }
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

        const formattedVisits = visits.map((visit) => {
            let age_formatted = "-";
            if (visit.age_years !== null) {
                age_formatted = `${visit.age_years} ปี ${visit.age_months || 0} เดือน ${visit.age_days || 0} วัน`;
            }
            return {
                ...visit,
                age_formatted,
            };
        });

        return NextResponse.json({
            data: formattedVisits,
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
            const patient = await tx.patient.findUnique({
                where: { patient_id: body.patient_id },
                select: { birth_date: true },
            });

            let age_years = null,
                age_months = null,
                age_days = null;

            if (patient?.birth_date) {
                const visitDate = new Date(body.visit_date);
                const birthDate = new Date(patient.birth_date);
                let y = visitDate.getFullYear() - birthDate.getFullYear();
                let m = visitDate.getMonth() - birthDate.getMonth();
                let d = visitDate.getDate() - birthDate.getDate();

                if (d < 0) {
                    m -= 1;
                    d += new Date(
                        visitDate.getFullYear(),
                        visitDate.getMonth(),
                        0,
                    ).getDate();
                }
                if (m < 0) {
                    y -= 1;
                    m += 12;
                }
                age_years = Math.max(0, y);
                age_months = Math.max(0, m);
                age_days = Math.max(0, d);
            }

            // 1. Create Visit
            const visit = await tx.visit.create({
                data: {
                    patient: { connect: { patient_id: body.patient_id } },
                    visit_date: new Date(body.visit_date),
                    symptom: body.symptom,
                    diagnosis: body.diagnosis,
                    note: body.note,
                    blood_pressure: body.blood_pressure,
                    heart_rate: body.heart_rate
                        ? Number(body.heart_rate)
                        : null,
                    weight: body.weight ? Number(body.weight) : null,
                    height: body.height ? Number(body.height) : null,
                    age_years,
                    age_months,
                    age_days,
                },
            });

            let totalDrugAmount = 0;
            let totalServiceAmount = 0;

            // 2. Process Items
            for (const item of body.items) {
                // 2.1 Create Visit Detail
                await tx.visit_Detail.create({
                    data: {
                        visit: { connect: { visit_id: visit.visit_id } },
                        item_type: item.item_type as any,
                        drug: item.drug_id ? { connect: { drug_id: item.drug_id } } : undefined,
                        procedure: item.procedure_id ? { connect: { procedure_id: item.procedure_id } } : undefined,
                        description: item.description,
                        quantity: Number(item.quantity),
                        unit_price: Number(item.unit_price),
                    },
                });

                const itemAmount =
                    Number(item.quantity) * Number(item.unit_price);
                if (item.item_type === "drug") {
                    totalDrugAmount += itemAmount;
                } else {
                    totalServiceAmount += itemAmount;
                }

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
                                visit: { connect: { visit_id: visit.visit_id } },
                                lot: { connect: { lot_id: lot.lot_id } },
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

            // 3. Create Income records separately
            const drugCategory = await tx.income_Category.findUnique({
                where: { category_name: "ค่ายา" },
            });
            const serviceCategory = await tx.income_Category.findUnique({
                where: { category_name: "ค่าบริการ" },
            });

            let incomeIndex = 1;

            if (totalDrugAmount > 0 && drugCategory) {
                await tx.income.create({
                    data: {
                        visit: { connect: { visit_id: visit.visit_id } },
                        category: { connect: { category_id: drugCategory.category_id } },
                        income_date: new Date(body.visit_date),
                        amount: totalDrugAmount,
                        payment_method: body.payment_method as any,
                        receipt_no: `RC-DRG-${Date.now()}-${incomeIndex++}`,
                    },
                });
            }

            if (totalServiceAmount > 0 && serviceCategory) {
                await tx.income.create({
                    data: {
                        visit: { connect: { visit_id: visit.visit_id } },
                        category: { connect: { category_id: serviceCategory.category_id } },
                        income_date: new Date(body.visit_date),
                        amount: totalServiceAmount,
                        payment_method: body.payment_method as any,
                        receipt_no: `RC-SRV-${Date.now()}-${incomeIndex++}`,
                    },
                });
            }

            return visit;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error("Create treatment error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
