import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        // 1. Receive Pagination values
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        // 2. Fetch Income data
        const incomes = await prisma.income.findMany({
            where: { is_active: true, deleted_at: null },
            include: {
                visit: {
                    include: {
                        patient: true,
                    },
                },
            },
            orderBy: { income_date: "desc" },
            take: 50,
        });

        // 3. Fetch Expense data
        const expenses = await prisma.expense.findMany({
            where: { is_active: true, deleted_at: null },
            orderBy: { expense_date: "desc" },
            take: 50,
        });

        // 4. Format data consistently for table display
        const formattedIncomes = incomes.map((item) => ({
            id: item.income_id,
            timestamp: item.income_date.getTime(), //ใช้เรียง
            date: item.income_date.toLocaleDateString("th-TH", {
                year: "numeric",
                month: "numeric",
                day: "numeric",
            }),
            type: "income",
            category: "ค่าตรวจรักษา",
            description: item.visit?.patient
                ? `ผู้ป่วย: ${item.visit.patient.first_name} ${item.visit.patient.last_name}`
                : "รายรับอื่นๆ",
            amount: Number(item.amount),
            status: "เสร็จสิ้น",
        }));

        const formattedExpenses = expenses.map((item) => {
            let categoryTH = "ค่าใช้จ่ายทั่วไป";
            if (item.expense_type === "drug") categoryTH = "ค่ายา/เวชภัณฑ์";
            if (item.expense_type === "utility")
                categoryTH = "ค่าเช่า/สาธารณูปโภค";

            return {
                id: item.expense_id,
                timestamp: item.expense_date.getTime(), //ใช้เรียง
                date: item.expense_date.toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
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
        const paginatedData = allTransactions.slice(skip, skip + limit).map(({ timestamp, ...rest }) => rest);

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
