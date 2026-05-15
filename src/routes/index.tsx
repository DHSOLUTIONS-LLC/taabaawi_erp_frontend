// src/app/router.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import LoginPage from "../features/auth/pages/LoginPage";
import AdminLoginPage from "../features/auth/pages/AdminLoginPage";
import DashboardPage from "../features/auth/pages/DashboardPage";
import AddStaff from "../features/auth/pages/AddStaff";
import CreateNewRole from "../features/auth/pages/CreateRole";
import ProfilePage from "../features/pages/ProfilePage";
import MyLeavesPage from "../features/pages/MyLeavesPage";
import LeaveRequestFormPage from "../features/pages/LeaveRequestFormPage";
import ReturnsPage from "../features/pos/pages/ReturnsPage";

// Inventory
import InventoryDashboardPage from "../features/inventory/pages/InventoryDashboardPage";
import CategoryPage from "../features/inventory/pages/CategoryPage";
import InventoryReportPage from "../features/inventory/pages/InventoryReportPage";

// POS
import POSTerminalPage from "../features/pos/pages/posTerminalPage";
import POSCashBoxPage from "../features/pos/pages/cashBoxPage";
import POSOrders from "../features/pos/pages/posOrdersPage";
import POSShiftReports from "../features/pos/pages/shiftReportsPage";
import OpenPOSPage from "../features/pos/pages/openPosPage";

// Sales

import OrdersPage from "../features/sales/pages/orders/OrdersPage";
import ShippingMethodsPage from "../features/sales/pages/ShippingMethodsPage";

// HR
import HRDashboard from "../features/hr/pages/HRDashboard";
import AddEmployee from "../features/hr/pages/AddEmployee";
import MarkAttendance from "../features/hr/pages/MarkAttendance";
import PreviewLeaveRequests from "../features/hr/pages/PreviewLeaveRequests";
import LeaveRequestDetails from "../features/hr/pages/LeaveRequestDetails";
import AddBonusesPage from "../features/hr/pages/AddBonuses";
import PayrollListPage from "../features/hr/pages/payrolls/PayrollListPage";
import GeneratePayrollPage from "../features/hr/pages/payrolls/GeneratePayrollPage";
import BulkGeneratePayrollPage from "../features/hr/pages/payrolls/BulkGeneratePayrollPage";
import PayrollDetailsPage from "../features/hr/pages/payrolls/PayrollDetailsPage";
import InvoicePage from "../features/sales/pages/invoices/InvoicesPage";
import SalesDashboard from "../features/sales/pages/SalesDashboard";
import CreateInvoice from "../features/sales/pages/invoices/CreateInvoice";
import InvoiceDetailPage from "../features/sales/pages/invoices/InvoiceDetails";
import AddInvoiceProducts from "../features/sales/pages/invoices/AddInvoiceProducts";
import EditInvoice from "../features/sales/pages/invoices/EditInvoice";
import OrderDetailPage from "../features/sales/pages/orders/Orderdetailpage";
import CreateOrderPage from "../features/sales/pages/orders/CreateOrderPage";
import AddOrderProducts from "../features/sales/pages/orders/AddOrderProducts";

import SupplierReportsPage from "../features/purchase/pages/suppliers/SupplierReportsPage";
import SuppliersPage from "../features/purchase/pages/suppliers/SuppliersPage";
import SupplierDetailPage from "../features/purchase/pages/suppliers/SupplierDetailPage";
import CurrenciesPage from "../features/purchase/pages/Currencies/CurrenciesPage";
import PurchaseOrdersPage from "../features/purchase/pages/PurchaseOrders/PurchaseOrdersPage";
import CreatePurchaseOrderPage from "../features/purchase/pages/PurchaseOrders/CreatePurchaseOrderPage";
import PurchaseOrderDetailPage from "../features/purchase/pages/PurchaseOrders/PurchaseOrderDetailPage";
import EditPurchaseOrderPage from "../features/purchase/pages/PurchaseOrders/EditPurchaseOrderPage";
import PendingApprovalsPage from "../features/purchase/pages/PurchaseOrders/PendingApprovalsPage";
import GoodsReceiptsPage from "../features/purchase/pages/GoodsReceiptNotes/GoodsReceiptsPage";
import CreateGoodsReceiptPage from "../features/purchase/pages/GoodsReceiptNotes/CreateGoodsReceiptPage";
import GoodsReceiptDetailPage from "../features/purchase/pages/GoodsReceiptNotes/GoodsReceiptDetailPage";
import PurchaseReturnsPage from "../features/purchase/pages/PurchaseReturns/PurchaseReturnsPage";
import CreatePurchaseReturnPage from "../features/purchase/pages/PurchaseReturns/CreatePurchaseReturnPage";
import PurchaseReturnDetailPage from "../features/purchase/pages/PurchaseReturns/PurchaseReturnDetailPage";
import SupplierPaymentsPage from "../features/purchase/pages/SupplierPayments/SupplierPaymentsPage";
import CreatePaymentPage from "../features/purchase/pages/SupplierPayments/CreatePaymentModal";
import PaymentDetailPage from "../features/purchase/pages/SupplierPayments/PaymentDetailPage";
import PurchaseDashboardPage from "../features/purchase/pages/PurchaseDashboard";
import AddPurchaseOrderProducts from "../features/purchase/pages/PurchaseOrders/EditPurchaseOrderPage";

