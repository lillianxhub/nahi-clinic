export interface RevenueExpenseChartData {
    date: string;
    รายรับ: number;
    รายจ่าย: number;
}

export interface DashboardStats {
    todayPatients: number;
    todayIncome: number;
    totalDrugStock: number;
    lowStockCount: number;
}

export interface LowStockItem {
    id: string;
    name: string;
    stock: number;
    min: number;
}
