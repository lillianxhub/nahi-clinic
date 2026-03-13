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

        const type = searchParams.get("type"); // drug, supply
        const q = searchParams.get("q");
        const status = searchParams.get("status");

        const where: Record<string, any> = {
            deleted_at: null,
        };

        if (type && ["drug", "supply"].includes(type)) {
            where.product_type = type;
        } else {
            // Default to drugs and supplies
            where.product_type = { in: ["drug", "supply"] };
        }

        if (q) {
            where.product_name = { contains: q };
        }

        let activeStatus = searchParams.get("activeStatus");
        if (activeStatus === "active") {
            where.is_active = true;
        } else if (activeStatus === "inactive") {
            where.is_active = false;
        }

        // Handle stock level filtering (low/normal)
        if (status === "low" || status === "normal") {
            const allProducts = await prisma.product.findMany({
                select: {
                    product_id: true,
                    min_stock: true,
                    lots: {
                        select: { qty_remaining: true },
                        where: { is_active: true, deleted_at: null },
                    },
                },
                where: {
                    is_active: true,
                    deleted_at: null,
                    product_type: where.product_type,
                },
            });

            const filteredIds = allProducts
                .filter((p) => {
                    const totalQty = p.lots.reduce(
                        (sum, lot) => sum + lot.qty_remaining,
                        0,
                    );
                    return status === "low"
                        ? totalQty <= p.min_stock
                        : totalQty > p.min_stock;
                })
                .map((p) => p.product_id);

            where.product_id = { in: filteredIds };
        }

        const [data, total, summaryData] = await Promise.all([
            prisma.product.findMany({
                skip,
                take,
                orderBy,
                where,
                include: {
                    category: true,
                    lots: {
                        where: { is_active: true, deleted_at: null },
                    },
                },
            }),

            prisma.product.count({ where }),

            (async () => {
                const products = await prisma.product.findMany({
                    select: {
                        min_stock: true,
                        lots: {
                            select: { qty_remaining: true, expire_date: true },
                            where: { is_active: true, deleted_at: null },
                        },
                    },
                    where: {
                        is_active: true,
                        deleted_at: null,
                        product_type: where.product_type,
                    },
                });

                let lowCount = 0;
                let expiringCount = 0;

                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + 30);

                products.forEach((p) => {
                    const totalQty = p.lots.reduce(
                        (sum, lot) => sum + lot.qty_remaining,
                        0,
                    );
                    if (totalQty <= p.min_stock) {
                        lowCount++;
                    }

                    p.lots.forEach((lot) => {
                        if (
                            lot.qty_remaining > 0 &&
                            lot.expire_date <= targetDate
                        ) {
                            expiringCount++;
                        }
                    });
                });

                return {
                    lowStockCount: lowCount,
                    expiringLotsCount: expiringCount,
                };
            })(),
        ]);

        const mappedData = data.map((p) => ({
            ...p,
            price: p.lots?.[0]?.sell_price ? Number(p.lots[0].sell_price) : 0,
            sell_price: p.lots?.[0]?.sell_price
                ? Number(p.lots[0].sell_price)
                : 0,
            status: p.is_active ? "active" : "inactive",
            product_type: p.product_type,
        }));

        return NextResponse.json({
            data: mappedData,
            summary: {
                lowStockCount: summaryData.lowStockCount,
                expiringLotsCount: summaryData.expiringLotsCount,
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
        console.error("Get products error:", error);
        return NextResponse.json(
            {
                message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า",
                error: error.message,
            },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        let {
            product_name,
            category_id,
            unit,
            quantity,
            buy_price,
            sell_price,
            buy_unit,
            conversion_factor,
            expiry_date,
            lot_no,
            received_date,
            product_type: bodyProductType,
            supplier_id,
        } = body;

        const effectiveProductType = bodyProductType || "drug";

        const result = await prisma.$transaction(async (tx) => {
            // 1. Find or create Product (drug type)
            let product = await tx.product.findFirst({
                where: {
                    product_name,
                    product_type: effectiveProductType,
                    is_active: true,
                    deleted_at: null,
                },
            });

            if (!supplier_id) {
                // Check if any supplier exists, if not, create a default one
                let supplier = await tx.supplier.findFirst();
                if (!supplier) {
                    supplier = await tx.supplier.create({
                        data: {
                            supplier_name: "General Supplier",
                            contact: "N/A",
                        },
                    });
                }
                supplier_id = supplier.supplier_id;
            }

            if (product) {
                product = await tx.product.update({
                    where: { product_id: product.product_id },
                    data: {
                        category_id: category_id || product.category_id,
                        unit: unit || product.unit,
                    },
                });
            } else {
                product = await tx.product.create({
                    data: {
                        product_name,
                        product_type: effectiveProductType,
                        category_id,
                        unit,
                        min_stock: 0,
                    },
                });
            }

            // 2. Create InventoryLot
            const dateForLot = received_date
                ? new Date(received_date)
                : new Date();
            const year = dateForLot.getFullYear();
            const month = String(dateForLot.getMonth() + 1).padStart(2, "0");
            const day = String(dateForLot.getDate()).padStart(2, "0");
            const autoLotNo = `LOT-${year}${month}-${day}`;

            const lot = await tx.inventoryLot.create({
                data: {
                    product_id: product.product_id,
                    supplier_id: supplier_id,
                    lot_no: lot_no || autoLotNo,
                    buy_unit: buy_unit || unit,
                    conversion_factor: conversion_factor
                        ? Number(conversion_factor)
                        : 1,
                    buy_price: Number(buy_price),
                    sell_price: Number(sell_price),
                    received_date: dateForLot,
                    expire_date: new Date(expiry_date),
                    qty_received:
                        Number(quantity) *
                        (conversion_factor ? Number(conversion_factor) : 1),
                    qty_remaining:
                        Number(quantity) *
                        (conversion_factor ? Number(conversion_factor) : 1),
                },
            });

            // 3. Create Expense for Finance
            const totalAmount =
                Number(lot.qty_received) * Number(lot.buy_price);
            const expense = await tx.expense.create({
                data: {
                    expense_type:
                        effectiveProductType === "drug" ? "drug" : "supply",
                    description: `ซื้อ${effectiveProductType === "drug" ? "ยา" : "เวชภัณฑ์"}: ${product_name} (${quantity} ${buy_unit})`,
                    amount: totalAmount,
                    expense_date: dateForLot,
                    receipt_no: `EXP-${dateForLot.getTime()}`,
                },
            });

            // 4. Link Lot to Expense
            await tx.expenseInventoryLot.create({
                data: {
                    expense_id: expense.expense_id,
                    lot_id: lot.lot_id,
                },
            });

            return { product, lot, expense };
        });

        const response = {
            ...result.product,
            lot: result.lot,
            expense: result.expense,
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error: any) {
        console.error("Create product error:", error);
        return NextResponse.json(
            {
                message: "เกิดข้อผิดพลาดในการเพิ่มยาหรือสต็อก",
                error: error.message,
            },
            { status: 500 },
        );
    }
}
