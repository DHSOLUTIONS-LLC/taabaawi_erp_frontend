// src/features/pos/components/CouponDetailModal.tsx
import { useGetCouponByIdQuery, useGetCouponUsageStatisticsQuery } from '../../../services/posApi';

interface CouponDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  couponId: number | null;
}

export default function CouponDetailModal({ isOpen, onClose, couponId }: CouponDetailModalProps) {
  const { data: couponResponse, isLoading: couponLoading } = useGetCouponByIdQuery(couponId!, {
    skip: !isOpen || !couponId,
  });
  const { data: statsResponse, isLoading: statsLoading } = useGetCouponUsageStatisticsQuery(couponId!, {
    skip: !isOpen || !couponId,
  });

  const coupon = couponResponse?.data;
  const stats = statsResponse?.data;

  if (!isOpen) return null;

  const isExpired = coupon ? new Date(coupon.valid_until) < new Date() : false;
  const usagePct = coupon?.usage_limit
    ? Math.min(100, (coupon.times_used / coupon.usage_limit) * 100)
    : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1773CF] to-blue-400 px-6 py-5 flex items-center justify-between shrink-0">
          <div>
            <p className="text-white/70 text-xs uppercase tracking-widest font-medium">Coupon Code</p>
            <h2 className="text-2xl font-bold text-white tracking-widest font-mono mt-0.5">
              {coupon?.coupon_code || '—'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {coupon && (
              <div className="text-right">
                <p className="text-white/70 text-xs">Discount</p>
                <p className="text-white text-xl font-bold">
                  {coupon.discount_type === 'Percentage' ? `${coupon.discount_value}%` : `KWD ${coupon.discount_value}`}
                </p>
              </div>
            )}
            <button onClick={onClose} className="text-white/70 hover:text-white ml-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {couponLoading || statsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : !coupon ? (
            <p className="text-center text-gray-500 py-8">Coupon not found</p>
          ) : (
            <>
              {/* Status badges */}
              <div className="flex gap-2 flex-wrap">
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${coupon.is_active && !isExpired ? 'bg-green-100 text-green-700' :
                    isExpired ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                  {isExpired ? 'Expired' : coupon.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                  {coupon.channel}
                </span>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                  {coupon.discount_type}
                </span>
              </div>

              {/* Coupon details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <p className="font-semibold text-gray-900 text-base">{coupon.coupon_name}</p>
                {coupon.description && <p className="text-gray-500">{coupon.description}</p>}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <p className="text-gray-400 text-xs">Valid From</p>
                    <p className="font-medium text-gray-800">
                      {new Date(coupon.valid_from).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Valid Until</p>
                    <p className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-800'}`}>
                      {new Date(coupon.valid_until).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {coupon.min_purchase_amount > 0 && (
                    <div>
                      <p className="text-gray-400 text-xs">Min Purchase</p>
                      <p className="font-medium text-gray-800">KWD {parseFloat(coupon.min_purchase_amount).toFixed(3)}</p>
                    </div>
                  )}
                  {coupon.max_discount_amount > 0 && (
                    <div>
                      <p className="text-gray-400 text-xs">Max Discount Cap</p>
                      <p className="font-medium text-gray-800">KWD {parseFloat(coupon.max_discount_amount).toFixed(3)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-400 text-xs">Per User Limit</p>
                    <p className="font-medium text-gray-800">{coupon.usage_limit_per_user || 1} use(s)</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Total Limit</p>
                    <p className="font-medium text-gray-800">{coupon.usage_limit || 'Unlimited'}</p>
                  </div>
                </div>
              </div>

              {/* Usage progress */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-gray-700">Usage</p>
                  <p className="text-sm font-bold text-gray-900">
                    {coupon.times_used} / {coupon.usage_limit || '∞'}
                  </p>
                </div>
                {usagePct !== null && (
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${usagePct >= 90 ? 'bg-red-500' : usagePct >= 60 ? 'bg-orange-500' : 'bg-[#1773CF]'}`}
                      style={{ width: `${usagePct}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Usage Statistics from /usage-statistics endpoint */}
              {stats && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Usage Statistics</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      { label: 'Total Uses', value: stats.total_uses || 0 },
                      { label: 'Unique Users', value: stats.unique_users || 0 },
                      { label: 'Total Discounted', value: `KWD ${parseFloat(stats.total_discount_given || 0).toFixed(3)}` },
                      { label: 'Avg Discount', value: `KWD ${parseFloat(stats.average_discount || 0).toFixed(3)}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-xs mb-1">{label}</p>
                        <p className="font-bold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recent uses */}
                  {stats.recent_uses?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Recent Uses</p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {stats.recent_uses.map((use: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs bg-white rounded-lg px-3 py-2">
                            <div>
                              <p className="font-medium text-gray-800">{use.sale_number}</p>
                              <p className="text-gray-400">{new Date(use.used_at).toLocaleDateString('en-GB')}</p>
                            </div>
                            <span className="text-green-600 font-semibold">-KWD {parseFloat(use.discount_amount || 0).toFixed(3)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-300 shrink-0">
          <button onClick={onClose} className="w-full py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}