// Accounting
import AccountingDashboardPage from "../features/accounting/pages/AccountingDashboard";
import ChartOfAccountsPage from "../features/accounting/pages/ChartsOfAccounts/ChartOfAccountsPage";
import AccountTreePage from "../features/accounting/pages/ChartsOfAccounts/AccountTreePage";
import CreateAccountPage from "../features/accounting/pages/ChartsOfAccounts/CreateAccountPage";
import AccountDetailPage from "../features/accounting/pages/ChartsOfAccounts/AccountDetailPage";
import EditAccountPage from "../features/accounting/pages/ChartsOfAccounts/EditAccountPage";
import JournalEntriesPage from "../features/accounting/pages/JournalEntries/JournalEntriesPage";
import CreateJournalEntryPage from "../features/accounting/pages/JournalEntries/CreateJournalEntryPage";
import JournalEntryDetailPage from "../features/accounting/pages/JournalEntries/JournalEntryDetailPage";
import EditJournalEntryPage from "../features/accounting/pages/JournalEntries/EditJournalEntryPage";
import BankAccountsPage from "../features/accounting/pages/BankAccounts/BankAccountsPage";
import CreateBankAccountPage from "../features/accounting/pages/BankAccounts/CreateBankAccountPage";
import BankAccountDetailPage from "../features/accounting/pages/BankAccounts/BankAccountDetailPage";
import BankStatementPage from "../features/accounting/pages/BankAccounts/BankStatementPage";
import BankReconciliationPage from "../features/accounting/pages/BankAccounts/BankReconciliationPage";
import AccountsPayablePage from "../features/accounting/pages/AccountsPayable/AccountsPayablePage";
import APDetailPage from "../features/accounting/pages/AccountsPayable/APDetailPage";
import APAgingReportPage from "../features/accounting/pages/AccountsPayable/APAgingReportPage";
import AccountsReceivablePage from "../features/accounting/pages/AccountsReceivable/AccountsReceivablePage";
import ARDetailPage from "../features/accounting/pages/AccountsReceivable/ARDetailPage";
import ARAgingReportPage from "../features/accounting/pages/AccountsReceivable/ARAgingReportPage";
import BudgetsPage from "../features/accounting/pages/Budgets/BudgetsPage";
import CreateBudgetPage from "../features/accounting/pages/Budgets/CreateBudgetPage";
import BudgetDetailPage from "../features/accounting/pages/Budgets/BudgetDetailPage";
import BudgetVsActualPage from "../features/accounting/pages/Budgets/BudgetVsActualPage";
// import TrialBalancePage from '../features/accounting/pages/FinancialReports/TrialBalancePage';
// import ProfitLossPage from '../features/accounting/pages/FinancialReports/ProfitLossPage';
// import BalanceSheetPage from '../features/accounting/pages/FinancialReports/BalanceSheetPage';
// import GeneralLedgerPage from '../features/accounting/pages/FinancialReports/GeneralLedgerPage';
// import CashFlowPage from '../features/accounting/pages/FinancialReports/CashFlowPage';
import EditBudgetPage from "../features/accounting/pages/Budgets/EditBudgetPage";
import CreateAPPage from "../features/accounting/pages/AccountsPayable/CreateAPPage";
import CreateARPage from "../features/accounting/pages/AccountsReceivable/CreateARPage";
import EditBankAccountPage from "../features/accounting/pages/BankAccounts/EditBankAccountPage";
import CreateBankTransactionPage from "../features/accounting/pages/BankAccounts/CreateBankTransactionPage";
import FinancialReportsPage from "../features/accounting/pages/FinancialReports/FinancialReportsPage";
import { CustomersPage } from "../features/crm/pages/CustomersPage";
import { CustomerProfilePage } from "../features/crm/pages/CustomerProfilePage";
import { LoyaltyPage } from "../features/crm/pages/LoyaltyPage";
import { DuplicatesPage } from "../features/crm/pages/DuplicatesPage";
import { CrmDashboard } from "../features/crm/pages/CrmDashboard";
import { ReportsDashboard } from "../features/reports/pages/ReportsDashboard";
import HelpSaved from "../features/help/pages/HelpSaved";
import HelpSearch from "../features/help/pages/HelpSearch";
import HelpDetail from "../features/help/pages/HelpDetail";
import HelpBrowse from "../features/help/pages/HelpBrowse";
import HelpDashboard from "../features/help/pages/HelpDashboard";
import HelpManagement from "../features/help/pages/admin/HelpManagement";
import FaqManager from "../features/help/pages/admin/FaqManager";
import CategoryManager from "../features/help/pages/admin/CategoryManager";
import ArticleManager from "../features/help/pages/admin/ArticleManager";

// System settings
import SystemSettingsPage from "../features/system/pages/SystemSettingsPage";
import PaymentMethodsPage from "../features/system/pages/PaymentMethodsPage";
import SEOPage from "../features/system/pages/SEOPage";
import BlogCreatePage from "../features/system/pages/posts/BlogCreatePage";
import BlogPage from "../features/system/pages/posts/BlogPage";
import BlogEditPage from "../features/system/pages/posts/BlogEditPage";
import BlogCategoriesPage from "../features/system/pages/posts/BlogCategoriesPage";
import BlogPostDetailPage from "../features/system/pages/posts/BlogPostDetailPage";

import AIContentDashboard from "../features/ai/pages/AIContentDashboard";
import SecurityCenterPage from "../features/security/pages/SecurityCenterPage";
import CreateNewBranch from "../features/branch/pages/CreateNewBranch";
import BranchesDashboard from "../features/branch/pages/BranchesDashboard";
import CouponsPage from "../features/pos/pages/CouponsPage";

// ---------------------------
// Helper functions
// ---------------------------
const getStoredUser = () => {
  const auth =
    localStorage.getItem("erp_auth") || localStorage.getItem("employee_auth");
  if (auth) {
    try {
      const parsed = JSON.parse(auth);
      return parsed.user;
    } catch {
      return null;
    }
  }
  return null;
};

const hasPermission = (requiredPermission: string) => {
  const user = getStoredUser();
  if (!user || !user.role || !user.role.permissions) return false;
  if (user.role.role_name === "Super Admin") return true;
  const permissions = user.role.permissions;
  return permissions.some(
    (p: any) =>
      p.permission_name === requiredPermission || p.name === requiredPermission,
  );
};

