// src/features/accounting/pages/financial-reports/GeneralLedgerPage.tsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { useGetGeneralLedgerQuery, useGetChartOfAccountsQuery } from '../../../../services/accountingApi';
import ReportHeader from '../../components/ReportHeader';
import ReportActions from '../../components/ReportActions';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

const num = (v: any) => parseFloat(v) || 0;

export default function GeneralLedgerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state: RootState) => state.auth);
  
  const [accountId, setAccountId] = useState(
    searchParams.get('account_id') || ''
  );
  const [dateRange, setDateRange] = useState({
    start_date: searchParams.get('start_date') || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end_date: searchParams.get('end_date') || new Date().toISOString().split('T')[0],
  });

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  // Fetch accounts for dropdown
  const { data: accountsData } = useGetChartOfAccountsQuery({
    is_active: 1 as any,
    per_page: 1000,
  });

  const accounts = (accountsData as any)?.data?.data || (accountsData as any)?.data || [];

  // Fetch ledger data
  const { data, isLoading, refetch } = useGetGeneralLedgerQuery({
    account_id: parseInt(accountId),
    start_date: dateRange.start_date,
    end_date: dateRange.end_date,
  }, {
    skip: !accountId,
  });

  const ledger = (data as any)?.data;

  const handleAccountChange = (id: string) => {
    setAccountId(id);
    if (id) {
      navigate(`?account_id=${id}&start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`, { replace: true });
    }
  };

  const handleDateChange = (field: 'start_date' | 'end_date', value: string) => {
    const newRange = { ...dateRange, [field]: value };
    setDateRange(newRange);
    if (accountId) {
      navigate(`?account_id=${accountId}&start_date=${newRange.start_date}&end_date=${newRange.end_date}`, { replace: true });
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting general ledger as ${format}`);
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
            <button onClick={() => navigate(`${basePath}/accounting/financial-reports`)}>
              <img src={arrow_back_icon} alt="" className="w-8 h-8" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">General Ledger</h1>
              <p className="text-sm text-gray-500 mt-1">Detailed transaction history by account</p>
            </div>
          </div>
          <ReportActions
            onExport={handleExport}
            onPrint={handlePrint}
            onRefresh={refetch}
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-2">Select Account</label>
            <div className="relative">
              <select
                value={accountId}
                onChange={(e) => handleAccountChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose an account...</option>
                {accounts.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_code} - {acc.account_name} ({acc.account_type})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => handleDateChange('start_date', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => handleDateChange('end_date', e.target.value)}
              min={dateRange.start_date}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-xl p-4 print:p-0">
          {!accountId ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Please select an account to view the general ledger</p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : !ledger ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No transactions found for this period</p>
            </div>
          ) : (
            <>
              <ReportHeader
                title={`General Ledger: ${ledger.account_name}`}
                subtitle={`${ledger.account_code} · ${ledger.account_type} · Period: ${new Date(ledger.period_start).toLocaleDateString()} to ${new Date(ledger.period_end).toLocaleDateString()}`}
              />

              {/* Account Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Opening Balance</p>
                  <p className="text-lg font-bold text-gray-900">
                    KWD {num(ledger.opening_balance).toFixed(3)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Closing Balance</p>
                  <p className="text-lg font-bold text-blue-600">
                    KWD {num(ledger.closing_balance).toFixed(3)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Net Change</p>
                  <p className={`text-lg font-bold ${
                    num(ledger.closing_balance - ledger.opening_balance) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    KWD {(num(ledger.closing_balance) - num(ledger.opening_balance)).toFixed(3)}
                  </p>
                </div>
              </div>

              {/* Transactions Table */}
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Journal #</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Debit</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Credit</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ledger.transactions.map((trans: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {new Date(trans.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-sm font-mono text-blue-600">
                        {trans.journal_number}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                        {trans.description}
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-mono text-gray-900">
                        {num(trans.debit).toFixed(3)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-mono text-gray-900">
                        {num(trans.credit).toFixed(3)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-mono font-bold text-blue-600">
                        KWD {num(trans.balance).toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">
                      Closing Balance
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-mono font-bold text-blue-600">
                      KWD {num(ledger.closing_balance).toFixed(3)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}