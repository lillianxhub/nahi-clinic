"use client";

import { useState, useEffect } from "react";
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Calendar,
    Search,
    Filter,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    X,
    Check,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import PieWithLegend from "@/components/charts/PieWithLegend";
import TransactionsTable from "@/components/finance/TransactionsTable";
import AddTransactionModal from "@/components/finance/AddTransactionModal";
import { financeService } from "@/services/finance";
import {
    FinanceSummaryStats,
    FinanceBarChartItem,
    IncomeStatItem,
    ExpenseStatItem,
    TransactionItem,
} from "@/interface/finance";
import usePageTitle from "@/hooks/usePageTitle";

function StatCard({
    icon: Icon,
    title,
    value,
    subtitle,
    trend,
    trendValue,
    color,
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
        <div
            className="bg-white rounded-xl p-6 shadow-sm border transition-all hover:shadow-md"
            style={{ borderColor: "#E5E7EB" }}
        >
            <div className="flex items-start justify-between mb-4">
                <div
                    className="rounded-xl p-3"
                    style={{ backgroundColor: `${color}10` }}
                >
                    <Icon size={24} style={{ color }} />
                </div>
                {trend && (
                    <div
                        className={`flex items-center gap-1 text-sm font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}
                    >
                        {trend === "up" ? (
                            <TrendingUp size={16} />
                        ) : (
                            <TrendingDown size={16} />
                        )}
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>
            <div>
                <p className="text-sm mb-1" style={{ color: "#7E7E7E" }}>
                    {title}
                </p>
                <h3 className="text-3xl font-bold mb-1" style={{ color }}>
                    {value}
                </h3>
                {subtitle && (
                    <p className="text-sm" style={{ color: "#7E7E7E" }}>
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function FinancePage() {
    usePageTitle("Finance");
    const [showAddModal, setShowAddModal] = useState(false);
    const [transactionType, setTransactionType] = useState("income");
    const [filterType, setFilterType] = useState("all");
    const [dateRange, setDateRange] = useState<"week" | "month" | "year">(
        "year",
    );

    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<FinanceSummaryStats | null>(null);
    const [chartData, setChartData] = useState<FinanceBarChartItem[]>([]);
    const [incomeStats, setIncomeStats] = useState<IncomeStatItem[]>([]);
    const [expenseStats, setExpenseStats] = useState<ExpenseStatItem[]>([]);
    const [transactions, setTransactions] = useState<TransactionItem[]>([]);
    const [transactionPage, setTransactionPage] = useState(1);
    const [totalTransactions, setTotalTransactions] = useState(0);
    const TRANSACTIONS_PER_PAGE = 10;

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");

    const fetchTransactionsData = async (page: number) => {
        try {
            const tableRes = await financeService.getTransactionsTable({
                page,
                limit: TRANSACTIONS_PER_PAGE,
                search: searchQuery,
                startDate: customStartDate,
                endDate: customEndDate,
                type: filterType,
            });
            setTransactions(tableRes.data);
            setTotalTransactions(tableRes.total);
            setTransactionPage(tableRes.page);
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        }
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const queryParams = { range: dateRange };
            const [summaryRes, chartRes, incomeRes, expenseRes] =
                await Promise.all([
                    financeService.getSummaryStats(queryParams),
                    financeService.getBarChartData(queryParams),
                    financeService.getIncomeStats(queryParams),
                    financeService.getExpenseStats(queryParams),
                ]);

            setSummary(summaryRes.data);
            setChartData(chartRes);
            setIncomeStats(incomeRes.data);
            setExpenseStats(expenseRes.data);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [dateRange]);

    useEffect(() => {
        fetchTransactionsData(1);
    }, [filterType, customStartDate, customEndDate]);

    const handleSearch = () => {
        fetchTransactionsData(1);
    };

    const incomeColors = ["#3F7C87", "#5A9AA8", "#A5DBDD", "#C8E6E8"];
    const formattedIncomeDistribution = incomeStats.map((item, index) => ({
        name:
            item.type === "drug"
                ? "จ่ายยา"
                : item.type === "service"
                  ? "บริการ"
                  : item.type,
        value: item.percentage,
        amount: item.amount,
        color: incomeColors[index % incomeColors.length],
    }));

    const expenseColors = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6"];
    const expenseTypeLabels = {
        drug: "ค่ายา",
        utility: "ค่าเช่า/สาธารณูปโภค",
        general: "ค่าใช้จ่ายอื่นๆ",
    };
    const formattedExpenseDistribution = expenseStats.map((item, index) => ({
        name:
            expenseTypeLabels[item.type as keyof typeof expenseTypeLabels] ||
            item.type,
        value: item.percentage,
        amount: item.amount,
        color: expenseColors[index % expenseColors.length],
    }));

    if (loading && !summary) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                กำลังโหลดข้อมูล...
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={ArrowUpRight}
                        title="รายรับทั้งหมด"
                        value={`฿${(summary?.monthIncome || 0).toLocaleString()}`}
                        subtitle="ช่วงเวลาที่เลือก"
                        color="#10B981"
                    />
                    <StatCard
                        icon={ArrowDownRight}
                        title="รายจ่ายทั้งหมด"
                        value={`฿${(summary?.monthExpense || 0).toLocaleString()}`}
                        subtitle="ช่วงเวลาที่เลือก"
                        color="#EF4444"
                    />
                    <StatCard
                        icon={DollarSign}
                        title="กำไรสุทธิ"
                        value={`฿${(summary?.netProfit || 0).toLocaleString()}`}
                        trend={
                            (summary?.netProfitGrowth || 0) >= 0 ? "up" : "down"
                        }
                        trendValue={`${Math.abs(summary?.netProfitGrowth || 0)}%`}
                        subtitle="เทียบกับช่วงก่อนหน้า"
                        color="#3F7C87"
                    />
                    <StatCard
                        icon={TrendingUp}
                        title="อัตรากำไร"
                        value={`${summary?.profitRate || 0}%`}
                        subtitle="ช่วงเวลาที่เลือก"
                        color="#F59E0B"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Trend */}
                    <div
                        className="lg:col-span-2 bg-white border rounded-xl p-6 shadow-sm"
                        style={{ borderColor: "#E5E7EB" }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3
                                className="text-lg font-bold"
                                style={{ color: "#3F7C87" }}
                            >
                                แนวโน้มรายรับ-รายจ่าย
                            </h3>
                            <select
                                value={dateRange}
                                onChange={(e) =>
                                    setDateRange(e.target.value as any)
                                }
                                disabled={!!(customStartDate && customEndDate)}
                                className="px-3 py-2 border rounded-lg text-sm outline-none disabled:bg-gray-50"
                                style={{
                                    borderColor: "#E5E7EB",
                                    color: "#3F7C87",
                                }}
                            >
                                <option value="week">วัน</option>
                                <option value="month">เดือน</option>
                                <option value="year">ปี</option>
                            </select>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={chartData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#F3F4F6"
                                />
                                <XAxis
                                    dataKey="name"
                                    stroke="#7E7E7E"
                                    style={{ fontSize: "12px" }}
                                />
                                <YAxis
                                    stroke="#7E7E7E"
                                    style={{ fontSize: "12px" }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#fff",
                                        border: "1px solid #E5E7EB",
                                        borderRadius: "8px",
                                    }}
                                />
                                <Legend />
                                <Bar
                                    dataKey="income"
                                    name="รายรับ"
                                    fill="#3F7C87"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="expense"
                                    name="รายจ่าย"
                                    fill="#91d9db"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Income Distribution */}
                    <div
                        className="bg-white border rounded-xl p-6 shadow-sm"
                        style={{ borderColor: "#E5E7EB" }}
                    >
                        <h3
                            className="text-lg font-bold mb-6"
                            style={{ color: "#3F7C87" }}
                        >
                            สัดส่วนรายรับ
                        </h3>
                        <PieWithLegend data={formattedIncomeDistribution} />
                    </div>
                </div>

                {/* Expense Distribution */}
                <div
                    className="bg-white border rounded-xl p-6 shadow-sm"
                    style={{ borderColor: "#E5E7EB" }}
                >
                    <h3
                        className="text-lg font-bold mb-6"
                        style={{ color: "#3F7C87" }}
                    >
                        สัดส่วนรายจ่าย
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {formattedExpenseDistribution.map((item, index) => (
                            <div
                                key={index}
                                className="p-4 border rounded-lg"
                                style={{ borderColor: "#F3F4F6" }}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex-1">
                                        <p className="text-sm pb-2">
                                            {item.name}
                                        </p>
                                        <p className="font-bold text-primary">
                                            ฿{item.amount.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs mb-2">
                                    <span className="text-muted">
                                        {item.value}% ของรายจ่าย
                                    </span>
                                </div>
                                <div
                                    className="w-full rounded-full h-2"
                                    style={{ backgroundColor: "#F3F4F6" }}
                                >
                                    <div
                                        className="h-2 rounded-full"
                                        style={{
                                            width: `${item.value}%`,
                                            backgroundColor: item.color,
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Transactions Table Section */}
                <div
                    className="bg-white border rounded-xl p-6 shadow-sm"
                    style={{ borderColor: "#E5E7EB" }}
                >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                        <h3 className="text-lg font-bold text-primary">
                            รายการธุรกรรม
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setTransactionType("income");
                                    setShowAddModal(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm cursor-pointer hover:opacity-90 transition-opacity"
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
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm cursor-pointer hover:opacity-90 transition-opacity"
                                style={{ backgroundColor: "#5A9AA8" }}
                            >
                                <Plus size={16} />
                                เพิ่มรายจ่าย
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                                size={18}
                            />
                            <input
                                type="text"
                                placeholder="ค้นหารายละเอียด หรือ ผู้ป่วย..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleSearch()
                                }
                                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                style={{ borderColor: "#E5E7EB" }}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-muted" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none"
                                style={{ borderColor: "#E5E7EB" }}
                            >
                                <option value="all">ทุกประเภท</option>
                                <option value="income">รายรับ</option>
                                <option value="expense">รายจ่าย</option>
                            </select>
                        </div>

                        <div className="md:col-span-2 flex items-center gap-2">
                            <Calendar size={18} className="text-muted" />
                            <div className="flex items-center gap-2 flex-1">
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) =>
                                        setCustomStartDate(e.target.value)
                                    }
                                    className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none"
                                    style={{ borderColor: "#E5E7EB" }}
                                />
                                <span className="text-muted">-</span>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) =>
                                        setCustomEndDate(e.target.value)
                                    }
                                    className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none"
                                    style={{ borderColor: "#E5E7EB" }}
                                />
                                {(customStartDate || customEndDate) && (
                                    <button
                                        onClick={() => {
                                            setCustomStartDate("");
                                            setCustomEndDate("");
                                        }}
                                        className="p-2 text-muted hover:text-red-500 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <TransactionsTable
                        data={transactions}
                        currentPage={transactionPage}
                        total={totalTransactions}
                        onPageChange={fetchTransactionsData}
                        onRefresh={() => {
                            fetchDashboardData();
                            fetchTransactionsData(transactionPage);
                        }}
                        pageSize={TRANSACTIONS_PER_PAGE}
                    />
                </div>
            </div>

            {/* Modals */}
            <AddTransactionModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    fetchDashboardData();
                    fetchTransactionsData(1);
                }}
                initialType={transactionType as "income" | "expense"}
            />
        </div>
    );
}
