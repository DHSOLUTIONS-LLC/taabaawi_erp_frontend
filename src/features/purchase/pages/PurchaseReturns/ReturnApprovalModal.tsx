// src/features/purchase/components/ReturnApprovalModal.tsx
import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  useApprovePurchaseReturnMutation,
  useRejectPurchaseReturnMutation,
} from '../../../../services/purchaseApi';
import type { PurchaseReturn } from '../../../../services/purchaseApi';
import ReturnReasonBadge from '../../components/ReturnReasonBadge';

interface ReturnApprovalModalProps {
  purchaseReturn: PurchaseReturn;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnApprovalModal({ purchaseReturn, onClose, onSuccess }: ReturnApprovalModalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');

  const [approveReturn, { isLoading: isApproving }] = useApprovePurchaseReturnMutation();
  const [rejectReturn, { isLoading: isRejecting }] = useRejectPurchaseReturnMutation();

  const isLoading = isApproving || isRejecting;

  const handleSubmit = async () => {
    if (action === 'reject' && !reason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }
    try {
      if (action === 'approve') {
        await approveReturn(purchaseReturn.id).unwrap();
      } else {
        await rejectReturn({ id: purchaseReturn.id, reason }).unwrap();
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err?.data?.message || `Failed to ${action} return`);
    }
  };

  const num = (v: any) => parseFloat(v) || 0;

  return (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl my-auto mx-3 sm:mx-4">
      {/* Header - Responsive */}
      <div className="flex items-start sm:items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Review Return Request</h2>
          <p className="text-xs text-gray-500 mt-0.5 break-words">{purchaseReturn.return_number}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* Return Summary - Responsive Grid */}
        <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">Return Number</p>
              <p className="text-sm font-semibold text-gray-900 break-words">{purchaseReturn.return_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Return Amount</p>
              <p className="text-sm font-semibold text-blue-600 break-words">
                {purchaseReturn.currency} {num(purchaseReturn.return_amount).toFixed(3)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Reason</p>
              <ReturnReasonBadge reason={purchaseReturn.reason} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Return Date</p>
              <p className="text-sm text-gray-900">
                {new Date(purchaseReturn.return_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          {purchaseReturn.reason_details && (
            <div>
              <p className="text-xs text-gray-500">Details</p>
              <p className="text-sm text-gray-700 break-words">{purchaseReturn.reason_details}</p>
            </div>
          )}
        </div>

        {/* Items - Responsive Table */}
        {purchaseReturn.items && purchaseReturn.items.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Items to Return</p>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[300px]">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-600">Product</th>
                        <th className="px-2 sm:px-3 py-2 text-center text-xs font-semibold text-gray-600">Qty</th>
                        <th className="px-2 sm:px-3 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {purchaseReturn.items.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-2 sm:px-3 py-2 text-gray-900 break-words">{item.product?.product_name ?? `Product #${item.product_id}`}</td>
                          <td className="px-2 sm:px-3 py-2 text-center text-gray-700">{item.quantity}</td>
                          <td className="px-2 sm:px-3 py-2 text-right font-medium whitespace-nowrap">
                            {purchaseReturn.currency} {num(item.total).toFixed(3)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Selection - Responsive */}
        {!action ? (
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
            <button
              onClick={() => setAction('approve')}
              className="py-2.5 sm:py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Approve Return
            </button>
            <button
              onClick={() => setAction('reject')}
              className="py-2.5 sm:py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject Return
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium ${
              action === 'approve' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {action === 'approve' ? '✓ Approving this return request' : '✗ Rejecting this return request'}
            </div>

            {action === 'reject' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this return is being rejected..."
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none text-sm"
                />
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => { setAction(null); setReason(''); }}
                className="sm:flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`sm:flex-1 py-2.5 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm ${
                  action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isLoading && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {isLoading ? 'Processing...' : `Confirm ${action === 'approve' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
}