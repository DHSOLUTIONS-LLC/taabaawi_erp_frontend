// src/services/salesApi.ts
import { api } from './api';
import type {
  Order,
  OrderFilters,
  OrderStatistics,
  ShippingMethod,
  CreateOrderPayload,
  ShipOrderPayload,
} from '../types/sales';

export const salesApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ─── ORDERS ───────────────────────────────────────────────────────

    getOrders: builder.query<any, OrderFilters>({
      query: (params) => ({ url: '/orders', params }),
      providesTags: ['Orders'],
    }),

    getOrderById: builder.query<{ success: boolean; data: Order }, number>({
      query: (id) => `/orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Orders', id }],
    }),

    createOrder: builder.mutation<{ success: boolean; data: Order }, CreateOrderPayload>({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: ['Orders'],
    }),

    updateOrder: builder.mutation<{ success: boolean; data: Order }, {
      id: number;
      data: {
        customer_name?: string;
        customer_email?: string;
        customer_phone?: string;
        shipping_address?: string;
        shipping_city?: string;
        internal_notes?: string;
      };
    }>({
      query: ({ id, data }) => ({ url: `/orders/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Orders', id }, 'Orders'],
    }),

    deleteOrder: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/orders/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Orders'],
    }),

    getOrderStatistics: builder.query<{ success: boolean; data: OrderStatistics }, {
      branch_id?: number;
      start_date?: string;
      end_date?: string;
    }>({
      query: (params) => ({ url: '/orders/statistics', params }),
      providesTags: ['Orders'],
    }),

    getMyOrders: builder.query<any, { page?: number; per_page?: number }>({
      query: (params) => ({ url: '/orders/my-orders', params }),
    }),

    // ─── ORDER STATUS ACTIONS ─────────────────────────────────────────

    confirmOrder: builder.mutation<{ success: boolean; data: Order }, number>({
      query: (id) => ({ url: `/orders/${id}/confirm`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Orders', id }, 'Orders'],
    }),

    processOrder: builder.mutation<{ success: boolean; data: Order }, number>({
      query: (id) => ({ url: `/orders/${id}/process`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Orders', id }, 'Orders'],
    }),

    packOrder: builder.mutation<{ success: boolean; data: Order }, number>({
      query: (id) => ({ url: `/orders/${id}/pack`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Orders', id }, 'Orders'],
    }),

    shipOrder: builder.mutation<{ success: boolean; data: Order }, { id: number } & ShipOrderPayload>({
      query: ({ id, ...body }) => ({ url: `/orders/${id}/ship`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Orders', id }, 'Orders'],
    }),

    deliverOrder: builder.mutation<{ success: boolean; data: Order }, number>({
      query: (id) => ({ url: `/orders/${id}/deliver`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Orders', id }, 'Orders'],
    }),

    cancelOrder: builder.mutation<{ success: boolean; data: Order }, { id: number; reason: string }>({
      query: ({ id, reason }) => ({ url: `/orders/${id}/cancel`, method: 'POST', body: { reason } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Orders', id }, 'Orders'],
    }),

    returnOrder: builder.mutation<{ success: boolean; data: Order }, { id: number; reason: string }>({
      query: ({ id, reason }) => ({ url: `/orders/${id}/return`, method: 'POST', body: { reason } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Orders', id }, 'Orders'],
    }),

    assignOrderToStaff: builder.mutation<{ success: boolean; data: Order }, { id: number; staff_id: number }>({
      query: ({ id, staff_id }) => ({ url: `/orders/${id}/assign`, method: 'POST', body: { staff_id } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Orders', id }],
    }),

    markOrderAsPaid: builder.mutation<{ success: boolean; data: Order }, number>({
      query: (id) => ({ url: `/orders/${id}/mark-paid`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Orders', id }, 'Orders'],
    }),

    getOrderStatusHistory: builder.query<{ success: boolean; data: any[] }, number>({
      query: (id) => `/orders/${id}/status-history`,
      providesTags: (_r, _e, id) => [{ type: 'Orders', id }],
    }),

    trackOrder: builder.query<{ success: boolean; data: any }, number>({
      query: (id) => `/orders/${id}/track`,
    }),

    // ─── SHIPPING METHODS ─────────────────────────────────────────────

    getShippingMethods: builder.query<any, {
      is_active?: boolean;
      provider?: string;
      area?: string;
      search?: string;
      per_page?: number;
    }>({
      query: (params) => ({ url: '/shipping-methods', params }),
      providesTags: ['ShippingMethods'],
    }),

    getShippingMethodById: builder.query<{ success: boolean; data: ShippingMethod }, number>({
      query: (id) => `/shipping-methods/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'ShippingMethods', id }],
    }),

    createShippingMethod: builder.mutation<{ success: boolean; data: ShippingMethod }, Partial<ShippingMethod>>({
      query: (body) => ({ url: '/shipping-methods', method: 'POST', body }),
      invalidatesTags: ['ShippingMethods'],
    }),

    updateShippingMethod: builder.mutation<{ success: boolean; data: ShippingMethod }, { id: number; data: Partial<ShippingMethod> }>({
      query: ({ id, data }) => ({ url: `/shipping-methods/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'ShippingMethods', id }, 'ShippingMethods'],
    }),

    deleteShippingMethod: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/shipping-methods/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ShippingMethods'],
    }),

    calculateShippingCost: builder.mutation<{ success: boolean; data: any }, {
      shipping_method_id: number;
      weight?: number;
      area?: string;
      items?: { product_id: number; quantity: number }[];
    }>({
      query: (body) => ({ url: '/shipping-methods/calculate-cost', method: 'POST', body }),
    }),


    getSalesToday: builder.query<any, void>({
            query: () => '/dashboard/sales/today',
        }),
        getSalesWeekly: builder.query<any, void>({
            query: () => '/dashboard/sales/weekly',
        }),
        getSalesMonthly: builder.query<any, void>({
            query: () => '/dashboard/sales/monthly',
        }),
        getSalesOverview: builder.query<any, void>({
            query: () => '/dashboard/sales/overview',
        }),
        getChannelBreakdown: builder.query<any, void>({
            query: () => '/reports/sales/by-channel',
        }),

  }),
});

export const {
  // Orders
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
  useGetOrderStatisticsQuery,
  useGetMyOrdersQuery,
  // Status actions
  useConfirmOrderMutation,
  useProcessOrderMutation,
  usePackOrderMutation,
  useShipOrderMutation,
  useDeliverOrderMutation,
  useCancelOrderMutation,
  useReturnOrderMutation,
  useAssignOrderToStaffMutation,
  useMarkOrderAsPaidMutation,
  useGetOrderStatusHistoryQuery,
  useTrackOrderQuery,
  // Shipping
  useGetShippingMethodsQuery,
  useGetShippingMethodByIdQuery,
  useCreateShippingMethodMutation,
  useUpdateShippingMethodMutation,
  useDeleteShippingMethodMutation,
  useCalculateShippingCostMutation,
   useGetSalesTodayQuery,
    useGetSalesWeeklyQuery,
    useGetSalesMonthlyQuery,
    useGetSalesOverviewQuery,
    useGetChannelBreakdownQuery,
} = salesApi;