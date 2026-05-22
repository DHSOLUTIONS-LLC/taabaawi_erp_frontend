// services/api.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../app/store";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;

      // Add auth token
      const token = state.auth.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }

      // Standard headers
      headers.set("Accept", "application/json");
      headers.set("Content-Type", "application/json");
      headers.set("ngrok-skip-browser-warning", "true");

      // ==================== BRANCH FILTERING LOGIC ====================
      const user = state.auth.user;

      if (user) {
        // Roles that can switch branches (see all data across branches)
        const canSwitchBranch = ["Super Admin", "Accountant"].includes(
          user.role?.role_name || "",
        );

        if (canSwitchBranch) {
          // For Super Admin/Accountant: use their selected branch from Redux
          const selectedBranchId = state.branch?.selectedBranchId;

          if (selectedBranchId !== null && selectedBranchId !== undefined) {
            // Specific branch selected
            headers.set("X-Branch-Id", String(selectedBranchId));
            console.log("x-branch-id", selectedBranchId);
          }
          // If null or undefined, don't set header = "All Branches" mode
        } else {
          // For branch-restricted users: always filter by their assigned branch
          if (user.branch_id) {
            headers.set("X-Branch-Id", String(user.branch_id));
          }
        }
      }
      // ================================================================

      return headers;
    },
  }),
  tagTypes: [
    "Roles",
    "Users",
    "Branches",
    "BranchUsers",
    "BranchStatistics",
    "DeletedBranches",
    "BranchTypes",
    "Permissions",
    "Staff",
    "Products",
    "Attendance",
    "Employee",
    "LeaveRequest",
    "Bonus",
    "Payroll",
    "POS",
    "ShiftReports",
    "Sales",
    "Returns",
    "Coupons",
    "Orders",
    "ShippingMethods",
    "Invoices",
    "Suppliers",
    "Currencies",
    "PurchaseOrders",
    "GoodsReceiptNotes",
    "PurchaseReturns",
    "SupplierPayments",
    "ChartOfAccounts",
    "JournalEntries",
    "BankAccounts",
    "BankTransactions",
    "AccountsPayable",
    "AccountsReceivable",
    "Budgets",
    "Customers",
    "CustomerStatistics",
    "LoyaltyStatistics",
    "CustomerDuplicates",
    "CustomerMergeHistory",
    "CustomerInteractions",
    "Loyalty",
    "Reports",
    "ReportExecutions",
    "Dashboards",
    "KpiMetrics",
    "HelpFaqs",
    "HelpArticles",
    "HelpCategories",
    "SystemSettings",
    "PaymentMethods",
    "Seo",
    "Sitemap",
    "Blog",
    "BlogCategories",
    "AIStatistics",
    "AILogs",
    "SecurityStats",
    "ActivityLogs",
    "LoginHistory",
    "SecurityAlerts",
    "UserSessions",
    "DeletedRecords",
    "ActivityLogStatistics",
    "ChangeHistory",
    "DeletedRecordStatistics",
    "SupplierReports",
    "Inventory",
    "TransferRequests",
    "EmployeeDocuments",
    "Expenses",
    "ExpenseStatistics",
    "ExpenseCategories",
    "BulkDiscounts",
    "LeavePlanner"
  ],
  endpoints: () => ({
    // Common endpoints will be injected by other API files
  }),
});
