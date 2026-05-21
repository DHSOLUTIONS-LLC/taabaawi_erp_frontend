// src/features/accounting/tabs/ExpensesTab.tsx
import { useState } from 'react';
import { useGetExpensesQuery } from '../../../services/accountingApi';
import { useGetExpenseCategoriesQuery } from '../../../services/accountingApi';
import { useGetBranchesQuery } from '../../../services/superAdminApi';
import ExpenseFilters from '../components/ExpenseFilters';
import CreateExpenseModal from '../components/CreateExpenseModal';

interface ExpensesTabProps {
  branchId?: number;
  limit?: number;
  showHeader?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Approved: 'bg-blue-100 text-blue-700',
  Rejected: 'bg-red-100 text-red-700',
  Paid: 'bg-green-100 text-green-700',
};

export default function ExpensesTab({ branchId, limit = 10, showHeader = true }: ExpensesTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    branch: branchId?.toString() || '',
    startDate: '',
    endDate: '',
  });

  const { data: expensesData, isLoading, refetch } = useGetExpensesQuery({
    search: filters.search || undefined,
    status: filters.status || undefined,
    expense_category_id: filters.category ? parseInt(filters.category) : undefined,
    branch_id: filters.branch ? parseInt(filters.branch) : branchId,
    start_date: filters.startDate || undefined,
    end_date: filters.endDate || undefined,
    per_page: limit,
  });

  const { data: categoriesData } = useGetExpenseCategoriesQuery({ is_active: true });
  const { data: branchesData } = useGetBranchesQuery();

  const expenses = expensesData?.data?.data || [];
  const categories = categoriesData?.data || [];
  const branches = Array.isArray(branchesData) ? branchesData : [];

  const getStatusBadge = (status: string) => {
    return `px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KW', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recent Expenses</h2>
            <p className="text-sm text-gray-500">Track tea, water, cleaning, and other business expenses</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            + New Expense
          </button>
        </div>
      )}

      {/* Filters */}
      <ExpenseFilters
        onFilterChange={setFilters}
        categories={categories}
        branches={branches}
        initialFilters={filters}
      />

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500">No expenses found</p>
          <p className="text-sm text-gray-400 mt-1">Create your first expense record</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vendor/Description</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses.map((expense: any) => (
                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {expense.category?.category_name || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{expense.vendor_name || '—'}</div>
                      {expense.description && <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{expense.description}</div>}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold">
                      KWD {formatCurrency(expense.amount_kwd)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={getStatusBadge(expense.status)}>{expense.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateExpenseModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
          categories={categories}
          branches={branches}
        />
      )}
    </div>
  );
}