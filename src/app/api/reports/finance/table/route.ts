import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const range = searchParams.get("range") || "month";
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const type = searchParams.get("type") || "all";
        const skip = (page - 1) * limit;

        const incomeWhere: any = { deleted_at: null };
        const expenseWhere: any = { deleted_at: null };

        let start: Date | undefined;
        let end: Date | undefined;

        if (startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            const now = new Date();
            if (range === "year") {
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            } else if (range === "week") {
                end = new Date(now);
                end.setHours(23, 59, 59, 999);
                start = new Date(now);
                start.setDate(now.getDate() - 6);
                start.setHours(0, 0, 0, 0);
            } else if (range === "month") {
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    0,
                    23,
                    59,
                    59,
                    999,
                );
            }
        }

        // Date filters
        if (start) {
            incomeWhere.income_date = { gte: start };
            expenseWhere.expense_date = { gte: start };
        }
        if (end) {
            incomeWhere.income_date = { ...incomeWhere.income_date, lte: end };
            expenseWhere.expense_date = {
                ...expenseWhere.expense_date,
                lte: end,
            };
        }

        if (search) {
            incomeWhere.visitItem = {
                visit: {
                    patient: {
                        OR: [
                            { first_name: { contains: search } },
                            { last_name: { contains: search } },
                        ],
                    },
                },
            };
            expenseWhere.description = { contains: search };
        }

        let incomes: any[] = [];
        let expenses: any[] = [];

        if (type === "all" || type === "income") {
            incomes = await prisma.income.findMany({
                where: incomeWhere,
                include: {
                    visitItem: {
                        include: {
                            visit: {
                                include: {
                                    patient: true,
                                },
                            },
                            product: {
                                select: {
                                    product_name: true,
                                    category: {
                                        select: { product_type: true },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { income_date: "desc" },
                take: 100,
            });
        }

        if (type === "all" || type === "expense") {
            expenses = await prisma.expense.findMany({
                where: expenseWhere,
                orderBy: { expense_date: "desc" },
                take: 100,
            });
        }

        const incomeGroups: Record<string, any> = {};

        incomes.forEach((item) => {
            const visit = item.visitItem?.visit;
            if (!visit) return;

            const visitId = visit.visit_id;
            const visitItem = item.visitItem;
            const product = visitItem?.product;

            const formattedItem = {
                product_name: product?.product_name || visitItem.description,
                product_type:
                    product?.category.product_type ||
                    (visitItem.item_type === "service" ? "service" : "other"),
                quantity: Number(visitItem.quantity),
                unit_price: Number(visitItem.unit_price),
                total_price:
                    Number(visitItem.quantity) * Number(visitItem.unit_price),
            };

            if (!incomeGroups[visitId]) {
                incomeGroups[visitId] = {
                    id: item.income_id, // Use the first income_id as reference
                    receipt_no:
                        item.receipt_no ||
                        visitId.substring(0, 8).toUpperCase(),
                    timestamp: item.income_date.getTime(),
                    date: item.income_date.toLocaleString("th-TH", {
                        timeZone: "Asia/Bangkok",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                    }),
                    type: "income",
                    category: "ค่าตรวจรักษา",
                    description: visit.patient
                        ? `ผู้ป่วย: ${visit.patient.first_name} ${visit.patient.last_name}`
                        : "รายรับจากการรักษา",
                    amount: 0,
                    status: "เสร็จสิ้น",
                    visit: {
                        symptom: visit.symptom,
                        diagnosis: visit.diagnosis,
                        note: visit.note,
                        items: [],
                    },
                };
            }

            incomeGroups[visitId].amount += Number(item.amount);
            incomeGroups[visitId].visit.items.push(formattedItem);

            // Update timestamp/date if this income is newer
            if (item.income_date.getTime() > incomeGroups[visitId].timestamp) {
                incomeGroups[visitId].timestamp = item.income_date.getTime();
                incomeGroups[visitId].date = item.income_date.toLocaleString(
                    "th-TH",
                    {
                        timeZone: "Asia/Bangkok",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                    },
                );
            }
        });

        const formattedIncomes = Object.values(incomeGroups);

        const formattedExpenses = expenses.map((item) => {
            let categoryTH = "ค่าใช้จ่ายทั่วไป";
            if (item.expense_type === "drug") categoryTH = "ค่ายา/เวชภัณฑ์";
            if (item.expense_type === "utility")
                categoryTH = "ค่าเช่า/สาธารณูปโภค";
            if (item.expense_type === "equipment_supply")
                categoryTH = "ค่าอุปกรณ์";

            return {
                id: item.expense_id,
                receipt_no: item.receipt_no,
                timestamp: item.expense_date.getTime(),
                date: item.expense_date.toLocaleString("th-TH", {
                    timeZone: "Asia/Bangkok",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                }),
                type: "expense",
                category: categoryTH,
                description: item.description || "-",
                amount: -Number(item.amount),
                status: "เสร็จสิ้น",
            };
        });

        const allTransactions = [
            ...formattedIncomes,
            ...formattedExpenses,
        ].sort((a, b) => b.timestamp - a.timestamp);

        const paginatedData = allTransactions
            .slice(skip, skip + limit)
            .map(({ timestamp, ...rest }) => rest);

        return NextResponse.json({
            data: paginatedData,
            total: allTransactions.length,
            page,
            limit,
        });
    } catch (error: any) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json(
            {
                message: error.message || "Internal Server Error",
                stack: error.stack,
            },
            { status: 500 },
        );
    }
}
