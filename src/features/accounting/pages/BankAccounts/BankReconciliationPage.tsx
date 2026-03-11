// src/features/accounting/pages/bank-accounts/BankReconciliationPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { 
  useGetBankAccountByIdQuery,
  useGetBankTransactionsQuery,
  useReconcileBankTransactionsMutation 
} from '../../../../services/accountingApi';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';

const num = (v: any) => parseFloat(v) || 0;

export default function BankReconciliationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [clearedDate, setClearedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const accountId = id ? parseInt(id, 10) : 0;
  const { data: accountData } = useGetBankAccountByIdQuery(accountId);
  const { data: transactionsData, refetch } = useGetBankTransactionsQuery({
    bank_account_id: accountId,
  });

  const [reconcile] = useReconcileBankTransactionsMutation();

  const account = (accountData as any)?.data;
  const transactions = (transactionsData as any)?.data?.data || (transactionsData as any)?.data || [];

  const pendingTransactions = transactions.filter((t: any) => t.status === 'Pending' || t.status === 'Cleared');
  
  const selectedTotal = pendingTransactions
    .filter((t: any) => selectedTransactions.includes(t.id))
    .reduce((sum: number, t: any) => sum + num(t.amount), 0);

  const handleSelectAll = () => {
    if (selectedTransactions.length === pendingTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(pendingTransactions.map((t: any) => t.id));
    }
  };

  const handleSelect = (id: number) => {
    setSelectedTransactions(prev =>
      prev.includes(id)
        ? prev.filter(tid => tid !== id)
        : [...prev, id]
    );
  };

  const handleReconcile = async () => {
    if (selectedTransactions.length === 0) {
      alert('Please select at least one transaction to reconcile');
      return;
    }

    setIsSubmitting(true);
    try {
      await reconcile({
        bank_account_id: accountId,
        transaction_ids: selectedTransactions,
        cleared_date: clearedDate,
      }).unwrap();
      
      alert('Transactions reconciled successfully');
      refetch();
      setSelectedTransactions([]);
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to reconcile transactions');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!account) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`${basePath}/accounting/bank-accounts/${accountId}`)}>
              <img src={arrow_back_icon} alt="" className="w-8 h-8" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reconcile Bank Account</h1>
              <p className="text-sm text-gray-500 mt-1">
                {account.account_name} · {account.bank_name} · {account.account_number}
              </p>
            </div>
          </div>
        </div>

        {/* Account Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Current Balance</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {account.currency} {num(account.current_balance).toFixed(3)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Pending Transactions</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {pendingTransactions.length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Selected Amount</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {account.currency} {selectedTotal.toFixed(3)}
            </p>
          </div>
        </div>

        {/* Reconciliation Controls */}
        <div className="bg-white rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Cleared Date:</label>
            <input
              type="date"
              value={clearedDate}
              onChange={(e) => setClearedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              {selectedTransactions.length === pendingTransactions.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={handleReconcile}
              disabled={isSubmitting || selectedTransactions.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Reconciling...' : 'Reconcile Selected'}
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.length === pendingTransactions.length && pendingTransactions.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No pending transactions to reconcile
                    </td>
                  </tr>
                ) : (
                  pendingTransactions.map((trans: any) => (
                    <tr key={trans.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.includes(trans.id)}
                          onChange={() => handleSelect(trans.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(trans.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          trans.transaction_type === 'Deposit' || trans.transaction_type === 'Interest'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {trans.transaction_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                        {trans.description}
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-mono font-semibold ${
                        ['Deposit', 'Interest'].includes(trans.transaction_type)
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {['Deposit', 'Interest'].includes(trans.transaction_type) ? '+' : '-'}
                        {account.currency} {num(trans.amount).toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          trans.status === 'Cleared' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {trans.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <strong>Reconciliation Tip:</strong> Select the transactions that match your bank statement,
            then click "Reconcile Selected" to mark them as reconciled. Reconciled transactions cannot be modified.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}