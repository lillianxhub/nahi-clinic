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
  Income
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
  
  async getBarChartData(range: "week" | "month" | "year" = "year"): Promise<FinanceBarChartResponse> {
    const query = buildQuery({ range });
    return apiClient.get<FinanceBarChartResponse>(`/api/finance/bar-chart${query}`);
  },

  async getExpenseStats(): Promise<ExpenseStatsApiResponse> {
    return apiClient.get<ExpenseStatsApiResponse>("/api/finance/expense");
  },

  async createExpense(payload: CreateExpensePayload): Promise<Expense> {
    return apiClient.post<Expense, CreateExpensePayload>("/api/finance/expense", payload);
  },

  async getIncomeStats(): Promise<IncomeStatsApiResponse> {
    return apiClient.get<IncomeStatsApiResponse>("/api/finance/income");
  },

  async createIncome(payload: CreateIncomePayload): Promise<Income> {
    return apiClient.post<Income, CreateIncomePayload>("/api/finance/income", payload);
  },

  async getSummaryStats(): Promise<FinanceSummaryStatsApiResponse> {
    return apiClient.get<FinanceSummaryStatsApiResponse>("/api/finance/stats");
  },

  async getTransactionsTable(params?: QueryParams): Promise<TransactionTableApiResponse> {
    const query = buildQuery(params);
    return apiClient.get<TransactionTableApiResponse>(`/api/finance/table${query}`);
  },
};
