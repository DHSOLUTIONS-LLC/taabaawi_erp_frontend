// src/features/pos/types/index.ts
export interface POSProduct {
  id: number;
  barcode: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  image?: string;
  tax_rate: number;
}

export interface CartItem {
  product: POSProduct;
  quantity: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Sale {
  id: number;
  invoice_number: string;
  customer_id?: number;
  customer_name?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: 'cash' | 'card' | 'knet' | 'bank_transfer';
  cashier_id: number;
  cashier_name: string;
  branch_id: number;
  status: 'pending' | 'completed' | 'refunded';
  created_at: string;
}

export interface POSShift {
  id: number;
  cashier_id: number;
  cashier_name: string;
  branch_id: number;
  opening_cash: number;
  closing_cash: number;
  total_sales: number;
  start_time: string;
  end_time?: string;
  status: 'open' | 'closed';
}

export interface CreateSaleDTO {
  customer_id?: number;
  items: Array<{
    product_id: number;
    quantity: number;
    price: number;
    discount: number;
    tax_rate: number;
  }>;
  payment_method: string;
  branch_id: number;
}