// src/features/accounting/pages/financial-reports/FinancialReportsPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import {
  useGetTrialBalanceQuery,
  useGetProfitLossQuery,
  useGetBalanceSheetQuery,
  useGetGeneralLedgerQuery,
  useGetCashFlowQuery,
  useGetChartOfAccountsQuery
} from '../../../../services/accountingApi';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import download_icon from '../../../../assets/icons/download_icon.png';
import print_icon from '../../../../assets/icons/print_icon.png';
import refresh_icon from '../../../../assets/icons/refresh_icon.png';
import calendar_icon from '../../../../assets/icons/calender_icon.png';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

type ReportTab = 'trial-balance' | 'profit-loss' | 'balance-sheet' | 'general-ledger' | 'cash-flow';

const num = (v: any) => parseFloat(v) || 0;

const ACCOUNT_TYPE_ORDER = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense', 'Cost of Goods Sold'];

const TAB_CONFIG = [
  { id: 'trial-balance', label: 'Trial Balance', icon: '⚖️' },
  { id: 'profit-loss', label: 'Profit & Loss', icon: '📊' },
  { id: 'balance-sheet', label: 'Balance Sheet', icon: '📑' },
  { id: 'general-ledger', label: 'General Ledger', icon: '📒' },
  { id: 'cash-flow', label: 'Cash Flow', icon: '💰' },
];

