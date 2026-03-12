import { apiClient } from "./apiClient";
import {
    IncomeApiResponse,
    ExpenseApiResponse,
    FinanceBarChartResponse,
    ExpenseStatsApiResponse,
    CreateExpensePayload,
    IncomeStatsApiResponse,
    CreateIncomePayload,
    FinanceSummaryStatsApiResponse,
    TransactionTableApiResponse,
    Expense,
    Income,
} from "@/interface/finance";
import { buildQuery, QueryParams } from "@/utils/query";

export const financeService = {
    // --- Basic Income & Expense (Original) --- doesn't use yet
    // async getIncomes(month?: number, year?: number): Promise<IncomeApiResponse> {
    //   const query = buildQuery({ month, year });
    //   return apiClient.get<IncomeApiResponse>(`/api/incomes${query}`);
    // },

    // async getExpenses(month?: number, year?: number): Promise<ExpenseApiResponse> {
    //   const query = buildQuery({ month, year });
    //   return apiClient.get<ExpenseApiResponse>(`/api/expenses${query}`);
    // },

    // --- Extended Finance APIs (api/finance/*) ---

    async getBarChartData(
        params?: QueryParams,
    ): Promise<FinanceBarChartResponse> {
        const query = buildQuery(params);
        return apiClient.get<FinanceBarChartResponse>(
            `/api/reports/finance/bar-chart${query}`,
        );
    },

    async getIncomeCategories(): Promise<{ category_id: string; category_name: string }[]> {
        const res = await apiClient.get<any[]>(`/api/reports/finance/categories`);
        return res;
    },

    async getExpenseStats(
        params?: QueryParams,
    ): Promise<ExpenseStatsApiResponse> {
        const query = buildQuery(params);
        return apiClient.get<ExpenseStatsApiResponse>(
            `/api/reports/finance/expense${query}`,
        );
    },

    async createExpense(payload: CreateExpensePayload): Promise<Expense> {
        return apiClient.post<Expense, CreateExpensePayload>(
            "/api/reports/finance/expense",
            payload,
        );
    },

    async getIncomeStats(
        params?: QueryParams,
    ): Promise<IncomeStatsApiResponse> {
        const query = buildQuery(params);
        return apiClient.get<IncomeStatsApiResponse>(
            `/api/reports/finance/income${query}`,
        );
    },

    async createIncome(payload: CreateIncomePayload): Promise<Income> {
        return apiClient.post<Income, CreateIncomePayload>(
            "/api/reports/finance/income",
            payload,
        );
    },

    async getSummaryStats(
        params?: QueryParams,
    ): Promise<FinanceSummaryStatsApiResponse> {
        const query = buildQuery(params);
        return apiClient.get<FinanceSummaryStatsApiResponse>(
            `/api/reports/finance/stats${query}`,
        );
    },

    async getTransactionsTable(
        params?: QueryParams,
    ): Promise<TransactionTableApiResponse> {
        const query = buildQuery(params);
        return apiClient.get<TransactionTableApiResponse>(
            `/api/reports/finance/table${query}`,
        );
    },

    async getIncomeById(id: string): Promise<Income> {
        const res = await apiClient.get<{ data: Income }>(`/api/incomes/${id}`);
        return res.data;
    },

    async updateIncome(
        id: string,
        payload: Partial<CreateIncomePayload>,
    ): Promise<Income> {
        const res = await apiClient.patch<
            { data: Income },
            Partial<CreateIncomePayload>
        >(`/api/incomes/${id}`, payload);
        return res.data;
    },

    async deleteIncome(id: string): Promise<void> {
        await apiClient.delete(`/api/incomes/${id}`);
    },

    async getExpenseById(id: string): Promise<Expense> {
        const res = await apiClient.get<{ data: Expense }>(
            `/api/expenses/${id}`,
        );
        return res.data;
    },

    async updateExpense(
        id: string,
        payload: Partial<CreateExpensePayload>,
    ): Promise<Expense> {
        const res = await apiClient.patch<
            { data: Expense },
            Partial<CreateExpensePayload>
        >(`/api/expenses/${id}`, payload);
        return res.data;
    },

    async deleteExpense(id: string): Promise<void> {
        await apiClient.delete(`/api/expenses/${id}`);
    },
};