const getDefaultRouteByRole = (roleName: string): string => {
  switch (roleName) {
    case "Super Admin":
      return "/admin/dashboard";
    case "HR":
    case "HR Manager":
      return "/hr";
    case "Cashier":
      return "/pos";
    case "Inventory Manager":
      return "/inventory";
    case "Sales":
    case "Sales Manager":
      return "/sales";
    case "Branch Manager":
      return "/inventory";
    default:
      return "/dashboard";
  }
};

// ---------------------------
// Auth wrappers
// ---------------------------
const EmployeeProtectedRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const auth = localStorage.getItem("employee_auth");
  return auth ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = localStorage.getItem("erp_auth");
  return auth ? <>{children}</> : <Navigate to="/admin_login" replace />;
};

// ---------------------------
// Permission wrapper
// ---------------------------
interface PermissionRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
}

const PermissionRoute = ({
  children,
  requiredPermissions = [],
}: PermissionRouteProps) => {
  const user = getStoredUser();
  const role = user?.role;

  if (role?.role_name === "Super Admin") return <>{children}</>;
  if (requiredPermissions.length === 0) return <>{children}</>;

  const hasAccess = requiredPermissions.some((p) => hasPermission(p));
  if (!hasAccess)
    return (
      <Navigate to={getDefaultRouteByRole(role?.role_name || "")} replace />
    );

  return <>{children}</>;
};

