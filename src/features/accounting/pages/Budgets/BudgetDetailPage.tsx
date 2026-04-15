// src/features/accounting/pages/budgets/BudgetDetailPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import {
  useGetBudgetByIdQuery,
  useActivateBudgetMutation,
  useCloseBudgetMutation,
  useDeleteBudgetMutation,
  useGetChartOfAccountsQuery
} from '../../../../services/accountingApi';
import BudgetLines from '../../components/BudgetLines';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import edit_icon from '../../../../assets/icons/edit_icon.svg';
import check_icon from '../../../../assets/icons/check_icon.png';
import close_icon from '../../../../assets/icons/cross_icon.svg';
import delete_icon from '../../../../assets/icons/delete-icon.png';

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Active: 'bg-green-100 text-green-700',
  Closed: 'bg-red-100 text-red-700',
};

const PERIOD_COLORS: Record<string, string> = {
  Monthly: 'bg-blue-100 text-blue-700',
  Quarterly: 'bg-purple-100 text-purple-700',
  Yearly: 'bg-orange-100 text-orange-700',
};

const num = (v: any) => parseFloat(v) || 0;

export default function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const budgetId = id ? parseInt(id, 10) : 0;
  const { data, isLoading, refetch } = useGetBudgetByIdQuery(budgetId);
  const [activateBudget, { isLoading: isActivating }] = useActivateBudgetMutation();
  const [closeBudget, { isLoading: isClosing }] = useCloseBudgetMutation();
  const [deleteBudget, { isLoading: isDeleting }] = useDeleteBudgetMutation();

  const budget = (data as any)?.data;
  const { data: accountsData } = useGetChartOfAccountsQuery({
    is_active: 1 as any,
    per_page: 1000,
  });
  const accounts = accountsData?.data ?? [];


  const handleActivate = async () => {
    try {
      await activateBudget(budgetId).unwrap();
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to activate budget');
    }
  };

  const handleClose = async () => {
    try {
      await closeBudget(budgetId).unwrap();
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to close budget');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBudget(budgetId).unwrap();
      navigate(`${basePath}/accounting/budgets`);
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to delete budget');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!budget) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-red-500 font-medium">Budget not found</p>
          <button
            onClick={() => navigate(`${basePath}/accounting/budgets`)}
            className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Back to Budgets
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const canEdit = budget.status === 'Draft';
  const canActivate = budget.status === 'Draft';
  const canClose = budget.status === 'Active';

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <button
              onClick={() => navigate(`${basePath}/accounting/budgets`)}
              className="flex-shrink-0 mt-1"
            >
              <img src={arrow_back_icon} alt="" className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{budget.budget_name}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[budget.status]}`}>
                  {budget.status}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${PERIOD_COLORS[budget.period_type]}`}>
                  {budget.period_type}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">
                Fiscal Year {budget.fiscal_year} · {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <>
                <button
                  onClick={() => navigate(`${basePath}/accounting/budgets/edit/${budget.id}`)}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 text-sm"
                >
                  <img src={edit_icon} alt="" className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 text-sm"
                >
                  <img src={delete_icon} alt="" className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
            {canActivate && (
              <button
                onClick={handleActivate}
                disabled={isActivating}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                <img src={check_icon} alt="" className="w-4 h-4" />
                {isActivating ? 'Activating...' : 'Activate Budget'}
              </button>
            )}
            {canClose && (
              <button
                onClick={handleClose}
                disabled={isClosing}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm"
              >
                <img src={close_icon} alt="" className="w-4 h-4" />
                {isClosing ? 'Closing...' : 'Close Budget'}
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-gray-500">Total Budgeted</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 break-words">
              KWD {num(budget.total_budget_amount).toFixed(3)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-gray-500">Total Actual</p>
            <p className="text-lg sm:text-2xl font-bold text-blue-600 mt-1 break-words">
              KWD {num(budget.total_actual).toFixed(3)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5 sm:col-span-2 lg:col-span-1">
            <p className="text-xs sm:text-sm text-gray-500">Variance</p>
            <p className={`text-lg sm:text-2xl font-bold mt-1 break-words ${num(budget.total_variance) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
              {num(budget.total_variance) >= 0 ? '+' : ''}{num(budget.total_variance).toFixed(3)}
            </p>
          </div>
        </div>

        {/* Budget Lines */}
        <div className="bg-white rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-base font-semibold text-gray-900">Budget Lines</h2>
            {budget.status === 'Active' && (
              <button
                onClick={() => navigate(`${basePath}/accounting/budgets/${budget.id}/budget-vs-actual`)}
                className="flex items-center justify-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 text-sm"
              >
                View Budget vs Actual
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <BudgetLines
              lines={budget.lines?.map((l: any) => ({
                id: `line-${l.id}`,
                account_id: l.account_id?.toString() || '',
                budgeted_amount: num(l.budgeted_amount),
                notes: l.notes || '',
              })) || []}
              accounts={accounts}
              onUpdate={() => { }}
              onRemove={() => { }}
              readOnly
            />
          </div>
        </div>

        {/* Utilization Chart */}
        <div className="bg-white rounded-xl p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Budget Utilization</h2>
          <div className="space-y-4 sm:space-y-3">
            {budget.lines?.map((line: any) => {
              const utilization = line.budgeted_amount > 0
                ? (line.actual_amount / line.budgeted_amount) * 100
                : 0;
              const variance = line.budgeted_amount - line.actual_amount;

              return (
                <div key={line.id} className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 text-sm">
                    <span className="text-gray-600 break-words">{line.account?.account_name || `Account #${line.account_id}`}</span>
                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-4">
                      <span className="text-gray-500 text-xs sm:text-sm">
                        {num(line.actual_amount).toFixed(3)} / {num(line.budgeted_amount).toFixed(3)}
                      </span>
                      <span className={`font-mono font-medium text-xs sm:text-sm ${variance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {variance >= 0 ? '+' : ''}{num(variance).toFixed(3)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${utilization > 100 ? 'bg-red-500' :
                          utilization > 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-12 text-right">
                      {utilization.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        {budget.notes && (
          <div className="bg-white rounded-xl p-4 sm:p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Notes</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{budget.notes}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal - Responsive */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 sm:mx-auto p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Delete Budget</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-6 break-words">
              Are you sure you want to delete "{budget.budget_name}"? This action cannot be undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm sm:text-base"
              >
                {isDeleting ? 'Deleting...' : 'Delete Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}