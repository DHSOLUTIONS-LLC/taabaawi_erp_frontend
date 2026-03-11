import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { paymentMethodApi } from '../../services/paymentMethodApi';
import type { PaymentMethod } from '../../types/payment-method';

interface PaymentMethodState {
  methods: PaymentMethod[];
  selectedMethod: PaymentMethod | null;
  loading: boolean;
  error: string | null;
  feeCalculation: {
    amount: number | null;
    fee: number | null;
    total: number | null;
    loading: boolean;
  };
}

const initialState: PaymentMethodState = {
  methods: [],
  selectedMethod: null,
  loading: false,
  error: null,
  feeCalculation: {
    amount: null,
    fee: null,
    total: null,
    loading: false,
  },
};

const paymentMethodSlice = createSlice({
  name: 'paymentMethods',
  initialState,
  reducers: {
    setSelectedMethod: (state, action: PayloadAction<PaymentMethod | null>) => {
      state.selectedMethod = action.payload;
    },
    clearFeeCalculation: (state) => {
      state.feeCalculation = {
        amount: null,
        fee: null,
        total: null,
        loading: false,
      };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Payment Methods
      .addMatcher(
        paymentMethodApi.endpoints.getPaymentMethods.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        paymentMethodApi.endpoints.getPaymentMethods.matchFulfilled,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          state.methods = payload.data || [];
        }
      )
      .addMatcher(
        paymentMethodApi.endpoints.getPaymentMethods.matchRejected,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          state.error = payload?.data?.message || 'Failed to fetch payment methods';
        }
      )

      // Get Payment Method By ID
      .addMatcher(
        paymentMethodApi.endpoints.getPaymentMethodById.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        paymentMethodApi.endpoints.getPaymentMethodById.matchFulfilled,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          state.selectedMethod = payload.data;
        }
      )
      .addMatcher(
        paymentMethodApi.endpoints.getPaymentMethodById.matchRejected,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          state.error = payload?.data?.message || 'Failed to fetch payment method';
        }
      )

      // Update Payment Method
      .addMatcher(
        paymentMethodApi.endpoints.updatePaymentMethod.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        paymentMethodApi.endpoints.updatePaymentMethod.matchFulfilled,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          state.selectedMethod = payload.data;
          // Update in methods list
          const index = state.methods.findIndex((m) => m.id === payload.data.id);
          if (index !== -1) {
            state.methods[index] = payload.data;
          }
        }
      )
      .addMatcher(
        paymentMethodApi.endpoints.updatePaymentMethod.matchRejected,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          state.error = payload?.data?.message || 'Failed to update payment method';
        }
      )

      // Calculate Fee
      .addMatcher(
        paymentMethodApi.endpoints.calculateFee.matchPending,
        (state) => {
          state.feeCalculation.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        paymentMethodApi.endpoints.calculateFee.matchFulfilled,
        (state, { payload }: PayloadAction<any>) => {
          state.feeCalculation.loading = false;
          state.feeCalculation.amount = payload.data.amount;
          state.feeCalculation.fee = payload.data.fee;
          state.feeCalculation.total = payload.data.total_with_fee;
        }
      )
      .addMatcher(
        paymentMethodApi.endpoints.calculateFee.matchRejected,
        (state, { payload }: PayloadAction<any>) => {
          state.feeCalculation.loading = false;
          state.error = payload?.data?.message || 'Failed to calculate fee';
        }
      );
  },
});

export const { setSelectedMethod, clearFeeCalculation, clearError } = paymentMethodSlice.actions;
export default paymentMethodSlice.reducer;