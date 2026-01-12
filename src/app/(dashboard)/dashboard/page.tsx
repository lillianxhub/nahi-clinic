"use client";

import { useState } from "react";
import Pagination from "@/components/Pagination";
import DataTable, { Column } from "@/components/table/Table";
import { MedicineStock } from "@/interface/medicine";
import {
    Users,
    DollarSign,
    Package,
    AlertCircle,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    PieLabelRenderProps,
} from "recharts";
import Badge from "@/components/Badge";
import RevenueExpenseChart from "@/components/charts/RevenueExpenseChart";
import PieWithLegend from "@/components/charts/PieWithLegend";

/* ---------- mock data ---------- */

const revenueData = [
    { date: "6/1", รายรับ: 15000, รายจ่าย: 8000 },
    { date: "7/1", รายรับ: 18000, รายจ่าย: 9000 },
    { date: "8/1", รายรับ: 22000, รายจ่าย: 7500 },
    { date: "9/1", รายรับ: 19000, รายจ่าย: 8500 },
    { date: "10/1", รายรับ: 25000, รายจ่าย: 10000 },
    { date: "11/1", รายรับ: 21000, รายจ่าย: 9500 },
    { date: "12/1", รายรับ: 28000, รายจ่าย: 11000 },
];

const patientData = [
    { date: "6/1", จำนวน: 18 },
    { date: "7/1", จำนวน: 22 },
    { date: "8/1", จำนวน: 25 },
    { date: "9/1", จำนวน: 20 },
    { date: "10/1", จำนวน: 28 },
    { date: "11/1", จำนวน: 24 },
    { date: "12/1", จำนวน: 23 },
];

const treatmentData = [
    { name: "ตรวจรักษาทั่วไป", value: 45, color: "#3F7C87" },
    { name: "โรคเรื้อรัง", value: 25, color: "#5A9AA8" },
    { name: "ฉีดวัคซีน", value: 15, color: "#A5DBDD" },
    { name: "อื่นๆ", value: 15, color: "#C8E6E8" },
];

const medicines: MedicineStock[] = [
    { id: 1, name: "Paracetamol 500mg", stock: 25, min: 100 },
    { id: 2, name: "Amoxicillin 250mg", stock: 15, min: 50 },
    { id: 3, name: "Ibuprofen 400mg", stock: 8, min: 75 },
    { id: 4, name: "Cetirizine 10mg", stock: 30, min: 100 },
    { id: 5, name: "Metformin 500mg", stock: 12, min: 80 },
    { id: 6, name: "Cetirizine 10mg", stock: 30, min: 100 },
    { id: 7, name: "Metformin 500mg", stock: 12, min: 80 },
];

const columns: Column<MedicineStock>[] = [
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
/* ---------- components ---------- */

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

const renderPieLabel = ({
    percent,
}: PieLabelRenderProps): string => {
    if (percent === undefined) return "";
    return `${Math.round(percent * 100)}%`;
};


export default function DashboardPage() {
    const [page, setPage] = useState(1);
    return (
        <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Users} title="ผู้ป่วยวันนี้" value="23" />
                <StatCard icon={DollarSign} title="รายรับวันนี้" value="฿28,500" />
                <StatCard icon={Package} title="ยาในคลัง" value="156" />
                <StatCard icon={AlertCircle} title="ยาใกล้หมด" value="5" />
            </div>

            {/* Charts row */}
            <div className="bg-white border rounded-xl p-6">
                <h3 className="text-lg font-bold text-primary mb-4">
                    รายรับ - รายจ่าย
                </h3>
                <RevenueExpenseChart data={revenueData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* สัดส่วนการรักษา */}
                <div className="bg-white border rounded-xl p-6">
                    <h3 className="text-lg font-bold text-primary mb-4">
                        สัดส่วนการรักษา
                    </h3>

                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Chart */}
                        <div className="flex-1">
                            <PieWithLegend data={treatmentData} />
                        </div>
                    </div>
                </div>


                {/* จำนวนผู้ป่วยรายวัน */}
                <div className="bg-white border rounded-xl p-6">
                    <h3 className="text-lg font-bold text-primary mb-4">
                        จำนวนผู้ป่วยล่าสุด
                    </h3>
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
                </div>
            </div>

            <div className="bg-white border rounded-xl p-6">
                <h3 className="text-lg font-bold text-primary mb-4">
                    รายการยาที่ต้องสั่งเพิ่ม
                </h3>
                <DataTable
                    columns={columns}
                    data={medicines}
                    rowKey={(row) => row.id}
                    page={page}
                    pageSize={5}
                />
                <Pagination
                    page={page}
                    totalPages={Math.ceil(medicines.length / 5)}
                    onChange={setPage}
                />
            </div>

        </div >
    );
}
