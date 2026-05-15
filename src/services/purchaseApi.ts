// src/services/purchaseApi.ts
import { api } from "./api";

/* ================= TYPES ================= */

// Supplier Types
export type Supplier = {
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
  rating: "Excellent" | "Good" | "Average" | "Poor";
  is_active: boolean;
  notes: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  outstanding_balance?: number;
  total_purchases?: number;
  total_payments?: number;
};

export type SupplierContact = {
  id: number;
  supplier_id: number;
  name: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  is_primary: boolean;
};

// Currency Types
export type Currency = {
  id: number;
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  exchange_rate: number;
  is_active: boolean;
  is_base_currency: boolean;
  last_updated: string;
};

// Purchase Order Types
export type PurchaseOrderItem = {
  id: number;
  purchase_order_id: number;
  product_id: number;
  variant_id: number | null;
  product_name: string;
  variant_name: string | null;
  sku: string | null;
  quantity_ordered: number;
  quantity_received: number;
  quantity_returned?: number;
  unit_price: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  product?: any;
  variant?: any;
};

export type PurchaseOrder = {
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
  status:
    | "Draft"
    | "Pending Approval"
    | "Approved"
    | "Ordered"
    | "Partially Received"
    | "Received"
    | "Cancelled"
    | "Returned";
  payment_status: "Unpaid" | "Partially Paid" | "Paid";
  terms_and_conditions: string | null;
  notes: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  supplier?: Supplier;
  branch?: any;
  createdBy?: any;
  approvedBy?: any;
  items?: PurchaseOrderItem[];
  total_paid?: number;
  outstanding_amount?: number;
  is_fully_received?: boolean;
};

// Goods Receipt Note Types
export type GrnItem = {
  id: number;
  grn_id: number;
  po_item_id: number;
  product_id: number;
  variant_id: number | null;
  quantity_ordered: number;
  quantity_received: number;
  quantity_accepted: number;
  quantity_rejected: number;
  condition: "Good" | "Damaged" | "Defective" | "Expired";
  notes: string | null;
  product?: any;
  variant?: any;
  poItem?: PurchaseOrderItem;
};

export type GoodsReceiptNote = {
  id: number;
  grn_number: string;
  purchase_order_id: number;
  branch_id: number;
  received_by: number;
  receipt_date: string;
  supplier_invoice_number: string | null;
  supplier_invoice_date: string | null;
  status: "Pending" | "Verified" | "Completed" | "Cancelled";
  notes: string | null;
  discrepancy_notes: string | null;
  created_at: string;
  updated_at: string;
  purchaseOrder?: PurchaseOrder;
  branch?: any;
  receivedBy?: any;
  items?: GrnItem[];
};

// Purchase Return Types
export type PurchaseReturnItem = {
  id: number;
  purchase_return_id: number;
  po_item_id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  unit_price: number;
  total: number;
  notes: string | null;
  product?: any;
  variant?: any;
  poItem?: PurchaseOrderItem;
};

export type PurchaseReturn = {
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
  reason: "Damaged" | "Defective" | "Wrong Item" | "Excess Quantity" | "Other";
  reason_details: string | null;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  created_at: string;
  updated_at: string;
  purchaseOrder?: PurchaseOrder;
  supplier?: Supplier;
  branch?: any;
  processedBy?: any;
  approvedBy?: any;
  items?: PurchaseReturnItem[];
};

// Supplier Payment Types
export type SupplierPayment = {
  id: number;
  payment_number: string;
  purchase_order_id: number;
  supplier_id: number;
  paid_by: number;
  payment_date: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  payment_method:
    | "Cash"
    | "Bank Transfer"
    | "Cheque"
    | "Credit Card"
    | "Online Payment";
  reference_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  purchaseOrder?: PurchaseOrder;
  supplier?: Supplier;
  paidBy?: any;
};

/* ================= API ENDPOINTS ================= */

