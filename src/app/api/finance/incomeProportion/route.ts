import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const now = new Date();

        const startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
            0, 0, 0
    );

        const endDate = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23, 59, 59
    );
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

        // 3️⃣ รวมยอดเงินตามประเภท
        const summary = {
            drug: 0,
            service: 0,
        };

        for (const item of visitDetails) {
            const amount = Number(item.unit_price) * item.quantity;
            summary[item.item_type] += amount;
        }

        const total = summary.drug + summary.service;

        // 4️⃣ คำนวณ proportion (%)
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
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}