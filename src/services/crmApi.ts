// src/services/crmApi.ts
import { api } from './api';



export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  alternative_phone?: string;
  date_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  nationality?: string;
  id_number?: string;
  id_type?: 'National' | 'Passport' | 'Civil ID';

  // Address
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;

  // Company info
  company_name?: string;
  company_vat?: string;
  job_title?: string;

  // Preferences
  preferred_contact_method?: 'Email' | 'Phone' | 'SMS' | 'WhatsApp';
  preferred_language?: string;
  communication_preferences?: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };

  // Loyalty
  loyalty_points: number;
  lifetime_points: number;
  loyalty_tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  loyalty_enrolled_date?: string;

  // Statistics
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  last_order_date?: string;

  // Status
  status: 'Active' | 'Inactive' | 'Blocked' | 'Lead';
  is_active: boolean;
  is_verified: boolean;

  // Metadata
  notes?: string;
  tags?: string[];
  created_by?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relations
  createdBy?: any;
}

export interface CustomerInteraction {
  id: number;
  customer_id: number;
  interaction_type: 'Call' | 'Email' | 'Meeting' | 'Note' | 'Support' | 'Complaint' | 'Other';
  subject: string;
  content: string;
  status?: 'Scheduled' | 'Completed' | 'Cancelled';
  scheduled_at?: string;
  completed_at?: string;
  duration_minutes?: number;
  outcome?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  assigned_to?: number;
  created_by: number;
  created_at: string;
  updated_at: string;

  // Relations
  customer?: Customer;
  assignedTo?: any;
  createdBy?: any;
}

export interface CustomerDuplicate {
  id: number;
  customer_1_id: number;
  customer_2_id: number;
  similarity_score: number;
  matching_fields: string[];
  status: 'Pending' | 'Confirmed Duplicate' | 'Not Duplicate' | 'Ignored' | 'Merged';
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;

  // Relations
  customer1?: Customer;
  customer2?: Customer;
  reviewedBy?: any;
}

export interface CustomerMergeHistory {
  id: number;
  primary_customer_id: number;
  merged_customer_ids: number[];
  merged_data: any[];
  orders_merged: number;
  interactions_merged: number;
  points_merged: number;
  merged_by: number;
  merged_at: string;
  notes?: string;

  // Relations
  primaryCustomer?: Customer;
  mergedBy?: any;
}

export interface LoyaltyTransaction {
  id: number;
  customer_id: number;
  points: number;
  transaction_type: 'Earned' | 'Redeemed' | 'Bonus' | 'Adjusted' | 'Expired';
  description: string;
  reference_type?: 'Order' | 'Manual' | 'Promotion' | 'Refund';
  reference_id?: number;
  reference_number?: string;
  balance_after: number;
  expiry_date?: string;
  processed_by: number;
  created_at: string;
  updated_at: string;

  // Relations
  customer?: Customer;
  processedBy?: any;
}

export interface CustomerStatistics {
  total_customers: number;
  active_customers: number;
  new_customers_this_month: number;
  leads_count: number;
  customers_by_status: {
    status: string;
    count: number;
  }[];
  customers_by_tier: {
    tier: string;
    count: number;
    total_points: number;
  }[];
  top_customers: Customer[];
  recent_customers: Customer[];
  total_spent_all: number;
  average_order_value_all: number;
}

export interface LoyaltyStatistics {
  total_members: number;
  total_points_earned: number;
  total_points_redeemed: number;
  active_points: number;
  by_tier: {
    loyalty_tier: string;
    count: number;
    total_points: number;
  }[];
  top_members: {
    id: number;
    first_name: string;
    last_name: string;
    lifetime_points: number;
    loyalty_tier: string;
  }[];
  redemption_rate: number;
  average_points_per_customer: number;
}



