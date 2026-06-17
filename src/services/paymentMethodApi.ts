import { api } from '../services/api';
import type {
  PaymentMethodFilters,
  PaymentMethodResponse,
  PaymentMethodsResponse,
  FeeCalculationResponse,
  UpdatePaymentMethodPayload,
  CreatePaymentMethodPayload
} from '../types/payment-method';

export const paymentMethodApi = api.injectEndpoints({
  endpoints: (builder) => ({

    createPaymentMethod: builder.mutation<
      PaymentMethodResponse,
      CreatePaymentMethodPayload
    >({
      query: (data) => ({
        url: '/payment-methods',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PaymentMethods'],
    }),
    // Get all payment methods
    getPaymentMethods: builder.query<PaymentMethodsResponse, PaymentMethodFilters | void>({
      query: (params) => ({
        url: '/payment-methods',
        params: params || {},
      }),
      providesTags: ['PaymentMethods'],
    }),

    // Get active payment methods
    getActivePaymentMethods: builder.query<PaymentMethodsResponse, void>({
      query: () => '/payment-methods/active',
      providesTags: ['PaymentMethods'],
    }),

    // Get payment method by ID
    getPaymentMethodById: builder.query<PaymentMethodResponse, number>({
      query: (id) => `/payment-methods/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'PaymentMethods', id }],
    }),

    // Update payment method
    updatePaymentMethod: builder.mutation<
      PaymentMethodResponse,
      { id: number; data: UpdatePaymentMethodPayload }
    >({
      query: ({ id, data }) => ({
        url: `/payment-methods/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        'PaymentMethods',
        { type: 'PaymentMethods', id },
      ],
    }),

    // Calculate transaction fee
    calculateFee: builder.mutation<
      FeeCalculationResponse,
      { id: number; amount: number }
    >({
      query: ({ id, amount }) => ({
        url: `/payment-methods/${id}/calculate-fee`,
        method: 'POST',
        body: { amount },
      }),
    }),
  }),
});

export const {
  useGetPaymentMethodsQuery,
  useGetActivePaymentMethodsQuery,
  useGetPaymentMethodByIdQuery,
  useUpdatePaymentMethodMutation,
  useCalculateFeeMutation,
  useCreatePaymentMethodMutation
} = paymentMethodApi;