// src/features/purchase/types/purchase.types.ts

export interface Supplier {
  id: number;
  supplier_code: string;
  supplier_name: string;
  company_name: string | null;
  email: string;
  phone: string;
  mobile: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  contact_person_name: string | null;
  contact_person_phone: string | null;
  contact_person_email: string | null;
  tax_number: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  iban: string | null;
  credit_limit: number;
  payment_terms_days: number;
  default_currency: string;
  rating: 'Excellent' | 'Good' | 'Average' | 'Poor';
  is_active: boolean;
  notes: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Currency {
  id: number;
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  exchange_rate: number;
  is_active: boolean;
  is_base_currency: boolean;
  last_updated: string;
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  product_id: number;
  variant_id: number | null;
  product_name: string;
  variant_name: string | null;
  sku: string | null;
  quantity_ordered: number;
  quantity_received: number;
  quantity_returned: number;
  unit_price: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  total: number;
  notes: string | null;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  branch_id: number;
  created_by: number;
  approved_by: number | null;
  currency: string;
  exchange_rate: number;
  order_date: string;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  total_amount_kwd: number;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled' | 'Returned';
  payment_status: 'Unpaid' | 'Partially Paid' | 'Paid';
  terms_and_conditions: string | null;
  notes: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface GoodsReceiptNote {
  id: number;
  grn_number: string;
  purchase_order_id: number;
  branch_id: number;
  received_by: number;
  receipt_date: string;
  supplier_invoice_number: string | null;
  supplier_invoice_date: string | null;
  status: 'Pending' | 'Verified' | 'Completed' | 'Cancelled';
  notes: string | null;
  discrepancy_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseReturn {
  id: number;
  return_number: string;
  purchase_order_id: number;
  supplier_id: number;
  branch_id: number;
  processed_by: number;
  approved_by: number | null;
  return_date: string;
  return_amount: number;
  currency: string;
  reason: 'Damaged' | 'Defective' | 'Wrong Item' | 'Excess Quantity' | 'Other';
  reason_details: string | null;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  created_at: string;
  updated_at: string;
}

export interface SupplierPayment {
  id: number;
  payment_number: string;
  purchase_order_id: number;
  supplier_id: number;
  paid_by: number;
  payment_date: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  payment_method: 'Cash' | 'Bank Transfer' | 'Cheque' | 'Credit Card' | 'Online Payment';
  reference_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}