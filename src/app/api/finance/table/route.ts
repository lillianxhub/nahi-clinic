import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        // 1. Receive Pagination and Filter values
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const range = searchParams.get("range") || "month";
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const type = searchParams.get("type") || "all";
        const skip = (page - 1) * limit;

        // 2. Prepare Filters
        const incomeWhere: any = { is_active: true, deleted_at: null };
        const expenseWhere: any = { is_active: true, deleted_at: null };

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
            incomeWhere.OR = [
                { visit: { patient: { first_name: { contains: search } } } },
                { visit: { patient: { last_name: { contains: search } } } },
            ];
            expenseWhere.description = { contains: search };
        }

        let incomes: any[] = [];
        let expenses: any[] = [];

        // 3. Fetch data based on type
        if (type === "all" || type === "income") {
            incomes = await prisma.income.findMany({
                where: incomeWhere,
                include: {
                    visit: {
                        include: {
                            patient: true,
                            visitDetails: true,
                        },
                    },
                },
                orderBy: { income_date: "desc" },
                take: 100, // Pull more for better combined pagination
            });
        }

        if (type === "all" || type === "expense") {
            expenses = await prisma.expense.findMany({
                where: expenseWhere,
                orderBy: { expense_date: "desc" },
                take: 100,
            });
        }

        // 4. Format data consistently for table display
        const formattedIncomes = incomes.map((item) => ({
            id: item.income_id,
            timestamp: item.income_date.getTime(),
            date: item.income_date.toLocaleString("th-TH", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            }),
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
                    items: item.visit.visitDetails.map((detail: any) => ({
                        description: detail.description,
                        quantity: Number(detail.quantity),
                        unit_price: Number(detail.unit_price),
                    })),
                }
                : undefined,
        }));

        const formattedExpenses = expenses.map((item) => {
            let categoryTH = "ค่าใช้จ่ายทั่วไป";
            if (item.expense_type === "drug") categoryTH = "ค่ายา/เวชภัณฑ์";
            if (item.expense_type === "utility")
                categoryTH = "ค่าเช่า/สาธารณูปโภค";

            return {
                id: item.expense_id,
                timestamp: item.expense_date.getTime(),
                date: item.expense_date.toLocaleString("th-TH", {
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

        // 5. Combine entries and sort by date (newest first)
        const allTransactions = [
            ...formattedIncomes,
            ...formattedExpenses,
        ].sort((a, b) => b.timestamp - a.timestamp);

        // 6. Paginate data
        const paginatedData = allTransactions
            .slice(skip, skip + limit)
            .map(({ timestamp, ...rest }) => rest);

        return NextResponse.json({
            data: paginatedData,
            total: allTransactions.length,
            page: page,
            limit: limit,
        });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
