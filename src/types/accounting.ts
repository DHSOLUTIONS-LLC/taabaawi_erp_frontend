// Add to types section
export interface ExpenseCategory {
  id: number;
  category_name: string;
  category_code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expenses_count?: number;
  total_amount?: number;
}

export interface Expense {
  id: number;
  expense_number: string;
  expense_category_id: number;
  branch_id: number;
  amount: number;
  currency: string;
  exchange_rate: number;
  amount_kwd: number;
  expense_date: string;
  vendor_name: string | null;
  invoice_number: string | null;
  payment_method: 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque' | 'Other';
  description: string | null;
  receipt_path: string | null;
  is_recurring: boolean;
  recurring_period: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly' | null;
  next_recurrence_date: string | null;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  created_by: number;
  approved_by: number | null;
  approved_at: string | null;
  approval_notes: string | null;
  created_at: string;
  updated_at: string;
  category?: ExpenseCategory;
  branch?: any;
  createdBy?: any;
  approvedBy?: any;
}