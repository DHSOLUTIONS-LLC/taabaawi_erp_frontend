// src/features/accounting/pages/financial-reports/TrialBalancePage.tsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { useGetTrialBalanceQuery } from '../../../../services/accountingApi';
import ReportHeader from '../../components/ReportHeader';
import ReportActions from '../../components/ReportActions';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';

const ACCOUNT_TYPE_ORDER = [
  'Asset', 'Liability', 'Equity', 'Revenue', 'Expense', 'Cost of Goods Sold'
];

const num = (v: any) => parseFloat(v) || 0;

export default function TrialBalancePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state: RootState) => state.auth);
  
  const [asOfDate, setAsOfDate] = useState(
    searchParams.get('as_of_date') || new Date().toISOString().split('T')[0]
  );

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const { data, isLoading, refetch } = useGetTrialBalanceQuery({
    as_of_date: asOfDate,
  });

  const report = (data as any)?.data;
  const accounts = report?.accounts || [];
  console.log('reports:', report)
  console.log('accounts:///:', accounts)

  // Group accounts by type
  const groupedAccounts = accounts.reduce((acc: any, account: any) => {
    if (!acc[account.account_type]) {
      acc[account.account_type] = [];
    }
    acc[account.account_type].push(account);
    return acc;
  }, {});

  const handleDateChange = (newDate: string) => {
    setAsOfDate(newDate);
    navigate(`?as_of_date=${newDate}`, { replace: true });
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting trial balance as ${format}`);
    // Implement export functionality
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
              <h1 className="text-2xl font-bold text-gray-900">Trial Balance</h1>
              <p className="text-sm text-gray-500 mt-1">As of {new Date(asOfDate).toLocaleDateString()}</p>
            </div>
          </div>
          <ReportActions
            onExport={handleExport}
            onPrint={handlePrint}
            onRefresh={refetch}
          />
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-xl p-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">As of Date:</label>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => handleDateChange(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-xl p-4 print:p-0">
          <ReportHeader
            title="Trial Balance"
            subtitle={`As of ${new Date(asOfDate).toLocaleDateString()}`}
          />

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No data available for this period</p>
            </div>
          ) : (
            <>
              {/* Accounts by Type */}
              {ACCOUNT_TYPE_ORDER.map(type => {
                const typeAccounts = groupedAccounts[type] || [];
                if (typeAccounts.length === 0) return null;

                return (
                  <div key={type} className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{type}</h3>
                    <table className="w-full">
                      <thead className="bg-gray-50 border-y border-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Account Code</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Account Name</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Debit</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Credit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {typeAccounts.map((account: any) => (
                          <tr key={account.account_code} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm font-mono text-gray-600">{account.account_code}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{account.account_name}</td>
                            <td className="px-4 py-2 text-right text-sm font-mono text-gray-900">
                              {num(account.debit).toFixed(3)}
                            </td>
                            <td className="px-4 py-2 text-right text-sm font-mono text-gray-900">
                              {num(account.credit).toFixed(3)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}

              {/* Totals */}
              <div className="mt-8 pt-4 border-t-2 border-gray-300">
                <div className="flex justify-end gap-8">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Debit</p>
                    <p className="text-lg font-bold text-blue-600">
                      KWD {num(report?.total_debit).toFixed(3)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Credit</p>
                    <p className="text-lg font-bold text-blue-600">
                      KWD {num(report?.total_credit).toFixed(3)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    report?.is_balanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {report?.is_balanced ? (
                      <>✓ Trial Balance is Balanced</>
                    ) : (
                      <>✗ Trial Balance is NOT Balanced</>
                    )}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}