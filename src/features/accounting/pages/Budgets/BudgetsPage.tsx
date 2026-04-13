// src/features/accounting/pages/budgets/BudgetsPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { useGetBudgetsQuery } from '../../../../services/accountingApi';

import search_icon from '../../../../assets/icons/search_icon.svg';
import add_icon from '../../../../assets/icons/add.svg';
import edit_icon from '../../../../assets/icons/edit_icon.svg';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

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

export default function BudgetsPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const { data, isLoading } = useGetBudgetsQuery({
    search: search || undefined,
    status: statusFilter as any || undefined,
    period_type: periodFilter as any || undefined,
    fiscal_year: yearFilter ? parseInt(yearFilter) : undefined,
    page: currentPage,
    per_page: 15,
  });

  const budgets = (data as any)?.data?.data || (data as any)?.data || [];
  console.log('budgets', budgets)
  const pagination = (data as any)?.data;

  // Get unique years for filter
  const years = [...new Set(budgets.map((b: any) => b.fiscal_year))].sort((a: any, b: any) => b - a);


  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Budgets</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Plan and track financial budgets</p>
          </div>
          <button
            onClick={() => navigate(`${basePath}/accounting/budgets/create`)}
            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            <img src={add_icon} alt="" className="w-4 h-4" />
            New Budget
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-3 sm:p-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="relative flex-1 min-w-[200px]">
              <img src={search_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search by budget name..."
                className="w-full pl-9 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative flex-1 sm:flex-initial min-w-[150px]">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm bg-white appearance-none pr-10"
              >
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
              </div>
            </div>

            <div className="relative flex-1 sm:flex-initial min-w-[150px]">
              <select
                value={periodFilter}
                onChange={(e) => { setPeriodFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm bg-white appearance-none pr-10"
              >
                <option value="">All Periods</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
              </div>
            </div>

            <div className="relative flex-1 sm:flex-initial min-w-[150px]">
              <select
                value={yearFilter}
                onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm bg-white appearance-none pr-10"
              >
                <option value="">All Years</option>
                {years.map((year: any) => (
                  <option key={String(year)} value={String(year)}>{year}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
              </div>
            </div>

            {(search || statusFilter || periodFilter || yearFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setPeriodFilter('');
                  setYearFilter('');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-red-500 border border-gray-300 rounded-lg"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : budgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No budgets found</p>
              <p className="text-sm text-gray-400 mt-1">Create your first budget</p>
              <button
                onClick={() => navigate(`${basePath}/accounting/budgets/create`)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Create Budget
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
              <div className="xl:col-span-4 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Budget Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Fiscal Year</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Period</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Budgeted</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actual</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Variance</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Utilization</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {budgets.map((budget: any) => (
                      <tr key={budget.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => navigate(`${basePath}/accounting/budgets/${budget.id}`)}
                            className="text-sm font-semibold text-blue-600 hover:underline text-left"
                          >
                            {budget.budget_name}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{budget.fiscal_year}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PERIOD_COLORS[budget.period_type]}`}>
                            {budget.period_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-mono text-gray-900">
                          KWD {num(budget.total_budget_amount).toFixed(3)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-mono text-blue-600">
                          KWD {num(budget.total_actual).toFixed(3)}
                        </td>
                        <td className={`px-6 py-4 text-right text-sm font-mono font-medium ${num(budget.total_variance) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {num(budget.total_variance) >= 0 ? '+' : ''}{num(budget.total_variance).toFixed(3)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${(budget.utilization_percentage || 0) > 100 ? 'bg-red-500' :
                                  (budget.utilization_percentage || 0) > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                style={{ width: `${Math.min((budget.utilization_percentage || 0), 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">
                              {(budget.utilization_percentage || 0).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[budget.status]}`}>
                            {budget.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => navigate(`${basePath}/accounting/budgets/${budget.id}`)}
                              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              View
                            </button>
                            {budget.status === 'Draft' && (
                              <button
                                onClick={() => navigate(`${basePath}/accounting/budgets/edit/${budget.id}`)}
                                className="p-1.5 text-gray-500 hover:text-blue-600"
                              >
                                <img src={edit_icon} alt="Edit" className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          )}
        </div>

        {/* Pagination */}
        {pagination?.last_page > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.current_page} of {pagination.last_page}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))}
                disabled={currentPage === pagination.last_page}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}