import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        /* =======================
           1. Stat Cards (ไม่ใช้ field compare ข้าม table)
        ======================= */

        const [todayPatients, todayIncome, totalDrugStock] = await Promise.all([
            prisma.visit.count({
                where: {
                    visit_date: {
                        gte: todayStart,
                        lte: todayEnd,
                    },
                    is_active: true,
                },
            }),

            prisma.income.aggregate({
                _sum: { amount: true },
                where: {
                    income_date: {
                        gte: todayStart,
                        lte: todayEnd,
                    },
                    is_active: true,
                },
            }),

            prisma.drug.count({
                where: { is_active: true },
            }),
        ]);

        /* =======================
           2. Revenue vs Expense (7 วันล่าสุด)
        ======================= */

        const revenue = await prisma.income.groupBy({
            by: ["income_date"],
            _sum: { amount: true },
            where: { is_active: true },
            orderBy: { income_date: "asc" },
            take: 7,
        });

        const expense = await prisma.expense.groupBy({
            by: ["expense_date"],
            _sum: { amount: true },
            where: { is_active: true },
            orderBy: { expense_date: "asc" },
            take: 7,
        });

        const revenueExpenseChart = revenue.map((r, index) => ({
            date: r.income_date.toLocaleDateString("th-TH"),
            รายรับ: Number(r._sum.amount ?? 0),
            รายจ่าย: Number(expense[index]?._sum.amount ?? 0),
        }));

        /* =======================
           3. Patient Chart (7 วันล่าสุด)
        ======================= */

        const patientChart = await prisma.visit.groupBy({
            by: ["visit_date"],
            _count: true,
            orderBy: { visit_date: "asc" },
            take: 7,
        });

        /* =======================
           4. Treatment Pie
        ======================= */

        const treatmentPie = await prisma.visit_Detail.groupBy({
            by: ["item_type"],
            _count: true,
        });

        /* =======================
           5. Low Stock Table (คำนวณใน JS)
        ======================= */

        const drugs = await prisma.drug.findMany({
            where: { is_active: true },
            include: {
                lots: {
                    where: { is_active: true },
                },
            },
        });

        const lowStock = drugs
            .map((drug) => {
                const stock = drug.lots.reduce(
                    (sum, lot) => sum + Number(lot.qty_remaining ?? 0),
                    0
                );

                if (stock >= drug.min_stock) return null;

                return {
                    id: drug.drug_id,
                    name: drug.drug_name,
                    stock,
                    min: drug.min_stock,
                };
            })
            .filter(Boolean);

        /* =======================
           Response
        ======================= */

        return NextResponse.json({
            stats: {
                todayPatients,
                todayIncome: Number(todayIncome._sum.amount ?? 0),
                totalDrugStock,
                lowStockCount: lowStock.length,
            },
            charts: {
                revenueExpense: revenueExpenseChart,
                patient: patientChart.map((p) => ({
                    date: p.visit_date.toLocaleDateString("th-TH"),
                    จำนวน: p._count,
                })),
                treatment: treatmentPie.map((t) => ({
                    name: t.item_type,
                    value: t._count,
                })),
            },
            tables: {
                lowStock,
            },
        });
    } catch (error: any) {
        console.error("Dashboard API error:", error);
        return NextResponse.json(
            {
                message: "เกิดข้อผิดพลาดในการโหลดข้อมูล dashboard",
                error: error.message,
            },
            { status: 500 }
        );
    }
}
