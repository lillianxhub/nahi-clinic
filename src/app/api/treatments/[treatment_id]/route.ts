import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateTreatmentDTO } from "@/interface/treatment";

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
                        first_name: true,
                        last_name: true,
                        allergy: true,
                    },
                },
                visitDetails: true,
            },
        });

        if (!visit) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลการรักษา" },
                { status: 404 },
            );
        }

        return NextResponse.json({ data: visit });
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
        console.log("PATCH Treatment Request Body:", JSON.stringify(body, null, 2));

        const result = await prisma.$transaction(async (tx) => {
            // 1. Check if visit exists and include necessary relations
            const existing = await tx.visit.findFirst({
                where: {
                    visit_id: treatment_id,
                    deleted_at: null,
                },
                include: {
                    drugUsages: true,
                    visitDetails: true,
                },
            });

            if (!existing) {
                throw new Error("ไม่พบข้อมูลการรักษา");
            }

            // 2. Restore Stock from previous drug usages
            for (const usage of existing.drugUsages) {
                await tx.drug_Lot.update({
                    where: { lot_id: usage.lot_id },
                    data: {
                        qty_remaining: { increment: usage.quantity },
                    },
                });
            }

            // 3. Clean up existing details and drug usages
            await tx.drug_Usage.deleteMany({
                where: { visit_id: treatment_id },
            });
            await tx.visit_Detail.deleteMany({
                where: { visit_id: treatment_id },
            });

            // 4. Update basic visit information
            const visit = await tx.visit.update({
                where: { visit_id: treatment_id },
                data: {
                    visit_date: body.visit_date ? new Date(body.visit_date) : undefined,
                    symptom: body.symptom,
                    diagnosis: body.diagnosis,
                    note: body.note,
                },
            });

            let totalAmount = 0;

            // 5. Process new Items (Similar to POST logic)
            if (body.items && body.items.length > 0) {
                for (const item of body.items) {
                    // 5.1 Create Visit Detail
                    await tx.visit_Detail.create({
                        data: {
                            visit_id: treatment_id,
                            item_type: item.item_type,
                            drug_id: item.drug_id,
                            description: item.description,
                            quantity: Number(item.quantity),
                            unit_price: Number(item.unit_price),
                        },
                    });

                    totalAmount += Number(item.quantity) * Number(item.unit_price);

                    // 5.2 If it's a drug, handle FEFO stock deduction
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
                                    visit_id: treatment_id,
                                    lot_id: lot.lot_id,
                                    quantity: deduction,
                                    used_at: body.visit_date ? new Date(body.visit_date) : existing.visit_date,
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
            } else {
                // If items are not provided, we should ideally keep the previous total 
                // but since we deleted all details, totalAmount would be 0 if we don't handle this.
                // However, the frontend always sends the full items list.
            }

            // 6. Update Income record
            await tx.income.updateMany({
                where: { visit_id: treatment_id },
                data: {
                    income_date: body.visit_date ? new Date(body.visit_date) : undefined,
                    amount: totalAmount,
                    payment_method: body.payment_method as any,
                },
            });

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

        const visit = await prisma.visit.update({
            where: { visit_id: treatment_id },
            data: {
                deleted_at: new Date(),
            },
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
