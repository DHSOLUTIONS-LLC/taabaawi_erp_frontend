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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`${basePath}/accounting/accounts-receivable`)}>
              <img src={arrow_back_icon} alt="" className="w-8 h-8" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AR Aging Report</h1>
              <p className="text-sm text-gray-500 mt-1">Accounts Receivable aging summary</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
          >
            Refresh
          </button>
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Aging Summary</h2>
                <p className="text-sm text-gray-500">As of {new Date().toLocaleDateString()}</p>
              </div>

              {/* Aging Grid */}
              <div className="grid grid-cols-5 gap-4 mb-8">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-green-600 uppercase font-semibold mb-1">Current</p>
                  <p className="text-xl font-bold text-gray-900">KWD {num(aging.current).toFixed(3)}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-yellow-600 uppercase font-semibold mb-1">1-30 Days</p>
                  <p className="text-xl font-bold text-gray-900">KWD {num(aging['1_30_days']).toFixed(3)}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-orange-600 uppercase font-semibold mb-1">31-60 Days</p>
                  <p className="text-xl font-bold text-gray-900">KWD {num(aging['31_60_days']).toFixed(3)}</p>
                </div>
                <div className="bg-red-100 rounded-lg p-4 text-center">
                  <p className="text-xs text-red-600 uppercase font-semibold mb-1">61-90 Days</p>
                  <p className="text-xl font-bold text-gray-900">KWD {num(aging['61_90_days']).toFixed(3)}</p>
                </div>
                <div className="bg-red-200 rounded-lg p-4 text-center">
                  <p className="text-xs text-red-700 uppercase font-semibold mb-1">Over 90 Days</p>
                  <p className="text-xl font-bold text-gray-900">KWD {num(aging.over_90_days).toFixed(3)}</p>
                </div>
              </div>

              {/* Summary Table */}
              <div className="border-t-2 border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Aging Details</h3>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Outstanding</p>
                    <p className="text-2xl font-bold text-blue-600">KWD {num(totalOutstanding).toFixed(3)}</p>
                  </div>
                </div>

                <table className="w-full">
                  <thead className="bg-gray-50 border-y border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Aging Period</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount (KWD)</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">Current (Not Due)</td>
                      <td className="px-4 py-3 text-right text-sm font-mono font-medium">
                        KWD {num(aging.current).toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono text-gray-600">
                        {totalOutstanding > 0 ? ((aging.current / totalOutstanding) * 100).toFixed(1) : '0'}%
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">1 - 30 Days</td>
                      <td className="px-4 py-3 text-right text-sm font-mono font-medium">
                        KWD {num(aging['1_30_days']).toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono text-gray-600">
                        {totalOutstanding > 0 ? ((aging['1_30_days'] / totalOutstanding) * 100).toFixed(1) : '0'}%
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">31 - 60 Days</td>
                      <td className="px-4 py-3 text-right text-sm font-mono font-medium">
                        KWD {num(aging['31_60_days']).toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono text-gray-600">
                        {totalOutstanding > 0 ? ((aging['31_60_days'] / totalOutstanding) * 100).toFixed(1) : '0'}%
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">61 - 90 Days</td>
                      <td className="px-4 py-3 text-right text-sm font-mono font-medium">
                        KWD {num(aging['61_90_days']).toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono text-gray-600">
                        {totalOutstanding > 0 ? ((aging['61_90_days'] / totalOutstanding) * 100).toFixed(1) : '0'}%
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">Over 90 Days</td>
                      <td className="px-4 py-3 text-right text-sm font-mono font-medium">
                        KWD {num(aging.over_90_days).toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono text-gray-600">
                        {totalOutstanding > 0 ? ((aging.over_90_days / totalOutstanding) * 100).toFixed(1) : '0'}%
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">Total</td>
                      <td className="px-4 py-3 text-right text-sm font-mono font-bold text-blue-600">
                        KWD {num(totalOutstanding).toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono font-bold text-blue-600">
                        100%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Aging Chart */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Aging Distribution</h3>
                <div className="h-8 w-full bg-gray-200 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-green-500 h-full"
                    style={{ width: `${totalOutstanding > 0 ? (aging.current / totalOutstanding) * 100 : 0}%` }}
                  />
                  <div 
                    className="bg-yellow-500 h-full"
                    style={{ width: `${totalOutstanding > 0 ? (aging['1_30_days'] / totalOutstanding) * 100 : 0}%` }}
                  />
                  <div 
                    className="bg-orange-500 h-full"
                    style={{ width: `${totalOutstanding > 0 ? (aging['31_60_days'] / totalOutstanding) * 100 : 0}%` }}
                  />
                  <div 
                    className="bg-red-500 h-full"
                    style={{ width: `${totalOutstanding > 0 ? (aging['61_90_days'] / totalOutstanding) * 100 : 0}%` }}
                  />
                  <div 
                    className="bg-red-700 h-full"
                    style={{ width: `${totalOutstanding > 0 ? (aging.over_90_days / totalOutstanding) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-xs text-gray-600">Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-xs text-gray-600">1-30 Days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span className="text-xs text-gray-600">31-60 Days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-xs text-gray-600">61-90 Days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-700 rounded"></div>
                    <span className="text-xs text-gray-600">Over 90 Days</span>
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