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

        // Income: date filter via visit.visit_date
        if (start) {
            incomeWhere.visit = { visit_date: { gte: start } };
            expenseWhere.created_at = { gte: start };
        }
        if (end) {
            incomeWhere.visit = {
                ...incomeWhere.visit,
                visit_date: { ...incomeWhere.visit?.visit_date, lte: end },
            };
            expenseWhere.created_at = { ...expenseWhere.created_at, lte: end };
        }

        if (search) {
            incomeWhere.visit = {
                ...incomeWhere.visit,
                patient: {
                    OR: [
                        { first_name: { contains: search } },
                        { last_name: { contains: search } },
                    ],
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
                    visit: {
                        include: {
                            patient: true,
                            items: {
                                where: { is_active: true },
                                include: {
                                    product: {
                                        select: {
                                            product_name: true,
                                            product_type: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { created_at: "desc" },
                take: 100,
            });
        }

        if (type === "all" || type === "expense") {
            expenses = await prisma.expense.findMany({
                where: expenseWhere,
                orderBy: { created_at: "desc" },
                take: 100,
            });
        }

        const formattedIncomes = incomes.map((item) => ({
            id: item.income_id,
            receipt_no: item.receipt_no,
            timestamp: (item.visit?.visit_date ?? item.created_at).getTime(),
            date: (item.visit?.visit_date ?? item.created_at).toLocaleString(
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
            ),
            type: "income",
            category: "ค่าตรวจรักษา",
            description: item.visit?.patient
                ? `ผู้ป่วย: ${item.visit.patient.first_name} ${item.visit.patient.last_name}`
                : "รายรับอื่นๆ",
            amount: Number(item.amount),
            status: "เสร็จสิ้น",
            visit: item.visit
                ? {
                      symptom: item.visit.symptom,
                      diagnosis: item.visit.diagnosis,
                      note: item.visit.note,
                      items: item.visit.items.map((vi: any) => ({
                          product_name: vi.product?.product_name,
                          product_type: vi.product?.product_type,
                          quantity: Number(vi.quantity),
                          unit_price: Number(vi.unit_price),
                          total_price: Number(vi.total_price),
                      })),
                  }
                : undefined,
        }));

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
                timestamp: item.created_at.getTime(),
                date: item.created_at.toLocaleString("th-TH", {
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
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