export const purchaseApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ==================== SUPPLIERS ====================
    getSuppliers: builder.query<
      { data: Supplier[]; meta?: any },
      {
        is_active?: boolean;
        rating?: string;
        country?: string;
        currency?: string;
        search?: string;
        page?: number;
        per_page?: number;
      }
    >({
      query: (params) => ({ url: "/suppliers", params }),
      providesTags: ["Suppliers"],
      transformResponse: (response: any) => {
        if (response?.data?.data) return response.data;
        if (response?.data)
          return { data: Array.isArray(response.data) ? response.data : [] };
        return { data: [] };
      },
    }),

    getSupplierById: builder.query<{ data: Supplier }, number>({
      query: (id) => `/suppliers/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Suppliers", id }],
    }),

    createSupplier: builder.mutation<{ data: Supplier }, Partial<Supplier>>({
      query: (body) => ({
        url: "/suppliers",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Suppliers"],
    }),

    updateSupplier: builder.mutation<
      { data: Supplier },
      { id: number; data: Partial<Supplier> }
    >({
      query: ({ id, data }) => ({
        url: `/suppliers/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Suppliers", id },
        "Suppliers",
      ],
    }),

    deleteSupplier: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/suppliers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Suppliers"],
    }),

    getSupplierStatistics: builder.query<{ data: any }, number>({
      query: (id) => `/suppliers/${id}/statistics`,
      providesTags: (_r, _e, id) => [{ type: "Suppliers", id }],
    }),

    // ==================== CURRENCIES ====================
    getCurrencies: builder.query<{ data: Currency[] }, { is_active?: boolean }>(
      {
        query: (params) => ({ url: "/currencies", params }),
        providesTags: ["Currencies"],
        transformResponse: (response: any) => {
          console.log("Raw API Response:", response);

          // Your API returns { success: true, data: [...] }
          if (response?.success && Array.isArray(response.data)) {
            return {
              data: response.data.map((c: any) => ({
                ...c,
                exchange_rate: parseFloat(c.exchange_rate),
              })),
            };
          }

          // Fallback
          return { data: [] };
        },
      },
    ),

    createCurrency: builder.mutation<{ data: Currency }, Partial<Currency>>({
      query: (body) => ({
        url: "/currencies",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Currencies"],
    }),

    updateCurrency: builder.mutation<
      { data: Currency },
      { id: number; data: Partial<Currency> }
    >({
      query: ({ id, data }) => ({
        url: `/currencies/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Currencies"],
    }),

    deleteCurrency: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/currencies/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Currencies"],
    }),

    convertCurrency: builder.mutation<
      { data: any },
      { amount: number; from_currency: string; to_currency: string }
    >({
      query: (body) => ({
        url: "/currencies/convert",
        method: "POST",
        body,
      }),
    }),

    getBaseCurrency: builder.query<{ data: Currency }, void>({
      query: () => "/currencies/base-currency",
      providesTags: ["Currencies"],
    }),

    // ==================== PURCHASE ORDERS ====================
    getPurchaseOrders: builder.query<
      { data: PurchaseOrder[]; meta?: any },
      {
        supplier_id?: number;
        branch_id?: number;
        status?: string;
        payment_status?: string;
        currency?: string;
        start_date?: string;
        end_date?: string;
        search?: string;
        page?: number;
        per_page?: number;
      }
    >({
      query: (params) => ({ url: "/purchase-orders", params }),
      providesTags: ["PurchaseOrders"],
      transformResponse: (response: any) => {
        if (response?.data?.data) return response.data;
        if (response?.data)
          return { data: Array.isArray(response.data) ? response.data : [] };
        return { data: [] };
      },
    }),

    getPurchaseOrderById: builder.query<{ data: PurchaseOrder }, number>({
      query: (id) => `/purchase-orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: "PurchaseOrders", id }],
      transformResponse: (response: any) => {
        const po = response?.data ?? response;

        const parseNum = (v: any) =>
          v !== null && v !== undefined ? parseFloat(v) || 0 : 0;

        return {
          data: {
            ...po,
            subtotal: parseNum(po.subtotal),
            discount_amount: parseNum(po.discount_amount),
            tax_amount: parseNum(po.tax_amount),
            shipping_cost: parseNum(po.shipping_cost),
            total_amount: parseNum(po.total_amount),
            total_amount_kwd: parseNum(po.total_amount_kwd),
            exchange_rate: parseNum(po.exchange_rate),
            total_paid: parseNum(po.total_paid),
            outstanding_amount: parseNum(po.outstanding_amount),
            items: (po.items ?? []).map((item: any) => ({
              ...item,
              quantity_ordered: parseNum(item.quantity_ordered),
              quantity_received: parseNum(item.quantity_received),
              unit_price: parseNum(item.unit_price),
              discount_percentage: parseNum(item.discount_percentage),
              discount_amount: parseNum(item.discount_amount),
              tax_percentage: parseNum(item.tax_percentage),
              tax_amount: parseNum(item.tax_amount),
              total: parseNum(item.total),
            })),
          },
        };
      },
    }),

    createPurchaseOrder: builder.mutation<{ data: PurchaseOrder }, any>({
      query: (body) => ({
        url: "/purchase-orders",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PurchaseOrders"],
    }),

    updatePurchaseOrder: builder.mutation<
      { data: PurchaseOrder },
      { id: number; data: any }
    >({
      query: ({ id, data }) => ({
        url: `/purchase-orders/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "PurchaseOrders", id },
        "PurchaseOrders",
      ],
    }),

    deletePurchaseOrder: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/purchase-orders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PurchaseOrders"],
    }),

    submitPurchaseOrderForApproval: builder.mutation<
      { data: PurchaseOrder },
      number
    >({
      query: (id) => ({
        url: `/purchase-orders/${id}/submit`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [{ type: "PurchaseOrders", id }],
    }),

    approvePurchaseOrder: builder.mutation<{ data: PurchaseOrder }, number>({
      query: (id) => ({
        url: `/purchase-orders/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [{ type: "PurchaseOrders", id }],
    }),

    rejectPurchaseOrder: builder.mutation<
      { data: PurchaseOrder },
      { id: number; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/purchase-orders/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "PurchaseOrders", id }],
    }),

    markPurchaseOrderAsOrdered: builder.mutation<
      { data: PurchaseOrder },
      number
    >({
      query: (id) => ({
        url: `/purchase-orders/${id}/mark-ordered`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [{ type: "PurchaseOrders", id }],
    }),

    cancelPurchaseOrder: builder.mutation<
      { data: PurchaseOrder },
      { id: number; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/purchase-orders/${id}/cancel`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "PurchaseOrders", id }],
    }),

    getPurchaseOrderStatistics: builder.query<
      { data: any },
      {
        start_date?: string;
        end_date?: string;
        branch_id?: number;
      }
    >({
      query: (params) => ({ url: "/purchase-orders/statistics", params }),
      providesTags: ["PurchaseOrders"],
    }),

    getPendingApprovals: builder.query<
      { data: PurchaseOrder[]; meta?: any },
      {
        branch_id?: number;
        page?: number;
        per_page?: number;
      }
    >({
      query: (params) => ({
        url: "/purchase-orders/pending-approvals",
        params,
      }),
      providesTags: ["PurchaseOrders"],
    }),

    // ==================== GOODS RECEIPT NOTES ====================
    getGoodsReceiptNotes: builder.query<
      { data: GoodsReceiptNote[]; meta?: any },
      {
        purchase_order_id?: number;
        branch_id?: number;
        status?: string;
        start_date?: string;
        end_date?: string;
        search?: string;
        page?: number;
        per_page?: number;
      }
    >({
      query: (params) => ({ url: "/goods-receipt-notes", params }),
      providesTags: ["GoodsReceiptNotes"],
      transformResponse: (response: any) => {
        if (response?.data?.data) return response.data;
        if (response?.data)
          return { data: Array.isArray(response.data) ? response.data : [] };
        return { data: [] };
      },
    }),

    getGoodsReceiptNoteById: builder.query<{ data: GoodsReceiptNote }, number>({
      query: (id) => `/goods-receipt-notes/${id}`,
      providesTags: (_r, _e, id) => [{ type: "GoodsReceiptNotes", id }],
    }),

    createGoodsReceiptNote: builder.mutation<{ data: GoodsReceiptNote }, any>({
      query: (body) => ({
        url: "/goods-receipt-notes",
        method: "POST",
        body,
      }),
      invalidatesTags: ["GoodsReceiptNotes", "PurchaseOrders"],
    }),

    verifyGoodsReceiptNote: builder.mutation<
      { data: GoodsReceiptNote },
      number
    >({
      query: (id) => ({
        url: `/goods-receipt-notes/${id}/verify`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [{ type: "GoodsReceiptNotes", id }],
    }),

    completeGoodsReceiptNote: builder.mutation<
      { data: GoodsReceiptNote },
      number
    >({
      query: (id) => ({
        url: `/goods-receipt-notes/${id}/complete`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [{ type: "GoodsReceiptNotes", id }],
    }),

    // ==================== PURCHASE RETURNS ====================
    getPurchaseReturns: builder.query<
      { data: PurchaseReturn[]; meta?: any },
      {
        purchase_order_id?: number;
        supplier_id?: number;
        branch_id?: number;
        status?: string;
        reason?: string;
        start_date?: string;
        end_date?: string;
        search?: string;
        page?: number;
        per_page?: number;
      }
    >({
      query: (params) => ({ url: "/purchase-returns", params }),
      providesTags: ["PurchaseReturns"],
      transformResponse: (response: any) => {
        if (response?.data?.data) return response.data;
        if (response?.data)
          return { data: Array.isArray(response.data) ? response.data : [] };
        return { data: [] };
      },
    }),

    getPurchaseReturnById: builder.query<{ data: PurchaseReturn }, number>({
      query: (id) => `/purchase-returns/${id}`,
      providesTags: (_r, _e, id) => [{ type: "PurchaseReturns", id }],
    }),

    createPurchaseReturn: builder.mutation<{ data: PurchaseReturn }, any>({
      query: (body) => ({
        url: "/purchase-returns",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PurchaseReturns", "PurchaseOrders"],
    }),

    approvePurchaseReturn: builder.mutation<{ data: PurchaseReturn }, number>({
      query: (id) => ({
        url: `/purchase-returns/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [{ type: "PurchaseReturns", id }],
    }),

    rejectPurchaseReturn: builder.mutation<
      { data: PurchaseReturn },
      { id: number; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/purchase-returns/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "PurchaseReturns", id }],
    }),

    completePurchaseReturn: builder.mutation<{ data: PurchaseReturn }, number>({
      query: (id) => ({
        url: `/purchase-returns/${id}/complete`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [{ type: "PurchaseReturns", id }],
    }),

    getPurchaseReturnStatistics: builder.query<
      { data: any },
      {
        start_date?: string;
        end_date?: string;
        branch_id?: number;
      }
    >({
      query: (params) => ({ url: "/purchase-returns/statistics", params }),
      providesTags: ["PurchaseReturns"],
    }),

    // ==================== SUPPLIER PAYMENTS ====================
    getSupplierPayments: builder.query<
      { data: SupplierPayment[]; meta?: any },
      {
        purchase_order_id?: number;
        supplier_id?: number;
        payment_method?: string;
        start_date?: string;
        end_date?: string;
        search?: string;
        page?: number;
        per_page?: number;
      }
    >({
      query: (params) => ({ url: "/supplier-payments", params }),
      providesTags: ["SupplierPayments"],
      transformResponse: (response: any) => {
        if (response?.data?.data) return response.data;
        if (response?.data)
          return { data: Array.isArray(response.data) ? response.data : [] };
        return { data: [] };
      },
    }),

    getSupplierPaymentById: builder.query<{ data: SupplierPayment }, number>({
      query: (id) => `/supplier-payments/${id}`,
      providesTags: (_r, _e, id) => [{ type: "SupplierPayments", id }],
    }),

    createSupplierPayment: builder.mutation<{ data: SupplierPayment }, any>({
      query: (body) => ({
        url: "/supplier-payments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SupplierPayments", "PurchaseOrders"],
    }),

    deleteSupplierPayment: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/supplier-payments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SupplierPayments", "PurchaseOrders"],
    }),

    getSupplierPaymentStatistics: builder.query<
      { data: any },
      {
        start_date?: string;
        end_date?: string;
      }
    >({
      query: (params) => ({ url: "/supplier-payments/statistics", params }),
      providesTags: ["SupplierPayments"],
    }),

    // Supplier Reports (Add these to purchaseApi.ts)
    getSupplierPerformance: builder.query<
      any,
      {
        supplier_id?: number;
        start_date?: string;
        end_date?: string;
      }
    >({
      query: (params) => ({ url: "/reports/supplier-performance", params }),
      providesTags: ["SupplierReports"],
    }),

    getSupplierPurchases: builder.query<
      any,
      {
        supplier_id?: number;
        start_date?: string;
        end_date?: string;
        group_by?: "supplier" | "month" | "quarter" | "year";
      }
    >({
      query: (params) => ({ url: "/reports/supplier-purchases", params }),
      providesTags: ["SupplierReports"],
    }),

    getSupplierAging: builder.query<
      any,
      {
        as_of_date?: string;
        supplier_id?: number;
      }
    >({
      query: (params) => ({ url: "/reports/supplier-aging", params }),
      providesTags: ["SupplierReports"],
    }),

    getSupplierProducts: builder.query<
      any,
      {
        supplier_id: number; // required
        start_date?: string;
        end_date?: string;
      }
    >({
      query: (params) => ({ url: "/reports/supplier-products", params }),
      providesTags: ["SupplierReports"],
    }),
  }),
});

