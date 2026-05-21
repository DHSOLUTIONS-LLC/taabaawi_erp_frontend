// src/features/accounting/pages/ExpensesManagementPage.tsx
import { useState } from "react";
import DashboardLayout from "../../../../layouts/DashboardLayout";
import {
  useGetExpensesQuery,
  useDeleteExpenseMutation,
  useApproveExpenseMutation,
  useRejectExpenseMutation,
  useMarkExpenseAsPaidMutation,
  useGetExpenseCategoriesQuery,
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,
  useGetExpenseStatisticsQuery,
  useGetExpenseSummaryQuery,
} from "../../../../services/accountingApi";
import { useGetBranchesQuery } from "../../../../services/superAdminApi";
import CreateExpenseModal from "../../components/CreateExpenseModal";

import search_icon from "../../../../assets/icons/search_icon.svg";
import add_icon from "../../../../assets/icons/add.svg";
import delete_icon from "../../../../assets/icons/delete-icon.png";
import refresh_icon from "../../../../assets/icons/refresh_icon.png";
import dropdown_arrow_icon from "../../../../assets/icons/dropdown_arrow_icon.svg";
import edit_icon from "../../../../assets/icons/edit_icon.svg";

type ExpenseStatus = "Pending" | "Approved" | "Rejected" | "Paid";
type ActiveTab = "expenses" | "categories" | "reports";

const STATUS_COLORS: Record<ExpenseStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-blue-100 text-blue-700",
  Rejected: "bg-red-100 text-red-700",
  Paid: "bg-green-100 text-green-700",
};

const TABS = [
  { id: "expenses" as const, label: "All Expenses", icon: "📋" },
  { id: "categories" as const, label: "Categories", icon: "🏷️" },
  { id: "reports" as const, label: "Reports", icon: "📊" },
];

// Category Modal Component
interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  category?: any;
  isEditing?: boolean;
}

