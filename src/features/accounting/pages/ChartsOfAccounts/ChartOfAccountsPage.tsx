// src/features/accounting/pages/chart-of-accounts/ChartOfAccountsPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { useGetChartOfAccountsQuery } from '../../../../services/accountingApi';

import search_icon from '../../../../assets/icons/search_icon.svg';
import add_icon from '../../../../assets/icons/add.svg';
import edit_icon from '../../../../assets/icons/edit_icon.svg';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  Asset: 'bg-blue-100 text-blue-700',
  Liability: 'bg-orange-100 text-orange-700',
  Equity: 'bg-purple-100 text-purple-700',
  Revenue: 'bg-green-100 text-green-700',
  Expense: 'bg-red-100 text-red-700',
  'Cost of Goods Sold': 'bg-yellow-100 text-yellow-700',
};

const num = (v: any) => parseFloat(v) || 0;

export default function ChartOfAccountsPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [search, setSearch] = useState('');
  const [accountType, setAccountType] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const { data, isLoading } = useGetChartOfAccountsQuery({
    search:       search || undefined,
    account_type: accountType as any || undefined,
    is_active:    showInactive ? undefined : 1 as any,
    page:         currentPage,
    per_page:     15,
  });

  // Same extraction pattern as AccountTreePage which already works
  const raw        = data as any;
  const accounts   = raw?.data?.data ?? raw?.data ?? [];
  const pagination = raw?.data ?? null;

  return (
    <DashboardLayout>
      <div className="space-y-6">

      {/* Header */}
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Chart of Accounts</h1>
    <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage your financial accounts</p>
  </div>
  <div className='flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:space-x-reverse'>
    <button
      onClick={() => navigate(`${basePath}/accounting/chart-of-accounts/create`)}
      className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-black rounded-lg border border-blue-600 hover:bg-blue-700 hover:text-white transition-colors cursor-pointer text-sm sm:text-base"
    >
      <img src={add_icon} alt="" className="w-4 h-4" />
      New Account
    </button>
    <button
      onClick={() => navigate(`${basePath}/accounting/account-tree`)}
      className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 border border-blue-600 text-black rounded-lg hover:bg-blue-700 hover:text-white transition-colors cursor-pointer text-sm sm:text-base"
    >
      <img src={add_icon} alt="" className="w-4 h-4" />
      Accounts Tree
    </button>
  </div>
</div>

{/* Filters */}
<div className="bg-white rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center">
  <div className="relative flex-1 min-w-[200px] sm:min-w-[220px]">
    <img src={search_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
    <input
      type="text"
      value={search}
      onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
      placeholder="Search by code or name..."
      className="w-full pl-9 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <div className="relative flex-1 sm:flex-initial min-w-[180px]">
    <select
      value={accountType}
      onChange={(e) => { setAccountType(e.target.value); setCurrentPage(1); }}
      className="w-full px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm bg-white appearance-none pr-10"
    >
      <option value="">All Account Types</option>
      <option value="Asset">Asset</option>
      <option value="Liability">Liability</option>
      <option value="Equity">Equity</option>
      <option value="Revenue">Revenue</option>
      <option value="Expense">Expense</option>
      <option value="Cost of Goods Sold">Cost of Goods Sold</option>
    </select>
    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
      <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
    </div>
  </div>

  <div className="flex items-center justify-between sm:justify-normal gap-3">
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="showInactive"
        checked={showInactive}
        onChange={(e) => { setShowInactive(e.target.checked); setCurrentPage(1); }}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <label htmlFor="showInactive" className="text-sm text-gray-700 whitespace-nowrap">Show inactive</label>
    </div>

    {(search || accountType || showInactive) && (
      <button
        onClick={() => { setSearch(''); setAccountType(''); setShowInactive(false); setCurrentPage(1); }}
        className="px-4 py-2 sm:py-2.5 text-sm text-gray-500 hover:text-red-500 border border-gray-300 rounded-lg"
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
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No accounts found</p>
              <p className="text-sm text-gray-400 mt-1">Create your first account to get started</p>
              <button
                onClick={() => navigate(`${basePath}/accounting/chart-of-accounts/create`)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Create Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
   <div className="xl:col-span-4 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left   text-xs font-semibold text-gray-600 uppercase">Account Code</th>
                    <th className="px-6 py-4 text-left   text-xs font-semibold text-gray-600 uppercase">Account Name</th>
                    <th className="px-6 py-4 text-left   text-xs font-semibold text-gray-600 uppercase">Type</th>
                    <th className="px-6 py-4 text-right  text-xs font-semibold text-gray-600 uppercase">Current Balance</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {accounts.map((account: any) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono font-semibold text-gray-900">{account.account_code}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{account.account_name}</div>
                        {account.parent_account && (
                          <div className="text-xs text-gray-500">Parent: {account.parent_account.account_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ACCOUNT_TYPE_COLORS[account.account_type] ?? 'bg-gray-100 text-gray-700'}`}>
                          {account.account_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {account.currency} {num(account.current_balance).toFixed(3)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Opening: {num(account.opening_balance).toFixed(3)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          account.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {account.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => navigate(`${basePath}/accounting/chart-of-accounts/${account.id}`)}
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            View
                          </button>
                          {!account.is_system_account && (
                            <button
                              onClick={() => navigate(`${basePath}/accounting/chart-of-accounts/edit/${account.id}`)}
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
              Showing {pagination.from}–{pagination.to} of {pagination.total}
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