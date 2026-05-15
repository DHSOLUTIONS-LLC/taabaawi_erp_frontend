import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { SavedReport, KpiMetric } from "../../services/reportsApi";

interface ReportsState {
  activeTab: "overview" | "saved" | "kpis";

  reportFilters: {
    search: string;
    report_type: string;
    visibility: string;
    page: number;
    per_page: number;
  };

  kpiFilters: {
    kpi_category: string;
    page: number;
    per_page: number;
  };

  // Pre-built report date ranges
  preBuiltDates: {
    start_date: string;
    end_date: string;
  };

  // Modal state
  isReportModalOpen: boolean;
  reportModalMode: "create" | "edit";
  selectedReport: SavedReport | null;

  isKpiModalOpen: boolean;
  kpiModalMode: "create" | "edit";
  selectedKpi: KpiMetric | null;

  // Report execution result (shown inline)
  executionResult: {
    reportId: number | null;
    data: any[];
    summary: any;
    records_count: number;
    execution_time_ms: number;
  } | null;
}

const initialState: ReportsState = {
  activeTab: "overview",

  reportFilters: {
    search: "",
    report_type: "",
    visibility: "",
    page: 1,
    per_page: 15,
  },

  kpiFilters: {
    kpi_category: "",
    page: 1,
    per_page: 15,
  },

  preBuiltDates: {
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  },

  isReportModalOpen: false,
  reportModalMode: "create",
  selectedReport: null,

  isKpiModalOpen: false,
  kpiModalMode: "create",
  selectedKpi: null,

  executionResult: null,
};

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<ReportsState["activeTab"]>) => {
      state.activeTab = action.payload;
    },

    setReportFilters: (
      state,
      action: PayloadAction<Partial<ReportsState["reportFilters"]>>,
    ) => {
      state.reportFilters = { ...state.reportFilters, ...action.payload };
    },
    resetReportFilters: (state) => {
      state.reportFilters = initialState.reportFilters;
    },

    setKpiFilters: (
      state,
      action: PayloadAction<Partial<ReportsState["kpiFilters"]>>,
    ) => {
      state.kpiFilters = { ...state.kpiFilters, ...action.payload };
    },

    setPreBuiltDates: (
      state,
      action: PayloadAction<Partial<ReportsState["preBuiltDates"]>>,
    ) => {
      state.preBuiltDates = { ...state.preBuiltDates, ...action.payload };
    },

    openReportModal: (
      state,
      action: PayloadAction<{ mode: "create" | "edit"; report?: SavedReport }>,
    ) => {
      state.isReportModalOpen = true;
      state.reportModalMode = action.payload.mode;
      state.selectedReport = action.payload.report ?? null;
    },
    closeReportModal: (state) => {
      state.isReportModalOpen = false;
      state.selectedReport = null;
    },

    openKpiModal: (
      state,
      action: PayloadAction<{ mode: "create" | "edit"; kpi?: KpiMetric }>,
    ) => {
      state.isKpiModalOpen = true;
      state.kpiModalMode = action.payload.mode;
      state.selectedKpi = action.payload.kpi ?? null;
    },
    closeKpiModal: (state) => {
      state.isKpiModalOpen = false;
      state.selectedKpi = null;
    },

    setExecutionResult: (
      state,
      action: PayloadAction<ReportsState["executionResult"]>,
    ) => {
      state.executionResult = action.payload;
    },
    clearExecutionResult: (state) => {
      state.executionResult = null;
    },
  },
});

export const {
  setActiveTab,
  setReportFilters,
  resetReportFilters,
  setKpiFilters,
  setPreBuiltDates,
  openReportModal,
  closeReportModal,
  openKpiModal,
  closeKpiModal,
  setExecutionResult,
  clearExecutionResult,
} = reportsSlice.actions;

export default reportsSlice.reducer;
