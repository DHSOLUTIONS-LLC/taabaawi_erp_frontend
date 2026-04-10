// src/features/purchase/pages/PurchaseReturns/PurchaseReturnDetailPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import {
  useGetPurchaseReturnByIdQuery,
  useCompletePurchaseReturnMutation,
} from '../../../../services/purchaseApi';
import ReturnReasonBadge from '../../components/ReturnReasonBadge';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import ReturnApprovalModal from './ReturnApprovalModal';

const STATUS_COLORS: Record<string, string> = {
  Pending:   'bg-yellow-100 text-yellow-700',
  Approved:  'bg-blue-100 text-blue-700',
  Rejected:  'bg-red-100 text-red-700',
  Completed: 'bg-green-100 text-green-700',
};

const num = (v: any) => parseFloat(v) || 0;

export default function PurchaseReturnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const returnId = id ? parseInt(id, 10) : 0;
  const { data, isLoading, refetch } = useGetPurchaseReturnByIdQuery(returnId);
  const [completeReturn, { isLoading: isCompleting }] = useCompletePurchaseReturnMutation();

  const purchaseReturn = (data as any)?.data ?? (data as any);

  const handleComplete = async () => {
    if (!confirm('Mark this return as completed? This cannot be undone.')) return;
    try {
      await completeReturn(returnId).unwrap();
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to complete return');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!purchaseReturn) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-red-500 font-medium">Return not found</p>
          <button onClick={() => navigate(`${basePath}/purchase/returns`)}
            className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50">
            Back to Returns
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const canApproveOrReject = purchaseReturn.status === 'Pending';
  const canComplete = purchaseReturn.status === 'Approved';

 return (
  <DashboardLayout>
    <div className="space-y-4 md:space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => navigate(`${basePath}/purchase/returns`)} className="shrink-0">
            <img src={arrow_back_icon} alt="" className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 break-words">{purchaseReturn.return_number}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[purchaseReturn.status] ?? 'bg-gray-100 text-gray-700'}`}>
                {purchaseReturn.status}
              </span>
              <ReturnReasonBadge reason={purchaseReturn.reason} />
            </div>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Submitted on {new Date(purchaseReturn.created_at).toLocaleDateString()}
              {purchaseReturn.processedBy?.name ? ` by ${purchaseReturn.processedBy.name}` : ''}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {canApproveOrReject && (
            <button
              onClick={() => setShowApprovalModal(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Review Return
            </button>
          )}
          {canComplete && (
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
            >
              {isCompleting && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {isCompleting ? 'Completing...' : 'Mark as Completed'}
            </button>
          )}
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Left Column - Full width on mobile, 2/3 on desktop */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6 order-2 lg:order-1">
          
          {/* Return Items - Responsive Table */}
          <div className="bg-white rounded-xl p-4 md:p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Return Items</h2>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
 <div className="xl:col-span-4 overflow-x-auto">
              <div className="min-w-[500px] md:min-w-0">
                <table className="w-full">
                  <thead className="bg-gray-50 border-y border-gray-200">
                    <tr>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-center text-xs font-semibold text-gray-600 uppercase">Qty</th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-right text-xs font-semibold text-gray-600 uppercase">Unit Price</th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {purchaseReturn.items?.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-3 md:px-4 py-2 md:py-3">
                          <div className="text-sm font-medium text-gray-900 break-words">
                            {item.product?.product_name ?? `Product #${item.product_id}`}
                          </div>
                          {item.poItem?.sku && (
                            <div className="text-xs text-gray-500">SKU: {item.poItem.sku}</div>
                          )}
                        </td>
                        <td className="px-3 md:px-4 py-2 md:py-3 text-center text-sm">{item.quantity}</td>
                        <td className="px-3 md:px-4 py-2 md:py-3 text-right text-sm whitespace-nowrap">
                          {purchaseReturn.currency ?? 'KWD'} {num(item.unit_price).toFixed(3)}
                        </td>
                        <td className="px-3 md:px-4 py-2 md:py-3 text-right text-sm font-semibold whitespace-nowrap">
                          {purchaseReturn.currency ?? 'KWD'} {num(item.total).toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-200">
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-3 md:px-4 py-2 md:py-3 text-right text-sm font-semibold text-gray-700">
                        Total Return Value
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-right text-base md:text-lg font-bold text-blue-600 whitespace-nowrap">
                        {purchaseReturn.currency ?? 'KWD'} {num(purchaseReturn.return_amount).toFixed(3)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            </div>
           
          </div>

          {/* Reason Details */}
          {purchaseReturn.reason_details && (
            <div className="bg-white rounded-xl p-4 md:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-2">Reason Details</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{purchaseReturn.reason_details}</p>
            </div>
          )}
        </div>

        {/* Right Column - Full width on mobile, 1/3 on desktop */}
        <div className="space-y-4 md:space-y-6 order-1 lg:order-2">
          
          {/* Status Timeline - Responsive */}
          <div className="bg-white rounded-xl p-4 md:p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Status</h2>
            <div className="space-y-3">
              {(['Pending', 'Approved', 'Completed'] as const).map((s, i) => {
                const statusOrder = ['Pending', 'Approved', 'Completed', 'Rejected'];
                const currentIdx = statusOrder.indexOf(purchaseReturn.status);
                const stepIdx = statusOrder.indexOf(s);
                const isDone = stepIdx <= currentIdx && purchaseReturn.status !== 'Rejected';
                const isCurrent = s === purchaseReturn.status;

                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isDone ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs md:text-sm ${isCurrent ? 'font-semibold text-gray-900' : isDone ? 'text-gray-700' : 'text-gray-400'}`}>
                      {s}
                    </span>
                  </div>
                );
              })}
              {purchaseReturn.status === 'Rejected' && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold shrink-0">✗</div>
                  <span className="text-xs md:text-sm font-semibold text-red-600">Rejected</span>
                </div>
              )}
            </div>
          </div>

          {/* Related PO */}
          <div className="bg-white rounded-xl p-4 md:p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Purchase Order</h2>
            {purchaseReturn.purchaseOrder ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">PO Number</p>
                  <button
                    onClick={() => navigate(`${basePath}/purchase/orders/${purchaseReturn.purchase_order_id}`)}
                    className="text-sm font-semibold text-blue-600 hover:underline break-words text-left"
                  >
                    {purchaseReturn.purchaseOrder.po_number}
                  </button>
                </div>
                <div>
                  <p className="text-xs text-gray-500">PO Status</p>
                  <p className="text-sm text-gray-900">{purchaseReturn.purchaseOrder.status}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate(`${basePath}/purchase/orders/${purchaseReturn.purchase_order_id}`)}
                className="text-sm text-blue-600 hover:underline"
              >
                View PO #{purchaseReturn.purchase_order_id}
              </button>
            )}
          </div>

          {/* Supplier */}
          <div className="bg-white rounded-xl p-4 md:p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Supplier</h2>
            {purchaseReturn.supplier ? (
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <button
                    onClick={() => navigate(`${basePath}/purchase/suppliers/${purchaseReturn.supplier_id}`)}
                    className="text-sm font-semibold text-blue-600 hover:underline break-words text-left"
                  >
                    {purchaseReturn.supplier.supplier_name}
                  </button>
                </div>
                {purchaseReturn.supplier.email && (
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-gray-900 break-words">{purchaseReturn.supplier.email}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 break-words">Supplier #{purchaseReturn.supplier_id}</p>
            )}
          </div>

          {/* Dates */}
          <div className="bg-white rounded-xl p-4 md:p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Dates</h2>
            <div className="space-y-3">
              <div className="flex justify-between flex-wrap gap-2">
                <span className="text-xs text-gray-500">Return Date</span>
                <span className="text-sm">{new Date(purchaseReturn.return_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between flex-wrap gap-2">
                <span className="text-xs text-gray-500">Created</span>
                <span className="text-sm">{new Date(purchaseReturn.created_at).toLocaleDateString()}</span>
              </div>
              {purchaseReturn.approvedBy && (
                <div className="flex justify-between flex-wrap gap-2">
                  <span className="text-xs text-gray-500">
                    {purchaseReturn.status === 'Rejected' ? 'Rejected By' : 'Approved By'}
                  </span>
                  <span className="text-sm break-words">{purchaseReturn.approvedBy.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {showApprovalModal && purchaseReturn && (
      <ReturnApprovalModal
        purchaseReturn={purchaseReturn}
        onClose={() => setShowApprovalModal(false)}
        onSuccess={refetch}
      />
    )}
  </DashboardLayout>
);
}