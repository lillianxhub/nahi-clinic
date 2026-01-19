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
import { DashboardStats, LowStockItem, RevenueExpenseChartData } from "@/interface/dashboard";

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
        key: "stock", // Using stock as key for status render logic
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

function StatCard({
    icon: Icon,
    title,
    value,
}: {
    icon: any;
    title: string;
    value: string;
}) {
    return (
        <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex justify-between mb-4">
                <Icon className="text-primary" />
            </div>
            <p className="text-muted text-sm">{title}</p>
            <h3 className="text-2xl font-bold text-primary">{value}</h3>
        </div>
    );
}

/* =========================
   Page
========================= */

export default function DashboardPage() {
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    
    // Data States
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [revenueExpense, setRevenueExpense] = useState<RevenueExpenseChartData[]>([]);
    const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
    
    // Mock Data for missing endpoints or skipped charts
    const [treatmentData] = useState<any[]>([]); 
    const [patientData] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [statsRes, revenueRes, lowStockRes] = await Promise.all([
                    dashboardService.getStats(),
                    dashboardService.getRevenueExpenseChart(),
                    dashboardService.getLowStockTable(),
                ]);

                setStats(statsRes.data);
                setRevenueExpense(revenueRes.data);
                setLowStock(lowStockRes.data);
            } catch (error) {
                console.error("Load dashboard error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

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
            <div className="bg-white border rounded-xl p-6">
                <h3 className="text-lg font-bold text-primary mb-4">
                    รายรับ - รายจ่าย
                </h3>
                <RevenueExpenseChart data={revenueExpense} />
            </div>

            {/* ================= Charts ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Treatment Pie */}
                <div className="bg-white border rounded-xl p-6">
                    <h3 className="text-lg font-bold text-primary mb-4">
                        สัดส่วนการรักษา
                    </h3>
                    <div className="h-[260px] flex items-center justify-center text-muted">
                        Coming soon
                    </div>
                   {/* <PieWithLegend data={treatmentData} /> */}
                </div>

                {/* Patient Chart */}
                <div className="bg-white border rounded-xl p-6">
                    <h3 className="text-lg font-bold text-primary mb-4">
                        จำนวนผู้ป่วยล่าสุด
                    </h3>
                     <div className="h-[260px] flex items-center justify-center text-muted">
                        Coming soon
                    </div>
                    {/* 
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={patientData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Bar
                                dataKey="จำนวน"
                                fill="#3F7C87"
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer> 
                    */}
                </div>
            </div>

            {/* ================= Low Stock Table ================= */}
            <div className="bg-white border rounded-xl p-6">
                <h3 className="text-lg font-bold text-primary mb-4">
                    รายการยาที่ต้องสั่งเพิ่ม
                </h3>

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
            </div>
        </div>
    );
}