// src/features/sales/pages/OrderDetailPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import {
  useGetOrderByIdQuery,
  useConfirmOrderMutation,
  useProcessOrderMutation,
  usePackOrderMutation,
  useShipOrderMutation,
  useDeliverOrderMutation,
  useCancelOrderMutation,
  useReturnOrderMutation,
  useMarkOrderAsPaidMutation,
//   useAssignOrderToStaffMutation,
  useGetOrderStatusHistoryQuery,
} from '../../../../services/salesApi';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Confirmed: 'bg-blue-100 text-blue-800',
  Processing: 'bg-indigo-100 text-indigo-800',
  Packed: 'bg-purple-100 text-purple-800',
  Shipped: 'bg-cyan-100 text-cyan-800',
  'Out for Delivery': 'bg-orange-100 text-orange-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  Returned: 'bg-gray-100 text-gray-800',
};

const PAYMENT_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Paid: 'bg-green-100 text-green-700',
  'Partially Paid': 'bg-blue-100 text-blue-700',
  Refunded: 'bg-purple-100 text-purple-700',
  Failed: 'bg-red-100 text-red-700',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderId = parseInt(id!);

  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'history'>('details');

  // Action modals
  const [showShipModal, setShowShipModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingProvider, setShippingProvider] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('');

  const { data: orderResponse, isLoading } = useGetOrderByIdQuery(orderId, { skip: !orderId });
  const { data: historyResponse } = useGetOrderStatusHistoryQuery(orderId, { skip: !orderId });

  const [confirmOrder, { isLoading: isConfirming }] = useConfirmOrderMutation();
  const [processOrder, { isLoading: isProcessing }] = useProcessOrderMutation();
  const [packOrder, { isLoading: isPacking }] = usePackOrderMutation();
  const [shipOrder, { isLoading: isShipping }] = useShipOrderMutation();
  const [deliverOrder, { isLoading: isDelivering }] = useDeliverOrderMutation();
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();
  const [returnOrder, { isLoading: isReturning }] = useReturnOrderMutation();
  const [markAsPaid, { isLoading: isMarkingPaid }] = useMarkOrderAsPaidMutation();

  const order = orderResponse?.data;
  const history = historyResponse?.data || [];

  const handleAction = async (action: () => Promise<any>, errorMsg: string) => {
    try { await action(); }
    catch (err: any) { alert(err?.data?.message || errorMsg); }
  };

  const handleShip = async () => {
    if (!trackingNumber.trim() || !shippingProvider.trim()) {
      alert('Please enter tracking number and shipping provider'); return;
    }
    try {
      await shipOrder({ id: orderId, tracking_number: trackingNumber, shipping_provider: shippingProvider }).unwrap();
      setShowShipModal(false); setTrackingNumber(''); setShippingProvider('');
    } catch (err: any) { alert(err?.data?.message || 'Failed to ship order'); }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) { alert('Please enter cancellation reason'); return; }
    try {
      await cancelOrder({ id: orderId, reason: cancelReason }).unwrap();
      setShowCancelModal(false); setCancelReason('');
    } catch (err: any) { alert(err?.data?.message || 'Failed to cancel order'); }
  };

  const handleReturn = async () => {
    if (!returnReason.trim()) { alert('Please enter return reason'); return; }
    try {
      await returnOrder({ id: orderId, reason: returnReason }).unwrap();
      setShowReturnModal(false); setReturnReason('');
    } catch (err: any) { alert(err?.data?.message || 'Failed to return order'); }
  };

  if (isLoading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    </DashboardLayout>
  );

  if (!order) return (
    <DashboardLayout>
      <div className="text-center py-24 text-gray-500">Order not found.</div>
    </DashboardLayout>
  );

  const status = order.order_status;
  const canConfirm = status === 'Pending';
  const canProcess = ['Pending', 'Confirmed'].includes(status);
  const canPack = status === 'Processing';
  const canShip = ['Packed', 'Processing'].includes(status);
  const canDeliver = ['Shipped', 'Out for Delivery'].includes(status);
  const canCancel = ['Pending', 'Confirmed', 'Processing'].includes(status);
  const canReturn = status === 'Delivered';
  const canMarkPaid = order.payment_status !== 'Paid';

  return (
  <DashboardLayout>
  <div className="space-y-4 sm:space-y-6 xl:p-4 sm:p-0">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-2 sm:gap-4">
        <button onClick={() => navigate(-1)} className="flex-shrink-0">
          <img src={arrow_back_icon} alt="" className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 break-all sm:break-normal">{order.order_number}</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
            {' · '}{order.channel}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="text-xs sm:text-sm text-gray-600">Status:</span>
        <span className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-full ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'}`}>
          {status}
        </span>
        <span className="text-xs sm:text-sm text-gray-600">Payment:</span>
        <span className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-full ${PAYMENT_COLORS[order.payment_status] || 'bg-gray-100 text-gray-700'}`}>
          {order.payment_status}
        </span>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="bg-white rounded-xl p-3 sm:p-4 flex flex-wrap gap-2 sm:gap-3">
      {canConfirm && (
        <button onClick={() => handleAction(() => confirmOrder(orderId).unwrap(), 'Failed to confirm')}
          disabled={isConfirming}
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {isConfirming ? 'Confirming...' : 'Confirm Order'}
        </button>
      )}
      {canProcess && (
        <button onClick={() => handleAction(() => processOrder(orderId).unwrap(), 'Failed to process')}
          disabled={isProcessing}
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {isProcessing ? 'Processing...' : 'Start Processing'}
        </button>
      )}
      {canPack && (
        <button onClick={() => handleAction(() => packOrder(orderId).unwrap(), 'Failed to pack')}
          disabled={isPacking}
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors">
          {isPacking ? 'Packing...' : 'Mark as Packed'}
        </button>
      )}
      {canShip && (
        <button onClick={() => setShowShipModal(true)}
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-cyan-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-cyan-700 transition-colors">
          Ship Order
        </button>
      )}
      {canDeliver && (
        <button onClick={() => handleAction(() => deliverOrder(orderId).unwrap(), 'Failed to deliver')}
          disabled={isDelivering}
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors">
          {isDelivering ? 'Updating...' : 'Mark as Delivered'}
        </button>
      )}
      {canMarkPaid && (
        <button onClick={() => handleAction(() => markAsPaid(orderId).unwrap(), 'Failed to mark as paid')}
          disabled={isMarkingPaid}
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
          {isMarkingPaid ? 'Updating...' : 'Mark as Paid'}
        </button>
      )}
      {canCancel && (
        <button onClick={() => setShowCancelModal(true)}
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-100 text-red-700 rounded-lg text-xs sm:text-sm font-semibold hover:bg-red-200 transition-colors">
          Cancel Order
        </button>
      )}
      {canReturn && (
        <button onClick={() => setShowReturnModal(true)}
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-semibold hover:bg-gray-200 transition-colors">
          Return Order
        </button>
      )}
    </div>

    {/* Tabs - Horizontal Scroll on Mobile */}
    <div className="border-b overflow-x-auto">
      <div className="flex min-w-max sm:min-w-0">
        {(['details', 'items', 'history'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab ? 'border-[#1773CF] text-[#1773CF]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab === 'history' ? 'Status History' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
    </div>

    {/* Tab Content */}
    {activeTab === 'details' && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Customer Info */}
        <div className="bg-white rounded-xl p-4 sm:p-6">
          <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">Customer Information</h3>
          <div className="space-y-2 sm:space-y-3 text-sm">
            {[
              { label: 'Name', value: order.customer_name },
              { label: 'Email', value: order.customer_email },
              { label: 'Phone', value: order.customer_phone },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-gray-500 text-xs sm:text-sm">{label}</span>
                <span className="font-medium text-gray-900 text-xs sm:text-sm break-all">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Info */}
        <div className="bg-white rounded-xl p-4 sm:p-6">
          <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">Shipping Information</h3>
          <div className="space-y-2 sm:space-y-3 text-sm">
            {[
              { label: 'Address', value: order.shipping_address },
              { label: 'City', value: order.shipping_city || '—' },
              { label: 'Country', value: order.shipping_country },
              { label: 'Tracking #', value: order.tracking_number || '—' },
              { label: 'Provider', value: order.shipping_provider || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-gray-500 text-xs sm:text-sm">{label}</span>
                <span className="font-medium text-gray-900 text-xs sm:text-sm text-left sm:text-right break-all sm:max-w-[200px]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-xl p-4 sm:p-6">
          <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">Payment Summary</h3>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Subtotal', value: Number(order.subtotal) },
              { label: 'Discount', value: -Number(order.discount_amount) },
              { label: 'Coupon', value: -Number(order.coupon_discount) },
              { label: 'Tax', value: Number(order.tax_amount) },
              { label: 'Shipping', value: Number(order.shipping_fee) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500 text-xs sm:text-sm">{label}</span>
                <span className={`font-medium text-xs sm:text-sm ${value < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {value < 0 ? '-' : ''}KD {Math.abs(value).toFixed(3)}
                </span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t font-bold text-sm sm:text-base">
              <span>Total</span>
              <span className="text-[#1773CF]">KD {Number(order.total_amount).toFixed(3)}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 text-xs sm:text-sm">Method</span>
              <span className="font-medium text-xs sm:text-sm">{order.payment_method}</span>
            </div>
            {order.coupon_code && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs sm:text-sm">Coupon</span>
                <span className="font-medium text-green-600 text-xs sm:text-sm">{order.coupon_code}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {(order.customer_notes || order.internal_notes) && (
          <div className="bg-white rounded-xl p-4 sm:p-6">
            <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">Notes</h3>
            {order.customer_notes && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">Customer Notes</p>
                <p className="text-xs sm:text-sm text-gray-800 bg-gray-50 rounded-lg p-2 sm:p-3 break-words">{order.customer_notes}</p>
              </div>
            )}
            {order.internal_notes && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Internal Notes</p>
                <p className="text-xs sm:text-sm text-gray-800 bg-amber-50 rounded-lg p-2 sm:p-3 break-words">{order.internal_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    )}

    {activeTab === 'items' && (
      <div className="bg-white rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
 <div className="xl:col-span-4 overflow-x-auto">
          <div className="min-w-[640px] md:min-w-full">
            <table className="w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Product', 'SKU', 'Qty', 'Unit Price', 'Discount', 'Tax', 'Total'].map(h => (
                    <th key={h} className="px-3 sm:px-5 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-5 py-3 sm:py-4">
                      <div className="font-medium text-gray-900 text-xs sm:text-sm break-words">{item.product_name}</div>
                      {item.variant_name && <div className="text-xs text-gray-500">{item.variant_name}</div>}
                    </td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">{item.sku}</td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{item.quantity}</td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap">KD {parseFloat(item.unit_price).toFixed(3)}</td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-red-600 whitespace-nowrap">KD {parseFloat(item.discount_amount).toFixed(3)}</td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">KD {parseFloat(item.tax_amount).toFixed(3)}</td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">KD {parseFloat(item.total).toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={6} className="px-3 sm:px-5 py-2 sm:py-3 font-bold text-gray-700 text-xs sm:text-sm">Grand Total</td>
                  <td className="px-3 sm:px-5 py-2 sm:py-3 font-bold text-[#1773CF] text-xs sm:text-sm whitespace-nowrap">KD {Number(order.total_amount).toFixed(3)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

          </div>
       
      </div>
    )}

    {activeTab === 'history' && (
      <div className="bg-white rounded-xl p-4 sm:p-6">
        {history.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No status history available.</p>
        ) : (
          <div className="space-y-4">
            {history.map((h: any, i: number) => (
              <div key={h.id} className="flex gap-3 sm:gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mt-1 ${i === 0 ? 'bg-[#1773CF]' : 'bg-gray-300'}`} />
                  {i < history.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="pb-4 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[h.new_status] || 'bg-gray-100 text-gray-600'}`}>
                      {h.new_status}
                    </span>
                    {h.old_status && (
                      <span className="text-xs text-gray-400">from {h.old_status}</span>
                    )}
                  </div>
                  {h.notes && <p className="text-xs sm:text-sm text-gray-600 break-words">{h.notes}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {h.changedBy?.name && `By ${h.changedBy.name} · `}
                    {new Date(h.changed_at).toLocaleString('en-GB')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>

  {/* Ship Modal */}
  {showShipModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-base sm:text-lg font-bold mb-4">Ship Order</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Tracking Number *</label>
            <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)}
              placeholder="e.g. 1Z999AA10123456784"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Shipping Provider *</label>
            <input value={shippingProvider} onChange={e => setShippingProvider(e.target.value)}
              placeholder="e.g. Aramex, DHL, FedEx"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setShowShipModal(false)}
            className="flex-1 py-2 sm:py-2.5 border rounded-xl font-medium text-gray-700 hover:bg-gray-50 text-sm transition-colors">
            Cancel
          </button>
          <button onClick={handleShip} disabled={isShipping}
            className="flex-1 py-2 sm:py-2.5 bg-cyan-600 text-white rounded-xl font-medium hover:bg-cyan-700 disabled:opacity-50 text-sm transition-colors">
            {isShipping ? 'Shipping...' : 'Confirm Ship'}
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Cancel Modal */}
  {showCancelModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-base sm:text-lg font-bold mb-4">Cancel Order</h3>
        <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
          rows={3} placeholder="Enter cancellation reason *"
          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
        <div className="flex gap-3">
          <button onClick={() => setShowCancelModal(false)}
            className="flex-1 py-2 sm:py-2.5 border rounded-xl font-medium text-gray-700 hover:bg-gray-50 text-sm transition-colors">
            Back
          </button>
          <button onClick={handleCancel} disabled={isCancelling}
            className="flex-1 py-2 sm:py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 text-sm transition-colors">
            {isCancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Return Modal */}
  {showReturnModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-base sm:text-lg font-bold mb-4">Return Order</h3>
        <textarea value={returnReason} onChange={e => setReturnReason(e.target.value)}
          rows={3} placeholder="Enter return reason *"
          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
        <div className="flex gap-3">
          <button onClick={() => setShowReturnModal(false)}
            className="flex-1 py-2 sm:py-2.5 border rounded-xl font-medium text-gray-700 hover:bg-gray-50 text-sm transition-colors">
            Back
          </button>
          <button onClick={handleReturn} disabled={isReturning}
            className="flex-1 py-2 sm:py-2.5 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 text-sm transition-colors">
            {isReturning ? 'Processing...' : 'Return Order'}
          </button>
        </div>
      </div>
    </div>
  )}
</DashboardLayout>
  );
}