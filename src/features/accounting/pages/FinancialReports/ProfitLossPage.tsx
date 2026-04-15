// src/features/accounting/pages/financial-reports/ProfitLossPage.tsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { useGetProfitLossQuery } from '../../../../services/accountingApi';
import ReportHeader from '../../components/ReportHeader';
import ReportActions from '../../components/ReportActions';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';

const num = (v: any) => parseFloat(v) || 0;

export default function ProfitLossPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state: RootState) => state.auth);
  
  const [dateRange, setDateRange] = useState({
    start_date: searchParams.get('start_date') || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end_date: searchParams.get('end_date') || new Date().toISOString().split('T')[0],
  });

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const { data, isLoading, refetch } = useGetProfitLossQuery(dateRange);

  const report = (data as any)?.data;

  const handleDateChange = (field: 'start_date' | 'end_date', value: string) => {
    const newRange = { ...dateRange, [field]: value };
    setDateRange(newRange);
    navigate(`?start_date=${newRange.start_date}&end_date=${newRange.end_date}`, { replace: true });
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting profit & loss as ${format}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const grossProfitMargin = report?.gross_profit_margin?.toFixed(2) || '0.00';
  const netProfitMargin = report?.net_profit_margin?.toFixed(2) || '0.00';

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
              <h1 className="text-2xl font-bold text-gray-900">Profit & Loss Statement</h1>
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
        <div className="bg-white rounded-xl p-4 print:p-0">
          <ReportHeader
            title="Profit & Loss Statement"
            subtitle={`For the period ${new Date(dateRange.start_date).toLocaleDateString()} to ${new Date(dateRange.end_date).toLocaleDateString()}`}
          />

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : !report ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No data available for this period</p>
            </div>
          ) : (
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
                      <td colSpan={2} className="px-4 py-2 text-sm font-semibold text-gray-900">Total Revenue</td>
                      <td className="px-4 py-2 text-right text-sm font-bold text-blue-600">
                        KWD {num(report.revenue.total).toFixed(3)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Cost of Goods Sold */}
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
                        <td colSpan={2} className="px-4 py-2 text-sm font-semibold text-gray-900">Total COGS</td>
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
                  <span className="text-base font-semibold text-gray-900">Gross Profit</span>
                  <span className="text-xl font-bold text-blue-600">
                    KWD {num(report.gross_profit).toFixed(3)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Gross Profit Margin: {grossProfitMargin}%</p>
              </div>

              {/* Operating Expenses */}
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
                        <td colSpan={2} className="px-4 py-2 text-sm font-semibold text-gray-900">Total Expenses</td>
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
                  <span className="text-base font-semibold text-gray-900">Net Profit</span>
                  <span className="text-xl font-bold text-green-600">
                    KWD {num(report.net_profit).toFixed(3)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Net Profit Margin: {netProfitMargin}%</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}