import { apiClient } from "./apiClient";
import {
    DashboardStats,
    LowStockItem,
    PatientChartData,
    RevenueExpenseChartData,
} from "@/interface/dashboard";

export const dashboardService = {
    async getRevenueExpenseChart(): Promise<{ data: RevenueExpenseChartData[] }> {
        return apiClient.get<{ data: RevenueExpenseChartData[] }>(
            "/api/dashboard/revenueExpense-chart"
        );
    },

    async getStats(): Promise<{ data: DashboardStats }> {
        return apiClient.get<{ data: DashboardStats }>("/api/dashboard/stats");
    },

    async getLowStockTable(): Promise<{ data: LowStockItem[] }> {
        return apiClient.get<{ data: LowStockItem[] }>("/api/dashboard/table");
    },

    async getPatientChart(): Promise<{ data: PatientChartData[] }> {
        return apiClient.get<{ data: PatientChartData[] }>("/api/dashboard/patient-chart");
    },
};
