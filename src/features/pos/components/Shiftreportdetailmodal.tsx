// src/features/pos/components/Shiftreportdetailmodal.tsx
import { useState } from 'react';
import { useGetPOSByIdQuery } from '../../../services/posApi';

interface ShiftReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: number | null;
  registerData?: any; // used for header info instantly while full data loads
}

export default function ShiftReportDetailModal({
  isOpen,
  onClose,
  reportId,
  registerData,
}: ShiftReportDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'sales' | 'movements'>('summary');

  // Fetch full register with sales + cash_movements included
  const { data: fullRegisterResponse, isLoading } = useGetPOSByIdQuery(reportId!, {
    skip: !isOpen || !reportId,
  });

  if (!isOpen) return null;

  // Use full fetched data, fall back to list row for header while loading
  const r = fullRegisterResponse?.data || registerData;

  const cashSales = r?.sales?.filter((s: any) => s.payment_method === 'Cash')
    .reduce((sum: number, s: any) => sum + parseFloat(s.total_amount || 0), 0) || 0;
  const cardSales = r?.sales?.filter((s: any) => s.payment_method === 'Card')
    .reduce((sum: number, s: any) => sum + parseFloat(s.total_amount || 0), 0) || 0;
  const knetSales = r?.sales?.filter((s: any) => s.payment_method === 'K-Net')
    .reduce((sum: number, s: any) => sum + parseFloat(s.total_amount || 0), 0) || 0;
  const mobileSales = r?.sales?.filter((s: any) => s.payment_method === 'Mobile Payment')
    .reduce((sum: number, s: any) => sum + parseFloat(s.total_amount || 0), 0) || 0;
  const totalSales = r?.sales?.reduce((sum: number, s: any) => sum + parseFloat(s.total_amount || 0), 0) || 0;
  const diff = parseFloat(r?.difference || 0);

  const paymentBadge = (method: string) => {
    const map: Record<string, string> = {
      Cash: 'bg-green-100 text-green-800',
      Card: 'bg-blue-100 text-blue-800',
      'K-Net': 'bg-purple-100 text-purple-800',
      'Mobile Payment': 'bg-orange-100 text-orange-800',
      Mixed: 'bg-gray-100 text-gray-800',
    };
    return map[method] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col">

        {/* Header — shows immediately from registerData prop */}
        <div className="bg-[#1773CF] px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between shrink-0">
          <div className="min-w-0 flex-1 pr-2">
            <h2 className="text-lg sm:text-xl font-bold text-white truncate">Shift Details</h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-0.5 truncate">
              {registerData?.user?.name} — {registerData?.branch?.branch_name} &nbsp;·&nbsp;
              {registerData?.opened_at && new Date(registerData.opened_at).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white shrink-0 ml-2">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-300 flex shrink-0 overflow-x-auto scrollbar-hide">
          {(['summary', 'sales', 'movements'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab
                  ? 'border-[#1773CF] text-[#1773CF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab === 'movements' ? 'Cash Movements' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {!isLoading && tab === 'sales' && r?.sales?.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {r.sales.length}
                </span>
              )}
              {!isLoading && tab === 'movements' && r?.cash_movements?.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                  {r.cash_movements.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">

          {/* Global loading state */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p className="text-gray-500 text-sm">Loading shift details...</p>
            </div>
          ) : !r ? (
            <p className="text-center text-gray-400 py-12">No data available for this shift.</p>
          ) : (
            <>
              {/* ── Summary Tab ── */}
              {activeTab === 'summary' && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {[
                      { label: 'Total Sales', value: `KD ${totalSales.toFixed(3)}`, color: 'text-[#1773CF]' },
                      { label: 'Transactions', value: r.sales?.length || 0, color: 'text-gray-900' },
                      { label: 'Opening Balance', value: `KD ${parseFloat(r.opening_balance || 0).toFixed(3)}`, color: 'text-gray-900' },
                      { label: 'Closing Balance', value: `KD ${parseFloat(r.closing_balance || 0).toFixed(3)}`, color: 'text-gray-900' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">{label}</p>
                        <p className={`text-base sm:text-xl font-bold truncate ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Shift time */}
                  <div className="bg-gray-50 rounded-xl p-4 text-sm flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">Shift Start</p>
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">
                        {new Date(r.opened_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-xs mb-0.5">Duration</p>
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">
                        {r.closed_at ? (() => {
                          const mins = Math.round((new Date(r.closed_at).getTime() - new Date(r.opened_at).getTime()) / 60000);
                          return `${Math.floor(mins / 60)}h ${mins % 60}m`;
                        })() : 'Still open'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs mb-0.5">Shift End</p>
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">
                        {r.closed_at
                          ? new Date(r.closed_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Cash reconciliation */}
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
                    <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Cash Reconciliation</h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      {[
                        { label: 'Opening Balance', value: parseFloat(r.opening_balance || 0) },
                        { label: 'Cash Sales', value: cashSales },
                        { label: 'Cash In (movements)', value: parseFloat(r.total_cash_in || 0) },
                        { label: 'Cash Out (movements)', value: -(parseFloat(r.total_cash_out || 0)) },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-gray-500">{label}</span>
                          <span className={`font-medium ${value < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {value < 0 ? '-' : ''}KD {Math.abs(value).toFixed(3)}
                          </span>
                        </div>
                      ))}
                      <div className="border-t border-gray-300 pt-2 space-y-1.5">
                        <div className="flex justify-between font-semibold">
                          <span>Actual Closing</span>
                          <span>KD {parseFloat(r.closing_balance || 0).toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm sm:text-base border-t border-gray-300 pt-1.5">
                          <span>Difference</span>
                          <span className={diff === 0 ? 'text-green-600' : diff > 0 ? 'text-blue-600' : 'text-red-600'}>
                            {diff > 0 ? '+' : ''}KD {diff.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment breakdown */}
                  {[
                    { method: 'Cash', amount: cashSales, count: r.sales?.filter((s: any) => s.payment_method === 'Cash').length || 0 },
                    { method: 'Card', amount: cardSales, count: r.sales?.filter((s: any) => s.payment_method === 'Card').length || 0 },
                    { method: 'K-Net', amount: knetSales, count: r.sales?.filter((s: any) => s.payment_method === 'K-Net').length || 0 },
                    { method: 'Mobile Payment', amount: mobileSales, count: r.sales?.filter((s: any) => s.payment_method === 'Mobile Payment').length || 0 },
                  ].some(i => i.count > 0) && (
                      <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
                        <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Payment Breakdown</h3>
                        <div className="space-y-2">
                          {[
                            { method: 'Cash', amount: cashSales, count: r.sales?.filter((s: any) => s.payment_method === 'Cash').length || 0 },
                            { method: 'Card', amount: cardSales, count: r.sales?.filter((s: any) => s.payment_method === 'Card').length || 0 },
                            { method: 'K-Net', amount: knetSales, count: r.sales?.filter((s: any) => s.payment_method === 'K-Net').length || 0 },
                            { method: 'Mobile Payment', amount: mobileSales, count: r.sales?.filter((s: any) => s.payment_method === 'Mobile Payment').length || 0 },
                          ].filter(item => item.count > 0).map(({ method, amount, count }) => (
                            <div key={method} className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-lg ${paymentBadge(method)}`}>{method}</span>
                                <span className="text-xs text-gray-500">{count} transactions</span>
                              </div>
                              <span className="font-semibold text-xs sm:text-sm">KD {amount.toFixed(3)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {r.closing_notes && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 sm:p-4">
                      <p className="text-xs font-semibold text-amber-700 mb-1">Closing Notes</p>
                      <p className="text-xs sm:text-sm text-amber-800 break-words">{r.closing_notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Sales Tab ── */}
              {activeTab === 'sales' && (
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  {!r.sales?.length ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400">No sales recorded in this shift</p>
                    </div>
                  ) : (
                    <table className="min-w-[500px] sm:min-w-full w-full divide-y divide-gray-200 text-xs sm:text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Sale #', 'Time', 'Items', 'Payment', 'Status', 'Total'].map(h => (
                            <th key={h} className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {r.sales.map((sale: any) => (
                          <tr key={sale.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-gray-900 whitespace-nowrap">{sale.sale_number}</td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-gray-500 whitespace-nowrap">
                              {new Date(sale.sale_date || sale.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 whitespace-nowrap">{sale.items?.length || 0}</td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-lg ${paymentBadge(sale.payment_method)}`}>
                                {sale.payment_method}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${sale.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                  sale.status === 'Refunded' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-600'
                                }`}>{sale.status}</span>
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-gray-900 whitespace-nowrap">
                              KD {parseFloat(sale.total_amount || 0).toFixed(3)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={5} className="px-3 sm:px-4 py-2.5 sm:py-3 font-bold text-gray-700 whitespace-nowrap">Total</td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-bold text-[#1773CF] whitespace-nowrap">KD {totalSales.toFixed(3)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              )}

              {/* ── Cash Movements Tab ── */}
              {activeTab === 'movements' && (
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  {!r.cash_movements?.length ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400">No cash movements recorded in this shift</p>
                    </div>
                  ) : (
                    <table className="min-w-[500px] sm:min-w-full w-full divide-y divide-gray-200 text-xs sm:text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Time', 'Type', 'Amount', 'Reason', 'By'].map(h => (
                            <th key={h} className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {r.cash_movements.map((mov: any) => (
                          <tr key={mov.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-gray-500 whitespace-nowrap">
                              {new Date(mov.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-lg ${mov.type === 'Cash In' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>{mov.type}</span>
                            </td>
                            <td className={`px-3 sm:px-4 py-2.5 sm:py-3 font-semibold whitespace-nowrap ${mov.type === 'Cash In' ? 'text-green-600' : 'text-red-600'}`}>
                              {mov.type === 'Cash In' ? '+' : '-'}KD {parseFloat(mov.amount || 0).toFixed(3)}
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 break-words max-w-[200px] sm:max-w-none">{mov.reason}</td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-gray-500 whitespace-nowrap">{mov.user?.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-300 shrink-0">
          <button onClick={onClose} className="w-full py-2.5 sm:py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}