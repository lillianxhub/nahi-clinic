import { PaymentMethod, ExpenseType } from "../../generated/prisma/client";

export interface Income {
    income_id: string;
    visit_id: string;
    income_date: string;
    amount: number;
    payment_method: PaymentMethod;
    receipt_no: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
    deleted_at: string | null;
}

export interface IncomeApiResponse {
    data: Income[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalAmount: number;
    };
}

export interface Expense {
    expense_id: string;
    expense_date: string;
    expense_type: ExpenseType;
    description: string | null;
    amount: number;
    receipt_no: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
    deleted_at: string | null;
}

export interface ExpenseApiResponse {
    data: Expense[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalAmount: number;
    };
}
export interface FinanceBarChartItem {
    name: string;
    income: number;
    expense: number;
}

export type FinanceBarChartResponse = FinanceBarChartItem[];

export interface ExpenseStatItem {
    type: ExpenseType;
    amount: number;
    percentage: number;
}

export interface ExpenseStatsApiResponse {
    total: number;
    data: ExpenseStatItem[];
}

export interface IncomeStatItem {
    type: string;
    amount: number;
    percentage: number;
}

export interface IncomeStatsApiResponse {
    data: IncomeStatItem[];
    meta: {
        month: number;
        year: number;
        totalAmount: number;
    };
}

export interface FinanceSummaryStats {
    monthIncome: number;
    monthExpense: number;
    netProfit: number;
    profitRate: number;
}

export interface FinanceSummaryStatsApiResponse {
    data: FinanceSummaryStats;
}

export interface TransactionItem {
    id: string;
    date: string;
    type: "income" | "expense";
    category: string;
    description: string;
    amount: number;
    status: string;
}

export interface TransactionTableApiResponse {
    data: TransactionItem[];
    total: number;
    page: number;
    limit: number;
}

export interface CreateExpensePayload {
    expense_date: string;
    expense_type: ExpenseType;
    amount: number;
    description?: string;
    receipt_no?: string;
}

export interface CreateIncomePayload {
    visit_id?: string;
    income_date: string;
    amount: number;
    payment_method: PaymentMethod;
    receipt_no?: string;
}
