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
        range: "week" | "month" | "year" = "year",
    ): Promise<FinanceBarChartResponse> {
        const query = buildQuery({ range });
        return apiClient.get<FinanceBarChartResponse>(
            `/api/finance/bar-chart${query}`,
        );
    },

    async getExpenseStats(): Promise<ExpenseStatsApiResponse> {
        return apiClient.get<ExpenseStatsApiResponse>("/api/finance/expense");
    },

    async createExpense(payload: CreateExpensePayload): Promise<Expense> {
        return apiClient.post<Expense, CreateExpensePayload>(
            "/api/finance/expense",
            payload,
        );
    },

    async getIncomeStats(): Promise<IncomeStatsApiResponse> {
        return apiClient.get<IncomeStatsApiResponse>("/api/finance/income");
    },

    async createIncome(payload: CreateIncomePayload): Promise<Income> {
        return apiClient.post<Income, CreateIncomePayload>(
            "/api/finance/income",
            payload,
        );
    },

    async getSummaryStats(): Promise<FinanceSummaryStatsApiResponse> {
        return apiClient.get<FinanceSummaryStatsApiResponse>(
            "/api/finance/stats",
        );
    },

    async getTransactionsTable(
        params?: QueryParams,
    ): Promise<TransactionTableApiResponse> {
        const query = buildQuery(params);
        return apiClient.get<TransactionTableApiResponse>(
            `/api/finance/table${query}`,
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
