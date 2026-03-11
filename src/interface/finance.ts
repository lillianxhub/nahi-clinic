import { PaymentMethod, ExpenseType } from "@/generated/prisma/client";
export type { PaymentMethod, ExpenseType };

export interface Income {
    income_id: string;
    visit_id: string;
    income_date: string;
    amount: number;
    payment_method: PaymentMethod;
    receipt_no: string | null;
    description: string | null;
    income_category?: string | null;
    category?: { category_name: string };
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
    deleted_at: string | null;
    visit?: any;
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
    prevMonthNetProfit: number;
    netProfitGrowth: number;
}

export interface FinanceSummaryStatsApiResponse {
    data: FinanceSummaryStats;
}

export interface TransactionItem {
    id: string;
    receipt_no: string;
    date: string;
    type: "income" | "expense";
    category: string;
    description: string;
    amount: number;
    status: string;
    visit?: {
        symptom?: string;
        diagnosis?: string;
        note?: string;
        items?: {
            item_type?: "drug" | "service";
            description: string;
            quantity: number;
            unit_price: number;
        }[];
    };
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
    patient_id?: string; // ถ้าไม่มี visit_id แต่มี patient_id → จะสร้าง walk-in visit อัตโนมัติ
    income_date: string;
    amount: number;
    payment_method: PaymentMethod;
    receipt_no?: string;
    description?: string;
    income_category?: string;
    items?: {
        item_type: "drug" | "service";
        product_id?: string;
        procedure_id?: string;
        description?: string;
        quantity: number;
        unit_price: number;
    }[];
}
