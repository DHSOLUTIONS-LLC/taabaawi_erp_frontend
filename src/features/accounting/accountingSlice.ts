// src/features/accounting/accountingSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

// ==================== TYPES ====================

// Chart of Accounts Form Types
export interface AccountForm {
  account_code: string;
  account_name: string;
  account_type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' | 'Cost of Goods Sold';
  account_sub_type: string;
  parent_account_id: string;
  description: string;
  opening_balance: number;
  currency: string;
  is_active: boolean;
}

// Journal Entry Form Types
export interface JournalEntryLineForm {
  id: string;
  account_id: string;
  description: string;
  debit: number;
  credit: number;
}

export interface JournalEntryForm {
  entry_date: string;
  description: string;
  reference_type: string;
  reference_number: string;
  notes: string;
  lines: JournalEntryLineForm[];
}

// Bank Account Form Types
export interface BankAccountForm {
  account_number: string;
  account_name: string;
  bank_name: string;
  branch_name: string;
  iban: string;
  swift_code: string;
  currency: string;
  opening_balance: number;
  gl_account_id: string;
  is_active: boolean;
  notes: string;
}

// Budget Form Types
export interface BudgetLineForm {
  id: string;
  account_id: string;
  budgeted_amount: number;
  notes: string;
}

export interface BudgetForm {
  budget_name: string;
  fiscal_year: number;
  period_type: 'Monthly' | 'Quarterly' | 'Yearly';
  start_date: string;
  end_date: string;
  lines: BudgetLineForm[];
  notes: string;
}

// AP/AR Form Types
export interface APForm {
  supplier_id: string;
  purchase_order_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  invoice_amount: number;
  currency: string;
  notes: string;
}

export interface ARForm {
  customer_id: string;
  order_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  invoice_amount: number;
  currency: string;
  notes: string;
}

// Filter Types
export interface JournalEntryFilters {
  status: string;
  reference_type: string;
  start_date: string;
  end_date: string;
  search: string;
}

export interface AccountFilters {
  account_type: string;
  account_sub_type: string;
  is_active: string;
  search: string;
}

export interface BankAccountFilters {
  is_active: string;
  currency: string;
  search: string;
}

export interface APFilters {
  supplier_id: string;
  status: string;
  overdue: boolean;
  start_date: string;
  end_date: string;
  search: string;
}

export interface ARFilters {
  customer_id: string;
  status: string;
  overdue: boolean;
  start_date: string;
  end_date: string;
  search: string;
}

export interface BudgetFilters {
  fiscal_year: string;
  status: string;
  period_type: string;
  search: string;
}

// ==================== STATE INTERFACE ====================

interface AccountingState {
  // Chart of Accounts
  accountForm: AccountForm;
  accountFilters: AccountFilters;
  selectedAccountId: number | null;

  // Journal Entries
  journalEntryForm: JournalEntryForm;
  journalEntryFilters: JournalEntryFilters;
  selectedJournalEntryId: number | null;

  // Bank Accounts
  bankAccountForm: BankAccountForm;
  bankAccountFilters: BankAccountFilters;
  selectedBankAccountId: number | null;

  // Budgets
  budgetForm: BudgetForm;
  budgetFilters: BudgetFilters;
  selectedBudgetId: number | null;

  // AP/AR
  apForm: APForm;
  apFilters: APFilters;
  selectedAPId: number | null;

  arForm: ARForm;
  arFilters: ARFilters;
  selectedARId: number | null;

  // Report Date Ranges
  reportDateRange: {
    start_date: string;
    end_date: string;
    as_of_date: string;
  };
}

// ==================== INITIAL STATE ====================

const initialAccountForm: AccountForm = {
  account_code: '',
  account_name: '',
  account_type: 'Asset',
  account_sub_type: '',
  parent_account_id: '',
  description: '',
  opening_balance: 0,
  currency: 'KWD',
  is_active: true,
};

const initialJournalEntryForm: JournalEntryForm = {
  entry_date: new Date().toISOString().split('T')[0],
  description: '',
  reference_type: '',
  reference_number: '',
  notes: '',
  lines: [],
};

const initialBankAccountForm: BankAccountForm = {
  account_number: '',
  account_name: '',
  bank_name: '',
  branch_name: '',
  iban: '',
  swift_code: '',
  currency: 'KWD',
  opening_balance: 0,
  gl_account_id: '',
  is_active: true,
  notes: '',
};

const initialBudgetForm: BudgetForm = {
  budget_name: '',
  fiscal_year: new Date().getFullYear(),
  period_type: 'Yearly',
  start_date: new Date().toISOString().split('T')[0],
  end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  lines: [],
  notes: '',
};

