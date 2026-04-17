// src/features/accounting/pages/accounts-receivable/ARAgingReportPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { useGetARAgingReportQuery } from '../../../../services/accountingApi';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';

const num = (v: any) => parseFloat(v) || 0;

export default function ARAgingReportPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [customerFilter, _setCustomerFilter] = useState('');

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const { data, isLoading, refetch } = useGetARAgingReportQuery({
    customer_id: customerFilter ? parseInt(customerFilter) : undefined,
  });

  const aging = (data as any)?.data || {
    current: 0,
    '1_30_days': 0,
    '31_60_days': 0,
    '61_90_days': 0,
    over_90_days: 0,
    total_outstanding: 0,
  };

  const totalOutstanding =
    aging.current +
    aging['1_30_days'] +
    aging['31_60_days'] +
    aging['61_90_days'] +
    aging.over_90_days;

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <button
              onClick={() => navigate(`${basePath}/accounting/accounts-receivable`)}
              className="flex-shrink-0 mt-1"
            >
              <img src={arrow_back_icon} alt="" className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">AR Aging Report</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Accounts Receivable aging summary</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
          >
            Refresh
          </button>
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-xl p-4 sm:p-6  overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Aging Summary</h2>
                <p className="text-xs sm:text-sm text-gray-500">As of {new Date().toLocaleDateString()}</p>
              </div>

              {/* Aging Grid - Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-8">
                <div className="bg-green-50 rounded-lg p-3 sm:p-4 text-center">
                  <p className="text-xs text-green-600 uppercase font-semibold mb-1">Current</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 break-words">
                    KWD {num(aging.current).toFixed(3)}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 text-center">
                  <p className="text-xs text-yellow-600 uppercase font-semibold mb-1">1-30 Days</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 break-words">
                    KWD {num(aging['1_30_days']).toFixed(3)}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 sm:p-4 text-center">
                  <p className="text-xs text-orange-600 uppercase font-semibold mb-1">31-60 Days</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 break-words">
                    KWD {num(aging['31_60_days']).toFixed(3)}
                  </p>
                </div>
                <div className="bg-red-100 rounded-lg p-3 sm:p-4 text-center">
                  <p className="text-xs text-red-600 uppercase font-semibold mb-1">61-90 Days</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 break-words">
                    KWD {num(aging['61_90_days']).toFixed(3)}
                  </p>
                </div>
                <div className="bg-red-200 rounded-lg p-3 sm:p-4 text-center sm:col-span-2 lg:col-span-1">
                  <p className="text-xs text-red-700 uppercase font-semibold mb-1">Over 90 Days</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 break-words">
                    KWD {num(aging.over_90_days).toFixed(3)}
                  </p>
                </div>
              </div>

              {/* Summary Table */}
              <div className="border-t-2 border-gray-200 pt-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Aging Details</h3>
                  <div className="text-left sm:text-right">
                    <p className="text-xs sm:text-sm text-gray-500">Total Outstanding</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600 break-words">
                      KWD {num(totalOutstanding).toFixed(3)}
                    </p>
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[400px]">
                    <thead className="bg-gray-50 border-y border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Aging Period</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Amount (KWD)</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">% of Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">Current (Not Due)</td>
                        <td className="px-4 py-3 text-right text-sm font-mono font-medium whitespace-nowrap">
                          KWD {num(aging.current).toFixed(3)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-mono text-gray-600 whitespace-nowrap">
                          {totalOutstanding > 0 ? ((aging.current / totalOutstanding) * 100).toFixed(1) : '0'}%
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">1 - 30 Days</td>
                        <td className="px-4 py-3 text-right text-sm font-mono font-medium whitespace-nowrap">
                          KWD {num(aging['1_30_days']).toFixed(3)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-mono text-gray-600 whitespace-nowrap">
                          {totalOutstanding > 0 ? ((aging['1_30_days'] / totalOutstanding) * 100).toFixed(1) : '0'}%
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">31 - 60 Days</td>
                        <td className="px-4 py-3 text-right text-sm font-mono font-medium whitespace-nowrap">
                          KWD {num(aging['31_60_days']).toFixed(3)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-mono text-gray-600 whitespace-nowrap">
                          {totalOutstanding > 0 ? ((aging['31_60_days'] / totalOutstanding) * 100).toFixed(1) : '0'}%
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">61 - 90 Days</td>
                        <td className="px-4 py-3 text-right text-sm font-mono font-medium whitespace-nowrap">
                          KWD {num(aging['61_90_days']).toFixed(3)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-mono text-gray-600 whitespace-nowrap">
                          {totalOutstanding > 0 ? ((aging['61_90_days'] / totalOutstanding) * 100).toFixed(1) : '0'}%
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">Over 90 Days</td>
                        <td className="px-4 py-3 text-right text-sm font-mono font-medium whitespace-nowrap">
                          KWD {num(aging.over_90_days).toFixed(3)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-mono text-gray-600 whitespace-nowrap">
                          {totalOutstanding > 0 ? ((aging.over_90_days / totalOutstanding) * 100).toFixed(1) : '0'}%
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">Total</td>
                        <td className="px-4 py-3 text-right text-sm font-mono font-bold text-blue-600 whitespace-nowrap">
                          KWD {num(totalOutstanding).toFixed(3)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-mono font-bold text-blue-600 whitespace-nowrap">
                          100%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-900">Current (Not Due)</span>
                      <span className="text-xs text-gray-500">
                        {totalOutstanding > 0 ? ((aging.current / totalOutstanding) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                    <p className="text-lg font-mono font-bold text-gray-900 break-words">
                      KWD {num(aging.current).toFixed(3)}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-900">1 - 30 Days</span>
                      <span className="text-xs text-gray-500">
                        {totalOutstanding > 0 ? ((aging['1_30_days'] / totalOutstanding) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                    <p className="text-lg font-mono font-bold text-gray-900 break-words">
                      KWD {num(aging['1_30_days']).toFixed(3)}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-900">31 - 60 Days</span>
                      <span className="text-xs text-gray-500">
                        {totalOutstanding > 0 ? ((aging['31_60_days'] / totalOutstanding) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                    <p className="text-lg font-mono font-bold text-gray-900 break-words">
                      KWD {num(aging['31_60_days']).toFixed(3)}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-900">61 - 90 Days</span>
                      <span className="text-xs text-gray-500">
                        {totalOutstanding > 0 ? ((aging['61_90_days'] / totalOutstanding) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                    <p className="text-lg font-mono font-bold text-gray-900 break-words">
                      KWD {num(aging['61_90_days']).toFixed(3)}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-900">Over 90 Days</span>
                      <span className="text-xs text-gray-500">
                        {totalOutstanding > 0 ? ((aging.over_90_days / totalOutstanding) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                    <p className="text-lg font-mono font-bold text-gray-900 break-words">
                      KWD {num(aging.over_90_days).toFixed(3)}
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3 mt-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-900">Total Outstanding</span>
                      <span className="text-xs text-gray-500">100%</span>
                    </div>
                    <p className="text-xl font-mono font-bold text-blue-600 break-words">
                      KWD {num(totalOutstanding).toFixed(3)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Aging Chart - Responsive */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Aging Distribution</h3>

                {/* Progress Bar */}
                <div className="h-6 sm:h-8 w-full bg-gray-200 rounded-full overflow-hidden flex flex-wrap sm:flex-nowrap">
                  <div
                    className="bg-green-500 h-full transition-all duration-300"
                    style={{ width: `${totalOutstanding > 0 ? (aging.current / totalOutstanding) * 100 : 0}%` }}
                    title={`Current: ${((aging.current / totalOutstanding) * 100).toFixed(1)}%`}
                  />
                  <div
                    className="bg-yellow-500 h-full transition-all duration-300"
                    style={{ width: `${totalOutstanding > 0 ? (aging['1_30_days'] / totalOutstanding) * 100 : 0}%` }}
                    title={`1-30 Days: ${((aging['1_30_days'] / totalOutstanding) * 100).toFixed(1)}%`}
                  />
                  <div
                    className="bg-orange-500 h-full transition-all duration-300"
                    style={{ width: `${totalOutstanding > 0 ? (aging['31_60_days'] / totalOutstanding) * 100 : 0}%` }}
                    title={`31-60 Days: ${((aging['31_60_days'] / totalOutstanding) * 100).toFixed(1)}%`}
                  />
                  <div
                    className="bg-red-500 h-full transition-all duration-300"
                    style={{ width: `${totalOutstanding > 0 ? (aging['61_90_days'] / totalOutstanding) * 100 : 0}%` }}
                    title={`61-90 Days: ${((aging['61_90_days'] / totalOutstanding) * 100).toFixed(1)}%`}
                  />
                  <div
                    className="bg-red-700 h-full transition-all duration-300"
                    style={{ width: `${totalOutstanding > 0 ? (aging.over_90_days / totalOutstanding) * 100 : 0}%` }}
                    title={`Over 90 Days: ${((aging.over_90_days / totalOutstanding) * 100).toFixed(1)}%`}
                  />
                </div>

                {/* Legend - Responsive Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded flex-shrink-0"></div>
                    <span className="text-xs text-gray-600 truncate">Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded flex-shrink-0"></div>
                    <span className="text-xs text-gray-600 truncate">1-30 Days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded flex-shrink-0"></div>
                    <span className="text-xs text-gray-600 truncate">31-60 Days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded flex-shrink-0"></div>
                    <span className="text-xs text-gray-600 truncate">61-90 Days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-700 rounded flex-shrink-0"></div>
                    <span className="text-xs text-gray-600 truncate">Over 90 Days</span>
                  </div>
                </div>

                {/* Percentage Labels for Mobile */}
                <div className="sm:hidden grid grid-cols-2 gap-2 mt-3 text-center">
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold">Current:</span> {totalOutstanding > 0 ? ((aging.current / totalOutstanding) * 100).toFixed(1) : '0'}%
                  </div>
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold">1-30:</span> {totalOutstanding > 0 ? ((aging['1_30_days'] / totalOutstanding) * 100).toFixed(1) : '0'}%
                  </div>
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold">31-60:</span> {totalOutstanding > 0 ? ((aging['31_60_days'] / totalOutstanding) * 100).toFixed(1) : '0'}%
                  </div>
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold">61-90:</span> {totalOutstanding > 0 ? ((aging['61_90_days'] / totalOutstanding) * 100).toFixed(1) : '0'}%
                  </div>
                  <div className="text-xs text-gray-600 col-span-2">
                    <span className="font-semibold">Over 90:</span> {totalOutstanding > 0 ? ((aging.over_90_days / totalOutstanding) * 100).toFixed(1) : '0'}%
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}