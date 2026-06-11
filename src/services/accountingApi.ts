// src/services/accountingApi.ts
import { api } from "./api";

/* ================= TYPES ================= */

// Chart of Accounts Types
export type AccountType =
  | "Asset"
  | "Liability"
  | "Equity"
  | "Revenue"
  | "Expense"
  | "Cost of Goods Sold";

export interface ChartOfAccount {
  id: number;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  account_sub_type: string | null;
  parent_account_id: number | null;
  description: string | null;
  opening_balance: number;
  current_balance: number;
  currency: string;
  is_active: boolean;
  is_system_account: boolean;
  created_at: string;
  updated_at: string;
  parentAccount?: ChartOfAccount;
  subAccounts?: ChartOfAccount[];
  hierarchy?: string[];
}

// Journal Entry Types
export type JournalEntryStatus = "Draft" | "Posted" | "Reversed";

export interface JournalEntryLine {
  id: number;
  journal_entry_id: number;
  account_id: number;
  description: string | null;
  debit: number;
  credit: number;
  account?: ChartOfAccount;
}

export interface JournalEntry {
  id: number;
  journal_number: string;
  entry_date: string;
  reference_type: string | null;
  reference_id: number | null;
  reference_number: string | null;
  description: string;
  total_debit: number;
  total_credit: number;
  status: JournalEntryStatus;
  created_by: number;
  posted_by: number | null;
  posted_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lines?: JournalEntryLine[];
  createdBy?: any;
  postedBy?: any;
}

// Bank Account Types
export interface BankAccount {
  id: number;
  account_number: string;
  account_name: string;
  bank_name: string;
  branch_name: string | null;
  iban: string | null;
  swift_code: string | null;
  currency: string;
  opening_balance: number;
  current_balance: number;
  gl_account_id: number | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  glAccount?: ChartOfAccount;
  available_balance?: number;
  unreconciled_count?: number;
}

export interface BankTransaction {
  id: number;
  transaction_number: string;
  bank_account_id: number;
  transaction_date: string;
  transaction_type:
  | "Deposit"
  | "Withdrawal"
  | "Transfer"
  | "Bank Charge"
  | "Interest";
  amount: number;
  reference_number: string | null;
  reference_type: string | null;
  reference_id: number | null;
  description: string;
  status: "Pending" | "Cleared" | "Reconciled" | "Void";
  cleared_date: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  bankAccount?: BankAccount;
  createdBy?: any;
}

export interface BankStatement {
  account: BankAccount;
  period_start: string;
  period_end: string;
  opening_balance: number;
  closing_balance: number;
  total_deposits: number;
  total_withdrawals: number;
  transactions: {
    date: string;
    transaction_number: string;
    type: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    status: string;
  }[];
}

// Accounts Payable Types
export interface AccountsPayable {
  id: number;
  ap_number: string;
  supplier_id: number;
  purchase_order_id: number | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  invoice_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  currency: string;
  status: "Unpaid" | "Partial" | "Paid" | "Overdue";
  notes: string | null;
  created_at: string;
  updated_at: string;
  supplier?: any;
  purchaseOrder?: any;
  is_overdue?: boolean;
  days_overdue?: number;
}

export interface APAgingReport {
  current: number;
  "1_30_days": number;
  "31_60_days": number;
  "61_90_days": number;
  over_90_days: number;
  total_outstanding: number;
}

// Accounts Receivable Types
export interface AccountsReceivable {
  id: number;
  ar_number: string;
  customer_id: number;
  order_id: number | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  invoice_amount: number;
  received_amount: number;
  outstanding_amount: number;
  currency: string;
  status: "Unpaid" | "Partial" | "Paid" | "Overdue";
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: any;
  order?: any;
  is_overdue?: boolean;
  days_overdue?: number;
}

export interface ARAgingReport {
  current: number;
  "1_30_days": number;
  "31_60_days": number;
  "61_90_days": number;
  over_90_days: number;
  total_outstanding: number;
}

// Budget Types
export type BudgetPeriodType = "Monthly" | "Quarterly" | "Yearly";
export type BudgetStatus = "Draft" | "Active" | "Closed";

export interface BudgetLine {
  id: number;
  budget_id: number;
  account_id: number;
  budgeted_amount: number;
  actual_amount: number;
  variance: number;
  notes: string | null;
  account?: ChartOfAccount;
}