const initialAPForm: APForm = {
  supplier_id: '',
  purchase_order_id: '',
  invoice_number: '',
  invoice_date: new Date().toISOString().split('T')[0],
  due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
  invoice_amount: 0,
  currency: 'KWD',
  notes: '',
};

const initialARForm: ARForm = {
  customer_id: '',
  order_id: '',
  invoice_number: '',
  invoice_date: new Date().toISOString().split('T')[0],
  due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
  invoice_amount: 0,
  currency: 'KWD',
  notes: '',
};

const initialState: AccountingState = {
  // Chart of Accounts
  accountForm: initialAccountForm,
  accountFilters: {
    account_type: '',
    account_sub_type: '',
    is_active: '',
    search: '',
  },
  selectedAccountId: null,

  // Journal Entries
  journalEntryForm: initialJournalEntryForm,
  journalEntryFilters: {
    status: '',
    reference_type: '',
    start_date: '',
    end_date: '',
    search: '',
  },
  selectedJournalEntryId: null,

  // Bank Accounts
  bankAccountForm: initialBankAccountForm,
  bankAccountFilters: {
    is_active: '',
    currency: '',
    search: '',
  },
  selectedBankAccountId: null,

  // Budgets
  budgetForm: initialBudgetForm,
  budgetFilters: {
    fiscal_year: '',
    status: '',
    period_type: '',
    search: '',
  },
  selectedBudgetId: null,

  // AP/AR
  apForm: initialAPForm,
  apFilters: {
    supplier_id: '',
    status: '',
    overdue: false,
    start_date: '',
    end_date: '',
    search: '',
  },
  selectedAPId: null,

  arForm: initialARForm,
  arFilters: {
    customer_id: '',
    status: '',
    overdue: false,
    start_date: '',
    end_date: '',
    search: '',
  },
  selectedARId: null,

  reportDateRange: {
    start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    as_of_date: new Date().toISOString().split('T')[0],
  },
};

// ==================== SLICE ====================

