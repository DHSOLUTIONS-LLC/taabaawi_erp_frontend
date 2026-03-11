// src/features/accounting/pages/bank-accounts/BankStatementPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { useGetBankStatementQuery } from '../../../../services/accountingApi';
import ReportHeader from '../../components/ReportHeader';
import ReportActions from '../../components/ReportActions';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';

const num = (v: any) => parseFloat(v) || 0;

export default function BankStatementPage() {
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
  const { data, isLoading, refetch } = useGetBankStatementQuery({
    bank_account_id: accountId,
    start_date: dateRange.start_date,
    end_date: dateRange.end_date,
  });

  const statement = (data as any)?.data;

  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting bank statement as ${format}`);
  };

  const handlePrint = () => {
    window.print();
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Bank Statement</h1>
              <p className="text-sm text-gray-500 mt-1">
                {statement?.account?.account_name} · {statement?.account?.bank_name}
              </p>
            </div>
          </div>
          <ReportActions
            onExport={handleExport}
            onPrint={handlePrint}
            onRefresh={refetch}
          />
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-xl p-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Period:</label>
          <input
            type="date"
            value={dateRange.start_date}
            onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end_date}
            onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
            min={dateRange.start_date}
            max={new Date().toISOString().split('T')[0]}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {/* Statement Content */}
        <div className="bg-white rounded-xl p-6 shadow-sm print:p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : !statement ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No data available for this period</p>
            </div>
          ) : (
            <>
              <ReportHeader
                title={`Bank Statement: ${statement.account.account_name}`}
                subtitle={`${statement.account.bank_name} · ${statement.account.account_number} · Period: ${new Date(statement.period_start).toLocaleDateString()} to ${new Date(statement.period_end).toLocaleDateString()}`}
              />

              {/* Summary */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Opening Balance</p>
                  <p className="text-lg font-bold text-gray-900">
                    {statement.account.currency} {num(statement.opening_balance).toFixed(3)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Total Deposits</p>
                  <p className="text-lg font-bold text-green-600">
                    {statement.account.currency} {num(statement.total_deposits).toFixed(3)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Total Withdrawals</p>
                  <p className="text-lg font-bold text-red-600">
                    {statement.account.currency} {num(statement.total_withdrawals).toFixed(3)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Closing Balance</p>
                  <p className="text-lg font-bold text-blue-600">
                    {statement.account.currency} {num(statement.closing_balance).toFixed(3)}
                  </p>
                </div>
              </div>

              {/* Transactions Table */}
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Debit</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Credit</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {statement.transactions.map((trans: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {new Date(trans.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-sm font-mono text-gray-600">
                        {trans.transaction_number}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 max-w-xs">
                        {trans.description}
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-mono text-red-600">
                        {trans.debit > 0 ? `${statement.account.currency} ${num(trans.debit).toFixed(3)}` : '-'}
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-mono text-green-600">
                        {trans.credit > 0 ? `${statement.account.currency} ${num(trans.credit).toFixed(3)}` : '-'}
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-mono font-bold text-blue-600">
                        {statement.account.currency} {num(trans.balance).toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}