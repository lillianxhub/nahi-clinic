import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateTreatmentDTO } from "@/interface/treatment";
import { generateReceiptNo, calculateAge, formatAge } from "@/lib/utils";

export async function GET(req: Request) {
    try {
        const searchParams = new URL(req.url).searchParams;
        const q = searchParams.get("q"); // search patient name
        const month = searchParams.get("month"); // optional: YYYY-MM
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const skip = (page - 1) * pageSize;

<<<<<<< HEAD
    // เรียก backend API ของคุณ
    const backendUrl = new URL(
      `${process.env.NEXT_PUBLIC_API_URL}/treatments`
    );
    backendUrl.searchParams.append("page", page);
    backendUrl.searchParams.append("pageSize", pageSize);
    if (q) backendUrl.searchParams.append("q", q);
    // include visitDetails เพื่อให้ได้ข้อมูลยา
    backendUrl.searchParams.append("include", "visitDetails");
=======
        const where: any = {
            deleted_at: null,
        };
>>>>>>> a6cfb6d5ff3cebacd3167edfc818325fe232e6dc

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
                            { citizen_number: { contains: term } },
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
                            citizen_number: true,
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
                },
                skip,
                take: pageSize,
            }),
            prisma.visit.count({ where }),
        ]);

        const mappedVisits = visits.map((visit: any) => ({
            ...visit,
            age_formatted: formatAge(
                visit.age_years || 0,
                visit.age_months || 0,
                visit.age_days || 0,
            ),
        }));

        return NextResponse.json({
            data: mappedVisits,
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
                const age = calculateAge(
                    new Date(patient.birth_date),
                    new Date(body.visit_date),
                );
                age_years = age.years;
                age_months = age.months;
                age_days = age.days;
            }

            // 1. Create Visit
            const visit = await tx.visit.create({
                data: {
                    patient: { connect: { patient_id: body.patient_id } },
                    visit_date: new Date(body.visit_date),
                    status: body.status ?? "draft",
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
                    smoking_history: body.smoking_history,
                    drinking_history: body.drinking_history,
                    age_years: age_years,
                    age_months: age_months,
                    age_days: age_days,
                },
            });

            const isCompleted = visit.status === "completed";
            let totalAmount = 0;

            // 2. Process Items
            for (const item of body.items) {
                const qty = Number(item.quantity);
                const price = Number(item.unit_price);
                const totalPrice = qty * price;
                totalAmount += totalPrice;

                // 2.1 Get product type to decide if stock deduction is needed
                const product = await tx.product.findUnique({
                    where: { product_id: item.product_id },
                    select: { product_type: true },
                });

                let usedLotId: string | null = null;

                // 2.2 If drug or supply AND status is completed → FEFO stock deduction
                if (
                    isCompleted &&
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
                                visit: {
                                    connect: { visit_id: visit.visit_id },
                                },
                                lot: { connect: { lot_id: lot.lot_id } },
                                quantity: deduction,
                                used_at: new Date(body.visit_date),
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

                // 2.3 Create VisitItem
                await tx.visitItem.create({
                    data: {
                        visit: { connect: { visit_id: visit.visit_id } },
                        product: { connect: { product_id: item.product_id } },
                        lot: usedLotId
                            ? { connect: { lot_id: usedLotId } }
                            : undefined,
                        quantity: qty,
                        unit_price: price,
                        total_price: totalPrice,
                    },
                });
            }

            // 3. Create Income (1-1 with Visit) only if completed
            if (isCompleted && totalAmount > 0) {
                await tx.income.create({
                    data: {
                        visit: { connect: { visit_id: visit.visit_id } },
                        income_type: "service", // Default for treatment
                        amount: totalAmount,
                        payment_method: body.payment_method as any,
                        receipt_no:
                            body.receipt_no || generateReceiptNo("รักษา"),
                        income_date: new Date(body.visit_date),
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
