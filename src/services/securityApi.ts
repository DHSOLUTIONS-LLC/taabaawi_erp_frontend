import { api } from '../services/api';
import type {
  ActivityLog,
  ActivityLogFilters,
  ActivityLogStatistics,
  LoginHistory,
  LoginHistoryFilters,
  SecurityAlert,
  SecurityAlertFilters,
  UserSession,
  ChangeHistory,
  ChangeHistoryFilters,
  DeletedRecord,
  DeletedRecordFilters,
  DeletedRecordStatistics,
  SecurityStats,
} from '../types/security';

export const securityApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ========== DASHBOARD STATS ==========
    getSecurityStats: builder.query<{ data: SecurityStats }, void>({
      query: () => '/security/statistics',
      providesTags: ['SecurityStats'],
    }),

    // ========== ACTIVITY LOGS ==========
    getActivityLogs: builder.query<{ data: ActivityLog[] }, ActivityLogFilters>({
      query: (params) => ({ url: '/activity-logs', params }),
      providesTags: ['ActivityLogs'],
    }),

    getActivityLogById: builder.query<{ data: ActivityLog }, number>({
      query: (id) => `/activity-logs/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'ActivityLogs', id }],
    }),

    getUserActivity: builder.query<{ data: ActivityLog[] }, { userId: number; params?: ActivityLogFilters }>({
      query: ({ userId, params }) => ({ url: `/activity-logs/user/${userId}`, params }),
      providesTags: ['ActivityLogs'],
    }),

    getModelHistory: builder.query<{ data: ActivityLog[] }, { model_type: string; model_id: number }>({
      query: (params) => ({ url: '/activity-logs/model-history', params }),
      providesTags: ['ActivityLogs'],
    }),

    getActivityStatistics: builder.query<{ data: ActivityLogStatistics }, { start_date?: string; end_date?: string }>({
      query: (params) => ({ url: '/activity-logs/statistics', params }),
      providesTags: ['ActivityLogStatistics'],
    }),

    // ========== LOGIN HISTORY ==========
    getLoginHistory: builder.query<{ data: LoginHistory[] }, LoginHistoryFilters>({
      query: (params) => ({ url: '/security/login-history', params }),
      providesTags: ['LoginHistory'],
    }),

    getUserLoginHistory: builder.query<{ data: LoginHistory[] }, { userId: number; params?: LoginHistoryFilters }>({
      query: ({ userId, params }) => ({ url: `/security/login-history/user/${userId}`, params }),
      providesTags: ['LoginHistory'],
    }),

    // ========== SECURITY ALERTS ==========
    getSecurityAlerts: builder.query<{ data: SecurityAlert[] }, SecurityAlertFilters>({
      query: (params) => ({ url: '/security/alerts', params }),
      providesTags: ['SecurityAlerts'],
    }),

    resolveAlert: builder.mutation<{ data: SecurityAlert }, { id: number; resolution_notes?: string }>({
      query: ({ id, resolution_notes }) => ({
        url: `/security/alerts/${id}/resolve`,
        method: 'POST',
        body: { resolution_notes },
      }),
      invalidatesTags: ['SecurityAlerts', 'SecurityStats'],
    }),

    markAlertFalsePositive: builder.mutation<{ data: SecurityAlert }, { id: number; resolution_notes?: string }>({
      query: ({ id, resolution_notes }) => ({
        url: `/security/alerts/${id}/false-positive`,
        method: 'POST',
        body: { resolution_notes },
      }),
      invalidatesTags: ['SecurityAlerts', 'SecurityStats'],
    }),

    // ========== USER SESSIONS ==========
    getActiveSessions: builder.query<{ data: UserSession[] }, void>({
      query: () => '/security/sessions',
      providesTags: ['UserSessions'],
    }),

    getUserSessions: builder.query<{ data: UserSession[] }, number>({
      query: (userId) => `/security/sessions/user/${userId}`,
      providesTags: ['UserSessions'],
    }),

    terminateSession: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/security/sessions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['UserSessions'],
    }),

    // ========== CHANGE HISTORY ==========
    getChangeHistory: builder.query<{ data: ChangeHistory[] }, ChangeHistoryFilters>({
      query: (params) => ({ url: '/change-history', params }),
      providesTags: ['ChangeHistory'],
    }),

    getModelChangeHistory: builder.query<{ data: ChangeHistory[] }, { model_type: string; model_id?: number }>({
      query: (params) => ({ url: '/change-history/model', params }),
      providesTags: ['ChangeHistory'],
    }),

    getFieldChanges: builder.query<
      { data: ChangeHistory[] },
      { model_type: string; field_name: string; model_id?: number }
    >({
      query: (params) => ({ url: '/change-history/field-changes', params }),
      providesTags: ['ChangeHistory'],
    }),

    // ========== DELETED RECORDS ==========
    getDeletedRecords: builder.query<{ data: DeletedRecord[] }, DeletedRecordFilters>({
      query: (params) => ({ url: '/deleted-records', params }),
      providesTags: ['DeletedRecords'],
    }),

    getDeletedRecordById: builder.query<{ data: DeletedRecord }, number>({
      query: (id) => `/deleted-records/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'DeletedRecords', id }],
    }),

    restoreDeletedRecord: builder.mutation<{ data: DeletedRecord }, number>({
      query: (id) => ({
        url: `/deleted-records/${id}/restore`,
        method: 'POST',
      }),
      invalidatesTags: ['DeletedRecords', 'DeletedRecordStatistics'],
    }),

    getDeletedRecordStatistics: builder.query<{ data: DeletedRecordStatistics }, { start_date?: string; end_date?: string }>({
      query: (params) => ({ url: '/deleted-records/statistics', params }),
      providesTags: ['DeletedRecordStatistics'],
    }),
  }),
});

export const {
  useGetSecurityStatsQuery,
  useGetActivityLogsQuery,
  useGetActivityLogByIdQuery,
  useGetUserActivityQuery,
  useGetModelHistoryQuery,
  useGetActivityStatisticsQuery,
  useGetLoginHistoryQuery,
  useGetUserLoginHistoryQuery,
  useGetSecurityAlertsQuery,
  useResolveAlertMutation,
  useMarkAlertFalsePositiveMutation,
  useGetActiveSessionsQuery,
  useGetUserSessionsQuery,
  useTerminateSessionMutation,
  useGetChangeHistoryQuery,
  useGetModelChangeHistoryQuery,
  useGetFieldChangesQuery,
  useGetDeletedRecordsQuery,
  useGetDeletedRecordByIdQuery,
  useRestoreDeletedRecordMutation,
  useGetDeletedRecordStatisticsQuery,
} = securityApi;