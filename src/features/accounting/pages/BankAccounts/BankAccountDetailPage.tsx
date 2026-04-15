// src/features/accounting/pages/bank-accounts/BankAccountDetailPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { 
  useGetBankAccountByIdQuery,
  useGetBankTransactionsQuery 
} from '../../../../services/accountingApi';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import edit_icon from '../../../../assets/icons/edit_icon.svg';
import statement_icon from '../../../../assets/icons/statement_icon.png';
import reconcile_icon from '../../../../assets/icons/reconcile_icon.png';

const TRANSACTION_TYPE_COLORS: Record<string, string> = {
  Deposit: 'bg-green-100 text-green-700',
  Withdrawal: 'bg-red-100 text-red-700',
  Transfer: 'bg-blue-100 text-blue-700',
  'Bank Charge': 'bg-orange-100 text-orange-700',
  Interest: 'bg-purple-100 text-purple-700',
};

const num = (v: any) => parseFloat(v) || 0;

export default function BankAccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const accountId = id ? parseInt(id, 10) : 0;
  const { data, isLoading } = useGetBankAccountByIdQuery(accountId);
  const { data: transactionsData } = useGetBankTransactionsQuery({
    bank_account_id: accountId,
    start_date: dateRange.start_date,
    end_date: dateRange.end_date,
  });

  const account = (data as any)?.data;
  const transactions = (transactionsData as any)?.data?.data || (transactionsData as any)?.data || [];

  console.log('transactions:..', transactions)
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!account) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-red-500 font-medium">Bank account not found</p>
          <button
            onClick={() => navigate(`${basePath}/accounting/bank-accounts`)}
            className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Back to Bank Accounts
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => navigate(`${basePath}/accounting/bank-accounts`)}
              className="flex-shrink-0 mt-1"
            >
              <img src={arrow_back_icon} alt="" className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{account.account_name}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  account.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {account.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">
                {account.bank_name} · {account.account_number} · {account.currency}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`${basePath}/accounting/bank-accounts/edit/${account.id}`)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 text-sm"
            >
              <img src={edit_icon} alt="" className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => navigate(`${basePath}/accounting/bank-accounts/${account.id}/statement`)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border border-green-300 rounded-lg text-green-600 hover:bg-green-50 text-sm"
            >
              <img src={statement_icon} alt="" className="w-4 h-4" />
              Statement
            </button>
            <button
              onClick={() => navigate(`${basePath}/accounting/bank-accounts/${id}/transactions/create`)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border border-green-300 rounded-lg text-green-600 hover:bg-green-50 text-sm"
            >
              <img src={statement_icon} alt="" className="w-4 h-4" />
              Add Transaction
            </button>
            <button
              onClick={() => navigate(`${basePath}/accounting/bank-accounts/${account.id}/reconcile`)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 text-sm"
            >
              <img src={reconcile_icon} alt="" className="w-4 h-4" />
              Reconcile
            </button>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-gray-500">Opening Balance</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 break-words">
              {account.currency} {num(account.opening_balance).toFixed(3)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-gray-500">Current Balance</p>
            <p className="text-lg sm:text-2xl font-bold text-blue-600 mt-1 break-words">
              {account.currency} {num(account.current_balance).toFixed(3)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-gray-500">Available Balance</p>
            <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1 break-words">
              {account.currency} {num(account.available_balance).toFixed(3)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-gray-500">Unreconciled</p>
            <p className="text-lg sm:text-2xl font-bold text-orange-600 mt-1">{account.unreconciled_count || 0}</p>
          </div>
        </div>

        {/* Account Details */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - 2/3 width on desktop, full width on mobile */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Recent Transactions */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-base font-semibold text-gray-900">Recent Transactions</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={dateRange.start_date}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                    className="flex-1 sm:flex-initial px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={dateRange.end_date}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                    className="flex-1 sm:flex-initial px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No transactions for this period</p>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-gray-50 border-y border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Description</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Amount</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {transactions.map((trans: any) => (
                          <tr key={trans.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                              {new Date(trans.transaction_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${TRANSACTION_TYPE_COLORS[trans.transaction_type]}`}>
                                {trans.transaction_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                              {trans.description}
                            </td>
                            <td className={`px-4 py-3 text-right text-sm font-mono font-semibold whitespace-nowrap ${
                              ['Deposit', 'Interest'].includes(trans.transaction_type) 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {['Deposit', 'Interest'].includes(trans.transaction_type) ? '+' : '-'}
                              {account.currency} {num(trans.amount).toFixed(3)}
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                trans.status === 'Reconciled' ? 'bg-green-100 text-green-700' :
                                trans.status === 'Cleared' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {trans.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-3">
                    {transactions.map((trans: any) => (
                      <div key={trans.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-xs text-gray-500">{new Date(trans.transaction_date).toLocaleDateString()}</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{trans.description}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            trans.status === 'Reconciled' ? 'bg-green-100 text-green-700' :
                            trans.status === 'Cleared' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {trans.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${TRANSACTION_TYPE_COLORS[trans.transaction_type]}`}>
                            {trans.transaction_type}
                          </span>
                          <p className={`text-sm font-mono font-semibold ${
                            ['Deposit', 'Interest'].includes(trans.transaction_type) 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {['Deposit', 'Interest'].includes(trans.transaction_type) ? '+' : '-'}
                            {account.currency} {num(trans.amount).toFixed(3)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column - 1/3 width on desktop, full width on mobile */}
          <div className="space-y-4 sm:space-y-6">
            {/* Bank Details */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Bank Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Account Number</p>
                  <p className="text-sm font-mono font-medium text-gray-900 mt-1 break-all">{account.account_number}</p>
                </div>
                {account.iban && (
                  <div>
                    <p className="text-xs text-gray-500">IBAN</p>
                    <p className="text-sm font-mono text-gray-900 mt-1 break-all">{account.iban}</p>
                  </div>
                )}
                {account.swift_code && (
                  <div>
                    <p className="text-xs text-gray-500">SWIFT Code</p>
                    <p className="text-sm font-mono text-gray-900 mt-1">{account.swift_code}</p>
                  </div>
                )}
                {account.branch_name && (
                  <div>
                    <p className="text-xs text-gray-500">Branch</p>
                    <p className="text-sm text-gray-900 mt-1 break-words">{account.branch_name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* GL Account */}
            {account.glAccount && (
              <div className="bg-white rounded-xl p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Linked GL Account</h2>
                <button
                  onClick={() => navigate(`${basePath}/accounting/chart-of-accounts/${account.gl_account_id}`)}
                  className="text-left w-full p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm font-medium text-blue-600">{account.glAccount.account_code}</p>
                  <p className="text-sm text-gray-900 mt-1 break-words">{account.glAccount.account_name}</p>
                  <p className="text-xs text-gray-500 mt-1">{account.glAccount.account_type}</p>
                </button>
              </div>
            )}

            {/* Notes */}
            {account.notes && (
              <div className="bg-white rounded-xl p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Notes</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{account.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}