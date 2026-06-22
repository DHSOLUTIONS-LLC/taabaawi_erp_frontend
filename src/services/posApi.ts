// services/posApi.ts
import { api } from "./api";

export interface VariantPayload {
  variant_name: string;
  variant_value: string;
  cost_price: number;
  selling_price: number;
  additional_price: number;
}

export interface CreateProductPayload {
  product_name: string;
  category_id: number;
  description: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  has_variants: boolean;
  low_stock_alert: number;
  is_active: boolean;
  images: string[];
  variants: VariantPayload[];
}

export type CreateCategoryReq = {
  category_name: string;
  description: string;
  image?: File;
  parent_id: number;
  is_active: boolean;
};

// ===== SALES TYPES =====
export interface SaleItem {
  product_id: number;
  variant_id?: number;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
}

export interface CreateSalePayload {
  branch_id: number;
  cash_register_id?: number;
  sales_staff_id?: number;
  customer_id?: number;
  payment_method: "Cash" | "Card" | "K-Net" | "Mobile Payment" | "Mixed";
  cash_received?: number;
  card_amount?: number;
  card_reference?: string;

  coupon_code?: string;
  is_gift?: boolean;
  is_employee_purchase?: boolean;
  notes?: string;
  items: SaleItem[];
}

export interface SalesFilters {
  branch_id?: number;
  cashier_id?: number;
  sales_staff_id?: number;
  payment_method?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  is_gift?: boolean;
  is_employee_purchase?: boolean;
  search?: string;
  per_page?: number;
  page?: number;
}

// ===== RETURN TYPES =====
export interface ReturnItem {
  sale_item_id: number;
  quantity: number;
  condition?: string;
}

export interface CreateReturnPayload {
  sale_id: number;
  refund_method: "Cash" | "Card" | "Store Credit";
  reason?: string;
  items: ReturnItem[];
}

export interface ReturnsFilters {
  branch_id?: number;
  status?: string;
  refund_method?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  per_page?: number;
  page?: number;
}

// ===== COUPON TYPES =====
export interface CreateCouponPayload {
  coupon_code: string;
  coupon_name: string;
  description?: string;
  discount_type: "Percentage" | "Fixed Amount";
  discount_value: number;
  max_discount_amount?: number;
  min_purchase_amount?: number;
  usage_limit?: number;
  usage_limit_per_user?: number;
  valid_from: string;
  valid_until: string;
  applicable_branches?: number[];
  applicable_products?: number[];
  applicable_categories?: number[];
  is_active?: boolean;
  channel: "All" | "POS" | "Website" | "Mobile App";
}

export interface CouponsFilters {
  is_active?: boolean;
  channel?: string;
  valid_only?: boolean;
  search?: string;
  per_page?: number;
  page?: number;
}

export interface ValidateCouponPayload {
  coupon_code: string;
  total_amount: number;
  branch_id?: number;
  customer_id?: number;
}

