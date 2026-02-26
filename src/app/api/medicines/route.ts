import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/utils/pagination";
import { MEDICINE_ORDER_FIELDS } from "@/constants/medicine";

type MedicineOrderKey = keyof typeof MEDICINE_ORDER_FIELDS;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const { page, pageSize, skip, take } = getPagination(searchParams);

        const orderKey = searchParams.get("orderBy");
        const direction = searchParams.get("order") === "desc" ? "desc" : "asc";

        let orderBy: Record<string, "asc" | "desc"> | undefined;

        if (orderKey && orderKey in MEDICINE_ORDER_FIELDS) {
            const key = orderKey as MedicineOrderKey;
            orderBy = {
                [MEDICINE_ORDER_FIELDS[key]]: direction,
            };
        }

        const [data, total, lowStockCount] = await Promise.all([
            prisma.drug.findMany({
                skip,
                take,
                orderBy,
                include: {
                    category: true,
                    lots: true,
                },
            }),

            prisma.drug.count(),

            (async () => {
                const drugs = await prisma.drug.findMany({
                    select: {
                        min_stock: true,
                        lots: {
                            select: { qty_remaining: true },
                        },
                    },
                    where: { is_active: true },
                });

                return drugs.filter((drug) => {
                    const totalQty = drug.lots.reduce(
                        (sum, lot) => sum + lot.qty_remaining,
                        0,
                    );
                    return totalQty <= drug.min_stock;
                }).length;
            })(),
        ]);

        return NextResponse.json({
            data,
            summary: {
                lowStockCount,
            },
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
        console.error("Get medicine error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            drug_name,
            category_id,
            unit,
            quantity,
            buy_price,
            sell_price,
            expiry_date,
            lot_no,
            received_date,
        } = body;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Find or Create Drug (Upsert logic by name)
            let drug = await tx.drug.findFirst({
                where: {
                    drug_name: drug_name,
                    is_active: true,
                    deleted_at: null,
                },
            });

            if (drug) {
                // Update existing drug metadata if provided
                drug = await tx.drug.update({
                    where: { drug_id: drug.drug_id },
                    data: {
                        category_id: category_id || drug.category_id,
                        unit: unit || drug.unit,
                        sell_price:
                            sell_price !== undefined
                                ? sell_price
                                : drug.sell_price,
                    },
                });
            } else {
                // Create new drug
                drug = await tx.drug.create({
                    data: {
                        drug_name,
                        category_id,
                        unit,
                        sell_price,
                        min_stock: 0,
                        status: "active",
                    },
                });
            }

            // 2. Create Drug_Lot
            const dateForLot = received_date
                ? new Date(received_date)
                : new Date();
            const year = dateForLot.getFullYear();
            const month = String(dateForLot.getMonth() + 1).padStart(2, "0");
            const day = String(dateForLot.getDate()).padStart(2, "0");
            const autoLotNo = `LOT-${year}${month}-${day}`;

            const lot = await tx.drug_Lot.create({
                data: {
                    drug_id: drug.drug_id,
                    lot_no: lot_no || autoLotNo,
                    received_date: dateForLot,
                    expire_date: new Date(expiry_date),
                    qty_received: Number(quantity),
                    qty_remaining: Number(quantity),
                    buy_price: Number(buy_price),
                },
            });

            // 3. Create Expense for Finance
            const totalAmount = Number(quantity) * Number(buy_price);
            const expense = await tx.expense.create({
                data: {
                    expense_date: received_date
                        ? new Date(received_date)
                        : new Date(),
                    expense_type: "drug",
                    description: `ซื้อยา: ${drug_name} (${quantity} ${unit})`,
                    amount: totalAmount,
                },
            });

            // 4. Link Lot to Expense
            await tx.expense_Drug_Lot.create({
                data: {
                    expense_id: expense.expense_id,
                    lot_id: lot.lot_id,
                },
            });

            return { drug, lot, expense };
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error("Create medicine error:", error);
        return NextResponse.json(
            {
                message: "เกิดข้อผิดพลาดในการเพิ่มยาหรือสต็อก",
                error: error.message,
            },
            { status: 500 },
        );
    }
}
