import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { api } from "./api";
// ── Types ─────────────────────────────────────────────────────────────────────

export interface SavedReport {
  id: number;
  report_name: string;
  report_code: string;
  report_type:
    | "Sales Report"
    | "Inventory Report"
    | "Financial Report"
    | "HR Report"
    | "Customer Report"
    | "Custom Report";
  description?: string;
  data_source: string;
  filters?: any;
  columns?: any;
  grouping?: any;
  sorting?: any;
  calculations?: any;
  custom_query?: string;
  chart_type:
    | "None"
    | "Bar Chart"
    | "Line Chart"
    | "Pie Chart"
    | "Area Chart"
    | "Table";
  visibility: "Private" | "Public" | "Shared";
  shared_with?: number[];
  is_scheduled: boolean;
  schedule_frequency?: string;
  schedule_time?: string;
  schedule_recipients?: string[];
  is_active: boolean;
  created_by: number;
  createdBy?: any;
  executions?: ReportExecution[];
  created_at: string;
  updated_at: string;
}

export interface ReportExecution {
  id: number;
  report_id: number;
  executed_by: number;
  executedBy?: any;
  execution_time_ms?: number;
  records_count?: number;
  status: "Success" | "Failed";
  export_format?: string;
  file_path?: string;
  file_size?: number;
  error_message?: string;
  created_at: string;
}

export interface KpiMetric {
  id: number;
  kpi_name: string;
  kpi_code: string;
  kpi_category:
    | "Sales"
    | "Financial"
    | "Inventory"
    | "HR"
    | "Customer"
    | "Operations";
  description?: string;
  calculation_type:
    | "Count"
    | "Sum"
    | "Average"
    | "Percentage"
    | "Ratio"
    | "Custom";
  data_source: string;
  calculation_formula?: string;
  current_value?: number;
  previous_value?: number;
  target_value?: number;
  warning_threshold?: number;
  critical_threshold?: number;
  unit?: string;
  trend_direction: "Up is Good" | "Down is Good" | "Neutral";
  calculation_frequency: number;
  last_calculated_at?: string;
  is_active: boolean;
  created_by: number;
  createdBy?: any;
  // computed by backend
  status?: "good" | "warning" | "critical" | "neutral";
  achievement_percentage?: number;
  variance?: number;
  created_at: string;
  updated_at: string;
}

export interface Dashboard {
  id: number;
  dashboard_name: string;
  description?: string;
  layout?: any;
  widgets?: any[];
  visibility: "Private" | "Public" | "Shared";
  shared_with?: number[];
  refresh_interval: number;
  auto_refresh: boolean;
  is_default: boolean;
  is_active: boolean;
  created_by: number;
  createdBy?: any;
  created_at: string;
  updated_at: string;
}

// ── Helper: normalize Laravel paginator ──────────────────────────────────────

const normalizePaginator = (response: any) => {
  const paginator = response?.data;
  if (paginator?.data && Array.isArray(paginator.data)) {
    return {
      data: paginator.data,
      meta: {
        total: paginator.total,
        per_page: paginator.per_page,
        current_page: paginator.current_page,
        last_page: paginator.last_page,
        from: paginator.from,
        to: paginator.to,
      },
    };
  }
  return { data: [], meta: undefined };
};

// ── API ───────────────────────────────────────────────────────────────────────

