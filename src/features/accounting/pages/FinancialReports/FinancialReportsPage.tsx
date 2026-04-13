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

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const [activeTab, setActiveTab] = useState<ReportTab>(
    (searchParams.get('tab') as ReportTab) || 'trial-balance'
  );

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

  const [showExportMenu, setShowExportMenu] = useState(false);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

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

  const { data: accountsData } = useGetChartOfAccountsQuery({
    is_active: 1 as any,
    per_page: 1000
  });

  const accounts = accountsData?.data ?? [];

  const report = (() => {
    switch (activeTab) {
      case 'trial-balance':
        // The data is directly in the response data property
        return (trialBalanceData as any)?.data;
      case 'profit-loss':
        return (profitLossData as any)?.data;
      case 'balance-sheet':
        return (balanceSheetData as any)?.data;
      case 'general-ledger':
        return (glData as any)?.data;
      case 'cash-flow':
        return (cashFlowData as any)?.data;
      default:
        return null;
    }
  })();

  // Debug to verify the structure
  console.log('Raw profitLossData:', profitLossData);
  console.log('Extracted report:', report);
  console.log('Revenue details:', report?.revenue);

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

  const getExportData = () => {
    if (!report) return null;

    switch (activeTab) {
      case 'trial-balance': {
        const accounts = report?.accounts || [];

        return {
          headers: ['Account Code', 'Account Name', 'Account Type', 'Debit (KWD)', 'Credit (KWD)'],
          rows: accounts.map((acc: any) => [
            acc.account_code,
            acc.account_name,
            acc.account_type,
            acc.debit?.toFixed(3) || '0.000',
            acc.credit?.toFixed(3) || '0.000',
          ]),
          title: 'Trial Balance',
          subtitle: `As of ${new Date(asOfDate).toLocaleDateString()}`,
          filename: `trial_balance_${asOfDate}`,
        };
      }

      case 'profit-loss': {
        const revenueRows = report.revenue?.details?.map((item: any) => [
          item.account_code,
          item.account_name,
          'Revenue',
          item.amount.toFixed(3),
        ]) || [];
        const expenseRows = report.operating_expenses?.details?.map((item: any) => [
          item.account_code,
          item.account_name,
          'Expense',
          item.amount.toFixed(3),
        ]) || [];
        const cogsRows = report.cost_of_goods_sold?.details?.map((item: any) => [
          item.account_code,
          item.account_name,
          'COGS',
          item.amount.toFixed(3),
        ]) || [];

        return {
          headers: ['Account Code', 'Account Name', 'Type', 'Amount (KWD)'],
          rows: [
            ...revenueRows,
            ...cogsRows,
            ['', '', 'Gross Profit', report.gross_profit?.toFixed(3) || '0.000'],
            ...expenseRows,
            ['', '', 'Net Profit', report.net_profit?.toFixed(3) || '0.000'],
          ],
          title: 'Profit & Loss Statement',
          subtitle: `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
          filename: `profit_loss_${startDate}_to_${endDate}`,
        };
      }

      case 'balance-sheet': {
        const assetRows = report.assets?.details?.map((item: any) => [
          item.account_name,
          'Asset',
          item.amount.toFixed(3),
        ]) || [];
        const liabilityRows = report.liabilities?.details?.map((item: any) => [
          item.account_name,
          'Liability',
          item.amount.toFixed(3),
        ]) || [];
        const equityRows = report.equity?.details?.map((item: any) => [
          item.account_name,
          'Equity',
          item.amount.toFixed(3),
        ]) || [];
        return {
          headers: ['Account Name', 'Type', 'Amount (KWD)'],
          rows: [
            ...assetRows,
            ['Total Assets', '', report.assets?.total?.toFixed(3) || '0.000'],
            ...liabilityRows,
            ['Total Liabilities', '', report.liabilities?.total?.toFixed(3) || '0.000'],
            ...equityRows,
            ['Total Equity', '', report.equity?.total?.toFixed(3) || '0.000'],
          ],
          title: 'Balance Sheet',
          subtitle: `As of ${new Date(asOfDate).toLocaleDateString()}`,
          filename: `balance_sheet_${asOfDate}`,
        };
      }

      case 'general-ledger': {
        const transactions = report?.transactions || [];
        return {
          headers: ['Date', 'Journal #', 'Description', 'Debit', 'Credit', 'Balance'],
          rows: transactions.map((trans: any) => [
            new Date(trans.date).toLocaleDateString(),
            trans.journal_number,
            trans.description,
            trans.debit?.toFixed(3) || '0.000',
            trans.credit?.toFixed(3) || '0.000',
            trans.balance?.toFixed(3) || '0.000',
          ]),
          title: 'General Ledger',
          subtitle: `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
          filename: `general_ledger_${startDate}_to_${endDate}`,
        };
      }

      case 'cash-flow': {
        return {
          headers: ['Activity Type', 'Amount (KWD)'],
          rows: [
            ['Operating Activities - Net Income', report.operating_activities?.net_income?.toFixed(3) || '0.000'],
            ['Operating Activities - Adjustments', report.operating_activities?.adjustments?.toFixed(3) || '0.000'],
            ['Operating Activities - Working Capital Changes', report.operating_activities?.working_capital_changes?.toFixed(3) || '0.000'],
            ['Net Cash from Operations', report.operating_activities?.net_cash?.toFixed(3) || '0.000'],
            ['Investing Activities - Purchase of Assets', report.investing_activities?.purchase_assets?.toFixed(3) || '0.000'],
            ['Investing Activities - Sale of Assets', report.investing_activities?.sale_assets?.toFixed(3) || '0.000'],
            ['Net Cash from Investing', report.investing_activities?.net_cash?.toFixed(3) || '0.000'],
            ['Financing Activities - Borrowings', report.financing_activities?.borrowings?.toFixed(3) || '0.000'],
            ['Financing Activities - Repayments', report.financing_activities?.repayments?.toFixed(3) || '0.000'],
            ['Net Cash from Financing', report.financing_activities?.net_cash?.toFixed(3) || '0.000'],
            ['Net Cash Flow', report.net_cash_flow?.toFixed(3) || '0.000'],
          ],
          title: 'Cash Flow Statement',
          subtitle: `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
          filename: `cash_flow_${startDate}_to_${endDate}`,
        };
      }

      default:
        return null;
    }
  };

  const handleExportExcel = () => {
    const exportData = getExportData();
    if (!exportData) return;

    const ws = XLSX.utils.json_to_sheet(
      exportData.rows.map((row: any) => {
        const obj: any = {};
        exportData.headers.forEach((header, idx) => {
          obj[header] = row[idx];
        });
        return obj;
      })
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, exportData.title);
    XLSX.writeFile(wb, `${exportData.filename}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const exportData = getExportData();
    if (!exportData) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(exportData.title, 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(exportData.subtitle, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

    autoTable(doc, {
      head: [exportData.headers],
      body: exportData.rows,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [23, 115, 207], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(`${exportData.filename}.pdf`);
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTabChange = (tab: ReportTab) => {
    setActiveTab(tab);
  };

  const renderDateFilters = () => {
    switch (activeTab) {
      case 'trial-balance':
      case 'balance-sheet':
        return (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <img src={calendar_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <span className="text-sm text-gray-500">As of this date</span>
          </div>
        );

      case 'profit-loss':
      case 'cash-flow':
        return (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <img src={calendar_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <span className="text-gray-500">to</span>
            <div className="relative w-full sm:w-auto">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={new Date().toISOString().split('T')[0]}
                className="w-full sm:w-auto pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <img src={calendar_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        );

      case 'general-ledger':
        return (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            <div className="relative w-full sm:min-w-[250px]">
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 text-sm"
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
            <div className="relative w-full sm:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <img src={calendar_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <span className="text-gray-500">to</span>
            <div className="relative w-full sm:w-auto">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={new Date().toISOString().split('T')[0]}
                className="w-full sm:w-auto pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <img src={calendar_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
      <div className="overflow-x-auto">
        {ACCOUNT_TYPE_ORDER.map(type => {
          const typeAccounts = groupedAccounts[type] || [];
          if (typeAccounts.length === 0) return null;

          return (
            <div key={type} className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{type}</h3>
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
                <div className="xl:col-span-4 overflow-x-auto">
                  <table className="w-full min-w-[500px]">
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
                          <td className="px-4 py-2 text-sm text-gray-900 break-words">{account.account_name}</td>
                          <td className="px-4 py-2 text-right text-sm font-mono text-gray-900 whitespace-nowrap">
                            {num(account.debit).toFixed(3)}
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-mono text-gray-900 whitespace-nowrap">
                            {num(account.credit).toFixed(3)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>



            </div>
          );
        })}

        <div className="mt-8 pt-4 border-t-2 border-gray-300">
          <div className="flex flex-col sm:flex-row justify-end gap-4 sm:gap-8">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Debit</p>
              <p className="text-lg font-bold text-blue-600 whitespace-nowrap">KWD {num(report?.total_debit).toFixed(3)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Credit</p>
              <p className="text-lg font-bold text-blue-600 whitespace-nowrap">KWD {num(report?.total_credit).toFixed(3)}</p>
            </div>
          </div>
          <div className="mt-2 text-center">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${report?.is_balanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
              {report?.is_balanced ? '✓ Balanced' : '✗ Not Balanced'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderProfitLoss = () => {
    const grossProfitMargin = report?.gross_profit_margin?.toFixed(2) || '0.00';
    const netProfitMargin = report?.net_profit_margin?.toFixed(2) || '0.00';

    return (
      <div className="space-y-6 overflow-x-auto">
        {/* Revenue */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Revenue</h3>
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
            <div className="xl:col-span-4 overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <tbody className="divide-y divide-gray-100">
                  {report.revenue?.details?.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-600">{item.account_code}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 break-words">{item.account_name}</td>
                      <td className="px-4 py-2 text-right text-sm font-mono text-gray-900 whitespace-nowrap">
                        KWD {num(item.amount).toFixed(3)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={2} className="px-4 py-2 text-sm font-semibold">Total Revenue</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-blue-600 whitespace-nowrap">
                      KWD {num(report.revenue?.total).toFixed(3)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* COGS */}
        {report.cost_of_goods_sold?.details?.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Cost of Goods Sold</h3>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
              <div className="xl:col-span-4 overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <tbody className="divide-y divide-gray-100">
                    {report.cost_of_goods_sold.details.map((item: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-600">{item.account_code}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 break-words">{item.account_name}</td>
                        <td className="px-4 py-2 text-right text-sm font-mono text-gray-900 whitespace-nowrap">
                          KWD {num(item.amount).toFixed(3)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td colSpan={2} className="px-4 py-2 text-sm font-semibold">Total COGS</td>
                      <td className="px-4 py-2 text-right text-sm font-bold text-blue-600 whitespace-nowrap">
                        KWD {num(report.cost_of_goods_sold.total).toFixed(3)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Gross Profit */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <span className="text-base font-semibold">Gross Profit</span>
            <div className="text-right">
              <span className="text-xl font-bold text-blue-600 whitespace-nowrap">
                KWD {num(report.gross_profit).toFixed(3)}
              </span>
              <p className="text-xs text-gray-500 mt-1">Margin: {grossProfitMargin}%</p>
            </div>
          </div>
        </div>

        {/* Expenses */}
        {report.operating_expenses?.details?.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Operating Expenses</h3>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
              <div className="xl:col-span-4 overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <tbody className="divide-y divide-gray-100">
                    {report.operating_expenses.details.map((item: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-600">{item.account_code}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 break-words">{item.account_name}</td>
                        <td className="px-4 py-2 text-right text-sm font-mono text-gray-900 whitespace-nowrap">
                          KWD {num(item.amount).toFixed(3)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td colSpan={2} className="px-4 py-2 text-sm font-semibold">Total Expenses</td>
                      <td className="px-4 py-2 text-right text-sm font-bold text-blue-600 whitespace-nowrap">
                        KWD {num(report.operating_expenses.total).toFixed(3)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Net Profit */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <span className="text-base font-semibold">Net Profit</span>
            <div className="text-right">
              <span className="text-xl font-bold text-green-600 whitespace-nowrap">
                KWD {num(report.net_profit).toFixed(3)}
              </span>
              <p className="text-xs text-gray-500 mt-1">Margin: {netProfitMargin}%</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    const assetsByType = report?.assets?.details?.reduce((acc: any, item: any) => {
      const type = item.account_sub_type || 'Current Assets';
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    }, {}) || {};

    const liabilitiesByType = report?.liabilities?.details?.reduce((acc: any, item: any) => {
      const type = item.account_sub_type || 'Current Liabilities';
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    }, {}) || {};

    return (
      <div className="flex flex-col lg:flex-row lg:gap-8 gap-6 overflow-x-auto">
        {/* Assets */}
        <div className="flex-1 min-w-[280px]">
          <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">ASSETS</h3>

          {Object.entries(assetsByType).map(([type, items]: [string, any]) => (
            <div key={type} className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">{type}</h4>
              <div className="space-y-1">
                {(items as any[]).map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600 break-words">{item.account_name}</span>
                    <span className="font-mono whitespace-nowrap ml-2">KWD {num(item.amount).toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-4 pt-2 border-t-2 border-gray-200">
            <div className="flex justify-between text-base font-bold">
              <span>Total Assets</span>
              <span className="text-blue-600 whitespace-nowrap">KWD {num(report?.assets?.total).toFixed(3)}</span>
            </div>
          </div>
        </div>

        {/* Liabilities & Equity */}
        <div className="flex-1 min-w-[280px]">
          <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">LIABILITIES</h3>

          {Object.entries(liabilitiesByType).map(([type, items]: [string, any]) => (
            <div key={type} className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">{type}</h4>
              <div className="space-y-1">
                {(items as any[]).map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600 break-words">{item.account_name}</span>
                    <span className="font-mono whitespace-nowrap ml-2">KWD {num(item.amount).toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-4 pt-2 border-t-2 border-gray-200">
            <div className="flex justify-between text-base font-bold">
              <span>Total Liabilities</span>
              <span className="text-orange-600 whitespace-nowrap">KWD {num(report?.liabilities?.total).toFixed(3)}</span>
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mt-6 mb-4 pb-2 border-b-2 border-gray-200">EQUITY</h3>

          {report?.equity?.details?.map((item: any, index: number) => (
            <div key={index} className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 break-words">{item.account_name}</span>
              <span className="font-mono whitespace-nowrap ml-2">KWD {num(item.amount).toFixed(3)}</span>
            </div>
          ))}

          <div className="mt-4 pt-2 border-t-2 border-gray-200">
            <div className="flex justify-between text-base font-bold">
              <span>Total Equity</span>
              <span className="text-green-600 whitespace-nowrap">KWD {num(report?.equity?.total).toFixed(3)}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t-4 border-gray-300">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Liabilities & Equity</span>
              <span className="text-purple-600 whitespace-nowrap">KWD {num(report?.total_liabilities_and_equity).toFixed(3)}</span>
            </div>
            <div className="mt-2 text-center">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${report?.is_balanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
      <div className="overflow-x-auto">
        {/* Account Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Opening Balance</p>
            <p className="text-base sm:text-lg font-bold whitespace-nowrap">KWD {num(report.opening_balance).toFixed(3)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Closing Balance</p>
            <p className="text-base sm:text-lg font-bold text-blue-600 whitespace-nowrap">KWD {num(report.closing_balance).toFixed(3)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Net Change</p>
            <p className={`text-base sm:text-lg font-bold whitespace-nowrap ${num(report.closing_balance - report.opening_balance) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
              KWD {(num(report.closing_balance) - num(report.opening_balance)).toFixed(3)}
            </p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
          <div className="xl:col-span-4 overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase whitespace-nowrap">Journal #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase whitespace-nowrap">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase whitespace-nowrap">Debit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase whitespace-nowrap">Credit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase whitespace-nowrap">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.transactions?.map((trans: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm whitespace-nowrap">{new Date(trans.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-sm font-mono text-blue-600 whitespace-nowrap">{trans.journal_number}</td>
                    <td className="px-4 py-2 text-sm max-w-xs truncate">{trans.description}</td>
                    <td className="px-4 py-2 text-right text-sm font-mono whitespace-nowrap">{num(trans.debit).toFixed(3)}</td>
                    <td className="px-4 py-2 text-right text-sm font-mono whitespace-nowrap">{num(trans.credit).toFixed(3)}</td>
                    <td className="px-4 py-2 text-right text-sm font-mono font-bold text-blue-600 whitespace-nowrap">
                      KWD {num(trans.balance).toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-right">Closing Balance</td>
                  <td className="px-4 py-3 text-right text-sm font-mono font-bold text-blue-600 whitespace-nowrap">
                    KWD {num(report.closing_balance).toFixed(3)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>
    );
  };

  const renderCashFlow = () => {
    const operatingCash = num(report?.operating_activities?.net_cash || 0);
    const investingCash = num(report?.investing_activities?.net_cash || 0);
    const financingCash = num(report?.financing_activities?.net_cash || 0);
    const netCashFlow = num(report?.net_cash_flow || 0);

    return (
      <div className="space-y-6">
        {/* Summary Cards - Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Operating</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-700 mt-1">
                  KWD {operatingCash.toFixed(3)}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-blue-500 mt-2">Cash from Operations</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">Investing</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-700 mt-1">
                  KWD {investingCash.toFixed(3)}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-orange-500 mt-2">Cash from Investments</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Financing</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-700 mt-1">
                  KWD {financingCash.toFixed(3)}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-purple-500 mt-2">Cash from Financing</p>
          </div>

          <div className={`bg-gradient-to-br rounded-xl p-4 border ${netCashFlow >= 0
              ? 'from-green-50 to-green-100 border-green-200'
              : 'from-red-50 to-red-100 border-red-200'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide ${
                netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
              }">Net Change</p>
                <p className={`text-xl sm:text-2xl font-bold mt-1 ${netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                  KWD {netCashFlow.toFixed(3)}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${netCashFlow >= 0 ? 'bg-green-200' : 'bg-red-200'
                }`}>
                <svg className={`w-5 h-5 ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {netCashFlow >= 0 ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  )}
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Overall Cash Flow</p>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Operating Activities */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <h3 className="text-black font-semibold">Operating Activities</h3>
                </div>
                <span className="text-black/80 text-xs">Primary Business</span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Net Income</span>
                <span className="text-sm font-mono font-medium text-gray-900">
                  KWD {num(report?.operating_activities?.net_income || 0).toFixed(3)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Non-Cash Adjustments</span>
                <span className="text-sm font-mono font-medium text-blue-600">
                  KWD {num(report?.operating_activities?.adjustments || 0).toFixed(3)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Working Capital Changes</span>
                <span className="text-sm font-mono font-medium text-orange-600">
                  KWD {num(report?.operating_activities?.working_capital_changes || 0).toFixed(3)}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t-2 border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">Net Cash from Operations</span>
                  <span className="text-base font-bold text-blue-600">
                    KWD {operatingCash.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Investing Activities */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-black font-semibold">Investing Activities</h3>
                </div>
                <span className="text-black/80 text-xs">Asset Management</span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Purchase of Assets</span>
                <span className="text-sm font-mono font-medium text-red-600">
                  (KWD {num(report?.investing_activities?.purchase_assets || 0).toFixed(3)})
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Sale of Assets</span>
                <span className="text-sm font-mono font-medium text-green-600">
                  KWD {num(report?.investing_activities?.sale_assets || 0).toFixed(3)}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t-2 border-orange-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">Net Cash from Investing</span>
                  <span className="text-base font-bold text-orange-600">
                    KWD {investingCash.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Financing Activities */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-black font-semibold">Financing Activities</h3>
                </div>
                <span className="text-black/80 text-xs">Capital Structure</span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Proceeds from Borrowings</span>
                <span className="text-sm font-mono font-medium text-green-600">
                  KWD {num(report?.financing_activities?.borrowings || 0).toFixed(3)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Debt Repayments</span>
                <span className="text-sm font-mono font-medium text-red-600">
                  (KWD {num(report?.financing_activities?.repayments || 0).toFixed(3)})
                </span>
              </div>

              <div className="mt-3 pt-3 border-t-2 border-purple-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">Net Cash from Financing</span>
                  <span className="text-base font-bold text-purple-600">
                    KWD {financingCash.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Net Cash Flow Summary */}
        <div className={`rounded-xl overflow-hidden shadow-lg ${netCashFlow >= 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'
          }`}>
          <div className="px-6 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-white/80 text-sm font-medium uppercase tracking-wide">Total Cash Flow for Period</p>
                <p className="text-white text-2xl sm:text-3xl font-bold mt-1">
                  KWD {Math.abs(netCashFlow).toFixed(3)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-lg ${netCashFlow >= 0 ? 'bg-white/20' : 'bg-white/20'
                  }`}>
                  <div className="flex items-center gap-2">
                    {netCashFlow >= 0 ? (
                      <>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        <span className="text-white font-medium">Net Increase</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        <span className="text-white font-medium">Net Decrease</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-white/70 text-xs">
                  <p>Compared to previous period</p>
                </div>
              </div>
            </div>

            {/* Mini trend indicator */}
            <div className="mt-4 h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${netCashFlow >= 0 ? 'bg-white' : 'bg-white'
                  }`}
                style={{ width: `${Math.min(Math.abs(netCashFlow) / 1000, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-600">
                Cash Flow Statement Summary
              </span>
            </div>
            <div className="text-xs text-gray-400">
              Operating + Investing + Financing = Net Cash Flow
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate(`${basePath}/accounting`)}
              className="hover:bg-gray-100 p-2 rounded-lg transition-colors flex-shrink-0"
            >
              <img src={arrow_back_icon} alt="" className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Financial Reports</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">View and analyze financial statements</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <img src={refresh_icon} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Export"
              >
                <img src={download_icon} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                    <button
                      onClick={handleExportPDF}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-t-lg"
                    >
                      Export PDF
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-b-lg"
                    >
                      Export Excel
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handlePrint}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Print"
            >
              <img src={print_icon} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          {/* Desktop Tabs - Horizontal layout */}
          <div className="hidden sm:block overflow-x-auto">
            <nav className="flex -mb-px space-x-8 min-w-max">
              {TAB_CONFIG.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as ReportTab)}
                  className={`
            py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap
            ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
          `}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Mobile Dropdown Select */}
          <div className="sm:hidden p-3">
            <div className="relative">
              <select
                value={activeTab}
                onChange={(e) => handleTabChange(e.target.value as ReportTab)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {TAB_CONFIG.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.icon} {tab.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
          {renderDateFilters()}
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm print:p-0 overflow-x-auto">
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              {TAB_CONFIG.find(t => t.id === activeTab)?.label}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 break-words">
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