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

        // Filter VisitItems based on their linked Income records' income_date
        const visitItems = await prisma.visitItem.findMany({
            where: {
                is_active: true,
                deleted_at: null,
                income: {
                    income_date: { gte: startDate, lte: endDate },
                    deleted_at: null,
                },
            },
            select: {
                item_type: true,
                quantity: true,
                unit_price: true,
                product: {
                    select: { category: { select: { product_type: true } } },
                },
            },
        });

        const summary = { drug: 0, service: 0, supply: 0 };

        for (const item of visitItems) {
            const amount = Number(item.quantity) * Number(item.unit_price);
            if (item.item_type === "service") {
                summary.service += amount;
            } else {
                const type = item.product?.category.product_type;
                if (type === "drug") summary.drug += amount;
                else if (type === "supply") summary.supply += amount;
                else summary.service += amount; // Fallback if somehow it's a product but typed as service
            }
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
    } catch (error: any) {
        console.error("Finance income GET API Error", error);
        return NextResponse.json(
            {
                message: error.message || "Internal Server Error",
                stack: error.stack,
            },
            { status: 500 },
        );
    }
}
