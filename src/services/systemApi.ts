import { api } from '../services/api';
import type { SystemSettings, EmailSettings } from '../types/system';

export const systemApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all system settings
    getSystemSettings: builder.query<any, void>({
      query: () => '/system-settings',
      providesTags: ['SystemSettings'],
    }),

    // Update all system settings
    updateSystemSettings: builder.mutation<any, Partial<SystemSettings>>({
      query: (settings) => ({
        url: '/system-settings',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['SystemSettings'],
    }),

    // Upload company logo
    uploadLogo: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/system-settings/upload-logo',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['SystemSettings'],
    }),

    // Update email settings
    updateEmailSettings: builder.mutation<any, Partial<EmailSettings>>({
      query: (emailSettings) => ({
        url: '/system-settings/email-settings',
        method: 'PUT',
        body: emailSettings,
      }),
      invalidatesTags: ['SystemSettings'],
    }),

    // Test email configuration
    testEmail: builder.mutation<any, { test_email: string }>({
      query: (payload) => ({
        url: '/system-settings/test-email',
        method: 'POST',
        body: payload,
      }),
    }),

    // Get specific setting by key
    getSetting: builder.query<any, string>({
      query: (key) => `/system-settings/${key}`,
      providesTags: (_result, _error, key) => [{ type: 'SystemSettings', id: key }],
    }),

    // Update specific setting by key
    setSetting: builder.mutation<any, { key: string; value: any }>({
      query: ({ key, value }) => ({
        url: `/system-settings/${key}`,
        method: 'PUT',
        body: { value },
      }),
      invalidatesTags: (_result, _error, { key }) => [
        'SystemSettings',
        { type: 'SystemSettings', id: key },
      ],
    }),
  }),
});

export const {
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
  useUploadLogoMutation,
  useUpdateEmailSettingsMutation,
  useTestEmailMutation,
  useGetSettingQuery,
  useSetSettingMutation,
} = systemApi;