import { apiClient } from "./apiClient";
import {
    DashboardStats,
    LowStockItem,
    PatientChartData,
    RevenueExpenseChartData,
} from "@/interface/dashboard";

export const dashboardService = {
    async getRevenueExpenseChart(
        filter?: string,
    ): Promise<{ data: RevenueExpenseChartData[] }> {
        return apiClient.get<{ data: RevenueExpenseChartData[] }>(
            `/api/reports/dashboard/revenueExpense-chart${filter ? `?filter=${filter}` : ""}`,
        );
    },

    async getStats(): Promise<{ data: DashboardStats }> {
        return apiClient.get<{ data: DashboardStats }>("/api/reports/dashboard/stats");
    },

    async getLowStockTable(): Promise<{ data: LowStockItem[] }> {
        return apiClient.get<{ data: LowStockItem[] }>("/api/reports/dashboard/table");
    },

    async getPatientChart(): Promise<{ data: PatientChartData[] }> {
        return apiClient.get<{ data: PatientChartData[] }>(
            "/api/reports/dashboard/patient-chart",
        );
    },
};