export interface Budget {
  id: number;
  budget_name: string;
  fiscal_year: number;
  period_type: BudgetPeriodType;
  start_date: string;
  end_date: string;
  total_budget_amount: number;
  status: BudgetStatus;
  created_by: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lines?: BudgetLine[];
  createdBy?: any;
  total_actual?: number;
  total_variance?: number;
  utilization_percentage?: number;
}

export interface BudgetVsActualReport {
  budget_name: string;
  fiscal_year: number;
  period: string;
  total_budget: number;
  total_actual: number;
  total_variance: number;
  utilization_percentage: number;
  lines: {
    account_code: string;
    account_name: string;
    account_type: string;
    budgeted_amount: number;
    actual_amount: number;
    variance: number;
    variance_percentage: number;
    utilization_percentage: number;
  }[];
}

// Financial Report Types
export interface TrialBalance {
  report_date: string;
  accounts: {
    account_code: string;
    account_name: string;
    account_type: string;
    debit: number;
    credit: number;
  }[];
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
}

export interface ProfitLossStatement {
  report_name: string;
  period_start: string;
  period_end: string;
  revenue: {
    details: { account_code: string; account_name: string; amount: number }[];
    total: number;
  };
  cost_of_goods_sold: {
    details: { account_code: string; account_name: string; amount: number }[];
    total: number;
  };
  gross_profit: number;
  operating_expenses: {
    details: { account_code: string; account_name: string; amount: number }[];
    total: number;
  };
  net_profit: number;
  gross_profit_margin: number;
  net_profit_margin: number;
}

export interface BalanceSheet {
  report_name: string;
  as_of_date: string;
  assets: {
    details: {
      account_code: string;
      account_name: string;
      account_sub_type: string;
      amount: number;
    }[];
    total: number;
  };
  liabilities: {
    details: {
      account_code: string;
      account_name: string;
      account_sub_type: string;
      amount: number;
    }[];
    total: number;
  };
  equity: {
    details: {
      account_code: string;
      account_name: string;
      account_sub_type: string;
      amount: number;
    }[];
    total: number;
  };
  total_liabilities_and_equity: number;
  is_balanced: boolean;
}

export interface GeneralLedger {
  account_code: string;
  account_name: string;
  account_type: string;
  period_start: string;
  period_end: string;
  opening_balance: number;
  closing_balance: number;
  transactions: {
    date: string;
    journal_number: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }[];
}

/* ================= API ENDPOINTS ================= */

