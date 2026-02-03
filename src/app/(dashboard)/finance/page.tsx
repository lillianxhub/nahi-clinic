"use client";

import { useState } from "react";
import {
    DollarSign, TrendingUp, TrendingDown, Calendar, Search,
    Filter, Download, Plus, Edit, Trash2, X, Check,
    ArrowUpRight, ArrowDownRight, FileText, Menu, Home,
    Users, Package, Settings, BarChart3, Eye
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import PieWithLegend from "@/components/charts/PieWithLegend";
import TransactionsTable from "@/components/finance/TransactionsTable";

function StatCard({
    icon: Icon,
    title,
    value,
    subtitle,
    trend,
    trendValue,
    color
}: {
    icon: any;
    title: string;
    value: string;
    subtitle: string;
    trend?: string;
    trendValue?: string;
    color?: string;
}) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border transition-all hover:shadow-md" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex items-start justify-between mb-4">
                <div className="rounded-xl p-3" style={{ backgroundColor: `${color}10` }}>
                    <Icon size={24} style={{ color }} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>
            <div>
                <p className="text-sm mb-1" style={{ color: '#7E7E7E' }}>{title}</p>
                <h3 className="text-3xl font-bold mb-1" style={{ color }}>{value}</h3>
                {subtitle && <p className="text-sm" style={{ color: '#7E7E7E' }}>{subtitle}</p>}
            </div>
        </div>
    )
}


