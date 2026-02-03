import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // 1. รับค่า Pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // 2. ดึงข้อมูล รายรับ (Income)
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

    // 3. ดึงข้อมูล รายจ่าย (Expense)
    const expenses = await prisma.expense.findMany({
      where: { is_active: true, deleted_at: null },
      orderBy: { expense_date: "desc" },
      take: 50,
    });

    // 4. แปลงข้อมูลให้อยู่ใน Format เดียวกันเพื่อใส่ตาราง
    const formattedIncomes = incomes.map((item) => ({
      id: item.income_id,
      date: item.income_date,
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
      if (item.expense_type === "utility") categoryTH = "ค่าเช่า/สาธารณูปโภค";

      return {
        id: item.expense_id,
        date: item.expense_date,
        type: "expense",
        category: categoryTH,
        description: item.description || "-",
        amount: -Number(item.amount),
        status: "เสร็จสิ้น",
      };
    });

    // 5. รวมรายการและเรียงตามวันที่ (ล่าสุดขึ้นก่อน)
    const allTransactions = [...formattedIncomes, ...formattedExpenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // 6. ตัดแบ่งหน้า (Pagination)
    const paginatedData = allTransactions.slice(skip, skip + limit);

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
      { status: 500 }
    );
  }
}