export const crmApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ══════════════════════════════════════════════════════════════════
    // CUSTOMERS
    // ══════════════════════════════════════════════════════════════════

    getCustomers: builder.query<{ data: Customer[]; meta?: any }, {
      search?: string;
      status?: string;
      tier?: string;
      city?: string;
      is_active?: boolean | null;
      start_date?: string;
      end_date?: string;
      page?: number;
      per_page?: number;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    }>({
      query: (params) => ({ url: '/customers', params }),
      providesTags: ['Customers'],
      transformResponse: (response: any) => {
  const paginator = response?.data;
  if (paginator?.data && Array.isArray(paginator.data)) {
    return {
      data: paginator.data,
      meta: {
        total:        paginator.total,
        per_page:     paginator.per_page,
        current_page: paginator.current_page,
        last_page:    paginator.last_page,
        from:         paginator.from,
        to:           paginator.to,
      },
    };
  }
  return { data: [] };
},
    }),

    getCustomerById: builder.query<{ data: Customer }, number>({
      query: (id) => `/customers/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Customers', id }],
    }),

    createCustomer: builder.mutation<{ data: Customer }, Partial<Customer>>({
      query: (body) => ({ url: '/customers', method: 'POST', body }),
      invalidatesTags: ['Customers', 'CustomerStatistics'],
    }),

    updateCustomer: builder.mutation<{ data: Customer }, { id: number; data: Partial<Customer> }>({
      query: ({ id, data }) => ({ url: `/customers/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Customers', id },
        'Customers',
        'CustomerStatistics',
      ],
    }),

    deleteCustomer: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/customers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Customers', 'CustomerStatistics'],
    }),

    getCustomerStatistics: builder.query<{ data: CustomerStatistics }, {
      start_date?: string;
      end_date?: string;
    }>({
      query: (params) => ({ url: '/customers/statistics', params }),
      providesTags: ['CustomerStatistics'],
    }),

    // ══════════════════════════════════════════════════════════════════
    // CUSTOMER INTERACTIONS
    // ══════════════════════════════════════════════════════════════════

    /** Fetch all interactions for a customer (was missing) */
    getCustomerInteractions: builder.query<{ data: CustomerInteraction[]; meta?: any }, {
      id: number;
      interaction_type?: string;
      status?: string;
      page?: number;
      per_page?: number;
    }>({
      query: ({ id, ...params }) => ({
        url: `/customers/${id}/interactions`,
        params,
      }),
      providesTags: (_r, _e, { id }) => [{ type: 'CustomerInteractions', id } as any],
    }),

    addCustomerInteraction: builder.mutation<{ data: CustomerInteraction }, {
      id: number;
      data: Partial<CustomerInteraction>;
    }>({
      query: ({ id, data }) => ({
        url: `/customers/${id}/interactions`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Customers', id },
        { type: 'CustomerInteractions', id } as any,
      ],
    }),

    updateCustomerInteraction: builder.mutation<{ data: CustomerInteraction }, {
      customerId: number;
      interactionId: number;
      data: Partial<CustomerInteraction>;
    }>({
      query: ({ customerId, interactionId, data }) => ({
        url: `/customers/${customerId}/interactions/${interactionId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_r, _e, { customerId }) => [
        { type: 'CustomerInteractions', id: customerId } as any,
      ],
    }),

    deleteCustomerInteraction: builder.mutation<{ success: boolean }, {
      customerId: number;
      interactionId: number;
    }>({
      query: ({ customerId, interactionId }) => ({
        url: `/customers/${customerId}/interactions/${interactionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { customerId }) => [
        { type: 'CustomerInteractions', id: customerId } as any,
      ],
    }),

    getCustomerPurchaseHistory: builder.query<{ data: any; meta?: any }, {
      id: number;
      page?: number;
      per_page?: number;
    }>({
      query: ({ id, ...params }) => ({ url: `/customers/${id}/purchase-history`, params }),
    }),

    // ══════════════════════════════════════════════════════════════════
    // LOYALTY PROGRAM
    // ══════════════════════════════════════════════════════════════════

    getLoyaltyStatistics: builder.query<{ data: LoyaltyStatistics }, {
      start_date?: string;
      end_date?: string;
    }>({
      query: (params) => ({ url: '/loyalty/statistics', params }),
      providesTags: ['LoyaltyStatistics'],
    }),

    calculateLoyaltyPoints: builder.mutation<{ data: any }, {
      amount: number;
      points_per_currency?: number;
    }>({
      query: (body) => ({ url: '/loyalty/calculate-points', method: 'POST', body }),
    }),

    getLoyaltyBalance: builder.query<{ data: any }, number>({
      query: (customerId) => `/loyalty/${customerId}/balance`,
      providesTags: (_r, _e, id) => [{ type: 'Loyalty', id }],
    }),

    addLoyaltyPoints: builder.mutation<{ data: LoyaltyTransaction }, {
      customerId: number;
      points: number;
      description: string;
      transaction_type?: 'Earned' | 'Bonus' | 'Adjusted';
      reference_type?: string;
      reference_id?: number;
    }>({
      query: ({ customerId, ...body }) => ({
        url: `/loyalty/${customerId}/add-points`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { customerId }) => [
        { type: 'Customers', id: customerId },
        { type: 'Loyalty', id: customerId },
        'LoyaltyStatistics',
      ],
    }),

    redeemLoyaltyPoints: builder.mutation<{ data: LoyaltyTransaction }, {
      customerId: number;
      points: number;
      description: string;
      reference_type?: string;
      reference_id?: number;
    }>({
      query: ({ customerId, ...body }) => ({
        url: `/loyalty/${customerId}/redeem-points`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { customerId }) => [
        { type: 'Customers', id: customerId },
        { type: 'Loyalty', id: customerId },
        'LoyaltyStatistics',
      ],
    }),

    getLoyaltyTransactions: builder.query<{ data: LoyaltyTransaction[]; meta?: any }, {
      customerId: number;
      transaction_type?: string;
      start_date?: string;
      end_date?: string;
      page?: number;
      per_page?: number;
    }>({
      query: ({ customerId, ...params }) => ({
        url: `/loyalty/${customerId}/transactions`,
        params,
      }),
      providesTags: (_r, _e, { customerId }) => [{ type: 'Loyalty', id: customerId }],
    }),

    // ══════════════════════════════════════════════════════════════════
    // CUSTOMER DUPLICATES
    // ══════════════════════════════════════════════════════════════════

    detectDuplicates: builder.mutation<{ data: any }, void>({
      query: () => ({ url: '/customer-duplicates/detect', method: 'POST' }),
      invalidatesTags: ['CustomerDuplicates'],
    }),

    getCustomerDuplicates: builder.query<{ data: CustomerDuplicate[]; meta?: any }, {
      status?: string;
      min_score?: number;
      page?: number;
      per_page?: number;
    }>({
      query: (params) => ({ url: '/customer-duplicates', params }),
      providesTags: ['CustomerDuplicates'],
      transformResponse: (response: any) => {
        if (response?.data?.data) return response.data;
        if (response?.data) return { data: Array.isArray(response.data) ? response.data : [] };
        return { data: [] };
      },
    }),

    reviewDuplicate: builder.mutation<{ data: CustomerDuplicate }, {
      id: number;
      status: 'Confirmed Duplicate' | 'Not Duplicate' | 'Ignored';
    }>({
      query: ({ id, ...body }) => ({
        url: `/customer-duplicates/${id}/review`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CustomerDuplicates'],
    }),

    mergeCustomers: builder.mutation<{ data: any }, {
      id: number;
      primary_customer_id: number;
      notes?: string;
    }>({
      query: ({ id, ...body }) => ({
        url: `/customer-duplicates/${id}/merge`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Customers', 'CustomerDuplicates', 'CustomerMergeHistory'],
    }),

    getMergeHistory: builder.query<{ data: CustomerMergeHistory[]; meta?: any }, {
      page?: number;
      per_page?: number;
    }>({
      query: (params) => ({ url: '/customer-duplicates/merge-history', params }),
      providesTags: ['CustomerMergeHistory'],
    }),
  }),
});

export const {
  // Customers
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetCustomerStatisticsQuery,

  // Interactions
  useGetCustomerInteractionsQuery,       // ← NEW
  useAddCustomerInteractionMutation,
  useUpdateCustomerInteractionMutation,  // ← NEW
  useDeleteCustomerInteractionMutation,  // ← NEW
  useGetCustomerPurchaseHistoryQuery,

  // Loyalty
  useGetLoyaltyStatisticsQuery,
  useCalculateLoyaltyPointsMutation,
  useGetLoyaltyBalanceQuery,
  useAddLoyaltyPointsMutation,
  useRedeemLoyaltyPointsMutation,
  useGetLoyaltyTransactionsQuery,

  // Duplicates
  useDetectDuplicatesMutation,
  useGetCustomerDuplicatesQuery,
  useReviewDuplicateMutation,
  useMergeCustomersMutation,
  useGetMergeHistoryQuery,
} = crmApi;