// ---------------------------
// Router definition
// ---------------------------
export const router = createBrowserRouter([
  // Login pages
  { path: "/login", element: <LoginPage /> },
  { path: "/admin_login", element: <AdminLoginPage /> },

  // ─── Employee routes ─────────────────────────────────────────────
  {
    path: "/",
    element: (
      <EmployeeProtectedRoute>
        <AppLayout />
      </EmployeeProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Navigate
            to={getDefaultRouteByRole(getStoredUser()?.role?.role_name || "")}
            replace
          />
        ),
      },

      { path: "dashboard", element: <DashboardPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "my-leaves", element: <MyLeavesPage /> },
      { path: "my-leaves/request", element: <LeaveRequestFormPage /> },

      {
        path: "system",
        children: [
          {
            path: "settings",
            element: (
              <PermissionRoute requiredPermissions={[""]}>
                <SystemSettingsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "payment-methods",
            element: (
              <PermissionRoute requiredPermissions={[""]}>
                <PaymentMethodsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "seo",
            element: (
              <PermissionRoute requiredPermissions={[""]}>
                <SEOPage />
              </PermissionRoute>
            ),
          },
        ],
      },

      {
        path: "ai-content",
        element: (
          <PermissionRoute requiredPermissions={["view_ai_content"]}>
            <AIContentDashboard />
          </PermissionRoute>
        ),
      },

      {
        path: "blog",
        children: [
          {
            index: true,
            element: (
              <PermissionRoute requiredPermissions={["manage_blog"]}>
                <BlogPage />
              </PermissionRoute>
            ),
          },
          {
            path: "create",
            element: (
              <PermissionRoute requiredPermissions={["manage_blog"]}>
                <BlogCreatePage />
              </PermissionRoute>
            ),
          },
          {
            path: ":id",
            element: <BlogPostDetailPage />,
          },
          {
            path: ":id/edit",
            element: (
              <PermissionRoute requiredPermissions={["manage_blog"]}>
                <BlogEditPage />
              </PermissionRoute>
            ),
          },
          {
            path: "categories",
            element: (
              <PermissionRoute requiredPermissions={["manage_blog"]}>
                <BlogCategoriesPage />
              </PermissionRoute>
            ),
          },
        ],
      },

      {
        path: "security",
        element: (
          <PermissionRoute requiredPermissions={["view_security"]}>
            <SecurityCenterPage />
          </PermissionRoute>
        ),
      },

      // ── Sales ──────────────────────────────────────────────────────
      {
        path: "sales",
        children: [
          {
            index: true,
            element: (
              <PermissionRoute
                requiredPermissions={["process_sale", "view_sales"]}
              >
                <SalesDashboard />
              </PermissionRoute>
            ),
          },
          {
            path: "create_invoice",
            element: (
              <PermissionRoute
                requiredPermissions={["process_sale", "create_invoice"]}
              >
                <CreateInvoice />
              </PermissionRoute>
            ),
          },
          {
            path: "edit_invoice/:id",
            element: (
              <PermissionRoute
                requiredPermissions={["process_sale", "create_invoice"]}
              >
                <EditInvoice />
              </PermissionRoute>
            ),
          },
          {
            path: "invoice",
            element: (
              <PermissionRoute
                requiredPermissions={["process_sale", "create_invoice"]}
              >
                <InvoicePage />
              </PermissionRoute>
            ),
          },
          {
            path: "invoices/:id",
            element: (
              <PermissionRoute
                requiredPermissions={["process_sale", "create_invoice"]}
              >
                <InvoiceDetailPage />
              </PermissionRoute>
            ),
          },
          {
            path: "add_product",
            element: (
              <PermissionRoute requiredPermissions={["process_sale"]}>
                <AddInvoiceProducts />
              </PermissionRoute>
            ),
          },
          // ── NEW ──
          {
            path: "orders",
            element: (
              <PermissionRoute
                requiredPermissions={["process_sale", "view_sales"]}
              >
                <OrdersPage />
              </PermissionRoute>
            ),
          },
          {
            path: "orders/:id",
            element: (
              <PermissionRoute
                requiredPermissions={["process_sale", "view_sales"]}
              >
                <OrderDetailPage />
              </PermissionRoute>
            ),
          },
          {
            path: "create-order",
            element: (
              <PermissionRoute
                requiredPermissions={["process_sale", "create_invoice"]}
              >
                <CreateOrderPage />
              </PermissionRoute>
            ),
          },
          {
            path: "add_order_products",
            element: (
              <PermissionRoute
                requiredPermissions={["process_sale", "create_invoice"]}
              >
                <AddOrderProducts />
              </PermissionRoute>
            ),
          },
          {
            path: "shipping-methods",
            element: (
              <PermissionRoute
                requiredPermissions={["process_sale", "view_sales"]}
              >
                <ShippingMethodsPage />
              </PermissionRoute>
            ),
          },
        ],
      },

      // ── Purchase ──────────────────────────────────────────────────────
      {
        path: "purchase",
        children: [
          {
            index: true,
            element: (
              <PermissionRoute requiredPermissions={["view_purchase"]}>
                <PurchaseDashboardPage />
              </PermissionRoute>
            ),
          },
          // Suppliers
          {
            path: "suppliers_reports",
            element: (
              <PermissionRoute requiredPermissions={["view_purchase"]}>
                <SupplierReportsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "suppliers",
            element: (
              <PermissionRoute requiredPermissions={["view_purchase"]}>
                <SuppliersPage />
              </PermissionRoute>
            ),
          },
          {
            path: "suppliers/:id",
            element: (
              <PermissionRoute requiredPermissions={["view_purchase"]}>
                <SupplierDetailPage />
              </PermissionRoute>
            ),
          },
          // Currencies
          {
            path: "currencies",
            element: (
              <PermissionRoute requiredPermissions={["view_purchase"]}>
                <CurrenciesPage />
              </PermissionRoute>
            ),
          },
          // Purchase Orders
          {
            path: "orders",
            element: (
              <PermissionRoute requiredPermissions={["view_purchase"]}>
                <PurchaseOrdersPage />
              </PermissionRoute>
            ),
          },
          {
            path: "orders/create",
            element: (
              <PermissionRoute requiredPermissions={["create_purchase_order"]}>
                <CreatePurchaseOrderPage />
              </PermissionRoute>
            ),
          },
          {
            path: "orders/:id",
            element: (
              <PermissionRoute requiredPermissions={["view_purchase"]}>
                <PurchaseOrderDetailPage />
              </PermissionRoute>
            ),
          },
          {
            path: "orders/edit/:id",
            element: (
              <PermissionRoute requiredPermissions={["edit_purchase_order"]}>
                <EditPurchaseOrderPage />
              </PermissionRoute>
            ),
          },
          {
            path: "orders/add-products",
            element: (
              <PermissionRoute requiredPermissions={["create_purchase_order"]}>
                <AddPurchaseOrderProducts />
              </PermissionRoute>
            ),
          },
          {
            path: "pending-approvals",
            element: (
              <PermissionRoute requiredPermissions={["approve_purchase_order"]}>
                <PendingApprovalsPage />
              </PermissionRoute>
            ),
          },
          // Goods Receipts
          {
            path: "goods-receipts",
            element: (
              <PermissionRoute requiredPermissions={["receive_goods"]}>
                <GoodsReceiptsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "goods-receipts/create/:poId?",
            element: (
              <PermissionRoute requiredPermissions={["receive_goods"]}>
                <CreateGoodsReceiptPage />
              </PermissionRoute>
            ),
          },
          {
            path: "goods-receipts/:id",
            element: (
              <PermissionRoute requiredPermissions={["view_purchase"]}>
                <GoodsReceiptDetailPage />
              </PermissionRoute>
            ),
          },
          // Purchase Returns
          {
            path: "returns",
            element: (
              <PermissionRoute requiredPermissions={["create_return"]}>
                <PurchaseReturnsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "returns/create/:poId?",
            element: (
              <PermissionRoute requiredPermissions={["create_return"]}>
                <CreatePurchaseReturnPage />
              </PermissionRoute>
            ),
          },
          {
            path: "returns/:id",
            element: (
              <PermissionRoute requiredPermissions={["view_purchase"]}>
                <PurchaseReturnDetailPage />
              </PermissionRoute>
            ),
          },
          // Supplier Payments
          {
            path: "payments",
            element: (
              <PermissionRoute requiredPermissions={["make_payment"]}>
                <SupplierPaymentsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "payments/create/:poId?",
            element: (
              <PermissionRoute requiredPermissions={["make_payment"]}>
                <CreatePaymentPage />
              </PermissionRoute>
            ),
          },
          {
            path: "payments/:id",
            element: (
              <PermissionRoute requiredPermissions={["view_purchase"]}>
                <PaymentDetailPage />
              </PermissionRoute>
            ),
          },
        ],
      },

      // ── Accounting ────────────────────────────────────────────────────
      {
        path: "accounting",
        children: [
          // Dashboard
          {
            index: true,
            element: (
              <PermissionRoute requiredPermissions={["view_accounting"]}>
                <AccountingDashboardPage />
              </PermissionRoute>
            ),
          },
          // Chart of Accounts
          {
            path: "chart-of-accounts",
            element: (
              <PermissionRoute requiredPermissions={["view_accounting"]}>
                <ChartOfAccountsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "account-tree",
            element: (
              <PermissionRoute requiredPermissions={["view_accounting"]}>
                <AccountTreePage />
              </PermissionRoute>
            ),
          },
          {
            path: "chart-of-accounts/create",
            element: (
              <PermissionRoute requiredPermissions={["create_account"]}>
                <CreateAccountPage />
              </PermissionRoute>
            ),
          },
          {
            path: "chart-of-accounts/:id",
            element: (
              <PermissionRoute requiredPermissions={["view_accounting"]}>
                <AccountDetailPage />
              </PermissionRoute>
            ),
          },
          {
            path: "chart-of-accounts/edit/:id",
            element: (
              <PermissionRoute requiredPermissions={["edit_account"]}>
                <EditAccountPage />
              </PermissionRoute>
            ),
          },
          // Journal Entries
          {
            path: "journal-entries",
            element: (
              <PermissionRoute requiredPermissions={["view_accounting"]}>
                <JournalEntriesPage />
              </PermissionRoute>
            ),
          },
          {
            path: "journal-entries/create",
            element: (
              <PermissionRoute requiredPermissions={["create_journal_entry"]}>
                <CreateJournalEntryPage />
              </PermissionRoute>
            ),
          },
          {
            path: "journal-entries/:id",
            element: (
              <PermissionRoute requiredPermissions={["view_accounting"]}>
                <JournalEntryDetailPage />
              </PermissionRoute>
            ),
          },
          {
            path: "journal-entries/edit/:id",
            element: (
              <PermissionRoute requiredPermissions={["edit_journal_entry"]}>
                <EditJournalEntryPage />
              </PermissionRoute>
            ),
          },
          // Bank Accounts
          {
            path: "bank-accounts",
            element: (
              <PermissionRoute requiredPermissions={["view_accounting"]}>
                <BankAccountsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "bank-accounts/create",
            element: (
              <PermissionRoute requiredPermissions={["create_bank_account"]}>
                <CreateBankAccountPage />
              </PermissionRoute>
            ),
          },
          {
            path: "bank-accounts/:id/transactions/create",
            element: (
              <PermissionRoute requiredPermissions={["create_bank_account"]}>
                <CreateBankTransactionPage />
              </PermissionRoute>
            ),
          },
          {
            path: "bank-accounts/:id",
            element: (
              <PermissionRoute requiredPermissions={["view_accounting"]}>
                <BankAccountDetailPage />
              </PermissionRoute>
            ),
          },
          {
            path: "bank-accounts/:id/statement",
            element: (
              <PermissionRoute requiredPermissions={["view_accounting"]}>
                <BankStatementPage />
              </PermissionRoute>
            ),
          },
          {
            path: "bank-accounts/:id/reconcile",
            element: (
              <PermissionRoute requiredPermissions={["reconcile_bank"]}>
                <BankReconciliationPage />
              </PermissionRoute>
            ),
          },
          // Accounts Payable
          {
            path: "accounts-payable",
            element: (
              <PermissionRoute requiredPermissions={["view_accounting"]}>
                <AccountsPayablePage />
              </PermissionRoute>
            ),
          },
          {
            path: "accounts-payable/:id",
            element: (
              <PermissionRoute requiredPermissions={["view_accounting"]}>
                <APDetailPage />
              </PermissionRoute>
            ),
          },
          {
            path: "accounts-payable/aging-report",
            element: (
              <PermissionRoute requiredPermissions={["view_accounting"]}>
                <APAgingReportPage />
              </PermissionRoute>
            ),
          },
          // Accounts Receivable
          {
            path: "accounts-receivable",
            element: (
              <PermissionRoute requiredPermissions={["view_accounting"]}>
                <AccountsReceivablePage />
              </PermissionRoute>
            ),
          },
          {
            path: "accounts-receivable/:id",
            element: (
              <PermissionRoute requiredPermissions={["view_accounting"]}>
                <ARDetailPage />
              </PermissionRoute>
            ),
          },
          {
            path: "accounts-receivable/aging-report",
            element: (
              <PermissionRoute requiredPermissions={["view_accounting"]}>
                <ARAgingReportPage />
              </PermissionRoute>
            ),
          },
          // Budgets
          {
            path: "budgets",
            element: (
              <PermissionRoute requiredPermissions={["view_budgets"]}>
                <BudgetsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "budgets/create",
            element: (
              <PermissionRoute requiredPermissions={["create_budget"]}>
                <CreateBudgetPage />
              </PermissionRoute>
            ),
          },
          {
            path: "budgets/:id",
            element: (
              <PermissionRoute requiredPermissions={["view_budgets"]}>
                <BudgetDetailPage />
              </PermissionRoute>
            ),
          },
          {
            path: "budgets/edit/:id",
            element: (
              <PermissionRoute requiredPermissions={["view_budgets"]}>
                <EditBudgetPage />
              </PermissionRoute>
            ),
          },
          {
            path: "budgets/:id/budget-vs-actual",
            element: (
              <PermissionRoute requiredPermissions={["view_budgets"]}>
                <BudgetVsActualPage />
              </PermissionRoute>
            ),
          },
          {
            path: "financial-reports",
            element: (
              <PermissionRoute requiredPermissions={["view_reports"]}>
                <FinancialReportsPage />
              </PermissionRoute>
            ),
          },

          // {
          //   path: 'financial-reports/trial-balance',
          //   element: (
          //     <PermissionRoute requiredPermissions={['view_reports']}>
          //       <TrialBalancePage />
          //     </PermissionRoute>
          //   )
          // },
          // {
          //   path: 'financial-reports/profit-loss',
          //   element: (
          //     <PermissionRoute requiredPermissions={['view_reports']}>
          //       <ProfitLossPage />
          //     </PermissionRoute>
          //   )
          // },
          // {
          //   path: 'financial-reports/balance-sheet',
          //   element: (
          //     <PermissionRoute requiredPermissions={['view_reports']}>
          //       <BalanceSheetPage />
          //     </PermissionRoute>
          //   )
          // },
          // {
          //   path: 'financial-reports/general-ledger',
          //   element: (
          //     <PermissionRoute requiredPermissions={['view_reports']}>
          //       <GeneralLedgerPage />
          //     </PermissionRoute>
          //   )
          // },
          // {
          //   path: 'financial-reports/cash-flow',
          //   element: (
          //     <PermissionRoute requiredPermissions={['view_reports']}>
          //       <CashFlowPage />
          //     </PermissionRoute>
          //   )
          // },
        ],
      },

      // ── Inventory ──────────────────────────────────────────────────
      {
        path: "inventory",
        children: [
          {
            index: true,
            element: (
              <PermissionRoute requiredPermissions={["view_products"]}>
                <InventoryDashboardPage />
              </PermissionRoute>
            ),
          },
          {
            path: "dashboard",
            element: (
              <PermissionRoute requiredPermissions={["view_products"]}>
                <InventoryDashboardPage />
              </PermissionRoute>
            ),
          },
          {
            path: "reports",
            element: (
              <PermissionRoute requiredPermissions={["view_products"]}>
                <InventoryReportPage />
              </PermissionRoute>
            ),
          },
          {
            path: "categories",
            element: (
              <PermissionRoute requiredPermissions={["view_products"]}>
                <CategoryPage />
              </PermissionRoute>
            ),
          },
        ],
      },

      // ── POS ────────────────────────────────────────────────────────
      {
        path: "pos",
        children: [
          {
            index: true,
            element: (
              <PermissionRoute requiredPermissions={["access_pos"]}>
                <OpenPOSPage />
              </PermissionRoute>
            ),
          },
          {
            path: "terminal",
            element: (
              <PermissionRoute requiredPermissions={["access_pos"]}>
                <POSTerminalPage />
              </PermissionRoute>
            ),
          },
          {
            path: "cashbox",
            element: (
              <PermissionRoute requiredPermissions={["process_sale"]}>
                <POSCashBoxPage />
              </PermissionRoute>
            ),
          },
          {
            path: "orders",
            element: (
              <PermissionRoute requiredPermissions={["process_sale"]}>
                <POSOrders />
              </PermissionRoute>
            ),
          },
          {
            path: "shift_reports",
            element: (
              <PermissionRoute requiredPermissions={["process_sale"]}>
                <POSShiftReports />
              </PermissionRoute>
            ),
          },
          {
            path: "returns",
            element: (
              <PermissionRoute requiredPermissions={["process_sale"]}>
                <ReturnsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "coupon",
            element: (
              <PermissionRoute requiredPermissions={["process_sale"]}>
                <CouponsPage />
              </PermissionRoute>
            ),
          },
        ],
      },

      // ── HR ─────────────────────────────────────────────────────────
      {
        path: "hr",
        children: [
          {
            index: true,
            element: (
              <PermissionRoute requiredPermissions={["view_users"]}>
                <HRDashboard />
              </PermissionRoute>
            ),
          },
          {
            path: "add_employee",
            element: (
              <PermissionRoute requiredPermissions={["view_users"]}>
                <AddEmployee />
              </PermissionRoute>
            ),
          },
          {
            path: "mark_attendance",
            element: (
              <PermissionRoute requiredPermissions={["view_users"]}>
                <MarkAttendance />
              </PermissionRoute>
            ),
          },
          {
            path: "add_bonuses",
            element: (
              <PermissionRoute requiredPermissions={["view_users"]}>
                <AddBonusesPage />
              </PermissionRoute>
            ),
          },
          {
            path: "payrolls",
            element: (
              <PermissionRoute requiredPermissions={["view_users"]}>
                <PayrollListPage />
              </PermissionRoute>
            ),
          },
          {
            path: "payrolls/generate",
            element: (
              <PermissionRoute requiredPermissions={["view_users"]}>
                <GeneratePayrollPage />
              </PermissionRoute>
            ),
          },
          {
            path: "payrolls/generate-bulk",
            element: (
              <PermissionRoute requiredPermissions={["view_users"]}>
                <BulkGeneratePayrollPage />
              </PermissionRoute>
            ),
          },
          {
            path: "payrolls/:id",
            element: (
              <PermissionRoute requiredPermissions={["view_users"]}>
                <PayrollDetailsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "leave_requests",
            element: (
              <PermissionRoute requiredPermissions={["view_users"]}>
                <PreviewLeaveRequests />
              </PermissionRoute>
            ),
          },
          {
            path: "leave_requests/:id",
            element: (
              <PermissionRoute requiredPermissions={["view_users"]}>
                <LeaveRequestDetails />
              </PermissionRoute>
            ),
          },
          {
            path: "create_role",
            element: (
              <PermissionRoute requiredPermissions={["view_users"]}>
                <CreateNewRole />
              </PermissionRoute>
            ),
          },
          {
            path: "add_staff",
            element: (
              <PermissionRoute requiredPermissions={["view_users"]}>
                <AddStaff />
              </PermissionRoute>
            ),
          },
        ],
      },

      // ── HELP & USER MANUAL ─────────────────────────────────────────
      {
        path: "help",
        children: [
          {
            index: true,
            element: (
              <PermissionRoute requiredPermissions={["view_help"]}>
                <HelpDashboard />
              </PermissionRoute>
            ),
          },
          {
            path: "browse",
            element: (
              <PermissionRoute requiredPermissions={["view_help"]}>
                <HelpBrowse />
              </PermissionRoute>
            ),
          },
          {
            path: "category/:categoryId",
            element: (
              <PermissionRoute requiredPermissions={["view_help"]}>
                <HelpBrowse />
              </PermissionRoute>
            ),
          },
          {
            path: "module/:module",
            element: (
              <PermissionRoute requiredPermissions={["view_help"]}>
                <HelpBrowse />
              </PermissionRoute>
            ),
          },
          {
            path: "article/:slug",
            element: (
              <PermissionRoute requiredPermissions={["view_help"]}>
                <HelpDetail />
              </PermissionRoute>
            ),
          },
          {
            path: "faq/:id",
            element: (
              <PermissionRoute requiredPermissions={["view_help"]}>
                <HelpDetail />
              </PermissionRoute>
            ),
          },
          {
            path: "search",
            element: (
              <PermissionRoute requiredPermissions={["view_help"]}>
                <HelpSearch />
              </PermissionRoute>
            ),
          },
          {
            path: "saved",
            element: (
              <PermissionRoute requiredPermissions={["view_help"]}>
                <HelpSaved />
              </PermissionRoute>
            ),
          },
        ],
      },

      // ── Reports and business ─────────────────────────────────────────────────────────
      {
        path: "reports",
        children: [
          {
            index: true,
            element: <ReportsDashboard />,
          },
        ],
      },

      {
        path: "branches",
        children: [
          {
            index: true,
            element: (
              <PermissionRoute requiredPermissions={[""]}>
                <BranchesDashboard />
              </PermissionRoute>
            ),
          },
          {
            path: "new",
            element: (
              <PermissionRoute requiredPermissions={["view_customers"]}>
                <CreateNewBranch />
              </PermissionRoute>
            ),
          },
          {
            path: "edit/:id",
            element: (
              <PermissionRoute requiredPermissions={["view_customers"]}>
                <CreateNewBranch />
              </PermissionRoute>
            ),
          },
        ],
      },

      // ── CRM ─────────────────────────────────────────────────────────
      {
        path: "crm",
        children: [
          {
            index: true,
            element: (
              <PermissionRoute requiredPermissions={["view_customers"]}>
                <CrmDashboard />
              </PermissionRoute>
            ),
          },
          {
            index: true,
            element: (
              <PermissionRoute requiredPermissions={["view_customers"]}>
                <CustomersPage />
              </PermissionRoute>
            ),
          },
          {
            path: "customers",
            element: (
              <PermissionRoute requiredPermissions={["view_customers"]}>
                <CustomersPage />
              </PermissionRoute>
            ),
          },
          {
            path: "customers/:id",
            element: (
              <PermissionRoute requiredPermissions={["view_customers"]}>
                <CustomerProfilePage />
              </PermissionRoute>
            ),
          },
          {
            path: "loyalty",
            element: (
              <PermissionRoute requiredPermissions={["view_loyalty"]}>
                <LoyaltyPage />
              </PermissionRoute>
            ),
          },
          {
            path: "duplicates",
            element: (
              <PermissionRoute requiredPermissions={["manage_customers"]}>
                <DuplicatesPage />
              </PermissionRoute>
            ),
          },
        ],
      },
    ],
  },

  // ─── Admin routes (Super Admin only) ─────────────────────────────
  {
    path: "/admin",
    element: (
      <AdminProtectedRoute>
        <AppLayout />
      </AdminProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },

      {
        path: "system",
        children: [
          { path: "settings", element: <SystemSettingsPage /> },
          { path: "payment-methods", element: <PaymentMethodsPage /> },
          { path: "seo", element: <SEOPage /> },
        ],
      },

      {
        path: "ai-content",
        element: <AIContentDashboard />,
      },

      {
        path: "blog",
        children: [
          { index: true, element: <BlogPage /> },
          { path: "create", element: <BlogCreatePage /> },
          { path: ":id", element: <BlogPostDetailPage /> },
          { path: ":id/edit", element: <BlogEditPage /> },
          { path: "categories", element: <BlogCategoriesPage /> },
        ],
      },

      {
        path: "security",
        element: <SecurityCenterPage />,
      },

      

      {
        path: "branches",
        children: [
          { index: true, element: <BranchesDashboard /> },
          { path: "new", element: <CreateNewBranch /> },
          { path: "edit/:id", element: <CreateNewBranch /> },
        ],
      },

      // ── Admin Sales ────────────────────────────────────────────────
      {
        path: "sales",
        children: [
          { index: true, element: <SalesDashboard /> },
          { path: "invoices", element: <InvoicePage /> },
          { path: "invoices/:id", element: <InvoiceDetailPage /> },
          { path: "create_invoice", element: <CreateInvoice /> },
          { path: "edit_invoice/:id", element: <EditInvoice /> },
          { path: "add_product", element: <AddInvoiceProducts /> },
          // ── NEW ──
          { path: "orders", element: <OrdersPage /> },
          { path: "orders/:id", element: <OrderDetailPage /> },
          { path: "create-order", element: <CreateOrderPage /> },
          { path: "add_order_products", element: <AddOrderProducts /> },
          { path: "shipping-methods", element: <ShippingMethodsPage /> },
        ],
      },

      // Inside the sales children array, add:
      {
        path: "purchase",
        children: [
          { path: "", element: <PurchaseDashboardPage /> },
          { path: "suppliers_reports", element: <SupplierReportsPage /> },
          { path: "suppliers", element: <SuppliersPage /> },
          { path: "suppliers/:id", element: <SupplierDetailPage /> },
          { path: "currencies", element: <CurrenciesPage /> },
          { path: "orders", element: <PurchaseOrdersPage /> },
          { path: "orders/create", element: <CreatePurchaseOrderPage /> },
          { path: "orders/:id", element: <PurchaseOrderDetailPage /> },
          { path: "orders/edit/:id", element: <EditPurchaseOrderPage /> },
          {
            path: "orders/add-products",
            element: <AddPurchaseOrderProducts />,
          },
          { path: "pending-approvals", element: <PendingApprovalsPage /> },
          { path: "goods-receipts", element: <GoodsReceiptsPage /> },
          {
            path: "goods-receipts/create/:poId?",
            element: <CreateGoodsReceiptPage />,
          },
          { path: "goods-receipts/:id", element: <GoodsReceiptDetailPage /> },
          { path: "returns", element: <PurchaseReturnsPage /> },
          {
            path: "returns/create/:poId?",
            element: <CreatePurchaseReturnPage />,
          },
          { path: "returns/:id", element: <PurchaseReturnDetailPage /> },
          { path: "payments", element: <SupplierPaymentsPage /> },
          { path: "payments/create/:poId?", element: <CreatePaymentPage /> },
          { path: "payments/:id", element: <PaymentDetailPage /> },
        ],
      },

      // ── Admin Accounting ─────────────────────────────────────────────
      {
        path: "accounting",
        children: [
          { index: true, element: <AccountingDashboardPage /> },
          // Chart of Accounts
          { path: "chart-of-accounts", element: <ChartOfAccountsPage /> },
          { path: "account-tree", element: <AccountTreePage /> },
          { path: "chart-of-accounts/create", element: <CreateAccountPage /> },
          { path: "chart-of-accounts/:id", element: <AccountDetailPage /> },
          { path: "chart-of-accounts/edit/:id", element: <EditAccountPage /> },
          // Journal Entries
          { path: "journal-entries", element: <JournalEntriesPage /> },
          {
            path: "journal-entries/create",
            element: <CreateJournalEntryPage />,
          },
          { path: "journal-entries/:id", element: <JournalEntryDetailPage /> },
          {
            path: "journal-entries/edit/:id",
            element: <EditJournalEntryPage />,
          },
          // Bank Accounts
          { path: "bank-accounts", element: <BankAccountsPage /> },
          { path: "bank-accounts/create", element: <CreateBankAccountPage /> },
          {
            path: "bank-accounts/:id/transactions/create",
            element: <CreateBankTransactionPage />,
          },
          { path: "bank-accounts/edit/:id", element: <EditBankAccountPage /> },
          { path: "bank-accounts/:id", element: <BankAccountDetailPage /> },
          {
            path: "bank-accounts/:id/statement",
            element: <BankStatementPage />,
          },
          {
            path: "bank-accounts/:id/reconcile",
            element: <BankReconciliationPage />,
          },
          // Accounts Payable
          { path: "accounts-payable", element: <AccountsPayablePage /> },
          { path: "accounts-payable/create", element: <CreateAPPage /> },
          { path: "accounts-payable/:id", element: <APDetailPage /> },
          {
            path: "accounts-payable/aging-report",
            element: <APAgingReportPage />,
          },
          // Accounts Receivable
          { path: "accounts-receivable", element: <AccountsReceivablePage /> },
          { path: "accounts-receivable/create", element: <CreateARPage /> },
          { path: "accounts-receivable/:id", element: <ARDetailPage /> },
          {
            path: "accounts-receivable/aging-report",
            element: <ARAgingReportPage />,
          },
          // Budgets
          { path: "budgets", element: <BudgetsPage /> },
          { path: "budgets/create", element: <CreateBudgetPage /> },
          { path: "budgets/:id", element: <BudgetDetailPage /> },
          { path: "budgets/edit/:id", element: <EditBudgetPage /> },
          {
            path: "budgets/:id/budget-vs-actual",
            element: <BudgetVsActualPage />,
          },
          // Financial Reports
          { path: "financial-reports", element: <FinancialReportsPage /> },
          // { path: 'financial-reports/profit-loss', element: <ProfitLossPage /> },
          // { path: 'financial-reports/balance-sheet', element: <BalanceSheetPage /> },
          // { path: 'financial-reports/general-ledger', element: <GeneralLedgerPage /> },
          // { path: 'financial-reports/cash-flow', element: <CashFlowPage /> },
        ],
      },

      // ── Admin Inventory ────────────────────────────────────────────
      {
        path: "inventory",
        children: [
          { index: true, element: <InventoryDashboardPage /> },
          { path: "dashboard", element: <InventoryDashboardPage /> },
          { path: "reports", element: <InventoryReportPage /> },
          { path: "categories", element: <CategoryPage /> },
        ],
      },

      // ── Admin POS ──────────────────────────────────────────────────
      {
        path: "pos",
        children: [
          { index: true, element: <OpenPOSPage /> },
          { path: "terminal", element: <POSTerminalPage /> },
          { path: "cashbox", element: <POSCashBoxPage /> },
          { path: "orders", element: <POSOrders /> },
          { path: "shift_reports", element: <POSShiftReports /> },
          { path: "returns", element: <ReturnsPage /> },
          { path: "coupon", element: <CouponsPage /> },
        ],
      },

      // ── Admin HR ───────────────────────────────────────────────────
      {
        path: "hr",
        children: [
          { index: true, element: <HRDashboard /> },
          { path: "add_employee", element: <AddEmployee /> },
          { path: "mark_attendance", element: <MarkAttendance /> },
          { path: "add_bonuses", element: <AddBonusesPage /> },
          { path: "leave_requests", element: <PreviewLeaveRequests /> },
          { path: "leave_requests/:id", element: <LeaveRequestDetails /> },
          { path: "add_staff", element: <AddStaff /> },
          { path: "create_role", element: <CreateNewRole /> },
          { path: "payrolls", element: <PayrollListPage /> },
          { path: "payrolls/generate", element: <GeneratePayrollPage /> },
          {
            path: "payrolls/generate-bulk",
            element: <BulkGeneratePayrollPage />,
          },
          { path: "payrolls/:id", element: <PayrollDetailsPage /> },
        ],
      },

      // ── Admin HR ───────────────────────────────────────────────────
      {
        path: "crm",
        children: [
          { index: true, element: <CrmDashboard /> },
          { path: "loyalty", element: <LoyaltyPage /> },
          { path: "customers", element: <CustomersPage /> },
          { path: "customers/:id", element: <CustomerProfilePage /> },
          { path: "duplicates", element: <DuplicatesPage /> },
        ],
      },

      // ── Admin Help ────────────────────────────────────────────────
      {
        path: "help",
        children: [
          { index: true, element: <HelpDashboard /> },
          { path: "browse", element: <HelpBrowse /> },
          { path: "category/:categoryId", element: <HelpBrowse /> },
          { path: "module/:module", element: <HelpBrowse /> },
          { path: "article/:slug", element: <HelpDetail /> },
          { path: "faq/:id", element: <HelpDetail /> },
          { path: "search", element: <HelpSearch /> },
          { path: "saved", element: <HelpSaved /> },
          { path: "management", element: <HelpManagement /> },
          { path: "categories", element: <CategoryManager /> },
          { path: "articles", element: <ArticleManager /> },
          { path: "faqs", element: <FaqManager /> },
        ],
      },

      {
        path: "reports",
        children: [{ index: true, element: <ReportsDashboard /> }],
      },
    ],
  },

  // Catch all
  { path: "*", element: <Navigate to="/" replace /> },
]);
