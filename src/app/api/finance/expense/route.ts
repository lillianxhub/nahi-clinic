import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. ดึงข้อมูลสรุปผลรวมแยกตามประเภท
    const expenseGroups = await prisma.expense.groupBy({
      by: ['expense_type'],
      _sum: {
        amount: true,
      },
      where: {
        is_active: true,
      },
    });

    // 2. คำนวณหาผลรวมทั้งหมด เพื่อใช้คิดเปอร์เซ็นต์
    const totalAmount = expenseGroups.reduce((acc, curr) => {
      return acc + (Number(curr._sum.amount) || 0);
    }, 0);

    // 3. จัด Format ข้อมูลเพื่อส่งกลับไปยัง Frontend
    const stats = expenseGroups.map((group) => {
      const amount = Number(group._sum.amount) || 0;
      const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;

      return {
        type: group.expense_type,
        amount: amount,
        percentage: Math.round(percentage), // ปัดเศษให้สวย
      };
    });

    return NextResponse.json({
      total: totalAmount,
      data: stats
    });

  } catch (error) {
    console.error("Error fetching expense stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { expense_date, expense_type, amount, description, receipt_no } = body;

    // 1. Validation: ตรวจสอบค่าที่จำเป็น
    if (!expense_date || !amount || !expense_type) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลที่จำเป็น (วันที่, ประเภท, จำนวนเงิน)" },
        { status: 400 }
      );
    }

    // 2. สร้างรายการ Expense ใหม่ลง Database
    const newExpense = await prisma.expense.create({
      data: {
        expense_date: new Date(expense_date),
        expense_type: expense_type,
        amount: Number(amount),
        description: description || undefined,
        receipt_no: receipt_no || undefined,
        is_active: true,
      },
    });

    return NextResponse.json(newExpense, { status: 201 });

  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error },
      { status: 500 }
    );
  }
}