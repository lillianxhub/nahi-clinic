import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { 
  startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, 
  subDays, format, isSameMonth, isSameDay, addDays, addMonths 
} from "date-fns";
import { th } from "date-fns/locale";

export async function GET(request: Request) {
  try {
    // 1. รับค่า filter จาก URL (เช่น /api/finance/bar-chart?range=7days)
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "year"; // default เป็น year

    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let groupBy: "day" | "month" = "month";

    // 2. กำหนดช่วงเวลาตาม filter
    if (range === "week") {
      // 7 วันล่าสุด: ย้อนหลัง 6 วัน + วันนี้
      startDate = startOfDay(subDays(now, 6));
      endDate = endOfDay(now);
      groupBy = "day";
    } else if (range === "month") {
      // เดือนนี้: ตั้งแต่วันที่ 1 ถึงสิ้นเดือน
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      groupBy = "day";
    } else {
      // ปีนี้ (default): ตั้งแต่ม.ค. ถึง ธ.ค. ของปีปัจจุบัน
      startDate = startOfYear(now);
      endDate = endOfYear(now);
      groupBy = "month";
    }

    // 3. ดึงข้อมูล Income
    const incomes = await prisma.income.findMany({
      where: {
        income_date: { gte: startDate, lte: endDate },
        is_active: true,
        deleted_at: null,
      },
      select: { amount: true, income_date: true },
    });

    // 4. ดึงข้อมูล Expense
    const expenses = await prisma.expense.findMany({
      where: {
        expense_date: { gte: startDate, lte: endDate },
        is_active: true,
        deleted_at: null,
      },
      select: { amount: true, expense_date: true },
    });

    // 5. ประมวลผลข้อมูล (Loop ตามช่วงเวลา)
    const chartData = [];
    let currentLoop = startDate;

    while (currentLoop <= endDate) {
      let label = "";
      let incomeSum = 0;
      let expenseSum = 0;

      if (groupBy === "month") {
        // --- กรณีจัดกลุ่มรายเดือน (สำหรับ "ปีนี้") ---
        label = format(currentLoop, "MMM", { locale: th }); // เช่น "ม.ค."
        
        incomeSum = incomes
          .filter((i) => isSameMonth(i.income_date, currentLoop))
          .reduce((sum, i) => sum + Number(i.amount), 0);

        expenseSum = expenses
          .filter((e) => isSameMonth(e.expense_date, currentLoop))
          .reduce((sum, e) => sum + Number(e.amount), 0);
          
        // ขยับไปเดือนถัดไป
        currentLoop = addMonths(currentLoop, 1);

      } else {
        // --- กรณีจัดกลุ่มรายวัน (สำหรับ "7 วันล่าสุด" หรือ "เดือนนี้") ---
        label = format(currentLoop, "d MMM", { locale: th });
        
        incomeSum = incomes
          .filter((i) => isSameDay(i.income_date, currentLoop))
          .reduce((sum, i) => sum + Number(i.amount), 0);

        expenseSum = expenses
          .filter((e) => isSameDay(e.expense_date, currentLoop))
          .reduce((sum, e) => sum + Number(e.amount), 0);

        // ขยับไปวันถัดไป
        currentLoop = addDays(currentLoop, 1);
      }

      chartData.push({
        name: label,
        income: incomeSum,
        expense: expenseSum,
      });
    }

    return NextResponse.json(chartData);

  } catch (error) {
    console.error("Error fetching finance chart data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}