function CategoryModal({
  isOpen,
  onClose,
  onSave,
  category,
  isEditing,
}: CategoryModalProps) {
  const [categoryName, setCategoryName] = useState(
    category?.category_name || "",
  );
  const [categoryCode, setCategoryCode] = useState(
    category?.category_code || "",
  );
  const [description, setDescription] = useState(category?.description || "");
  const [isActive, setIsActive] = useState(category?.is_active !== false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!categoryName.trim() || !categoryCode.trim()) {
      alert("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        category_name: categoryName,
        category_code: categoryCode,
        description,
        is_active: isActive,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? "Edit Category" : "New Category"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Tea, Water, Cleaning"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Code *
              </label>
              <input
                type="text"
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., TEA, WTR, CLN"
                maxLength={10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label className="text-sm text-gray-700">Active</label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isEditing ? (
                "Update"
              ) : (
                "Create"
              )}
            </button>{" "}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExpensesManagementPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("expenses");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [reportStartDate, setReportStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
  );
  const [reportEndDate, setReportEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [reportSelectedBranch, setReportSelectedBranch] = useState<string>("");
  const [reportSelectedCategory, setReportSelectedCategory] =
    useState<string>("");
  const [groupBy, setGroupBy] = useState<
    "category" | "branch" | "month" | "payment_method"
  >("category");
  const [isApproving, setIsApproving] = useState<number | null>(null);
  const [isRejecting, setIsRejecting] = useState<number | null>(null);
  const [isPaying, setIsPaying] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // Fetch data for Expenses tab
  const {
    data: expensesData,
    isLoading: expensesLoading,
    refetch: refetchExpenses,
  } = useGetExpensesQuery({
    status: selectedStatus || undefined,
    expense_category_id: selectedCategory
      ? parseInt(selectedCategory)
      : undefined,
    branch_id: selectedBranch ? parseInt(selectedBranch) : undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    page: currentPage,
    per_page: 20,
  });

  // Fetch data for Categories tab
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useGetExpenseCategoriesQuery({ is_active: true });
  const [createCategory] = useCreateExpenseCategoryMutation();
  const [updateCategory] = useUpdateExpenseCategoryMutation();
  const [deleteCategory] = useDeleteExpenseCategoryMutation();

  // Fetch data for Reports tab
  const { data: statsData, isLoading: statsLoading } =
    useGetExpenseStatisticsQuery({
      start_date: reportStartDate,
      end_date: reportEndDate,
      branch_id: reportSelectedBranch
        ? parseInt(reportSelectedBranch)
        : undefined,
    });
  const { data: summaryData, isLoading: summaryLoading } =
    useGetExpenseSummaryQuery({
      start_date: reportStartDate,
      end_date: reportEndDate,
      branch_id: reportSelectedBranch
        ? parseInt(reportSelectedBranch)
        : undefined,
      expense_category_id: reportSelectedCategory
        ? parseInt(reportSelectedCategory)
        : undefined,
      group_by: groupBy,
    });

  // Common data
  const { data: branchesData } = useGetBranchesQuery();
  const [deleteExpense] = useDeleteExpenseMutation();
  const [approveExpense] = useApproveExpenseMutation();
  const [rejectExpense] = useRejectExpenseMutation();
  const [markAsPaid] = useMarkExpenseAsPaidMutation();

  const expenses = expensesData?.data?.data || [];
  const pagination = expensesData?.data;
  const categories = categoriesData?.data || [];
  const branches = Array.isArray(branchesData) ? branchesData : [];
  const stats = statsData?.data;
  const summary = summaryData?.data;

  const groupByOptions = [
    { value: "category", label: "By Category" },
    { value: "branch", label: "By Branch" },
    { value: "month", label: "By Month" },
    { value: "payment_method", label: "By Payment Method" },
  ];

  // Expense Actions
  const handleDeleteExpense = async (id: number) => {
    if (confirm("Delete this expense?")) {
      await deleteExpense(id).unwrap();
      refetchExpenses();
    }
  };

  const handleApprove = async (id: number) => {
    setIsApproving(id);
    try {
      await approveExpense({ id }).unwrap();
      refetchExpenses();
    } finally {
      setIsApproving(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt("Enter rejection reason:");
    if (reason) {
      setIsRejecting(id);
      try {
        await rejectExpense({ id, approval_notes: reason }).unwrap();
        refetchExpenses();
      } finally {
        setIsRejecting(null);
      }
    }
  };

  const handleMarkPaid = async (id: number) => {
    setIsPaying(id);
    try {
      await markAsPaid(id).unwrap();
      refetchExpenses();
    } finally {
      setIsPaying(null);
    }
  };

  // Category Actions
  const handleCreateCategory = async (formData: any) => {
    await createCategory(formData).unwrap();
    setShowCategoryModal(false);
    refetchCategories();
  };

  const handleUpdateCategory = async (formData: any) => {
    await updateCategory({ id: editingCategory.id, data: formData }).unwrap();
    setEditingCategory(null);
    setShowCategoryModal(false);
    refetchCategories();
  };

  const handleDeleteCategory = async (id: number) => {
    if (
      confirm(
        "Delete this category? Expenses with this category will not be deleted.",
      )
    ) {
      setDeletingId(id);
      await deleteCategory(id).unwrap();
      refetchCategories();
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("");
    setSelectedCategory("");
    setSelectedBranch("");
    setStartDate("");
    setEndDate("");
  };

  const clearReportFilters = () => {
    setReportSelectedBranch("");
    setReportSelectedCategory("");
    setGroupBy("category");
  };

  // Render Expenses Tab
  const renderExpensesTab = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <img src={search_icon} alt="" className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by vendor or invoice number..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative w-full md:w-40">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white pr-10 text-sm"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Paid">Paid</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
            </div>
          </div>
          <div className="relative w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white pr-10 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
            </div>
          </div>
          <div className="relative w-full md:w-48">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white pr-10 text-sm"
            >
              <option value="">All Branches</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.branch_name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
            </div>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          />
          {(searchQuery ||
            selectedStatus ||
            selectedCategory ||
            selectedBranch ||
            startDate ||
            endDate) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
        {expensesLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No expenses found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Expense #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((expense: any) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-blue-600">
                      {expense.expense_number}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {expense.category?.category_name || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {expense.vendor_name || "—"}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold">
                      KWD {parseFloat(expense.amount_kwd).toFixed(3)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[expense.status as ExpenseStatus]}`}
                      >
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {expense.status === "Pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(expense.id)}
                              disabled={isApproving === expense.id}
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                            >
                              {isApproving === expense.id ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                "Approve"
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(expense.id)}
                              disabled={isRejecting === expense.id}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                            >
                              {isRejecting === expense.id ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                "Reject"
                              )}
                            </button>
                          </>
                        )}
                        {expense.status === "Approved" && (
                          <button
                            onClick={() => handleMarkPaid(expense.id)}
                            disabled={isPaying === expense.id}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                          >
                            {isPaying === expense.id ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              "Mark Paid"
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          disabled={isDeleting === expense.id}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
                        >
                          {isDeleting === expense.id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <img src={delete_icon} alt="" className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-sm text-gray-500">
            Page {pagination.current_page} of {pagination.last_page}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(pagination.last_page, p + 1))
              }
              disabled={currentPage === pagination.last_page}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Render Categories Tab
  const renderCategoriesTab = () => (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3 className="text-base font-semibold">Expense Categories</h3>
        <button
          onClick={() => {
            setEditingCategory(null);
            setShowCategoryModal(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <img src={add_icon} alt="" className="w-3 h-3" /> New Category
        </button>
      </div>
      {categoriesLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No expense categories found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                  Category Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                  Description
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((cat: any) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono">
                    {cat.category_code}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {cat.category_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {cat.description || "—"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${cat.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {cat.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setShowCategoryModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <img src={edit_icon} alt="" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        disabled={deletingId === cat.id}
                        className="text-red-600 hover:text-red-800"
                      >
                        <img src={delete_icon} alt="" className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Render Reports Tab
  const renderReportsTab = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="date"
            value={reportStartDate}
            onChange={(e) => setReportStartDate(e.target.value)}
            className="px-4 py-2.5 border rounded-lg text-sm"
          />
          <input
            type="date"
            value={reportEndDate}
            onChange={(e) => setReportEndDate(e.target.value)}
            className="px-4 py-2.5 border rounded-lg text-sm"
          />
          <select
            value={reportSelectedBranch}
            onChange={(e) => setReportSelectedBranch(e.target.value)}
            className="px-4 py-2.5 border rounded-lg appearance-none bg-white pr-8"
          >
            <option value="">All Branches</option>
            {branches.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.branch_name}
              </option>
            ))}
          </select>
          <select
            value={reportSelectedCategory}
            onChange={(e) => setReportSelectedCategory(e.target.value)}
            className="px-4 py-2.5 border rounded-lg appearance-none bg-white pr-8"
          >
            <option value="">All Categories</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.category_name}
              </option>
            ))}
          </select>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as any)}
            className="px-4 py-2.5 border rounded-lg appearance-none bg-white pr-8"
          >
            {groupByOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {(reportSelectedBranch || reportSelectedCategory) && (
            <button
              onClick={clearReportFilters}
              className="px-4 py-2.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats?.total_count || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-blue-600">
            KWD {stats?.total_amount || "0.000"}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border">
          <p className="text-sm text-gray-500">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600">
            KWD {stats?.pending_amount || "0.000"}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border">
          <p className="text-sm text-gray-500">Paid Expenses</p>
          <p className="text-2xl font-bold text-green-600">
            KWD {stats?.paid_amount || "0.000"}
          </p>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-base font-semibold">
            Expense Summary (
            {groupByOptions.find((o) => o.value === groupBy)?.label})
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(reportStartDate).toLocaleDateString()} -{" "}
            {new Date(reportEndDate).toLocaleDateString()}
          </p>
        </div>
        {summaryLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {summary?.summary?.[0] &&
                    Object.keys(summary.summary[0]).map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                      >
                        {key.replace(/_/g, " ")}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {summary?.summary?.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {Object.values(item).map((val: any, i: number) => (
                      <td key={i} className="px-6 py-3 text-sm">
                        {typeof val === "number"
                          ? `KWD ${val.toFixed(3)}`
                          : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-blue-600">
              KWD {summary?.total_amount || "0.000"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Expense Management
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Track and manage company expenses (tea, water, cleaning,
              stationery, etc.)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <img src={refresh_icon} alt="" className="w-4 h-4" />
            </button>
            {activeTab === "expenses" && (
              <button
                onClick={() => {
                  setSelectedExpense(null);
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <img src={add_icon} alt="" className="w-4 h-4" /> New Expense
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "expenses" && renderExpensesTab()}
        {activeTab === "categories" && renderCategoriesTab()}
        {activeTab === "reports" && renderReportsTab()}
      </div>

      {/* Create/Edit Expense Modal */}
      {showCreateModal && (
        <CreateExpenseModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetchExpenses();
          }}
          expense={selectedExpense}
          categories={categories}
          branches={branches}
        />
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
        }}
        onSave={editingCategory ? handleUpdateCategory : handleCreateCategory}
        category={editingCategory}
        isEditing={!!editingCategory}
      />
    </DashboardLayout>
  );
}
