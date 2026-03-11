import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { systemApi } from '../../services/systemApi';

interface SystemState {
  settings: any | null;
  loading: boolean;
  error: string | null;
  isTestEmailSending: boolean;
  testEmailSuccess: string | null;
  testEmailError: string | null;
}

const initialState: SystemState = {
  settings: null,
  loading: false,
  error: null,
  isTestEmailSending: false,
  testEmailSuccess: null,
  testEmailError: null,
};

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearTestEmailStatus: (state) => {
      state.testEmailSuccess = null;
      state.testEmailError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get System Settings
      .addMatcher(
        systemApi.endpoints.getSystemSettings.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        systemApi.endpoints.getSystemSettings.matchFulfilled,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          state.settings = payload.data;
        }
      )
      .addMatcher(
        systemApi.endpoints.getSystemSettings.matchRejected,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          state.error = payload?.data?.message || 'Failed to fetch system settings';
        }
      )

      // Update System Settings
      .addMatcher(
        systemApi.endpoints.updateSystemSettings.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        systemApi.endpoints.updateSystemSettings.matchFulfilled,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          state.settings = payload.data;
        }
      )
      .addMatcher(
        systemApi.endpoints.updateSystemSettings.matchRejected,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          state.error = payload?.data?.message || 'Failed to update system settings';
        }
      )

      // Upload Logo
      .addMatcher(
        systemApi.endpoints.uploadLogo.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        systemApi.endpoints.uploadLogo.matchFulfilled,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          if (state.settings) {
            state.settings.logo = payload.data.logo;
            state.settings.logo_url = payload.data.logo_url;
          }
        }
      )
      .addMatcher(
        systemApi.endpoints.uploadLogo.matchRejected,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          state.error = payload?.data?.message || 'Failed to upload logo';
        }
      )

      // Test Email
      .addMatcher(
        systemApi.endpoints.testEmail.matchPending,
        (state) => {
          state.isTestEmailSending = true;
          state.testEmailSuccess = null;
          state.testEmailError = null;
        }
      )
      .addMatcher(
        systemApi.endpoints.testEmail.matchFulfilled,
        (state, { payload }: PayloadAction<any>) => {
          state.isTestEmailSending = false;
          state.testEmailSuccess = payload.message;
        }
      )
      .addMatcher(
        systemApi.endpoints.testEmail.matchRejected,
        (state, { payload }: PayloadAction<any>) => {
          state.isTestEmailSending = false;
          state.testEmailError = payload?.data?.message || 'Failed to send test email';
        }
      );
  },
});

export const { clearError, clearTestEmailStatus } = systemSlice.actions;
export default systemSlice.reducer;