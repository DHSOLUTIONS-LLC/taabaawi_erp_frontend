// src/features/accounting/pages/accounts-receivable/ARDetailPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { 
  useGetARByIdQuery,
  useRecordARReceiptMutation 
} from '../../../../services/accountingApi';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import payment_icon from '../../../../assets/icons/payment_icon.png';

const STATUS_COLORS: Record<string, string> = {
  Unpaid: 'bg-red-100 text-red-700',
  Partial: 'bg-yellow-100 text-yellow-700',
  Paid: 'bg-green-100 text-green-700',
  Overdue: 'bg-orange-100 text-orange-700',
};

const num = (v: any) => parseFloat(v) || 0;

export default function ARDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const arId = id ? parseInt(id, 10) : 0;
  const { data, isLoading, refetch } = useGetARByIdQuery(arId);
  const [recordReceipt] = useRecordARReceiptMutation();

  const ar = (data as any)?.data;

  const handleRecordReceipt = async () => {
    const amount = parseFloat(receiptAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (amount > num(ar.outstanding_amount)) {
      alert(`Receipt amount cannot exceed outstanding amount (${ar.currency} ${num(ar.outstanding_amount).toFixed(3)})`);
      return;
    }

    setIsRecording(true);
    try {
      await recordReceipt({ id: arId, receipt_amount: amount }).unwrap();
      refetch();
      setShowReceiptModal(false);
      setReceiptAmount('');
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to record receipt');
    } finally {
      setIsRecording(false);
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

  if (!ar) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-red-500 font-medium">AR record not found</p>
          <button
            onClick={() => navigate(`${basePath}/accounting/accounts-receivable`)}
            className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Back to Accounts Receivable
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const isOverdue = new Date(ar.due_date) < new Date() && ar.outstanding_amount > 0;
  const displayStatus = isOverdue && ar.status === 'Unpaid' ? 'Overdue' : ar.status;

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
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{ar.ar_number}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[displayStatus]}`}>
                  {displayStatus}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {ar.customer?.name} · Invoice: {ar.invoice_number}
              </p>
            </div>
          </div>

          {ar.status !== 'Paid' && (
            <button
              onClick={() => setShowReceiptModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <img src={payment_icon} alt="" className="w-4 h-4 " />
              Record Receipt
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="col-span-2 space-y-6">
            {/* Invoice Details */}
            <div className="bg-white rounded-xl p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Invoice Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Invoice Number</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{ar.invoice_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Invoice Date</p>
                  <p className="text-sm text-gray-900 mt-1">{new Date(ar.invoice_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(ar.due_date).toLocaleDateString()}
                    {ar.days_overdue > 0 && (
                      <span className="ml-2 text-xs text-red-600 font-medium">
                        {ar.days_overdue} days overdue
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Currency</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{ar.currency}</p>
                </div>
              </div>
            </div>

            {/* Order Info */}
            {ar.order && (
              <div className="bg-white rounded-xl p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Order Information</h2>
                <button
                  onClick={() => navigate(`${basePath}/sales/orders/${ar.order_id}`)}
                  className="text-left w-full p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm font-medium text-blue-600">{ar.order.order_number}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Date: {new Date(ar.order.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Total: {ar.order.currency} {num(ar.order.total_amount).toFixed(3)}
                  </p>
                </button>
              </div>
            )}

            {/* Notes */}
            {ar.notes && (
              <div className="bg-white rounded-xl p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Notes</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{ar.notes}</p>
              </div>
            )}
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Amount Summary */}
            <div className="bg-white rounded-xl p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Amount Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Invoice Amount</span>
                  <span className="font-mono font-medium text-gray-900">
                    {ar.currency} {num(ar.invoice_amount).toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Received Amount</span>
                  <span className="font-mono font-medium text-green-600">
                    {ar.currency} {num(ar.received_amount).toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-semibold">Outstanding</span>
                  <span className="text-lg font-bold text-orange-600">
                    {ar.currency} {num(ar.outstanding_amount).toFixed(3)}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            {ar.customer && (
              <div className="bg-white rounded-xl p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Customer Information</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <button
                      onClick={() => navigate(`${basePath}/customers/${ar.customer.id}`)}
                      className="text-sm font-medium text-blue-600 hover:underline mt-1"
                    >
                      {ar.customer.name}
                    </button>
                  </div>
                  {ar.customer.email && (
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-gray-900 mt-1">{ar.customer.email}</p>
                    </div>
                  )}
                  {ar.customer.phone && (
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm text-gray-900 mt-1">{ar.customer.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="bg-white rounded-xl p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Created</span>
                  <span className="text-xs text-gray-900">{new Date(ar.created_at).toLocaleDateString()}</span>
                </div>
                {ar.paid_at && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Last Receipt</span>
                    <span className="text-xs text-gray-900">{new Date(ar.paid_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Record Receipt</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Outstanding Amount</p>
                <p className="text-xl font-bold text-orange-600">
                  {ar.currency} {num(ar.outstanding_amount).toFixed(3)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Receipt Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  placeholder={`Enter amount in ${ar.currency}`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordReceipt}
                  disabled={isRecording}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isRecording ? 'Recording...' : 'Record Receipt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}