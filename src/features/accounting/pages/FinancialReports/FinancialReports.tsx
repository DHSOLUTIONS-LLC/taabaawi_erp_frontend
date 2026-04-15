// src/features/accounting/pages/financial-reports/FinancialReports.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import DateRangePicker from '../../components/DateRangePicker';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import file_icon from '../../../../assets/icons/file_icon.svg';
import chart_icon from '../../../../assets/icons/chart_icon.svg';

const REPORT_TYPES = [
  {
    id: 'trial-balance',
    title: 'Trial Balance',
    description: 'List all accounts with their debit and credit balances',
    icon: chart_icon,
    color: 'bg-blue-50 text-blue-600',
    path: '/accounting/financial-reports/trial-balance'
  },
  {
    id: 'profit-loss',
    title: 'Profit & Loss',
    description: 'Income statement showing revenues, expenses, and net profit',
    icon: file_icon,
    color: 'bg-green-50 text-green-600',
    path: '/accounting/financial-reports/profit-loss'
  },
  {
    id: 'balance-sheet',
    title: 'Balance Sheet',
    description: 'Assets, liabilities, and equity snapshot',
    icon: file_icon,
    color: 'bg-purple-50 text-purple-600',
    path: '/accounting/financial-reports/balance-sheet'
  },
  {
    id: 'general-ledger',
    title: 'General Ledger',
    description: 'Detailed transaction history by account',
    icon: file_icon,
    color: 'bg-orange-50 text-orange-600',
    path: '/accounting/financial-reports/general-ledger'
  },
  {
    id: 'cash-flow',
    title: 'Cash Flow Statement',
    description: 'Cash inflows and outflows',
    icon: chart_icon,
    color: 'bg-cyan-50 text-cyan-600',
    path: '/accounting/financial-reports/cash-flow'
  },
];

export default function FinancialReports() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    as_of_date: new Date().toISOString().split('T')[0],
  });

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`${basePath}/accounting`)}>
              <img src={arrow_back_icon} alt="" className="w-8 h-8" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
              <p className="text-sm text-gray-500 mt-1">View and generate financial statements</p>
            </div>
          </div>
          <DateRangePicker
            startDate={dateRange.start_date}
            endDate={dateRange.end_date}
            asOfDate={dateRange.as_of_date}
            onChange={(range) => setDateRange(range)}
          />
        </div>

        {/* Report Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REPORT_TYPES.map((report) => (
            <button
              key={report.id}
              onClick={() => navigate(`${basePath}${report.path}`)}
              className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow text-left group"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${report.color} group-hover:scale-110 transition-transform`}>
                  <img src={report.icon} alt="" className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{report.title}</h3>
                  <p className="text-sm text-gray-500">{report.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate(`${basePath}/accounting/financial-reports/trial-balance`)}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
            >
              <span className="text-sm font-medium text-gray-700">Trial Balance</span>
            </button>
            <button
              onClick={() => navigate(`${basePath}/accounting/financial-reports/profit-loss`)}
              className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-center"
            >
              <span className="text-sm font-medium text-gray-700">Profit & Loss</span>
            </button>
            <button
              onClick={() => navigate(`${basePath}/accounting/financial-reports/balance-sheet`)}
              className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-center"
            >
              <span className="text-sm font-medium text-gray-700">Balance Sheet</span>
            </button>
            <button
              onClick={() => navigate(`${basePath}/accounting/financial-reports/general-ledger`)}
              className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors text-center"
            >
              <span className="text-sm font-medium text-gray-700">General Ledger</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}