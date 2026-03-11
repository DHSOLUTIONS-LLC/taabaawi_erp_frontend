export interface PaymentMethod {
  id: number;
  method_name: string;
  description?: string;
  is_active: boolean;
  is_online: boolean;
  transaction_fee_percentage: number;
  transaction_fee_fixed: number;
  configuration?: Record<string, any>;
  enabled_branches?: number[];
  sort_order: number;
  icon?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentMethodFilters {
  is_active?: boolean;
  is_online?: boolean;
  search?: string;
  per_page?: number;
  page?: number;
}

export interface PaymentMethodResponse {
  success: boolean;
  data: PaymentMethod;
  message?: string;
}

export interface PaymentMethodsResponse {
  success: boolean;
  data: PaymentMethod[];
  message?: string;
}

export interface FeeCalculationPayload {
  amount: number;
}

export interface FeeCalculationResponse {
  success: boolean;
  data: {
    amount: number;
    fee: number;
    total_with_fee: number;
    method: string;
  };
}

export interface UpdatePaymentMethodPayload {
  method_name?: string;
  description?: string;
  is_active?: boolean;
  transaction_fee_percentage?: number;
  transaction_fee_fixed?: number;
  configuration?: Record<string, any>;
  enabled_branches?: number[];
  sort_order?: number;
  icon?: string;
}