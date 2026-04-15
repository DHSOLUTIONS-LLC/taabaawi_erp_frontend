// src/features/accounting/pages/BankAccounts/BankAccountsPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import {
  useGetBankAccountsQuery,
  useDeleteBankAccountMutation,
} from '../../../../services/accountingApi';

import search_icon from '../../../../assets/icons/search_icon.svg';
import add_icon from '../../../../assets/icons/add.svg';
import edit_icon from '../../../../assets/icons/edit_icon.svg';
// import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

const num = (v: any) => parseFloat(v) || 0;

export default function BankAccountsPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const { data, isLoading, refetch } = useGetBankAccountsQuery({
    search: search || undefined,
    is_active: 1 as any,
    page: currentPage,
    per_page: 15,
  });

  const [deleteBankAccount] = useDeleteBankAccountMutation();

  const raw = data as any;
  const accounts = raw?.data?.data ?? raw?.data ?? [];
  console.log('bank accounts:', accounts)
  const pagination = raw?.data ?? null;

  // Stats from all accounts
  const totalBalance = accounts.reduce((sum: number, a: any) => sum + num(a.current_balance), 0);
  const activeCount = accounts.filter((a: any) => a.is_active).length;

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteBankAccount(id).unwrap();
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to delete bank account');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

     {/* Header */}
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  <div>
    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bank Accounts</h1>
    <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage your bank accounts and transactions</p>
  </div>
  <button
    onClick={() => navigate(`${basePath}/accounting/bank-accounts/create`)}
    className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
  >
    <img src={add_icon} alt="" className="w-4 h-4" />
    New Bank Account
  </button>
</div>

{/* Stats Cards */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
  <div className="bg-white rounded-xl p-4 sm:p-5">
    <p className="text-xs sm:text-sm text-gray-500">Total Balance</p>
    <p className="text-lg sm:text-2xl font-bold text-blue-600 mt-1 break-words">
      KWD {totalBalance.toFixed(3)}
    </p>
    <p className="text-xs text-gray-400 mt-1">Across all active accounts</p>
  </div>
  <div className="bg-white rounded-xl p-4 sm:p-5">
    <p className="text-xs sm:text-sm text-gray-500">Active Accounts</p>
    <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
    <p className="text-xs text-gray-400 mt-1">Currently active</p>
  </div>
  <div className="bg-white rounded-xl p-4 sm:p-5 sm:col-span-2 lg:col-span-1">
    <p className="text-xs sm:text-sm text-gray-500">Total Accounts</p>
    <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{pagination?.total ?? accounts.length}</p>
    <p className="text-xs text-gray-400 mt-1">All bank accounts</p>
  </div>
</div>

{/* Filters */}
<div className="bg-white rounded-xl p-3 sm:p-4">
  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
    <div className="relative flex-1 min-w-[200px] sm:min-w-[220px]">
      <img src={search_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        placeholder="Search by name, account number, or bank..."
        className="w-full pl-9 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
      />
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

      {(search || showInactive) && (
        <button
          onClick={() => { setSearch(''); setShowInactive(false); setCurrentPage(1); }}
          className="px-4 py-2 text-sm text-gray-500 hover:text-red-500 border border-gray-300 rounded-lg"
        >
          Clear
        </button>
      )}
    </div>
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
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No bank accounts found</p>
              <p className="text-sm text-gray-400 mt-1">Create your first bank account to get started</p>
              <button
                onClick={() => navigate(`${basePath}/accounting/bank-accounts/create`)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Create Bank Account
              </button>
            </div>
          ) : (
             <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
   <div className="xl:col-span-4 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Account Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Bank</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Account Number</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Currency</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Current Balance</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Available Balance</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {accounts.map((account: any) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{account.account_name}</div>
                        {account.branch_name && (
                          <div className="text-xs text-gray-500">{account.branch_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{account.bank_name}</div>
                        {account.swift_code && (
                          <div className="text-xs text-gray-500 font-mono">{account.swift_code}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono text-gray-900">{account.account_number}</div>
                        {account.iban && (
                          <div className="text-xs text-gray-500 font-mono">{account.iban}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {account.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {account.currency} {num(account.current_balance).toFixed(3)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-semibold text-green-600">
                          {account.currency} {num(account.available_balance ?? account.current_balance).toFixed(3)}
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
                            onClick={() => navigate(`${basePath}/accounting/bank-accounts/${account.id}`)}
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            View
                          </button>
                          <button
                            onClick={() => navigate(`${basePath}/accounting/bank-accounts/${account.id}/statement`)}
                            className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                          >
                            Statement
                          </button>
                          <button
                            onClick={() => navigate(`${basePath}/accounting/bank-accounts/edit/${account.id}`)}
                            className="p-1.5 text-gray-500 hover:text-blue-600"
                          >
                            <img src={edit_icon} alt="Edit" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(account.id, account.account_name)}
                            disabled={deletingId === account.id}
                            className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-40"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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