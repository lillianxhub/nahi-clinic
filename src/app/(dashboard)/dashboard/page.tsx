"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/Pagination";
import DataTable, { Column } from "@/components/table/Table";
import { Users, DollarSign, Package, AlertCircle } from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import Badge from "@/components/Badge";
import RevenueExpenseChart from "@/components/charts/RevenueExpenseChart";
import PieWithLegend from "@/components/charts/PieWithLegend";
import { dashboardService } from "@/services/dashboard";
import {
    DashboardStats,
    LowStockItem,
    PatientChartData,
    RevenueExpenseChartData,
} from "@/interface/dashboard";
import usePageTitle from "@/hooks/usePageTitle";
import StatCard from "@/components/cards/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* =========================
   Table Columns
========================= */

const columns: Column<LowStockItem>[] = [
    {
        key: "name",
        header: "ชื่อยา",
    },
    {
        key: "stock",
        header: "คงเหลือ",
        align: "center",
    },
    {
        key: "min",
        header: "ขั้นต่ำ",
        align: "center",
    },
    {
        key: "status",
        header: "สถานะ",
        align: "center",
        render: (row) => {
            const percent = (row.stock / row.min) * 100;

            if (percent < 20) {
                return <Badge label="ต้องสั่งด่วน" variant="error" />;
            }

            return <Badge label="ใกล้หมด" variant="warning" />;
        },
    },
];

/* =========================
   Components
========================= */

/* =========================
   Page
========================= */

export default function DashboardPage() {
    usePageTitle("Dashboard");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    // Data States
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [revenueExpense, setRevenueExpense] = useState<
        RevenueExpenseChartData[]
    >([]);
    const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
    const [patientData, setPatientData] = useState<PatientChartData[]>([]);
    const [chartFilter, setChartFilter] = useState("week");

    // Mock Data for missing endpoints or skipped charts
    const [treatmentData] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [statsRes, revenueRes, lowStockRes, patientRes] =
                    await Promise.all([
                        dashboardService.getStats(),
                        dashboardService.getRevenueExpenseChart(chartFilter),
                        dashboardService.getLowStockTable(),
                        dashboardService.getPatientChart(),
                    ]);

                setStats(statsRes.data);
                setRevenueExpense(revenueRes.data);
                setLowStock(lowStockRes.data);
                setPatientData(patientRes.data);
            } catch (error) {
                console.error("Load dashboard error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [chartFilter]);

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    if (!stats) {
        return <div className="p-6 text-red-500">โหลดข้อมูลไม่สำเร็จ</div>;
    }

    return (
        <div className="space-y-6">
            {/* ================= Stat Cards ================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={Users}
                    title="ผู้ป่วยวันนี้"
                    value={stats.todayPatients.toString()}
                />
                <StatCard
                    icon={DollarSign}
                    title="รายรับวันนี้"
                    value={`฿${stats.todayIncome.toLocaleString()}`}
                />
                <StatCard
                    icon={Package}
                    title="ยาในคลัง"
                    value={stats.totalDrugStock.toString()}
                />
                <StatCard
                    icon={AlertCircle}
                    title="ยาใกล้หมด"
                    value={stats.lowStockCount.toString()}
                />
            </div>

            {/* ================= Revenue / Expense ================= */}

            {/* ================= Charts ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-6">
                        <CardTitle className="text-lg font-bold text-primary">
                            รายรับ - รายจ่าย
                        </CardTitle>
                        <select
                            value={chartFilter}
                            onChange={(e) => setChartFilter(e.target.value)}
                            className="text-sm border rounded-lg px-2 py-1 outline-none"
                        >
                            <option value="week">7 วันล่าสุด</option>
                            <option value="month">เดือน</option>
                            <option value="year">ปี</option>
                        </select>
                    </CardHeader>
                    <CardContent>
                        <RevenueExpenseChart data={revenueExpense} />
                    </CardContent>
                </Card>

                {/* Patient Chart */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-primary">
                            จำนวนผู้ป่วย 7 วันล่าสุด
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={patientData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value) => [value, "จำนวน"]}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="#3F7C87"
                                    radius={[5, 5, 0, 0]}
                                    barSize={35}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* ================= Low Stock Table ================= */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-primary">
                        รายการยาที่ต้องสั่งเพิ่ม
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {lowStock.length > 0 ? (
                        <>
                            <DataTable
                                columns={columns}
                                data={lowStock}
                                rowKey={(row) => row.id}
                                page={page}
                                pageSize={5}
                            />

                            <Pagination
                                page={page}
                                totalPages={Math.ceil(lowStock.length / 5)}
                                onChange={setPage}
                            />
                        </>
                    ) : (
                        <div className="py-12 text-center text-muted border-2 border-dashed border-gray-100 rounded-xl">
                            <Package
                                className="mx-auto mb-2 opacity-20"
                                size={48}
                            />
                            <p>ไม่มีรายการยาใกล้หมด</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
