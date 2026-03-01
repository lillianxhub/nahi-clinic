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
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-picker-range";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/cards/StatCard";

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
    const [customRange, setCustomRange] = useState<DateRange | undefined>(
        undefined,
    );

    useEffect(() => {
        if (customRange?.from) {
            setCustomStartDate(format(customRange.from, "yyyy-MM-dd"));
        } else {
            setCustomStartDate("");
        }
        if (customRange?.to) {
            setCustomEndDate(format(customRange.to, "yyyy-MM-dd"));
        } else {
            setCustomEndDate("");
        }
    }, [customRange]);

    const fetchTransactionsData = async (page: number) => {
        try {
            const tableRes = await financeService.getTransactionsTable({
                page,
                limit: TRANSACTIONS_PER_PAGE,
                search: searchQuery,
                startDate: customStartDate,
                endDate: customEndDate,
                type: filterType,
                range: dateRange,
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
            const queryParams = {
                range: dateRange,
            };
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
    }, [filterType, customStartDate, customEndDate, dateRange]);

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

    const rangeLabels = {
        week: "สัปดาห์นี้",
        month: "เดือนนี้",
        year: "ปีนี้",
    };

    const currentSubtitle =
        customStartDate && customEndDate
            ? "ช่วงเวลาที่เลือก"
            : rangeLabels[dateRange];

    if (loading && !summary) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                กำลังโหลดข้อมูล...
            </div>
        );
    }

    return (
        <div className="max-w-400 mx-auto p-4 sm:p-6 lg:p-8">
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={ArrowUpRight}
                        title="รายรับทั้งหมด"
                        value={`฿${(summary?.monthIncome || 0).toLocaleString()}`}
                        subtitle={currentSubtitle}
                        color="#10B981"
                    />
                    <StatCard
                        icon={ArrowDownRight}
                        title="รายจ่ายทั้งหมด"
                        value={`฿${(summary?.monthExpense || 0).toLocaleString()}`}
                        subtitle={currentSubtitle}
                        color="#EF4444"
                    />
                    <StatCard
                        icon={DollarSign}
                        title="กำไรสุทธิ"
                        value={`฿${(summary?.netProfit || 0).toLocaleString()}`}
                        trendValue={`${Math.abs(summary?.netProfitGrowth || 0)}%`}
                        subtitle={currentSubtitle}
                        color="#3F7C87"
                    />
                    <StatCard
                        icon={TrendingUp}
                        title="อัตรากำไร"
                        value={`${summary?.profitRate || 0}%`}
                        subtitle={currentSubtitle}
                        color="#F59E0B"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Trend */}
                    <Card className="lg:col-span-2 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-6">
                            <CardTitle className="text-lg font-bold text-primary">
                                แนวโน้มรายรับ-รายจ่าย
                            </CardTitle>
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
                        </CardHeader>
                        <CardContent>
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
                        </CardContent>
                    </Card>

                    {/* Income Distribution */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-primary">
                                สัดส่วนรายรับ
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PieWithLegend data={formattedIncomeDistribution} />
                        </CardContent>
                    </Card>
                </div>

                {/* Expense Distribution */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-primary">
                            สัดส่วนรายจ่าย
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                </Card>

                {/* Transactions Table Section */}
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6">
                        <CardTitle className="text-lg font-bold text-primary">
                            รายการธุรกรรม
                        </CardTitle>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => {
                                    setTransactionType("income");
                                    setShowAddModal(true);
                                }}
                                className="cursor-pointer bg-[#3F7C87]"
                            >
                                <Plus size={16} />
                                เพิ่มรายรับ
                            </Button>
                            <Button
                                onClick={() => {
                                    setTransactionType("expense");
                                    setShowAddModal(true);
                                }}
                                className="cursor-pointer bg-[#5A9AA8]"
                            >
                                <Plus size={16} />
                                เพิ่มรายจ่าย
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="relative md:col-span-2">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10"
                                    size={18}
                                />
                                <Input
                                    placeholder="ค้นหารายละเอียด หรือ ผู้ป่วย..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && handleSearch()
                                    }
                                    className="pl-10 h-10"
                                />
                            </div>

                            <div className="flex items-center gap-2 h-10 px-3 bg-white border border-gray-200 rounded-lg">
                                <Filter
                                    size={18}
                                    className="text-muted-foreground"
                                />
                                <select
                                    value={filterType}
                                    onChange={(e) =>
                                        setFilterType(e.target.value)
                                    }
                                    className="flex-1 bg-transparent border-none text-sm outline-none"
                                >
                                    <option value="all">ทุกประเภท</option>
                                    <option value="income">รายรับ</option>
                                    <option value="expense">รายจ่าย</option>
                                </select>
                            </div>

                            <DatePickerWithRange
                                date={customRange}
                                setDate={setCustomRange}
                                label="ช่วงวันที่"
                                className="w-full h-10"
                            />
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
                    </CardContent>
                </Card>
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