const accountingSlice = createSlice({
  name: 'accounting',
  initialState,
  reducers: {
    // ===== Account Form =====
    setAccountFormField: (state, action: PayloadAction<Partial<AccountForm>>) => {
      state.accountForm = { ...state.accountForm, ...action.payload };
    },
    clearAccountForm: (state) => {
      state.accountForm = initialAccountForm;
    },
    setAccountFilters: (state, action: PayloadAction<Partial<AccountFilters>>) => {
      state.accountFilters = { ...state.accountFilters, ...action.payload };
    },
    clearAccountFilters: (state) => {
      state.accountFilters = initialState.accountFilters;
    },
    setSelectedAccountId: (state, action: PayloadAction<number | null>) => {
      state.selectedAccountId = action.payload;
    },

    // ===== Journal Entry Form =====
    setJournalEntryFormField: (state, action: PayloadAction<Partial<JournalEntryForm>>) => {
      state.journalEntryForm = { ...state.journalEntryForm, ...action.payload };
    },
    addJournalEntryLine: (state) => {
      const newLine: JournalEntryLineForm = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        account_id: '',
        description: '',
        debit: 0,
        credit: 0,
      };
      state.journalEntryForm.lines.push(newLine);
    },
    updateJournalEntryLine: (state, action: PayloadAction<{ id: string; updates: Partial<JournalEntryLineForm> }>) => {
      const index = state.journalEntryForm.lines.findIndex(l => l.id === action.payload.id);
      if (index !== -1) {
        state.journalEntryForm.lines[index] = {
          ...state.journalEntryForm.lines[index],
          ...action.payload.updates,
        };
      }
    },
    removeJournalEntryLine: (state, action: PayloadAction<string>) => {
      state.journalEntryForm.lines = state.journalEntryForm.lines.filter(l => l.id !== action.payload);
    },
    clearJournalEntryForm: (state) => {
      state.journalEntryForm = initialJournalEntryForm;
    },
    setJournalEntryFilters: (state, action: PayloadAction<Partial<JournalEntryFilters>>) => {
      state.journalEntryFilters = { ...state.journalEntryFilters, ...action.payload };
    },
    clearJournalEntryFilters: (state) => {
      state.journalEntryFilters = initialState.journalEntryFilters;
    },
    setSelectedJournalEntryId: (state, action: PayloadAction<number | null>) => {
      state.selectedJournalEntryId = action.payload;
    },

    // ===== Bank Account Form =====
    setBankAccountFormField: (state, action: PayloadAction<Partial<BankAccountForm>>) => {
      state.bankAccountForm = { ...state.bankAccountForm, ...action.payload };
    },
    clearBankAccountForm: (state) => {
      state.bankAccountForm = initialBankAccountForm;
    },
    setBankAccountFilters: (state, action: PayloadAction<Partial<BankAccountFilters>>) => {
      state.bankAccountFilters = { ...state.bankAccountFilters, ...action.payload };
    },
    clearBankAccountFilters: (state) => {
      state.bankAccountFilters = initialState.bankAccountFilters;
    },
    setSelectedBankAccountId: (state, action: PayloadAction<number | null>) => {
      state.selectedBankAccountId = action.payload;
    },

    // ===== Budget Form =====
    setBudgetFormField: (state, action: PayloadAction<Partial<BudgetForm>>) => {
      state.budgetForm = { ...state.budgetForm, ...action.payload };
    },
    addBudgetLine: (state) => {
      const newLine: BudgetLineForm = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        account_id: '',
        budgeted_amount: 0,
        notes: '',
      };
      state.budgetForm.lines.push(newLine);
    },
    updateBudgetLine: (state, action: PayloadAction<{ id: string; updates: Partial<BudgetLineForm> }>) => {
      const index = state.budgetForm.lines.findIndex(l => l.id === action.payload.id);
      if (index !== -1) {
        state.budgetForm.lines[index] = {
          ...state.budgetForm.lines[index],
          ...action.payload.updates,
        };
      }
    },
    removeBudgetLine: (state, action: PayloadAction<string>) => {
      state.budgetForm.lines = state.budgetForm.lines.filter(l => l.id !== action.payload);
    },
    clearBudgetForm: (state) => {
      state.budgetForm = initialBudgetForm;
    },
    setBudgetFilters: (state, action: PayloadAction<Partial<BudgetFilters>>) => {
      state.budgetFilters = { ...state.budgetFilters, ...action.payload };
    },
    clearBudgetFilters: (state) => {
      state.budgetFilters = initialState.budgetFilters;
    },
    setSelectedBudgetId: (state, action: PayloadAction<number | null>) => {
      state.selectedBudgetId = action.payload;
    },

    // ===== AP/AR Form =====
    setAPFormField: (state, action: PayloadAction<Partial<APForm>>) => {
      state.apForm = { ...state.apForm, ...action.payload };
    },
    clearAPForm: (state) => {
      state.apForm = initialAPForm;
    },
    setAPFilters: (state, action: PayloadAction<Partial<APFilters>>) => {
      state.apFilters = { ...state.apFilters, ...action.payload };
    },
    clearAPFilters: (state) => {
      state.apFilters = initialState.apFilters;
    },
    setSelectedAPId: (state, action: PayloadAction<number | null>) => {
      state.selectedAPId = action.payload;
    },

    setARFormField: (state, action: PayloadAction<Partial<ARForm>>) => {
      state.arForm = { ...state.arForm, ...action.payload };
    },
    clearARForm: (state) => {
      state.arForm = initialARForm;
    },
    setARFilters: (state, action: PayloadAction<Partial<ARFilters>>) => {
      state.arFilters = { ...state.arFilters, ...action.payload };
    },
    clearARFilters: (state) => {
      state.arFilters = initialState.arFilters;
    },
    setSelectedARId: (state, action: PayloadAction<number | null>) => {
      state.selectedARId = action.payload;
    },

    // ===== Report Date Range =====
    setReportDateRange: (state, action: PayloadAction<Partial<{ start_date: string; end_date: string; as_of_date: string }>>) => {
      state.reportDateRange = { ...state.reportDateRange, ...action.payload };
    },
    clearReportDateRange: (state) => {
      state.reportDateRange = initialState.reportDateRange;
    },
  },
});

export const {
  // Account
  setAccountFormField,
  clearAccountForm,
  setAccountFilters,
  clearAccountFilters,
  setSelectedAccountId,

  // Journal Entry
  setJournalEntryFormField,
  addJournalEntryLine,
  updateJournalEntryLine,
  removeJournalEntryLine,
  clearJournalEntryForm,
  setJournalEntryFilters,
  clearJournalEntryFilters,
  setSelectedJournalEntryId,

  // Bank Account
  setBankAccountFormField,
  clearBankAccountForm,
  setBankAccountFilters,
  clearBankAccountFilters,
  setSelectedBankAccountId,

  // Budget
  setBudgetFormField,
  addBudgetLine,
  updateBudgetLine,
  removeBudgetLine,
  clearBudgetForm,
  setBudgetFilters,
  clearBudgetFilters,
  setSelectedBudgetId,

  // AP/AR
  setAPFormField,
  clearAPForm,
  setAPFilters,
  clearAPFilters,
  setSelectedAPId,
  setARFormField,
  clearARForm,
  setARFilters,
  clearARFilters,
  setSelectedARId,

  // Reports
  setReportDateRange,
  clearReportDateRange,
} = accountingSlice.actions;

export default accountingSlice.reducer;