export const accountingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ==================== CHART OF ACCOUNTS ====================
    getChartOfAccounts: builder.query<
      { data: ChartOfAccount[]; meta?: any },
      {
        account_type?: AccountType;
        account_sub_type?: string;
        is_active?: boolean;
        parent_account_id?: number;
        search?: string;
        page?: number;
        per_page?: number;
      }
    >({
      query: (params) => ({ url: "/chart-of-accounts", params }),
      providesTags: ["ChartOfAccounts"],
      transformResponse: (response: any) => ({
        data: response?.data?.data ?? [],
        meta: {
          current_page: response?.data?.current_page,
          last_page: response?.data?.last_page,
          total: response?.data?.total,
          per_page: response?.data?.per_page,
          from: response?.data?.from,
          to: response?.data?.to,
        },
      }),
    }),

    getAccountTree: builder.query<
      { data: ChartOfAccount[] },
      { account_type?: AccountType }
    >({
      query: (params) => ({ url: "/chart-of-accounts/tree", params }),
      providesTags: ["ChartOfAccounts"],
    }),

    getAccountById: builder.query<{ data: ChartOfAccount }, number>({
      query: (id) => `/chart-of-accounts/${id}`,
      providesTags: (_r, _e, id) => [{ type: "ChartOfAccounts", id }],
    }),

    createAccount: builder.mutation<
      { data: ChartOfAccount },
      Partial<ChartOfAccount>
    >({
      query: (body) => ({
        url: "/chart-of-accounts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ChartOfAccounts"],
    }),

    updateAccount: builder.mutation<
      { data: ChartOfAccount },
      { id: number; data: Partial<ChartOfAccount> }
    >({
      query: ({ id, data }) => ({
        url: `/chart-of-accounts/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "ChartOfAccounts", id },
        "ChartOfAccounts",
      ],
    }),

    deleteAccount: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/chart-of-accounts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ChartOfAccounts"],
    }),

    getAccountBalance: builder.query<
      { data: any },
      { id: number; start_date?: string; end_date?: string }
    >({
      query: ({ id, ...params }) => ({
        url: `/chart-of-accounts/${id}/balance`,
        params,
      }),
      providesTags: (_r, _e, { id }) => [{ type: "ChartOfAccounts", id }],
    }),

    // ==================== JOURNAL ENTRIES ====================
    getJournalEntries: builder.query<
      { data: JournalEntry[]; meta?: any },
      {
        status?: JournalEntryStatus;
        reference_type?: string;
        start_date?: string;
        end_date?: string;
        search?: string;
        page?: number;
        per_page?: number;
      }
    >({
      query: (params) => ({ url: "/journal-entries", params }),
      providesTags: ["JournalEntries"],
      transformResponse: (response: any) => {
        if (response?.data?.data) return response.data;
        if (response?.data)
          return { data: Array.isArray(response.data) ? response.data : [] };
        return { data: [] };
      },
    }),

    getJournalEntryById: builder.query<{ data: JournalEntry }, number>({
      query: (id) => `/journal-entries/${id}`,
      providesTags: (_r, _e, id) => [{ type: "JournalEntries", id }],
    }),

    createJournalEntry: builder.mutation<{ data: JournalEntry }, any>({
      query: (body) => ({
        url: "/journal-entries",
        method: "POST",
        body,
      }),
      invalidatesTags: ["JournalEntries", "ChartOfAccounts"],
    }),

    updateJournalEntry: builder.mutation<
      { data: JournalEntry },
      { id: number; data: any }
    >({
      query: ({ id, data }) => ({
        url: `/journal-entries/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "JournalEntries", id },
        "JournalEntries",
      ],
    }),

    deleteJournalEntry: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/journal-entries/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["JournalEntries"],
    }),

    postJournalEntry: builder.mutation<{ data: JournalEntry }, number>({
      query: (id) => ({
        url: `/journal-entries/${id}/post`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: "JournalEntries", id },
        "JournalEntries",
        "ChartOfAccounts",
      ],
    }),

    reverseJournalEntry: builder.mutation<
      { data: any },
      { id: number; reversal_date: string; reason: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/journal-entries/${id}/reverse`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "JournalEntries", id },
        "JournalEntries",
        "ChartOfAccounts",
      ],
    }),

    // ==================== BANK ACCOUNTS ====================
    getBankAccounts: builder.query<
      { data: BankAccount[]; meta?: any },
      {
        is_active?: boolean;
        currency?: string;
        search?: string;
        page?: number;
        per_page?: number;
      }
    >({
      query: (params) => ({ url: "/bank-accounts", params }),
      providesTags: ["BankAccounts"],
      transformResponse: (response: any) => {
        if (response?.data?.data) return response.data;
        if (response?.data)
          return { data: Array.isArray(response.data) ? response.data : [] };
        return { data: [] };
      },
    }),

    getBankAccountById: builder.query<{ data: BankAccount }, number>({
      query: (id) => `/bank-accounts/${id}`,
      providesTags: (_r, _e, id) => [{ type: "BankAccounts", id }],
    }),

    createBankAccount: builder.mutation<
      { data: BankAccount },
      Partial<BankAccount>
    >({
      query: (body) => ({
        url: "/bank-accounts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BankAccounts"],
    }),

    updateBankAccount: builder.mutation<
      { data: BankAccount },
      { id: number; data: Partial<BankAccount> }
    >({
      query: ({ id, data }) => ({
        url: `/bank-accounts/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "BankAccounts", id },
        "BankAccounts",
      ],
    }),

    deleteBankAccount: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/bank-accounts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BankAccounts"],
    }),

    createBankTransaction: builder.mutation<{ data: BankTransaction }, any>({
      query: (body) => ({
        url: "/bank-accounts/transactions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BankAccounts"],
    }),

    getBankTransactions: builder.query<
      { data: BankTransaction[]; meta?: any },
      {
        bank_account_id: number;
        transaction_type?: string;
        status?: string;
        start_date?: string;
        end_date?: string;
        page?: number;
        per_page?: number;
      }
    >({
      query: ({ bank_account_id, ...params }) => ({
        url: `/bank-accounts/${bank_account_id}/transactions`,
        params,
      }),
      providesTags: ["BankTransactions"],
    }),

    reconcileBankTransactions: builder.mutation<
      { success: boolean },
      {
        bank_account_id: number;
        transaction_ids: number[];
        cleared_date: string;
      }
    >({
      query: ({ bank_account_id, ...body }) => ({
        url: `/bank-accounts/${bank_account_id}/reconcile`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["BankAccounts", "BankTransactions"],
    }),

    getBankStatement: builder.query<
      { data: BankStatement },
      {
        bank_account_id: number;
        start_date?: string;
        end_date?: string;
      }
    >({
      query: ({ bank_account_id, ...params }) => ({
        url: `/bank-accounts/${bank_account_id}/statement`,
        params,
      }),
    }),

    // ==================== ACCOUNTS PAYABLE ====================
    getAccountsPayable: builder.query<
      { data: AccountsPayable[]; meta?: any },
      {
        supplier_id?: number;
        status?: string;
        overdue?: boolean;
        start_date?: string;
        end_date?: string;
        search?: string;
        page?: number;
        per_page?: number;
      }
    >({
      query: (params) => ({ url: "/accounts-payable", params }),
      providesTags: ["AccountsPayable"],
      transformResponse: (response: any) => {
        if (response?.data?.data) return response.data;
        if (response?.data)
          return { data: Array.isArray(response.data) ? response.data : [] };
        return { data: [] };
      },
    }),

    getAPById: builder.query<{ data: AccountsPayable }, number>({
      query: (id) => `/accounts-payable/${id}`,
      providesTags: (_r, _e, id) => [{ type: "AccountsPayable", id }],
    }),

    createAP: builder.mutation<
      { data: AccountsPayable },
      Partial<AccountsPayable>
    >({
      query: (body) => ({
        url: "/accounts-payable",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AccountsPayable"],
    }),

    recordAPPayment: builder.mutation<
      { data: AccountsPayable },
      {
        id: number; payment_amount: number, payment_account_id: number, payment_date?: string;
        payment_reference?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/accounts-payable/${id}/record-payment`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "AccountsPayable", id },
        "AccountsPayable",
      ],
    }),

    getAPAgingReport: builder.query<
      { data: APAgingReport },
      { supplier_id?: number }
    >({
      query: (params) => ({ url: "/accounts-payable/aging-report", params }),
    }),

    getAPStatistics: builder.query<
      { data: any },
      { start_date?: string; end_date?: string }
    >({
      query: (params) => ({ url: "/accounts-payable/statistics", params }),
    }),

    // ==================== ACCOUNTS RECEIVABLE ====================
    getAccountsReceivable: builder.query<
      { data: AccountsReceivable[]; meta?: any },
      {
        customer_id?: number;
        status?: string;
        overdue?: boolean;
        start_date?: string;
        end_date?: string;
        search?: string;
        page?: number;
        per_page?: number;
      }
    >({
      query: (params) => ({ url: "/accounts-receivable", params }),
      providesTags: ["AccountsReceivable"],
      transformResponse: (response: any) => {
        if (response?.data?.data) return response.data;
        if (response?.data)
          return { data: Array.isArray(response.data) ? response.data : [] };
        return { data: [] };
      },
    }),

    getARById: builder.query<{ data: AccountsReceivable }, number>({
      query: (id) => `/accounts-receivable/${id}`,
      providesTags: (_r, _e, id) => [{ type: "AccountsReceivable", id }],
    }),

    createAR: builder.mutation<
      { data: AccountsReceivable },
      Partial<AccountsReceivable>
    >({
      query: (body) => ({
        url: "/accounts-receivable",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AccountsReceivable"],
    }),

    recordARReceipt: builder.mutation<
      { data: AccountsReceivable },
      { id: number; receipt_amount: number, receipt_account_id: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/accounts-receivable/${id}/record-receipt`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "AccountsReceivable", id },
        "AccountsReceivable",
      ],
    }),

    getARAgingReport: builder.query<
      { data: ARAgingReport },
      { customer_id?: number }
    >({
      query: (params) => ({ url: "/accounts-receivable/aging-report", params }),
    }),

    getARStatistics: builder.query<
      { data: any },
      { start_date?: string; end_date?: string }
    >({
      query: (params) => ({ url: "/accounts-receivable/statistics", params }),
    }),

    // ==================== BUDGETS ====================
    getBudgets: builder.query<
      { data: Budget[]; meta?: any },
      {
        fiscal_year?: number;
        status?: BudgetStatus;
        period_type?: BudgetPeriodType;
        search?: string;
        page?: number;
        per_page?: number;
      }
    >({
      query: (params) => ({ url: "/budgets", params }),
      providesTags: ["Budgets"],
      transformResponse: (response: any) => {
        if (response?.data?.data) return response.data;
        if (response?.data)
          return { data: Array.isArray(response.data) ? response.data : [] };
        return { data: [] };
      },
    }),

    getBudgetById: builder.query<{ data: Budget }, number>({
      query: (id) => `/budgets/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Budgets", id }],
    }),

    createBudget: builder.mutation<{ data: Budget }, any>({
      query: (body) => ({
        url: "/budgets",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Budgets"],
    }),

    updateBudget: builder.mutation<
      { data: Budget },
      { id: number; data: Partial<Budget> }
    >({
      query: ({ id, data }) => ({
        url: `/budgets/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Budgets", id }, "Budgets"],
    }),

    deleteBudget: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/budgets/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Budgets"],
    }),

    activateBudget: builder.mutation<{ data: Budget }, number>({
      query: (id) => ({
        url: `/budgets/${id}/activate`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [{ type: "Budgets", id }],
    }),

    closeBudget: builder.mutation<{ data: Budget }, number>({
      query: (id) => ({
        url: `/budgets/${id}/close`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [{ type: "Budgets", id }],
    }),

    updateBudgetLineActual: builder.mutation<
      { data: BudgetLine },
      {
        budget_id: number;
        line_id: number;
        actual_amount: number;
      }
    >({
      query: ({ budget_id, line_id, ...body }) => ({
        url: `/budgets/${budget_id}/lines/${line_id}/actual`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, { budget_id }) => [
        { type: "Budgets", budget_id },
      ],
    }),

    getBudgetVsActual: builder.query<{ data: BudgetVsActualReport }, number>({
      query: (id) => `/budgets/${id}/budget-vs-actual`,
    }),

    // ==================== FINANCIAL REPORTS ====================
    getTrialBalance: builder.query<
      { data: TrialBalance },
      { as_of_date?: string }
    >({
      query: (params) => ({ url: "/financial-reports/trial-balance", params }),
    }),

    getProfitLoss: builder.query<
      { data: ProfitLossStatement },
      {
        start_date?: string;
        end_date?: string;
      }
    >({
      query: (params) => ({ url: "/financial-reports/profit-loss", params }),
    }),

    getBalanceSheet: builder.query<
      { data: BalanceSheet },
      { as_of_date?: string }
    >({
      query: (params) => ({ url: "/financial-reports/balance-sheet", params }),
    }),

    getGeneralLedger: builder.query<
      { data: GeneralLedger },
      {
        account_id: number;
        start_date?: string;
        end_date?: string;
      }
    >({
      query: (params) => ({ url: "/financial-reports/general-ledger", params }),
    }),

    getCashFlow: builder.query<
      { data: any },
      {
        start_date?: string;
        end_date?: string;
      }
    >({
      query: (params) => ({ url: "/financial-reports/cash-flow", params }),
    }),

    getCustomers: builder.query<
      any,
      { is_active?: boolean; per_page?: number }
    >({
      query: (params) => ({
        url: "/users",
        params: { ...params, role_id: 10 },
      }),
      providesTags: ["Users"],
    }),

    // ==================== EXPENSE CATEGORIES ====================
    getExpenseCategories: builder.query<any, {}>({
      query: (params) => ({ url: "/expense-categories" }),
      providesTags: ["ExpenseCategories"],
    }),

    createExpenseCategory: builder.mutation<
      any,
      {
        category_name: string;
        category_code: string;
        description?: string;
        is_active?: boolean;
      }
    >({
      query: (body) => ({
        url: "/expense-categories",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ExpenseCategories"],
    }),

    updateExpenseCategory: builder.mutation<
      any,
      {
        id: number;
        data: Partial<{
          category_name: string;
          category_code: string;
          description: string;
          is_active: boolean;
        }>;
      }
    >({
      query: ({ id, data }) => ({
        url: `/expense-categories/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["ExpenseCategories"],
    }),

    deleteExpenseCategory: builder.mutation<any, number>({
      query: (id) => ({
        url: `/expense-categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ExpenseCategories"],
    }),

    // ==================== EXPENSES ====================
    getExpenses: builder.query<
      any,
      {
        branch_id?: number;
        expense_category_id?: number;
        status?: string;
        start_date?: string;
        end_date?: string;
        is_recurring?: boolean;
        page?: number;
        per_page?: number;
      }
    >({
      query: (params) => ({ url: "/expenses", params }),
      providesTags: ["Expenses"],
    }),

    getExpenseById: builder.query<any, number>({
      query: (id) => `/expenses/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Expenses", id }],
    }),

    createExpense: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/expenses",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Expenses", "ExpenseStatistics"],
    }),

    updateExpense: builder.mutation<any, { id: number; data: FormData }>({
      query: ({ id, data }) => ({
        url: `/expenses/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        "Expenses",
        { type: "Expenses", id },
      ],
    }),

    deleteExpense: builder.mutation<any, number>({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Expenses"],
    }),

    approveExpense: builder.mutation<
      any,
      { id: number; approval_notes?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/expenses/${id}/approve`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        "Expenses",
        { type: "Expenses", id },
      ],
    }),

    rejectExpense: builder.mutation<
      any,
      { id: number; approval_notes: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/expenses/${id}/reject`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        "Expenses",
        { type: "Expenses", id },
      ],
    }),

    markExpenseAsPaid: builder.mutation<any, number>({
      query: (id) => ({
        url: `/expenses/${id}/mark-paid`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => ["Expenses", { type: "Expenses", id }],
    }),

    getExpenseStatistics: builder.query<
      any,
      {
        branch_id?: number;
        start_date?: string;
        end_date?: string;
      }
    >({
      query: (params) => ({ url: "/expenses/statistics", params }),
      providesTags: ["ExpenseStatistics"],
    }),

    getExpenseSummary: builder.query<
      any,
      {
        start_date: string;
        end_date: string;
        branch_id?: number;
        expense_category_id?: number;
        group_by?: "category" | "branch" | "month" | "payment_method";
      }
    >({
      query: (params) => ({ url: "/expenses/summary", params }),
      providesTags: ["ExpenseStatistics"],
    }),

    downloadExpenseReceipt: builder.query<Blob, number>({
      query: (id) => ({
        url: `/expenses/${id}/receipt/download`,
        responseHandler: (response) => response.blob(),
      }),
    }),

    deleteExpenseReceipt: builder.mutation<any, number>({
      query: (id) => ({
        url: `/expenses/${id}/receipt`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, id) => [{ type: "Expenses", id }],
    }),
  }),
});

export const {
  // Chart of Accounts
  useGetChartOfAccountsQuery,
  useGetAccountTreeQuery,
  useGetAccountByIdQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useGetAccountBalanceQuery,

  // Journal Entries
  useGetJournalEntriesQuery,
  useGetJournalEntryByIdQuery,
  useCreateJournalEntryMutation,
  useUpdateJournalEntryMutation,
  useDeleteJournalEntryMutation,
  usePostJournalEntryMutation,
  useReverseJournalEntryMutation,

  // Bank Accounts
  useGetBankAccountsQuery,
  useGetBankAccountByIdQuery,
  useCreateBankAccountMutation,
  useUpdateBankAccountMutation,
  useDeleteBankAccountMutation,
  useCreateBankTransactionMutation,
  useGetBankTransactionsQuery,
  useReconcileBankTransactionsMutation,
  useGetBankStatementQuery,

  // Accounts Payable
  useGetAccountsPayableQuery,
  useGetAPByIdQuery,
  useCreateAPMutation,
  useRecordAPPaymentMutation,
  useGetAPAgingReportQuery,
  useGetAPStatisticsQuery,

  // Accounts Receivable
  useGetAccountsReceivableQuery,
  useGetARByIdQuery,
  useCreateARMutation,
  useRecordARReceiptMutation,
  useGetARAgingReportQuery,
  useGetARStatisticsQuery,

  // Budgets
  useGetBudgetsQuery,
  useGetBudgetByIdQuery,
  useCreateBudgetMutation,
  useUpdateBudgetMutation,
  useDeleteBudgetMutation,
  useActivateBudgetMutation,
  useCloseBudgetMutation,
  useUpdateBudgetLineActualMutation,
  useGetBudgetVsActualQuery,

  // Financial Reports
  useGetTrialBalanceQuery,
  useGetProfitLossQuery,
  useGetBalanceSheetQuery,
  useGetGeneralLedgerQuery,
  useGetCashFlowQuery,
  useGetCustomersQuery,

  useGetExpenseCategoriesQuery,
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,
  useGetExpensesQuery,
  useGetExpenseByIdQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useApproveExpenseMutation,
  useRejectExpenseMutation,
  useMarkExpenseAsPaidMutation,
  useGetExpenseStatisticsQuery,
  useGetExpenseSummaryQuery,
  useDownloadExpenseReceiptQuery,
  useDeleteExpenseReceiptMutation,
} = accountingApi;