export const reportsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ── Saved Reports ───────────────────────────────────────────────────────

    getReports: builder.query<
      { data: SavedReport[]; meta?: any },
      {
        report_type?: string;
        visibility?: string;
        is_active?: boolean;
        search?: string;
        page?: number;
        per_page?: number;
      }
    >({
      query: (params) => ({ url: "/reports", params }),
      transformResponse: normalizePaginator,
      providesTags: ["Reports"],
    }),

    getReport: builder.query<{ data: SavedReport }, number>({
      query: (id) => `/reports/${id}`,
      transformResponse: (response: any) => ({ data: response.data }),
      providesTags: (_r, _e, id) => [{ type: "Reports", id }],
    }),

    createReport: builder.mutation<{ data: SavedReport }, Partial<SavedReport>>(
      {
        query: (body) => ({ url: "/reports", method: "POST", body }),
        invalidatesTags: ["Reports"],
      },
    ),

    updateReport: builder.mutation<
      { data: SavedReport },
      { id: number; data: Partial<SavedReport> }
    >({
      query: ({ id, data }) => ({
        url: `/reports/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => ["Reports", { type: "Reports", id }],
    }),

    deleteReport: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/reports/${id}`, method: "DELETE" }),
      invalidatesTags: ["Reports"],
    }),

    executeReport: builder.mutation<
      {
        data: any[];
        summary: any;
        execution_time_ms: number;
        records_count: number;
      },
      number
    >({
      query: (id) => ({ url: `/reports/${id}/execute`, method: "POST" }),
      transformResponse: (response: any) => ({
        data: response.data,
        summary: response.summary,
        execution_time_ms: response.execution_time_ms,
        records_count: response.records_count,
      }),
      invalidatesTags: (_r, _e, id) => [{ type: "ReportExecutions", id }],
    }),

    getExecutionHistory: builder.query<
      { data: ReportExecution[]; meta?: any },
      {
        id: number;
        per_page?: number;
      }
    >({
      query: ({ id, ...params }) => ({
        url: `/reports/${id}/execution-history`,
        params,
      }),
      transformResponse: normalizePaginator,
      providesTags: (_r, _e, { id }) => [{ type: "ReportExecutions", id }],
    }),

    // ── Pre-Built Reports ───────────────────────────────────────────────────

    getSalesSummary: builder.query<
      any,
      { start_date?: string; end_date?: string }
    >({
      query: (params) => ({ url: "/pre-built-reports/sales-summary", params }),
      transformResponse: (response: any) => response.data,
    }),

    getTopSellingProducts: builder.query<
      any,
      {
        start_date?: string;
        end_date?: string;
        limit?: number;
      }
    >({
      query: (params) => ({
        url: "/pre-built-reports/top-selling-products",
        params,
      }),
      transformResponse: (response: any) => response.data,
    }),

    getInventoryStatus: builder.query<any, { low_stock_threshold?: number }>({
      query: (params) => ({
        url: "/pre-built-reports/inventory-status",
        params,
      }),
      transformResponse: (response: any) => response.data,
    }),

    getCustomerAnalysis: builder.query<
      any,
      { start_date?: string; end_date?: string }
    >({
      query: (params) => ({
        url: "/pre-built-reports/customer-analysis",
        params,
      }),
      transformResponse: (response: any) => response.data,
    }),

    getEmployeePerformance: builder.query<
      any,
      { start_date?: string; end_date?: string }
    >({
      query: (params) => ({
        url: "/pre-built-reports/employee-performance",
        params,
      }),
      transformResponse: (response: any) => response.data,
    }),

    getFinancialSummary: builder.query<
      any,
      { start_date?: string; end_date?: string }
    >({
      query: (params) => ({
        url: "/pre-built-reports/financial-summary",
        params,
      }),
      transformResponse: (response: any) => response.data,
    }),

    // ── Dashboards ──────────────────────────────────────────────────────────

    getDashboards: builder.query<
      { data: Dashboard[]; meta?: any },
      {
        visibility?: string;
        is_active?: boolean;
        per_page?: number;
      }
    >({
      query: (params) => ({ url: "/dashboards", params }),
      transformResponse: normalizePaginator,
      providesTags: ["Dashboards"],
    }),

    getDashboard: builder.query<
      { dashboard: Dashboard; widget_data: any },
      number
    >({
      query: (id) => `/dashboards/${id}`,
      transformResponse: (response: any) => response.data,
      providesTags: (_r, _e, id) => [{ type: "Dashboards", id }],
    }),

    createDashboard: builder.mutation<{ data: Dashboard }, Partial<Dashboard>>({
      query: (body) => ({ url: "/dashboards", method: "POST", body }),
      invalidatesTags: ["Dashboards"],
    }),

    updateDashboard: builder.mutation<
      { data: Dashboard },
      { id: number; data: Partial<Dashboard> }
    >({
      query: ({ id, data }) => ({
        url: `/dashboards/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        "Dashboards",
        { type: "Dashboards", id },
      ],
    }),

    deleteDashboard: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/dashboards/${id}`, method: "DELETE" }),
      invalidatesTags: ["Dashboards"],
    }),

    addWidget: builder.mutation<
      { data: Dashboard },
      {
        id: number;
        widget_type: "kpi" | "chart" | "table" | "text";
        widget_title: string;
        widget_config?: any;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/dashboards/${id}/widgets`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Dashboards", id }],
    }),

    removeWidget: builder.mutation<
      { data: Dashboard },
      { id: number; widget_id: string }
    >({
      query: ({ id, widget_id }) => ({
        url: `/dashboards/${id}/widgets`,
        method: "DELETE",
        body: { widget_id },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Dashboards", id }],
    }),

    updateWidget: builder.mutation<
      { data: Dashboard },
      {
        id: number;
        widget_id: string;
        widget_config: any;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/dashboards/${id}/widgets`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Dashboards", id }],
    }),

    // ── KPI Metrics ─────────────────────────────────────────────────────────

    getKpiMetrics: builder.query<
      { data: KpiMetric[]; meta?: any },
      {
        kpi_category?: string;
        is_active?: boolean;
        per_page?: number;
      }
    >({
      query: (params) => ({ url: "/kpi-metrics", params }),
      transformResponse: normalizePaginator,
      providesTags: ["KpiMetrics"],
    }),

    getKpiSummary: builder.query<
      {
        total_kpis: number;
        good: number;
        warning: number;
        critical: number;
        neutral: number;
        kpis: KpiMetric[];
      },
      { category?: string }
    >({
      query: (params) => ({ url: "/kpi-metrics/summary", params }),
      transformResponse: (response: any) => response.data,
      providesTags: ["KpiMetrics"],
    }),

    getKpiMetric: builder.query<{ data: KpiMetric }, number>({
      query: (id) => `/kpi-metrics/${id}`,
      transformResponse: (response: any) => ({ data: response.data }),
      providesTags: (_r, _e, id) => [{ type: "KpiMetrics", id }],
    }),

    createKpiMetric: builder.mutation<{ data: KpiMetric }, Partial<KpiMetric>>({
      query: (body) => ({ url: "/kpi-metrics", method: "POST", body }),
      invalidatesTags: ["KpiMetrics"],
    }),

    updateKpiMetric: builder.mutation<
      { data: KpiMetric },
      { id: number; data: Partial<KpiMetric> }
    >({
      query: ({ id, data }) => ({
        url: `/kpi-metrics/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        "KpiMetrics",
        { type: "KpiMetrics", id },
      ],
    }),

    deleteKpiMetric: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/kpi-metrics/${id}`, method: "DELETE" }),
      invalidatesTags: ["KpiMetrics"],
    }),

    calculateKpi: builder.mutation<
      {
        kpi_code: string;
        current_value: number;
        target_value: number;
        status: string;
        achievement_percentage: number;
        last_calculated_at: string;
      },
      number
    >({
      query: (id) => ({ url: `/kpi-metrics/${id}/calculate`, method: "POST" }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ["KpiMetrics"],
    }),

    recalculateAllKpis: builder.mutation<{ data: any[] }, void>({
      query: () => ({ url: "/kpi-metrics/recalculate-all", method: "POST" }),
      invalidatesTags: ["KpiMetrics"],
    }),

    // ── Report Export ───────────────────────────────────────────────────────

    getExportHistory: builder.query<
      { data: ReportExecution[]; meta?: any },
      {
        reportId: number;
        per_page?: number;
      }
    >({
      query: ({ reportId, ...params }) => ({
        url: `/report-export/${reportId}/history`,
        params,
      }),
      transformResponse: normalizePaginator,
    }),
  }),
});

export const {
  // Saved Reports
  useGetReportsQuery,
  useGetReportQuery,
  useCreateReportMutation,
  useUpdateReportMutation,
  useDeleteReportMutation,
  useExecuteReportMutation,
  useGetExecutionHistoryQuery,

  // Pre-Built Reports
  useGetSalesSummaryQuery,
  useGetTopSellingProductsQuery,
  useGetInventoryStatusQuery,
  useGetCustomerAnalysisQuery,
  useGetEmployeePerformanceQuery,
  useGetFinancialSummaryQuery,

  // Dashboards
  useGetDashboardsQuery,
  useGetDashboardQuery,
  useCreateDashboardMutation,
  useUpdateDashboardMutation,
  useDeleteDashboardMutation,
  useAddWidgetMutation,
  useRemoveWidgetMutation,
  useUpdateWidgetMutation,

  // KPI Metrics
  useGetKpiMetricsQuery,
  useGetKpiSummaryQuery,
  useGetKpiMetricQuery,
  useCreateKpiMetricMutation,
  useUpdateKpiMetricMutation,
  useDeleteKpiMetricMutation,
  useCalculateKpiMutation,
  useRecalculateAllKpisMutation,

  // Export
  useGetExportHistoryQuery,
} = reportsApi;
