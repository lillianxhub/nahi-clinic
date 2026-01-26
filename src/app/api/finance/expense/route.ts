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