export default function FinancePage() {
    const [showAddModal, setShowAddModal] = useState(false);
    const [transactionType, setTransactionType] = useState('income');
    const [filterType, setFilterType] = useState('all');
    const [dateRange, setDateRange] = useState('month');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // ข้อมูลสรุป
    const summaryData = {
        totalIncome: 285000,
        totalExpense: 142500,
        netProfit: 142500,
        thisMonthIncome: 28500,
        thisMonthExpense: 14250,
    };

    // ข้อมูลกราฟรายรับรายจ่าย
    const chartData = [
        { month: 'ม.ค.', รายรับ: 245000, รายจ่าย: 125000 },
        { month: 'ก.พ.', รายรับ: 268000, รายจ่าย: 132000 },
        { month: 'มี.ค.', รายรับ: 252000, รายจ่าย: 128000 },
        { month: 'เม.ย.', รายรับ: 278000, รายจ่าย: 145000 },
        { month: 'พ.ค.', รายรับ: 295000, รายจ่าย: 138000 },
        { month: 'มิ.ย.', รายรับ: 285000, รายจ่าย: 142500 },
    ];

    // ข้อมูลสัดส่วนรายรับ
    const incomeDistribution = [
        { name: 'ค่าตรวจรักษา', value: 45, amount: 128250, color: '#3F7C87' },
        { name: 'ค่ายา', value: 35, amount: 99750, color: '#5A9AA8' },
        { name: 'ค่าบริการ', value: 12, amount: 34200, color: '#A5DBDD' },
        { name: 'วัคซีน', value: 8, amount: 22800, color: '#C8E6E8' },
    ];

    // ข้อมูลสัดส่วนรายจ่าย
    const expenseDistribution = [
        { name: 'ค่ายา/เวชภัณฑ์', value: 40, amount: 57000, color: '#EF4444' },
        { name: 'เงินเดือนพนักงาน', value: 35, amount: 49875, color: '#F59E0B' },
        { name: 'ค่าเช่า/สาธารณูปโภค', value: 15, amount: 21375, color: '#10B981' },
        { name: 'อื่นๆ', value: 10, amount: 14250, color: '#3B82F6' },
    ];

    // รายการธุรกรรมล่าสุด
    const [transactions, setTransactions] = useState([
        { id: 1, date: '2024-01-12', type: 'income', category: 'ค่าตรวจรักษา', description: 'ผู้ป่วย: นางสาวมาลี สุขสันต์', amount: 1500, status: 'completed' },
        { id: 2, date: '2024-01-12', type: 'income', category: 'ค่ายา', description: 'ขายยา: Paracetamol, Amoxicillin', amount: 850, status: 'completed' },
        { id: 3, date: '2024-01-12', type: 'expense', category: 'ค่ายา/เวชภัณฑ์', description: 'สั่งซื้อยา: บริษัท ABC จำกัด', amount: 12500, status: 'completed' },
        { id: 4, date: '2024-01-11', type: 'income', category: 'วัคซีน', description: 'ฉีดวัคซีนไข้หวัดใหญ่', amount: 1200, status: 'completed' },
        { id: 5, date: '2024-01-11', type: 'expense', category: 'ค่าเช่า/สาธารณูปโภค', description: 'ค่าไฟฟ้าประจำเดือน', amount: 3500, status: 'completed' },
        { id: 6, date: '2024-01-11', type: 'income', category: 'ค่าตรวจรักษา', description: 'ผู้ป่วย: นายวิชัย กล้าหาญ', amount: 2000, status: 'completed' },
        { id: 7, date: '2024-01-10', type: 'expense', category: 'เงินเดือนพนักงาน', description: 'เงินเดือนครึ่งเดือน', amount: 25000, status: 'pending' },
        { id: 8, date: '2024-01-10', type: 'income', category: 'ค่าบริการ', description: 'ค่าใบรับรองแพทย์', amount: 300, status: 'completed' },
    ]);

    const menuItems = [
        { icon: Home, label: 'Dashboard', active: false },
        { icon: Users, label: 'ผู้ป่วย', active: false },
        { icon: Package, label: 'คลังยา', active: false },
        { icon: DollarSign, label: 'รายรับ-รายจ่าย', active: true },
        { icon: FileText, label: 'บันทึกการรักษา', active: false },
        { icon: BarChart3, label: 'รายงาน', active: false },
        { icon: Settings, label: 'ตั้งค่า', active: false },
    ];

    const filteredTransactions = transactions.filter(t => {
        if (filterType === 'all') return true;
        return t.type === filterType;
    });

    return (
        <>
            {/* Content */}
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={ArrowUpRight}
                        title="รายรับทั้งหมด"
                        value="฿285,000"
                        subtitle="เดือนนี้"
                        color="#10B981"
                    />
                    <StatCard
                        icon={ArrowDownRight}
                        title="รายจ่ายทั้งหมด"
                        value="฿142,500"
                        subtitle="เดือนนี้"
                        color="#EF4444"
                    />
                    <StatCard
                        icon={DollarSign}
                        title="กำไรสุทธิ"
                        value="฿142,500"
                        subtitle="เดือนนี้"
                        color="#3F7C87"
                    />
                    <StatCard
                        icon={TrendingUp}
                        title="อัตรากำไร"
                        value="50%"
                        subtitle="เพิ่มขึ้น 5%"
                        color="#F59E0B"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Revenue Trend */}
                    <div className="lg:col-span-2 bg-white border rounded-xl p-6 shadow-sm" style={{ borderColor: '#E5E7EB' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold" style={{ color: '#3F7C87' }}>แนวโน้มรายรับ-รายจ่าย</h3>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="px-3 py-2 border rounded-lg text-sm outline-none"
                                style={{ borderColor: '#E5E7EB', color: '#3F7C87' }}
                            >
                                <option value="week">7 วันล่าสุด</option>
                                <option value="month">เดือนนี้</option>
                                <option value="year">ปีนี้</option>
                            </select>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                <XAxis dataKey="month" stroke="#7E7E7E" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#7E7E7E" style={{ fontSize: '12px' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                                <Legend />
                                <Bar dataKey="รายรับ" fill="#3F7C87" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="รายจ่าย" fill="#91d9db" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Income Distribution */}
                    <div className="bg-white border rounded-xl p-6 shadow-sm" style={{ borderColor: '#E5E7EB' }}>
                        <h3 className="text-lg font-bold mb-6" style={{ color: '#3F7C87' }}>สัดส่วนรายรับ</h3>
                        <PieWithLegend data={incomeDistribution} />
                    </div>
                </div>

                {/* Expense Distribution */}
                <div className="bg-white border rounded-xl p-6 shadow-sm mb-6" style={{ borderColor: '#E5E7EB' }}>
                    <h3 className="text-lg font-bold mb-6" style={{ color: '#3F7C87' }}>สัดส่วนรายจ่าย</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {expenseDistribution.map((item, index) => (
                            <div key={index} className="p-4 border rounded-lg" style={{ borderColor: '#F3F4F6' }}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex-1">
                                        <p className="text-sm pb-2">{item.name}</p>
                                        <p className="font-bold text-primary">฿{item.amount.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs mb-2">
                                    <span className="text-muted">{item.value}% ของรายจ่าย</span>
                                </div>
                                <div className="w-full rounded-full h-2" style={{ backgroundColor: '#F3F4F6' }}>
                                    <div className="h-2 rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white border rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <h3 className="text-lg font-bold text-primary">
                            รายการธุรกรรม
                        </h3>

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setTransactionType("income");
                                    setShowAddModal(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm cursor-pointer"
                                style={{ backgroundColor: "#3F7C87" }}
                            >
                                <Plus size={16} />
                                เพิ่มรายรับ
                            </button>

                            <button
                                onClick={() => {
                                    setTransactionType("expense");
                                    setShowAddModal(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm cursor-pointer"
                                style={{ backgroundColor: "#5A9AA8" }}
                            >
                                <Plus size={16} />
                                เพิ่มรายจ่าย
                            </button>
                        </div>
                    </div>
                    <TransactionsTable data={transactions} />
                </div>

            </div>


            {/* Add Transaction Modal */}
            {showAddModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold" style={{ color: '#3F7C87' }}>เพิ่มรายการใหม่</h3>
                            <button onClick={() => setShowAddModal(false)}>
                                <X size={24} style={{ color: '#7E7E7E' }} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Transaction Type */}
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: '#3F7C87' }}>ประเภทรายการ</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setTransactionType('income')}
                                        className={`p-4 border-2 rounded-lg transition-all ${transactionType === 'income' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                                    >
                                        <ArrowUpRight size={24} className="mx-auto mb-2" style={{ color: '#10B981' }} />
                                        <p className="font-medium" style={{ color: transactionType === 'income' ? '#10B981' : '#7E7E7E' }}>รายรับ</p>
                                    </button>
                                    <button
                                        onClick={() => setTransactionType('expense')}
                                        className={`p-4 border-2 rounded-lg transition-all ${transactionType === 'expense' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                                    >
                                        <ArrowDownRight size={24} className="mx-auto mb-2" style={{ color: '#EF4444' }} />
                                        <p className="font-medium" style={{ color: transactionType === 'expense' ? '#EF4444' : '#7E7E7E' }}>รายจ่าย</p>
                                    </button>
                                </div>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: '#3F7C87' }}>วันที่</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all"
                                    style={{ borderColor: '#E5E7EB', color: '#3F7C87' }}
                                    onFocus={(e) => e.target.style.borderColor = '#3F7C87'}
                                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: '#3F7C87' }}>หมวดหมู่</label>
                                <select
                                    className="w-full px-4 py-3 border-2 rounded-lg outline-none"
                                    style={{ borderColor: '#E5E7EB', color: '#3F7C87' }}
                                >
                                    {transactionType === 'income' ? (
                                        <>
                                            <option>ค่าตรวจรักษา</option>
                                            <option>ค่ายา</option>
                                            <option>ค่าบริการ</option>
                                            <option>วัคซีน</option>
                                        </>
                                    ) : (
                                        <>
                                            <option>ค่ายา/เวชภัณฑ์</option>
                                            <option>เงินเดือนพนักงาน</option>
                                            <option>ค่าเช่า/สาธารณูปโภค</option>
                                            <option>อื่นๆ</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            {/* Amount */}
                            <div>
                                <label
                                    className="block text-sm font-medium mb-2"
                                    style={{ color: '#3F7C87' }}
                                >
                                    จำนวนเงิน
                                </label>
                                <input
                                    type="number"
                                    placeholder="กรอกจำนวนเงิน"
                                    className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all"
                                    style={{ borderColor: '#E5E7EB', color: '#3F7C87' }}
                                />
                            </div>

                            {/* Description */}
                            
                            {transactionType === 'expense' && (
                                <div>
                                    <label
                                        className="block text-sm font-medium mb-2"
                                        style={{ color: '#3F7C87' }}
                                    >
                                        รายละเอียด
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="รายละเอียดเพิ่มเติม"
                                        className="w-full px-4 py-3 border-2 rounded-lg outline-none resize-none"
                                        style={{ borderColor: '#E5E7EB', color: '#3F7C87' }}
                                    />
                                </div>
                            )}

                            {/* Status */}
                            <div>
                                <label
                                    className="block text-sm font-medium mb-2"
                                    style={{ color: '#3F7C87' }}
                                >
                                    สถานะ
                                </label>
                                <select
                                    className="w-full px-4 py-3 border-2 rounded-lg outline-none"
                                    style={{ borderColor: '#E5E7EB', color: '#3F7C87' }}
                                >
                                    <option value="completed">เสร็จสิ้น</option>
                                    <option value="pending">รอดำเนินการ</option>
                                </select>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex items-center gap-2 px-5 py-2 rounded-lg border hover:bg-gray-50"
                                    style={{ borderColor: '#E5E7EB', color: '#7E7E7E' }}
                                >
                                    <X size={18} />
                                    ยกเลิก
                                </button>

                                <button
                                    onClick={() => {
                                        // mock submit
                                        setShowAddModal(false);
                                    }}
                                    className="flex items-center gap-2 px-6 py-2 rounded-lg text-white hover:opacity-90"
                                    style={{ backgroundColor: '#3F7C87' }}
                                >
                                    <Check size={18} />
                                    บันทึก
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