export const posApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ===== EXISTING POS/CASH REGISTER ENDPOINTS =====
    openPOS: builder.mutation<
      any,
      {
        branch_id: number;
        opening_balance: number;
        opening_notes?: string;
      }
    >({
      query: (data) => ({
        url: "/cash-registers/open",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["POS"],
    }),

    getCurrentPOS: builder.query<any, void>({
      query: () => "/cash-registers/current",
      transformResponse: (response: any) => response,
      providesTags: ["POS"],
    }),

    getPOSs: builder.query<
      any,
      {
        branch_id?: number;
        status?: string;
        user_id?: number;
        date?: string;
        page?: number;
      }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.branch_id)
          queryParams.append("branch_id", params.branch_id.toString());
        if (params.status) queryParams.append("status", params.status);
        if (params.user_id)
          queryParams.append("user_id", params.user_id.toString());
        if (params.date) queryParams.append("date", params.date);
        if (params.page) queryParams.append("page", params.page.toString());
        return `/cash-registers?${queryParams.toString()}`;
      },
      providesTags: ["POS"],
    }),

    getPOSById: builder.query<any, number>({
      query: (id) => `/cash-registers/${id}`,
      providesTags: (_result, _error, id) => [{ type: "POS", id }],
    }),

    closePOS: builder.mutation<
      any,
      {
        id: number;
        closing_balance: number;
        closing_notes?: string;
        denominations?: Record<string, number>;
      }
    >({
      query: ({ id, ...data }) => ({
        url: `/cash-registers/${id}/close`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "POS", id }],
    }),

    addCashMovement: builder.mutation<
      any,
      {
        cash_register_id: number;
        type: "Cash In" | "Cash Out";
        amount: number;
        reason: string;
      }
    >({
      query: (data) => ({
        url: "/cash-registers/cash-movement",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { cash_register_id }) => [
        { type: "POS", id: cash_register_id },
      ],
    }),

    // ===== SALES ENDPOINTS =====
    getSales: builder.query<any, SalesFilters>({
      query: (params) => ({ url: "/sales", params }),
      providesTags: ["Sales"],
    }),

    createSale: builder.mutation<any, CreateSalePayload>({
      query: (data) => ({
        url: "/sales",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Sales", "POS"],
    }),

    getSaleById: builder.query<any, number>({
      query: (id) => `/sales/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Sales", id }],
    }),

    getSaleReceipt: builder.query<any, number>({
      query: (id) => `/sales/${id}/receipt`,
    }),

    getSalesStatistics: builder.query<
      any,
      {
        branch_id?: number;
        start_date?: string;
        end_date?: string;
      }
    >({
      query: (params) => ({ url: "/sales/statistics", params }),
      providesTags: ["Sales"],
    }),


    getReturnReceipt: builder.query<any, number>({
      query: (id) => `/returns/${id}/receipt`,
      providesTags: (_result, _error, id) => [{ type: 'Returns', id }],
    }),

    validateDiscount: builder.mutation<
      {
        success: boolean;
        data: {
          allowed: boolean;
          max_discount: number;
          message?: string;
          requires_authorization?: boolean;
        };
      },
      { discount_percentage: number; branch_id: number }
    >({
      query: (body) => ({
        url: "/sales/validate-discount",
        method: "POST",
        body,
      }),
    }),

    // ===== RETURNS ENDPOINTS =====
    getReturns: builder.query<any, ReturnsFilters>({
      query: (params) => ({ url: "/returns", params }),
      providesTags: ["Returns"],
    }),

    createReturn: builder.mutation<any, CreateReturnPayload>({
      query: (data) => ({
        url: "/returns",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Returns", "Sales"],
    }),

    getReturnById: builder.query<any, number>({
      query: (id) => `/returns/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Returns", id }],
    }),

    approveReturn: builder.mutation<any, number>({
      query: (id) => ({
        url: `/returns/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["Returns"],
    }),

    rejectReturn: builder.mutation<any, { id: number; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/returns/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["Returns"],
    }),

    getReturnStatistics: builder.query<
      any,
      {
        branch_id?: number;
        start_date?: string;
        end_date?: string;
      }
    >({
      query: (params) => ({ url: "/returns/statistics", params }),
      providesTags: ["Returns"],
    }),

    // ===== COUPONS ENDPOINTS =====
    getCoupons: builder.query<any, CouponsFilters>({
      query: (params) => ({ url: "/coupons", params }),
      providesTags: ["Coupons"],
    }),

    createCoupon: builder.mutation<any, CreateCouponPayload>({
      query: (data) => ({
        url: "/coupons",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Coupons"],
    }),

    getCouponById: builder.query<any, number>({
      query: (id) => `/coupons/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Coupons", id }],
    }),

    updateCoupon: builder.mutation<
      any,
      { id: number; data: Partial<CreateCouponPayload> }
    >({
      query: ({ id, data }) => ({
        url: `/coupons/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Coupons", id },
        "Coupons",
      ],
    }),

    deleteCoupon: builder.mutation<any, number>({
      query: (id) => ({
        url: `/coupons/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Coupons"],
    }),

    validateCoupon: builder.mutation<any, ValidateCouponPayload>({
      query: (data) => ({
        url: "/coupons/validate",
        method: "POST",
        body: data,
      }),
    }),

    getCouponUsageStatistics: builder.query<any, number>({
      query: (id) => `/coupons/${id}/usage-statistics`,
      providesTags: (_result, _error, id) => [{ type: "Coupons", id }],
    }),

    // ===== SHIFT REPORTS ENDPOINTS =====
    getShiftReports: builder.query<
      any,
      {
        branch_id?: number;
        user_id?: number;
        status?: string;
        start_date?: string;
        end_date?: string;
        page?: number;
      }
    >({
      query: (params) => ({ url: "/shift-reports", params }),
      providesTags: ["ShiftReports"],
    }),

    generateShiftReport: builder.mutation<any, number>({
      query: (cashRegisterId) => ({
        url: `/shift-reports/generate/${cashRegisterId}`,
        method: "POST",
      }),
      invalidatesTags: ["ShiftReports", "POS"],
    }),

    getShiftReportById: builder.query<any, number>({
      query: (id) => `/shift-reports/${id}`,
      providesTags: (_result, _error, id) => [{ type: "ShiftReports", id }],
    }),

    exportShiftReport: builder.query<any, { id: number; format: string }>({
      query: ({ id, format }) => `/shift-reports/${id}/export/${format}`,
    }),

    getDailyShiftSummary: builder.query<
      any,
      {
        date?: string;
        branch_id?: number;
      }
    >({
      query: (params) => ({ url: "/shift-reports/daily-summary", params }),
      providesTags: ["ShiftReports"],
    }),

    scanBarcode: builder.mutation<
      any,
      {
        barcode: string;
        branch_id: number;
      }
    >({
      query: (data) => ({
        url: "/barcodes/scan/pos",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Sales"],
    }),

    searchByBarcode: builder.query<any, { barcode: string }>({
      query: (params) => ({
        url: "/barcodes/search",
        params,
      }),
    }),
  }),
});

export const {
  // POS/Cash Register
  useOpenPOSMutation,
  useGetCurrentPOSQuery,
  useGetPOSsQuery,
  useGetPOSByIdQuery,
  useClosePOSMutation,
  useAddCashMovementMutation,

  // Sales
  useGetSalesQuery,
  useCreateSaleMutation,
  useGetSaleByIdQuery,
  useGetSaleReceiptQuery,
  useGetSalesStatisticsQuery,
  useValidateDiscountMutation,

  // Returns
  useGetReturnsQuery,
  useCreateReturnMutation,
  useGetReturnByIdQuery,
  useApproveReturnMutation,
  useRejectReturnMutation,
  useGetReturnStatisticsQuery,

  // Coupons
  useGetCouponsQuery,
  useCreateCouponMutation,
  useGetCouponByIdQuery,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useValidateCouponMutation,
  useGetCouponUsageStatisticsQuery,

  // Shift Reports
  useGetShiftReportsQuery,
  useGenerateShiftReportMutation,
  useGetShiftReportByIdQuery,
  useExportShiftReportQuery,
  useGetDailyShiftSummaryQuery,

  useScanBarcodeMutation,
  useSearchByBarcodeQuery,
  useGetReturnReceiptQuery
} = posApi;
