// src/types/sales.ts

// ─── Core Order Types ───────────────────────────────────────────────

export interface Order {
  id: number;
  order_number: string;
  customer_id: number | null;
  branch_id: number | null;
  channel: 'Website' | 'Mobile App' | 'POS' | 'Phone' | 'Manual';
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_country: string;
  shipping_postal_code: string | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_country: string | null;
  subtotal: number;
  discount_amount: number;
  coupon_discount: number;
  coupon_code: string | null;
  tax_amount: number;
  shipping_fee: number;
  total_amount: number;
  total_paid: number;
  payment_method: 'Cash on Delivery' | 'Credit Card' | 'Debit Card' | 'K-Net' | 'Online Payment' | 'Bank Transfer';
  payment_status: 'Pending' | 'Paid' | 'Partially Paid' | 'Refunded' | 'Failed';
  order_status: 'Pending' | 'Confirmed' | 'Processing' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';
  tracking_number: string | null;
  shipping_provider: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  assigned_to: number | null;
  ip_address: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  customer?: Customer;
  branch?: Branch;
  assignedTo?: Staff;
  items?: OrderItem[];
  statusHistory?: OrderStatusHistory[];
  paymentTransactions?: PaymentTransaction[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number | null;
  product_name: string;
  variant_name: string | null;
  sku: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  subtotal: number;
  total: number;
  // Relations
  product?: Product;
  variant?: ProductVariant;
}

export interface OrderStatusHistory {
  id: number;
  order_id: number;
  old_status: string | null;
  new_status: string;
  notes: string | null;
  changed_by: number | null;
  changed_at: string;
  changedBy?: Staff;
}

export interface PaymentTransaction {
  id: number;
  order_id: number;
  payment_gateway: string;
  transaction_type: 'Payment' | 'Refund';
  amount: number;
  currency: string;
  status: 'Pending' | 'Success' | 'Failed';
  gateway_reference: string | null;
  transaction_date: string;
  notes: string | null;
}

// ─── Shipping ────────────────────────────────────────────────────────

export interface ShippingMethod {
  id: number;
  method_name: string;
  provider: string | null;
  description: string | null;
  base_cost: number;
  cost_per_kg: number;
  estimated_days_min: number | null;
  estimated_days_max: number | null;
  is_active: boolean;
  available_areas: string[] | null;
  estimated_delivery_text?: string;
  created_at: string;
  updated_at: string;
}

// ─── Supporting Entities ─────────────────────────────────────────────

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  customer_type?: 'B2C' | 'B2B';
  company_name?: string | null;
}

export interface Staff {
  id: number;
  name: string;
  email: string;
}

export interface Branch {
  id: number;
  branch_name: string;
}

export interface Product {
  id: number;
  product_name: string;
  sku: string;
  price: number;
  stock?: number;
  images?: { image_url: string }[];
  category?: { category_name: string };
}

export interface ProductVariant {
  id: number;
  variant_name: string;
  sku: string;
  price: number;
}

// ─── Cart ─────────────────────────────────────────────────────────────

export interface CartItem {
  product_id: number;
  variant_id: number | null;
  product_name: string;
  variant_name: string | null;
  sku: string;
  image_url?: string;
  unit_price: number;
  quantity: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
}

// ─── API Payloads ────────────────────────────────────────────────────

export interface CreateOrderPayload {
  customer_id?: number;
  branch_id?: number;
  channel: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city?: string;
  shipping_country?: string;
  payment_method: string;
  coupon_code?: string;
  customer_notes?: string;
  shipping_fee?: number;
  items: {
    product_id: number;
    variant_id?: number;
    quantity: number;
    unit_price: number;
  }[];
}

export interface ShipOrderPayload {
  tracking_number: string;
  shipping_provider: string;
}

export interface OrderFilters {
  page?: number;
  per_page?: number;
  search?: string;
  customer_id?: number;
  branch_id?: number;
  channel?: string;
  order_status?: string;
  payment_status?: string;
  payment_method?: string;
  start_date?: string;
  end_date?: string;
}

export interface OrderStatistics {
  total_orders: number;
  total_revenue: number;
  by_status: { order_status: string; count: number; total: number }[];
  by_channel: { channel: string; count: number; total: number }[];
  by_payment_method: { payment_method: string; count: number; total: number }[];
  payment_status_breakdown: { payment_status: string; count: number }[];
}