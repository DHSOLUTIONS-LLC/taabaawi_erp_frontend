// src/features/accounting/pages/AccountingDashboard.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../app/hooks';
import type { RootState } from '../../../app/store';
import {
  useGetTrialBalanceQuery,
  useGetProfitLossQuery,
  useGetBalanceSheetQuery,
  useGetAccountsPayableQuery,
  useGetAccountsReceivableQuery,
  useGetJournalEntriesQuery,
} from '../../../services/accountingApi';
import FinancialChart from '../components/FinancialChart';
import StatusBadge from '../components/StatusBadge';
import DateRangePicker from '../components/DateRangePicker';

import add_icon from '../../../assets/icons/add.svg';
import file_icon from '../../../assets/icons/statement_icon.png';
import account_rec from '../../../assets/icons/account_recieveable_.png';
import account_payable from '../../../assets/icons/account_payable_.png';
import bank_icon from '../../../assets/icons/bank_icon.png';
// import payment_icon from '../../../assets/icons/payment_icon.png';

const num = (v: any) => parseFloat(v) || 0;

export default function AccountingDashboard() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    as_of_date: new Date().toISOString().split('T')[0],
  });

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  // Fetch dashboard data
  const { data: trialBalanceData } = useGetTrialBalanceQuery({
    as_of_date: dateRange.as_of_date,
  });

  const { data: profitLossData } = useGetProfitLossQuery({
    start_date: dateRange.start_date,
    end_date: dateRange.end_date,
  });

  const { data: balanceSheetData } = useGetBalanceSheetQuery({
    as_of_date: dateRange.as_of_date,
  });

  const { data: apData } = useGetAccountsPayableQuery({
    per_page: 5,
  });

  const { data: arData } = useGetAccountsReceivableQuery({
    per_page: 5,
  });

  // Fetch journal entries for chart data
  const { data: journalEntriesData } = useGetJournalEntriesQuery({
    start_date: dateRange.start_date,
    end_date: dateRange.end_date,
    per_page: 100,
  });

  const trialBalance = (trialBalanceData as any)?.data;
  const profitLoss = (profitLossData as any)?.data;
  const balanceSheet = (balanceSheetData as any)?.data;
  const recentAP = (apData as any)?.data?.data || [];
  const recentAR = (arData as any)?.data?.data || [];
  const journalEntries = (journalEntriesData as any)?.data?.data || [];

  // Calculate revenue vs expense chart data from journal entries
  const getMonthlyChartData = () => {
    const monthlyData: Record<string, { revenue: number; expense: number }> = {};
    const last6Months = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      monthlyData[monthKey] = { revenue: 0, expense: 0 };
      last6Months.push(monthKey);
    }

    journalEntries.forEach((entry: any) => {
      if (entry.status === 'Posted') {
        const entryDate = new Date(entry.entry_date);
        const monthKey = entryDate.toLocaleString('default', { month: 'short' });

        if (monthlyData[monthKey]) {
          // This would need actual account type mapping from lines
          // For now, use total_debit as revenue indicator
          monthlyData[monthKey].revenue += num(entry.total_debit);
          monthlyData[monthKey].expense += num(entry.total_credit);
        }
      }
    });

    return {
      labels: last6Months,
      datasets: [
        {
          label: 'Revenue',
          data: last6Months.map(m => monthlyData[m]?.revenue || 0),
          backgroundColor: '#10B981',
          borderColor: '#059669',
        },
        {
          label: 'Expenses',
          data: last6Months.map(m => monthlyData[m]?.expense || 0),
          backgroundColor: '#EF4444',
          borderColor: '#DC2626',
        },
      ],
    };
  };

  // Calculate financial health metrics
  const totalAssets = num(balanceSheet?.assets?.total);
  const totalLiabilities = num(balanceSheet?.liabilities?.total);
  const totalEquity = num(balanceSheet?.equity?.total);

  const currentRatio = totalLiabilities > 0 ? totalAssets / totalLiabilities : 0;
  const profitMargin = profitLoss?.revenue?.total > 0
    ? (profitLoss.net_profit / profitLoss.revenue.total) * 100
    : 0;
  const debtToEquity = totalEquity > 0 ? totalLiabilities / totalEquity : 0;

  const chartData = getMonthlyChartData();

  const quickActions = [
    {
      label: 'New Journal Entry',
      icon: add_icon,
      path: '/accounting/journal-entries/create',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Chart of Accounts',
      icon: file_icon,
      path: '/accounting/chart-of-accounts',
      color: 'bg-green-50 text-green-600',
    },

    {
      label: 'Bank Accounts',
      icon: bank_icon,
      path: '/accounting/bank-accounts',
      color: 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Accounts Payable',
      icon: account_payable,
      path: '/accounting/accounts-payable',
      color: 'bg-red-50 text-red-600',
    },
    {
      label: 'Accounts Receivable',
      icon: account_rec,
      path: '/accounting/accounts-receivable',
      color: 'bg-cyan-50 text-cyan-600',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Accounting Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5 sm:text-sm sm:mt-1">Overview of your financial position</p>
          </div>
          <div className="w-full sm:w-auto">
            <DateRangePicker
              startDate={dateRange.start_date}
              endDate={dateRange.end_date}
              asOfDate={dateRange.as_of_date}
              onChange={(range) => setDateRange(range)}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-500">Total Assets</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              KWD {totalAssets.toFixed(3)}
            </p>
            <p className="text-xs text-gray-400 mt-1">As of {new Date(dateRange.as_of_date).toLocaleDateString()}</p>
          </div>

          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-500">Total Liabilities</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              KWD {totalLiabilities.toFixed(3)}
            </p>
            <p className="text-xs text-gray-400 mt-1">As of {new Date(dateRange.as_of_date).toLocaleDateString()}</p>
          </div>

          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-500">Net Income</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              KWD {num(profitLoss?.net_profit).toFixed(3)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Period to date</p>
          </div>

          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-500">Trial Balance</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              KWD {num(trialBalance?.total_debit).toFixed(3)}
            </p>
            <p className={`text-xs mt-1 ${trialBalance?.is_balanced ? 'text-green-600' : 'text-red-600'}`}>
              {trialBalance?.is_balanced ? '✓ Balanced' : '✗ Not Balanced'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(`${basePath}${action.path}`)}
                className={`p-4 rounded-xl ${action.color} hover:opacity-80 transition-opacity text-center group cursor-pointer`}
              >
                <img src={action.icon} alt="" className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-4 lg:gap-6 md:grid-cols-3">
          {/* Revenue vs Expense Chart */}
          <div className="md:col-span-2 bg-white rounded-xl p-4 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Revenue vs Expenses</h2>
              <span className="text-xs text-gray-500">Last 6 months</span>
            </div>
            <div className="h-64 sm:h-72 md:h-64">
              <FinancialChart
                type="bar"
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        boxWidth: 12,
                        font: { size: window.innerWidth < 640 ? 10 : 12 }
                      }
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Financial Health */}
          <div className="bg-white rounded-xl p-4 sm:p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Financial Health</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Current Ratio</span>
                  <span className="font-medium text-gray-900">{currentRatio.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${Math.min(currentRatio / 3 * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Profit Margin</span>
                  <span className="font-medium text-gray-900">{profitMargin.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${Math.min(profitMargin, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Debt to Equity</span>
                  <span className="font-medium text-gray-900">{debtToEquity.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500"
                    style={{ width: `${Math.min(debtToEquity / 2 * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Gross Profit</span>
                <span className="text-sm font-semibold text-green-600">
                  KWD {num(profitLoss?.gross_profit).toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Net Profit</span>
                <span className="text-sm font-semibold text-blue-600">
                  KWD {num(profitLoss?.net_profit).toFixed(3)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-2">
          {/* Recent Accounts Payable */}
          <div className="bg-white rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">Recent Payables</h2>
              <button
                onClick={() => navigate(`${basePath}/accounting/accounts-payable`)}
                className="text-xs sm:text-sm text-blue-600 hover:underline"
              >
                View All
              </button>
            </div>

            {recentAP.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">No recent payables</p>
            ) : (
              <div className="space-y-3">
                {recentAP.map((ap: any) => (
                  <div
                    key={ap.id}
                    onClick={() => navigate(`${basePath}/accounting/accounts-payable/${ap.id}`)}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-blue-600">{ap.ap_number}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px] sm:max-w-none">{ap.supplier?.supplier_name}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {ap.currency} {num(ap.outstanding_amount).toFixed(3)}
                      </p>
                      <StatusBadge status={ap.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Accounts Receivable */}
          <div className="bg-white rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">Recent Receivables</h2>
              <button
                onClick={() => navigate(`${basePath}/accounting/accounts-receivable`)}
                className="text-xs sm:text-sm text-blue-600 hover:underline"
              >
                View All
              </button>
            </div>

            {recentAR.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">No recent receivables</p>
            ) : (
              <div className="space-y-3">
                {recentAR.map((ar: any) => (
                  <div
                    key={ar.id}
                    onClick={() => navigate(`${basePath}/accounting/accounts-receivable/${ar.id}`)}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-blue-600">{ar.ar_number}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px] sm:max-w-none">{ar.customer?.name}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {ar.currency} {num(ar.outstanding_amount).toFixed(3)}
                      </p>
                      <StatusBadge status={ar.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}