import { prisma } from "@/lib/prisma";
import { ItemType, PaymentMethod } from "@/generated/prisma/client";

export class StockNotEnoughError extends Error {
    constructor(message: string = "Stock not enough") {
        super(message);
        this.name = "StockNotEnoughError";
    }
}

export async function createVisitWithTreatment(input: {
    patient_id: string;
    symptom?: string;
    diagnosis?: string;
    services: { description: string; price: number }[];
    drugs: { lot_id: string; quantity: number; sell_price: number }[];
    payment_method: PaymentMethod;
}) {
    return await prisma.$transaction(async (tx) => {
        // -------------------------------------------------------
        // 1. Create Visit
        // -------------------------------------------------------
        const visit = await tx.visit.create({
            data: {
                patient_id: input.patient_id,
                visit_date: new Date(),
                symptom: input.symptom,
                diagnosis: input.diagnosis,
            },
        });

        let totalAmount = 0;

        // -------------------------------------------------------
        // 2. Handle Services (Service Charges)
        // -------------------------------------------------------
        if (input.services && input.services.length > 0) {
            for (const s of input.services) {
                totalAmount += s.price;

                await tx.visit_Detail.create({
                    data: {
                        visit_id: visit.visit_id,
                        item_type: ItemType.service,
                        description: s.description,
                        quantity: 1,
                        unit_price: s.price,
                    },
                });
            }
        }

        // -------------------------------------------------------
        // 3. Handle Drugs (Drug Charges and Stock Reduction)
        // -------------------------------------------------------
        if (input.drugs && input.drugs.length > 0) {
            for (const d of input.drugs) {
                // 3.1 Fetch Lot info to check stock and get drug_id
                const lot = await tx.drug_Lot.findUnique({
                    where: { lot_id: d.lot_id },
                    include: { drug: true },
                });

                // Check if drug exists and stock is sufficient
                if (!lot || lot.qty_remaining < d.quantity) {
                    throw new StockNotEnoughError(
                        `ยา Lot ${d.lot_id} ไม่พอ (เหลือ ${lot?.qty_remaining || 0})`,
                    );
                }

                // 3.2 Calculate total amount
                totalAmount += d.sell_price * d.quantity;

                // 3.3 Record drug usage history (Drug Usage)
                await tx.drug_Usage.create({
                    data: {
                        visit_id: visit.visit_id,
                        lot_id: d.lot_id,
                        quantity: d.quantity,
                        used_at: new Date(),
                    },
                });

                // 3.4 Record drug item on receipt (Visit Detail)
                await tx.visit_Detail.create({
                    data: {
                        visit_id: visit.visit_id,
                        item_type: ItemType.drug,
                        drug_id: lot.drug_id,
                        description: lot.drug.drug_name,
                        quantity: d.quantity,
                        unit_price: d.sell_price,
                    },
                });

                // 3.5 Deduct actual stock (Update Stock)
                await tx.drug_Lot.update({
                    where: { lot_id: d.lot_id },
                    data: {
                        qty_remaining: {
                            decrement: d.quantity,
                        },
                    },
                });
            }
        }

        // -------------------------------------------------------
        // 4. Record income (Income)
        // -------------------------------------------------------
        // First get or create a default category down the line. We can just use the generic ID if needed or omit if optional, but it is required.
        // Usually treatments are "ค่ายา" and "ค่าบริการ", maybe we need to find both or take one as an argument.
        // Let's assume there is a generic category logic or we find the categories from db.
        const defaultCategory = await tx.income_Category.findFirst({
            where: { category_name: "ค่ายา" }
        });

        await tx.income.create({
            data: {
                visit_id: visit.visit_id,
                category_id: defaultCategory?.category_id || "", // Temporarily fallback or require category fetching
                income_date: new Date(),
                amount: totalAmount,
                payment_method: input.payment_method,
            },
        });

        return visit;
    });
}
