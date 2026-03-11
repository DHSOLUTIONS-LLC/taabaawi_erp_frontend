// src/features/accounting/pages/financial-reports/CashFlowPage.tsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { useGetCashFlowQuery } from '../../../../services/accountingApi';
import ReportHeader from '../../components/ReportHeader';
import ReportActions from '../../components/ReportActions';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';

const num = (v: any) => parseFloat(v) || 0;

export default function CashFlowPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state: RootState) => state.auth);
  
  const [dateRange, setDateRange] = useState({
    start_date: searchParams.get('start_date') || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end_date: searchParams.get('end_date') || new Date().toISOString().split('T')[0],
  });

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const { data, isLoading, refetch } = useGetCashFlowQuery(dateRange);

  const report = (data as any)?.data;

  const handleDateChange = (field: 'start_date' | 'end_date', value: string) => {
    const newRange = { ...dateRange, [field]: value };
    setDateRange(newRange);
    navigate(`?start_date=${newRange.start_date}&end_date=${newRange.end_date}`, { replace: true });
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting cash flow statement as ${format}`);
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
              <h1 className="text-2xl font-bold text-gray-900">Cash Flow Statement</h1>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(dateRange.start_date).toLocaleDateString()} - {new Date(dateRange.end_date).toLocaleDateString()}
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
            onChange={(e) => handleDateChange('start_date', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end_date}
            onChange={(e) => handleDateChange('end_date', e.target.value)}
            min={dateRange.start_date}
            max={new Date().toISOString().split('T')[0]}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-xl p-6 shadow-sm print:p-0">
          <ReportHeader
            title="Cash Flow Statement"
            subtitle={`For the period ${new Date(dateRange.start_date).toLocaleDateString()} to ${new Date(dateRange.end_date).toLocaleDateString()}`}
          />

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : !report ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No data available for this period</p>
              <p className="text-xs text-gray-400 mt-2">
                Note: This is a simplified cash flow statement. Full implementation requires detailed transaction classification.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Operating Activities */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
                  Cash Flows from Operating Activities
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Net Income</span>
                    <span className="font-mono text-gray-900">
                      KWD {num(report?.operating_activities?.net_income || 0).toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Adjustments to reconcile net income</span>
                    <span className="font-mono text-gray-900">
                      KWD {num(report?.operating_activities?.adjustments || 0).toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Changes in working capital</span>
                    <span className="font-mono text-gray-900">
                      KWD {num(report?.operating_activities?.working_capital_changes || 0).toFixed(3)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <div className="flex justify-between text-base font-semibold">
                    <span>Net Cash from Operating Activities</span>
                    <span className="text-green-600">
                      KWD {num(report?.operating_activities?.net_cash || 0).toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Investing Activities */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
                  Cash Flows from Investing Activities
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Purchase of fixed assets</span>
                    <span className="font-mono text-red-600">
                      KWD {num(report?.investing_activities?.purchase_assets || 0).toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sale of fixed assets</span>
                    <span className="font-mono text-green-600">
                      KWD {num(report?.investing_activities?.sale_assets || 0).toFixed(3)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <div className="flex justify-between text-base font-semibold">
                    <span>Net Cash from Investing Activities</span>
                    <span className="text-orange-600">
                      KWD {num(report?.investing_activities?.net_cash || 0).toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financing Activities */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
                  Cash Flows from Financing Activities
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Proceeds from borrowings</span>
                    <span className="font-mono text-green-600">
                      KWD {num(report?.financing_activities?.borrowings || 0).toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Repayment of borrowings</span>
                    <span className="font-mono text-red-600">
                      KWD {num(report?.financing_activities?.repayments || 0).toFixed(3)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <div className="flex justify-between text-base font-semibold">
                    <span>Net Cash from Financing Activities</span>
                    <span className="text-purple-600">
                      KWD {num(report?.financing_activities?.net_cash || 0).toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Cash Flow */}
              <div className="mt-6 pt-4 border-t-4 border-gray-300">
                <div className="flex justify-between text-lg font-bold">
                  <span>Net Increase (Decrease) in Cash</span>
                  <span className={num(report?.net_cash_flow) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    KWD {num(report?.net_cash_flow).toFixed(3)}
                  </span>
                </div>
              </div>

              {/* Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-xs text-yellow-700">
                  Note: This is a simplified cash flow statement. Full implementation with detailed transaction classification 
                  would provide more accurate categorization of operating, investing, and financing activities.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}