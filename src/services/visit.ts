import { prisma } from "@/lib/prisma";

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
    payment_method: "cash" | "transfer";
}) {
    return await prisma.$transaction(async (tx) => {
        // 1. visit
        const visit = await tx.visit.create({
            data: {
                patient_id: input.patient_id,
                visit_date: new Date(),
                symptom: input.symptom,
                diagnosis: input.diagnosis,
            },
        });

        // const visit_diagnosis = await tx.visit.update({
        //     where: {
        //         visit_id: visit.visit_id,
        //     },
        //     data: {
        //         diagnosis: input.diagnosis,
        //     },
        // });

        let total = 0;

        // 2. services
        for (const s of input.services) {
            total += s.price;
            await tx.visit_Detail.create({
                data: {
                    visit_id: visit.visit_id,
                    item_type: "service",
                    description: s.description,
                    quantity: 1,
                    unit_price: s.price,
                },
            });
        }

        // 3. drugs
        for (const d of input.drugs) {
            const lot = await tx.drug_Lot.findUnique({
                where: { lot_id: d.lot_id },
            });

            if (!lot || lot.qty_remaining < d.quantity) {
                throw new StockNotEnoughError();
            }

            total += d.sell_price * d.quantity;

            await tx.drug_Usage.create({
                data: {
                    visit_id: visit.visit_id,
                    lot_id: d.lot_id,
                    quantity: d.quantity,
                    used_at: new Date(),
                },
            });

            await tx.drug_Lot.update({
                where: { lot_id: d.lot_id },
                data: {
                    qty_remaining: {
                        decrement: d.quantity,
                    },
                },
            });
        }

        // 4. income
        await tx.income.create({
            data: {
                visit_id: visit.visit_id,
                income_date: new Date(),
                amount: total,
                payment_method: input.payment_method,
            },
        });

        return visit;
    });
}