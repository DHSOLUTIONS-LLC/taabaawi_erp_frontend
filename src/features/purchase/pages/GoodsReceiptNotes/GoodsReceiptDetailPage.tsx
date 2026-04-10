// src/features/purchase/pages/goods-receipts/GoodsReceiptDetailPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import {
  useGetGoodsReceiptNoteByIdQuery,
  useVerifyGoodsReceiptNoteMutation,
  useCompleteGoodsReceiptNoteMutation,
} from '../../../../services/purchaseApi';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import check_icon from '../../../../assets/icons/check_icon.png';
// import close_icon from '../../../../assets/icons/close_icon.svg';

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Verified: 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const CONDITION_COLORS: Record<string, string> = {
  Good: 'bg-green-100 text-green-700',
  Damaged: 'bg-red-100 text-red-700',
  Defective: 'bg-orange-100 text-orange-700',
  Expired: 'bg-gray-100 text-gray-700',
};

// const num = (v: any) => parseFloat(v) || 0;

export default function GoodsReceiptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);

  const receiptId = id ? parseInt(id, 10) : 0;
  const { data, isLoading, refetch } = useGetGoodsReceiptNoteByIdQuery(receiptId);
  const [verifyReceipt, { isLoading: isVerifying }] = useVerifyGoodsReceiptNoteMutation();
  const [completeReceipt, { isLoading: isCompleting }] = useCompleteGoodsReceiptNoteMutation();

  const receipt = (data as any)?.data ?? (data as any);

  const handleVerify = async () => {
    try {
      await verifyReceipt(receiptId).unwrap();
      refetch();
      setShowVerifyConfirm(false);
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to verify receipt');
    }
  };

  const handleComplete = async () => {
    if (!confirm('Mark this receipt as completed? This action cannot be undone.')) return;
    try {
      await completeReceipt(receiptId).unwrap();
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to complete receipt');
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

  if (!receipt) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-red-500 font-medium">Receipt not found</p>
          <button
            onClick={() => navigate(`${basePath}/purchase/goods-receipts`)}
            className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Back to Receipts
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const canVerify = receipt.status === 'Pending';
  const canComplete = receipt.status === 'Verified';

  return (
    <DashboardLayout>
  <div className="space-y-4 md:space-y-6">
    {/* Header - Responsive */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3 md:gap-4">
        <button onClick={() => navigate(`${basePath}/purchase/goods-receipts`)} className="shrink-0">
          <img src={arrow_back_icon} alt="" className="w-6 h-6 md:w-8 md:h-8" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 break-words">{receipt.grn_number}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[receipt.status]}`}>
              {receipt.status}
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Received on {new Date(receipt.receipt_date).toLocaleDateString()}
            {receipt.receivedBy?.name && ` by ${receipt.receivedBy.name}`}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {canVerify && (
          <button
            onClick={() => setShowVerifyConfirm(true)}
            className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
          >
            <img src={check_icon} alt="" className="w-4 h-4" />
            Verify Receipt
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
            {isCompleting ? 'Completing...' : 'Complete Receipt'}
          </button>
        )}
      </div>
    </div>

    {/* Main Content - Responsive Layout */}
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
      
      {/* Left Column - Full width on mobile, 2/3 on desktop */}
      <div className="lg:col-span-2 space-y-4 md:space-y-6 order-2 lg:order-1">
        
        {/* Items Table - Responsive */}
        <div className="bg-white rounded-xl p-4 md:p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Received Items</h2>
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
<div className="xl:col-span-4 overflow-x-auto">
            <div className="min-w-[600px] md:min-w-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-center text-xs font-semibold text-gray-600 uppercase">Ordered</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-center text-xs font-semibold text-gray-600 uppercase">Received</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-center text-xs font-semibold text-gray-600 uppercase">Accepted</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-center text-xs font-semibold text-gray-600 uppercase">Rejected</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-center text-xs font-semibold text-gray-600 uppercase">Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {receipt.items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <div className="text-sm font-medium text-gray-900 break-words">
                          {item.product?.product_name ?? `Product #${item.product_id}`}
                        </div>
                        {item.poItem?.sku && (
                          <div className="text-xs text-gray-500">SKU: {item.poItem.sku}</div>
                        )}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-center text-sm text-gray-700">
                        {item.quantity_ordered}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-center text-sm font-medium text-gray-900">
                        {item.quantity_received}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-center text-sm text-green-600">
                        {item.quantity_accepted}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-center text-sm text-red-600">
                        {item.quantity_rejected}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${CONDITION_COLORS[item.condition]}`}>
                          {item.condition}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </div>
          

          {receipt.discrepancy_notes && (
            <div className="mt-4 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 mb-1">Discrepancy Notes</p>
              <p className="text-xs sm:text-sm text-yellow-700 break-words">{receipt.discrepancy_notes}</p>
            </div>
          )}

          {receipt.notes && (
            <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
              <p className="text-xs sm:text-sm text-gray-600 break-words">{receipt.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Full width on mobile, 1/3 on desktop */}
      <div className="space-y-4 md:space-y-6 order-1 lg:order-2">
        
        {/* PO Info */}
        <div className="bg-white rounded-xl p-4 md:p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Purchase Order</h2>
          {receipt.purchaseOrder ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">PO Number</p>
                <button
                  onClick={() => navigate(`${basePath}/purchase/orders/${receipt.purchase_order_id}`)}
                  className="text-sm font-semibold text-blue-600 hover:underline break-words text-left"
                >
                  {receipt.purchaseOrder.po_number}
                </button>
              </div>
              <div>
                <p className="text-xs text-gray-500">Supplier</p>
                <p className="text-sm text-gray-900 break-words">{receipt.purchaseOrder.supplier?.supplier_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">PO Status</p>
                <p className="text-sm text-gray-900">{receipt.purchaseOrder.status}</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate(`${basePath}/purchase/orders/${receipt.purchase_order_id}`)}
              className="text-sm text-blue-600 hover:underline"
            >
              View PO #{receipt.purchase_order_id}
            </button>
          )}
        </div>

        {/* Supplier Invoice */}
        {(receipt.supplier_invoice_number || receipt.supplier_invoice_date) && (
          <div className="bg-white rounded-xl p-4 md:p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Supplier Invoice</h2>
            <div className="space-y-3">
              {receipt.supplier_invoice_number && (
                <div>
                  <p className="text-xs text-gray-500">Invoice Number</p>
                  <p className="text-sm text-gray-900 break-words">{receipt.supplier_invoice_number}</p>
                </div>
              )}
              {receipt.supplier_invoice_date && (
                <div>
                  <p className="text-xs text-gray-500">Invoice Date</p>
                  <p className="text-sm text-gray-900">
                    {new Date(receipt.supplier_invoice_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-white rounded-xl p-4 md:p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Items</span>
              <span className="font-medium">{receipt.items?.length || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Received</span>
              <span className="font-medium">
                {receipt.items?.reduce((sum: number, i: any) => sum + i.quantity_received, 0) || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Accepted</span>
              <span className="font-medium text-green-600">
                {receipt.items?.reduce((sum: number, i: any) => sum + i.quantity_accepted, 0) || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Rejected</span>
              <span className="font-medium text-red-600">
                {receipt.items?.reduce((sum: number, i: any) => sum + i.quantity_rejected, 0) || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-white rounded-xl p-4 md:p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Dates</h2>
          <div className="space-y-3">
            <div className="flex justify-between flex-wrap gap-2">
              <span className="text-xs text-gray-500">Receipt Date</span>
              <span className="text-sm">{new Date(receipt.receipt_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between flex-wrap gap-2">
              <span className="text-xs text-gray-500">Created</span>
              <span className="text-sm">{new Date(receipt.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Verify Confirmation Modal - Responsive */}
  {showVerifyConfirm && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-5 sm:p-6 max-w-md w-full mx-3 sm:mx-4 my-auto">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Verify Receipt</h3>
        <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6">
          Are you sure you want to verify this receipt? This confirms that the received items match the documentation.
        </p>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            onClick={() => setShowVerifyConfirm(false)}
            className="sm:flex-1 lg:flex-none px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="sm:flex-1 lg:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {isVerifying && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {isVerifying ? 'Verifying...' : 'Confirm Verify'}
          </button>
        </div>
      </div>
    </div>
  )}
</DashboardLayout>
  );
}