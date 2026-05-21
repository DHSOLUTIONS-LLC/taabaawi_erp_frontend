// src/services/hrApi.ts
import { api } from "./api";

/* ================= TYPES ================= */
export interface Category {
  id: number;
  category_name: string;
  parent_id: number | null;
  description?: string;
  image?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  parent?: Category | null;
  children?: Category[];
}

export interface CategoryResponse {
  success: boolean;
  data: {
    current_page: number;
    data: Category[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{ url: string | null; label: string; active: boolean }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

/* ================= API ENDPOINTS ================= */
export const hrApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET CATEGORIES
    getCategories: builder.query<any, void>({
      query: () => "/categories",

      transformResponse: (response: any) => {
        console.log("Categories API Response:", response);
        return response;
      },
    }),

    getEmployees: builder.query<any, void>({
      query: () => "/employees",
      transformResponse: (response: any) => response,
    }),

    getEmployeeById: builder.query<any, number>({
      query: (id) => `/employees/${id}`,
      transformResponse: (response: any) => response,
    }),

    getDashboardStatistics: builder.query<any, void>({
      query: () => `/dashboard/hr`,
      transformResponse: (response: any) => response,
    }),

    markAttendance: builder.mutation<any, any>({
      query: (attendanceData) => ({
        url: "/attendances",
        method: "POST",
        body: attendanceData,
      }),
      invalidatesTags: ["Attendance"],
    }),

    getAttendanceByDate: builder.query<
      any,
      {
        date?: string;
        branch_id?: number;
        page?: number;
        per_page?: number;
      }
    >({
      query: ({ date, branch_id, page = 1, per_page = 15 }) => {
        const params = new URLSearchParams();
        if (date) params.append("date", date);
        if (branch_id) params.append("branch_id", branch_id.toString());
        params.append("page", page.toString());
        params.append("per_page", per_page.toString());

        return `/attendances?${params.toString()}`;
      },
      providesTags: ["Attendance"],
    }),

    markBulkAttendance: builder.mutation<any, any[]>({
      query: (attendances) => ({
        url: "/attendances/bulk",
        method: "POST",
        body: { attendances },
      }),
    }),

    // Get all leave requests
    getLeaveRequests: builder.query<any, void>({
      query: () => "/leave-requests",
      transformResponse: (response: any) => response,
    }),

    // Get single leave request
    getLeaveRequestById: builder.query<any, number>({
      query: (id) => `/leave-requests/${id}`,
      transformResponse: (response: any) => response,
    }),

    // Approve leave request
    approveLeaveRequest: builder.mutation<any, number>({
      query: (id) => ({
        url: `/leave-requests/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["LeaveRequest"],
    }),

    // Reject leave request
    rejectLeaveRequest: builder.mutation<
      any,
      { id: number; rejection_reason?: string }
    >({
      query: ({ id, rejection_reason }) => ({
        url: `/leave-requests/${id}/reject`,
        method: "POST",
        body: { rejection_reason },
      }),
      invalidatesTags: ["LeaveRequest"],
    }),

    // Cancel leave request (employee side)
    cancelLeaveRequest: builder.mutation<any, number>({
      query: (id) => ({
        url: `/leave-requests/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: ["LeaveRequest"],
    }),

    // Get leave balance for a user
    getLeaveBalance: builder.query<any, number>({
      query: (userId) => `/leave-requests/user/${userId}/balance`,
      transformResponse: (response: any) => response,
    }),

    getBonuses: builder.query<any, void>({
      query: () => `/bonuses`,
      transformResponse: (response: any) => response,
    }),

    createEmployee: builder.mutation<any, any>({
      query: (employeeData) => ({
        url: "/employees",
        method: "POST",
        body: employeeData,
      }),
      invalidatesTags: ["Employee"],
    }),

    // Update employee HR info
    updateEmployeeHrInfo: builder.mutation<any, { id: number; data: any }>({
      query: ({ id, data }) => ({
        url: `/employees/${id}/hr-info`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Employee"],
    }),

    // Upload document
    uploadEmployeeDocument: builder.mutation<
      any,
      { employeeId: number; data: FormData }
    >({
      query: ({ data }) => ({
        url: "/employee-documents",
        method: "POST",
        body: data,
      }),
    }),

    // Get expiring documents (within 30 days)
    getExpiringDocuments: builder.query<any, void>({
      query: () => "/employee-documents/expiring",
      providesTags: ["EmployeeDocuments"],
    }),

    // Get expired documents
    getExpiredDocuments: builder.query<any, void>({
      query: () => "/employee-documents/expired",
      providesTags: ["EmployeeDocuments"],
    }),

    // Get employee documents
    getEmployeeDocuments: builder.query<any, number>({
      query: (employeeId) => `/employees/${employeeId}/documents`,
      transformResponse: (response: any) => response,
    }),

    // Delete document
    deleteEmployeeDocument: builder.mutation<any, number>({
      query: (id) => ({
        url: `/employee-documents/${id}`,
        method: "DELETE",
      }),
    }),

    getLeaveTypes: builder.query<any, void>({
      query: () => "/leave-types",
      transformResponse: (response: any) => response,
    }),

    createLeaveRequest: builder.mutation<any, any>({
      query: (data) => ({
        url: "/leave-requests",
        method: "POST",
        body: data,
      }),
    }),

    updateEmployee: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Employee"],
    }),

    createEmp: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/users`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Employee"],
    }),

    getUserById: builder.query<any, number>({
      query: (id) => `/users/${id}`,
      transformResponse: (response: any) => response,
    }),

    createBonus: builder.mutation<any, any>({
      query: (bonusData) => ({
        url: "/bonuses",
        method: "POST",
        body: bonusData,
      }),
      invalidatesTags: ["Bonus"],
    }),

    getBonusById: builder.query<any, number>({
      query: (id) => `/bonuses/${id}`,
      transformResponse: (response: any) => response,
    }),

    getUserBonusSummary: builder.query<any, number>({
      query: (userId) => `/bonuses/user/${userId}/summary`,
      transformResponse: (response: any) => response,
    }),

    updateBonus: builder.mutation<any, { id: number; data: any }>({
      query: ({ id, data }) => ({
        url: `/bonuses/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Bonus"],
    }),

    deleteBonus: builder.mutation<any, number>({
      query: (id) => ({
        url: `/bonuses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Bonus"],
    }),

    //payroll apis
    getPayrolls: builder.query<
      any,
      {
        user_id?: number;
        payroll_month?: string;
        status?: string;
        page?: number;
        per_page?: number;
      }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.user_id)
          queryParams.append("user_id", params.user_id.toString());
        if (params.payroll_month)
          queryParams.append("payroll_month", params.payroll_month);
        if (params.status) queryParams.append("status", params.status);
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.per_page)
          queryParams.append("per_page", params.per_page.toString());

        return `/payrolls?${queryParams.toString()}`;
      },
      transformResponse: (response: any) => response,
      providesTags: ["Payroll"],
    }),

    getPayrollById: builder.query<any, number>({
      query: (id) => `/payrolls/${id}`,
      transformResponse: (response: any) => response,
      providesTags: (result, error, id) => [{ type: "Payroll", id }],
    }),

    getPayrollStatistics: builder.query<any, { payroll_month?: string }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.payroll_month)
          queryParams.append("payroll_month", params.payroll_month);
        return `/payrolls/statistics?${queryParams.toString()}`;
      },
      transformResponse: (response: any) => response,
    }),

    generatePayroll: builder.mutation<
      any,
      { user_id: number; payroll_month: string }
    >({
      query: (data) => ({
        url: "/payrolls/generate",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Payroll"],
    }),

    generateBulkPayroll: builder.mutation<
      any,
      { payroll_month: string; branch_id?: number }
    >({
      query: (data) => ({
        url: "/payrolls/generate-bulk",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Payroll"],
    }),

    approvePayroll: builder.mutation<any, number>({
      query: (id) => ({
        url: `/payrolls/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Payroll", id }],
    }),

    markPayrollAsPaid: builder.mutation<
      any,
      { id: number; payment_date: string }
    >({
      query: ({ id, payment_date }) => ({
        url: `/payrolls/${id}/mark-paid`,
        method: "POST",
        body: { payment_date },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Payroll", id }],
    }),

    deletePayroll: builder.mutation<any, number>({
      query: (id) => ({
        url: `/payrolls/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Payroll"],
    }),
  }),
});

export const {
  useGetCategoriesQuery, //done
  useGetEmployeesQuery, //done
  useGetEmployeeByIdQuery, //done
  useGetDashboardStatisticsQuery, //done
  useMarkAttendanceMutation, //done
  useGetAttendanceByDateQuery, //done
  useMarkBulkAttendanceMutation,

  useGetLeaveRequestsQuery, //done
  useGetLeaveRequestByIdQuery, //done
  useApproveLeaveRequestMutation, //done
  useRejectLeaveRequestMutation, //done
  useCancelLeaveRequestMutation, //done
  useGetLeaveBalanceQuery, //done
  useCreateEmployeeMutation, //done
  useUpdateEmployeeHrInfoMutation, //done
  useUploadEmployeeDocumentMutation,
  useGetEmployeeDocumentsQuery, //......................
  useDeleteEmployeeDocumentMutation, //......................
  useGetLeaveTypesQuery, //done
  useCreateLeaveRequestMutation, //done
  useUpdateEmployeeMutation, //done
  useCreateEmpMutation, //done
  useGetUserByIdQuery, //done
  useGetBonusesQuery,
  useCreateBonusMutation,
  useGetBonusByIdQuery,
  useGetUserBonusSummaryQuery,
  useUpdateBonusMutation,
  useDeleteBonusMutation,
  useGetPayrollsQuery,
  useGetPayrollByIdQuery,
  useGetPayrollStatisticsQuery,
  useGeneratePayrollMutation,
  useGenerateBulkPayrollMutation,
  useApprovePayrollMutation,
  useMarkPayrollAsPaidMutation,
  useDeletePayrollMutation,
   useGetExpiringDocumentsQuery,
  useGetExpiredDocumentsQuery,
} = hrApi;