export default function FinancialReportsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAppSelector((state: RootState) => state.auth);
  
  // Get tab from URL or default to trial-balance
  const [activeTab, setActiveTab] = useState<ReportTab>(
    (searchParams.get('tab') as ReportTab) || 'trial-balance'
  );

  // Date states
  const [asOfDate, setAsOfDate] = useState(
    searchParams.get('as_of_date') || new Date().toISOString().split('T')[0]
  );
  
  const [startDate, setStartDate] = useState(
    searchParams.get('start_date') || 
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  
  const [endDate, setEndDate] = useState(
    searchParams.get('end_date') || new Date().toISOString().split('T')[0]
  );

  const [selectedAccount, setSelectedAccount] = useState(
    searchParams.get('account_id') || ''
  );

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  // Update URL when filters change
  useEffect(() => {
    const params: any = { tab: activeTab };
    if (activeTab === 'trial-balance' || activeTab === 'balance-sheet') {
      params.as_of_date = asOfDate;
    } else if (activeTab === 'profit-loss' || activeTab === 'cash-flow') {
      params.start_date = startDate;
      params.end_date = endDate;
    } else if (activeTab === 'general-ledger') {
      params.start_date = startDate;
      params.end_date = endDate;
      if (selectedAccount) params.account_id = selectedAccount;
    }
    setSearchParams(params);
  }, [activeTab, asOfDate, startDate, endDate, selectedAccount]);

  // Fetch data based on active tab
  const { data: trialBalanceData, isLoading: trialLoading, refetch: refetchTrial } = useGetTrialBalanceQuery(
    { as_of_date: asOfDate },
    { skip: activeTab !== 'trial-balance' }
  );

  const { data: profitLossData, isLoading: plLoading, refetch: refetchPL } = useGetProfitLossQuery(
    { start_date: startDate, end_date: endDate },
    { skip: activeTab !== 'profit-loss' }
  );

  const { data: balanceSheetData, isLoading: bsLoading, refetch: refetchBS } = useGetBalanceSheetQuery(
    { as_of_date: asOfDate },
    { skip: activeTab !== 'balance-sheet' }
  );

  const { data: glData, isLoading: glLoading, refetch: refetchGL } = useGetGeneralLedgerQuery(
    { 
      account_id: selectedAccount ? parseInt(selectedAccount) : 0, 
      start_date: startDate, 
      end_date: endDate 
    },
    { skip: activeTab !== 'general-ledger' || !selectedAccount }
  );

  const { data: cashFlowData, isLoading: cfLoading, refetch: refetchCF } = useGetCashFlowQuery(
    { start_date: startDate, end_date: endDate },
    { skip: activeTab !== 'cash-flow' }
  );

  // Get accounts for GL dropdown
  const { data: accountsData } = useGetChartOfAccountsQuery({
    is_active: 1 as any,
    per_page: 1000
  });

  const accounts = accountsData?.data ?? [];

  const report = (() => {
    switch (activeTab) {
      case 'trial-balance': return (trialBalanceData as any)?.data;
      case 'profit-loss': return (profitLossData as any)?.data;
      case 'balance-sheet': return (balanceSheetData as any)?.data;
      case 'general-ledger': return (glData as any)?.data;
      case 'cash-flow': return (cashFlowData as any)?.data;
      default: return null;
    }
  })();

  const isLoading = () => {
    switch (activeTab) {
      case 'trial-balance': return trialLoading;
      case 'profit-loss': return plLoading;
      case 'balance-sheet': return bsLoading;
      case 'general-ledger': return glLoading;
      case 'cash-flow': return cfLoading;
      default: return false;
    }
  };

  const handleRefresh = () => {
    switch (activeTab) {
      case 'trial-balance': refetchTrial(); break;
      case 'profit-loss': refetchPL(); break;
      case 'balance-sheet': refetchBS(); break;
      case 'general-ledger': refetchGL(); break;
      case 'cash-flow': refetchCF(); break;
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting ${activeTab} as ${format}`);
    // Implement export logic
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTabChange = (tab: ReportTab) => {
    setActiveTab(tab);
  };

  // Render date filters based on active tab
  const renderDateFilters = () => {
    switch (activeTab) {
      case 'trial-balance':
      case 'balance-sheet':
        return (
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <img src={calendar_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <span className="text-sm text-gray-500">As of this date</span>
          </div>
        );

      case 'profit-loss':
      case 'cash-flow':
        return (
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <img src={calendar_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <span className="text-gray-500">to</span>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={new Date().toISOString().split('T')[0]}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <img src={calendar_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        );

      case 'general-ledger':
        return (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative min-w-[250px]">
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Account</option>
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
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <img src={calendar_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <span className="text-gray-500">to</span>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={new Date().toISOString().split('T')[0]}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <img src={calendar_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render report content based on active tab
  const renderReport = () => {
    if (isLoading()) {
      return (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      );
    }

    if (!report) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No data available for this period</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'trial-balance':
        return renderTrialBalance();
      case 'profit-loss':
        return renderProfitLoss();
      case 'balance-sheet':
        return renderBalanceSheet();
      case 'general-ledger':
        return renderGeneralLedger();
      case 'cash-flow':
        return renderCashFlow();
      default:
        return null;
    }
  };

  const renderTrialBalance = () => {
    const accounts = report?.accounts || [];
    const groupedAccounts = accounts.reduce((acc: any, account: any) => {
      if (!acc[account.account_type]) acc[account.account_type] = [];
      acc[account.account_type].push(account);
      return acc;
    }, {});

    return (
      <>
        {ACCOUNT_TYPE_ORDER.map(type => {
          const typeAccounts = groupedAccounts[type] || [];
          if (typeAccounts.length === 0) return null;

          return (
            <div key={type} className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{type}</h3>
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Account</th>
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

        <div className="mt-8 pt-4 border-t-2 border-gray-300">
          <div className="flex justify-end gap-8">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Debit</p>
              <p className="text-lg font-bold text-blue-600">KWD {num(report?.total_debit).toFixed(3)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Credit</p>
              <p className="text-lg font-bold text-blue-600">KWD {num(report?.total_credit).toFixed(3)}</p>
            </div>
          </div>
          <div className="mt-2 text-center">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              report?.is_balanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {report?.is_balanced ? '✓ Balanced' : '✗ Not Balanced'}
            </span>
          </div>
        </div>
      </>
    );
  };

  const renderProfitLoss = () => {
    const grossProfitMargin = report?.gross_profit_margin?.toFixed(2) || '0.00';
    const netProfitMargin = report?.net_profit_margin?.toFixed(2) || '0.00';

    return (
      <div className="space-y-6">
        {/* Revenue */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Revenue</h3>
          <table className="w-full">
            <tbody className="divide-y divide-gray-100">
              {report.revenue.details.map((item: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-600">{item.account_code}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{item.account_name}</td>
                  <td className="px-4 py-2 text-right text-sm font-mono text-gray-900">
                    KWD {num(item.amount).toFixed(3)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={2} className="px-4 py-2 text-sm font-semibold">Total Revenue</td>
                <td className="px-4 py-2 text-right text-sm font-bold text-blue-600">
                  KWD {num(report.revenue.total).toFixed(3)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* COGS */}
        {report.cost_of_goods_sold.details.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Cost of Goods Sold</h3>
            <table className="w-full">
              <tbody className="divide-y divide-gray-100">
                {report.cost_of_goods_sold.details.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-600">{item.account_code}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.account_name}</td>
                    <td className="px-4 py-2 text-right text-sm font-mono text-gray-900">
                      KWD {num(item.amount).toFixed(3)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td colSpan={2} className="px-4 py-2 text-sm font-semibold">Total COGS</td>
                  <td className="px-4 py-2 text-right text-sm font-bold text-blue-600">
                    KWD {num(report.cost_of_goods_sold.total).toFixed(3)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Gross Profit */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold">Gross Profit</span>
            <span className="text-xl font-bold text-blue-600">
              KWD {num(report.gross_profit).toFixed(3)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Margin: {grossProfitMargin}%</p>
        </div>

        {/* Expenses */}
        {report.operating_expenses.details.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Operating Expenses</h3>
            <table className="w-full">
              <tbody className="divide-y divide-gray-100">
                {report.operating_expenses.details.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-600">{item.account_code}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.account_name}</td>
                    <td className="px-4 py-2 text-right text-sm font-mono text-gray-900">
                      KWD {num(item.amount).toFixed(3)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td colSpan={2} className="px-4 py-2 text-sm font-semibold">Total Expenses</td>
                  <td className="px-4 py-2 text-right text-sm font-bold text-blue-600">
                    KWD {num(report.operating_expenses.total).toFixed(3)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Net Profit */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold">Net Profit</span>
            <span className="text-xl font-bold text-green-600">
              KWD {num(report.net_profit).toFixed(3)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Margin: {netProfitMargin}%</p>
        </div>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    const assetsByType = report?.assets.details.reduce((acc: any, item: any) => {
      const type = item.account_sub_type || 'Current Assets';
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    }, {});

    const liabilitiesByType = report?.liabilities.details.reduce((acc: any, item: any) => {
      const type = item.account_sub_type || 'Current Liabilities';
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    }, {});

    return (
      <div className="grid grid-cols-2 gap-8">
        {/* Assets */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">ASSETS</h3>
          
          {Object.entries(assetsByType || {}).map(([type, items]: [string, any]) => (
            <div key={type} className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">{type}</h4>
              <div className="space-y-1">
                {(items as any[]).map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.account_name}</span>
                    <span className="font-mono">KWD {num(item.amount).toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-4 pt-2 border-t-2 border-gray-200">
            <div className="flex justify-between text-base font-bold">
              <span>Total Assets</span>
              <span className="text-blue-600">KWD {num(report?.assets.total).toFixed(3)}</span>
            </div>
          </div>
        </div>

        {/* Liabilities & Equity */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">LIABILITIES</h3>
          
          {Object.entries(liabilitiesByType || {}).map(([type, items]: [string, any]) => (
            <div key={type} className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">{type}</h4>
              <div className="space-y-1">
                {(items as any[]).map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.account_name}</span>
                    <span className="font-mono">KWD {num(item.amount).toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-4 pt-2 border-t-2 border-gray-200">
            <div className="flex justify-between text-base font-bold">
              <span>Total Liabilities</span>
              <span className="text-orange-600">KWD {num(report?.liabilities.total).toFixed(3)}</span>
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mt-6 mb-4 pb-2 border-b-2 border-gray-200">EQUITY</h3>

          {report?.equity.details.map((item: any, index: number) => (
            <div key={index} className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">{item.account_name}</span>
              <span className="font-mono">KWD {num(item.amount).toFixed(3)}</span>
            </div>
          ))}

          <div className="mt-4 pt-2 border-t-2 border-gray-200">
            <div className="flex justify-between text-base font-bold">
              <span>Total Equity</span>
              <span className="text-green-600">KWD {num(report?.equity.total).toFixed(3)}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t-4 border-gray-300">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Liabilities & Equity</span>
              <span className="text-purple-600">KWD {num(report?.total_liabilities_and_equity).toFixed(3)}</span>
            </div>
            <div className="mt-2 text-center">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                report?.is_balanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {report?.is_balanced ? '✓ Balanced' : '✗ Not Balanced'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGeneralLedger = () => {
    if (!selectedAccount) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Please select an account to view the general ledger</p>
        </div>
      );
    }

    return (
      <>
        {/* Account Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Opening Balance</p>
            <p className="text-lg font-bold">KWD {num(report.opening_balance).toFixed(3)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Closing Balance</p>
            <p className="text-lg font-bold text-blue-600">KWD {num(report.closing_balance).toFixed(3)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Net Change</p>
            <p className={`text-lg font-bold ${
              num(report.closing_balance - report.opening_balance) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              KWD {(num(report.closing_balance) - num(report.opening_balance)).toFixed(3)}
            </p>
          </div>
        </div>

        {/* Transactions Table */}
        <table className="w-full">
          <thead className="bg-gray-50 border-y border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Journal #</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Description</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Debit</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Credit</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {report.transactions.map((trans: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm">{new Date(trans.date).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-sm font-mono text-blue-600">{trans.journal_number}</td>
                <td className="px-4 py-2 text-sm max-w-xs truncate">{trans.description}</td>
                <td className="px-4 py-2 text-right text-sm font-mono">{num(trans.debit).toFixed(3)}</td>
                <td className="px-4 py-2 text-right text-sm font-mono">{num(trans.credit).toFixed(3)}</td>
                <td className="px-4 py-2 text-right text-sm font-mono font-bold text-blue-600">
                  KWD {num(trans.balance).toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            <tr>
              <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-right">Closing Balance</td>
              <td className="px-4 py-3 text-right text-sm font-mono font-bold text-blue-600">
                KWD {num(report.closing_balance).toFixed(3)}
              </td>
            </tr>
          </tfoot>
        </table>
      </>
    );
  };

  const renderCashFlow = () => {
    return (
      <div className="space-y-6">
        {/* Operating Activities */}
        <div>
          <h3 className="text-lg font-bold mb-4 pb-2 border-b-2">Operating Activities</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Net Income</span>
              <span className="font-mono">KWD {num(report?.operating_activities?.net_income || 0).toFixed(3)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Adjustments</span>
              <span className="font-mono">KWD {num(report?.operating_activities?.adjustments || 0).toFixed(3)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Working Capital Changes</span>
              <span className="font-mono">KWD {num(report?.operating_activities?.working_capital_changes || 0).toFixed(3)}</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t">
            <div className="flex justify-between text-base font-semibold">
              <span>Net Cash from Operations</span>
              <span className="text-green-600">KWD {num(report?.operating_activities?.net_cash || 0).toFixed(3)}</span>
            </div>
          </div>
        </div>

        {/* Investing Activities */}
        <div>
          <h3 className="text-lg font-bold mb-4 pb-2 border-b-2">Investing Activities</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Purchase of Assets</span>
              <span className="font-mono text-red-600">KWD {num(report?.investing_activities?.purchase_assets || 0).toFixed(3)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sale of Assets</span>
              <span className="font-mono text-green-600">KWD {num(report?.investing_activities?.sale_assets || 0).toFixed(3)}</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t">
            <div className="flex justify-between text-base font-semibold">
              <span>Net Cash from Investing</span>
              <span className="text-orange-600">KWD {num(report?.investing_activities?.net_cash || 0).toFixed(3)}</span>
            </div>
          </div>
        </div>

        {/* Financing Activities */}
        <div>
          <h3 className="text-lg font-bold mb-4 pb-2 border-b-2">Financing Activities</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Borrowings</span>
              <span className="font-mono text-green-600">KWD {num(report?.financing_activities?.borrowings || 0).toFixed(3)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Repayments</span>
              <span className="font-mono text-red-600">KWD {num(report?.financing_activities?.repayments || 0).toFixed(3)}</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t">
            <div className="flex justify-between text-base font-semibold">
              <span>Net Cash from Financing</span>
              <span className="text-purple-600">KWD {num(report?.financing_activities?.net_cash || 0).toFixed(3)}</span>
            </div>
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className="mt-6 pt-4 border-t-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Net Cash Flow</span>
            <span className={num(report?.net_cash_flow) >= 0 ? 'text-green-600' : 'text-red-600'}>
              KWD {num(report?.net_cash_flow).toFixed(3)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`${basePath}/accounting`)} className="hover:bg-gray-100 p-2 rounded-lg">
              <img src={arrow_back_icon} alt="" className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
              <p className="text-sm text-gray-500 mt-1">View and analyze financial statements</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Refresh"
            >
              <img src={refresh_icon} alt="" className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Export as PDF"
            >
              <img src={download_icon} alt="" className="w-5 h-5" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Print"
            >
              <img src={print_icon} alt="" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as ReportTab)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4">
          {renderDateFilters()}
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-xl p-6 shadow-sm print:p-0">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {TAB_CONFIG.find(t => t.id === activeTab)?.label}
            </h2>
            <p className="text-sm text-gray-500">
              {activeTab === 'trial-balance' && `As of ${new Date(asOfDate).toLocaleDateString()}`}
              {activeTab === 'balance-sheet' && `As of ${new Date(asOfDate).toLocaleDateString()}`}
              {(activeTab === 'profit-loss' || activeTab === 'cash-flow') && 
                `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
              {activeTab === 'general-ledger' && selectedAccount && 
                `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
            </p>
          </div>

          {renderReport()}
        </div>
      </div>
    </DashboardLayout>
  );
}