export const {
  // Suppliers
  useGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetSupplierStatisticsQuery,

  // Currencies
  useGetCurrenciesQuery,
  useCreateCurrencyMutation,
  useUpdateCurrencyMutation,
  useDeleteCurrencyMutation,
  useConvertCurrencyMutation,
  useGetBaseCurrencyQuery,

  // Purchase Orders
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  useSubmitPurchaseOrderForApprovalMutation,
  useApprovePurchaseOrderMutation,
  useRejectPurchaseOrderMutation,
  useMarkPurchaseOrderAsOrderedMutation,
  useCancelPurchaseOrderMutation,
  useGetPurchaseOrderStatisticsQuery,
  useGetPendingApprovalsQuery,

  // Goods Receipt Notes
  useGetGoodsReceiptNotesQuery,
  useGetGoodsReceiptNoteByIdQuery,
  useCreateGoodsReceiptNoteMutation,
  useVerifyGoodsReceiptNoteMutation,
  useCompleteGoodsReceiptNoteMutation,

  // Purchase Returns
  useGetPurchaseReturnsQuery,
  useGetPurchaseReturnByIdQuery,
  useCreatePurchaseReturnMutation,
  useApprovePurchaseReturnMutation,
  useRejectPurchaseReturnMutation,
  useCompletePurchaseReturnMutation,
  useGetPurchaseReturnStatisticsQuery,

  // Supplier Payments
  useGetSupplierPaymentsQuery,
  useGetSupplierPaymentByIdQuery,
  useCreateSupplierPaymentMutation,
  useDeleteSupplierPaymentMutation,
  useGetSupplierPaymentStatisticsQuery,

  useGetSupplierPerformanceQuery,
  useGetSupplierPurchasesQuery,
  useGetSupplierAgingQuery,
  useGetSupplierProductsQuery,
} = purchaseApi;
