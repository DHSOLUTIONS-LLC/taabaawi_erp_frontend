// src/features/accounting/pages/accounts-payable/APDetailPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import {
  useGetAPByIdQuery,
  useRecordAPPaymentMutation,
  useGetSupplierPaymentAccountsQuery, // ADD THIS
} from '../../../../services/accountingApi';
import { useGetChartOfAccountsQuery } from '../../../../services/accountingApi';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import payment_icon from '../../../../assets/icons/payment_icon.png';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

const STATUS_COLORS: Record<string, string> = {
  Unpaid: 'bg-red-100 text-red-700',
  Partial: 'bg-yellow-100 text-yellow-700',
  Paid: 'bg-green-100 text-green-700',
  Overdue: 'bg-orange-100 text-orange-700',
};

const num = (v: any) => parseFloat(v) || 0;

export default function APDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const apId = id ? parseInt(id, 10) : 0;
  const { data, isLoading, refetch } = useGetAPByIdQuery(apId);
  const [recordPayment] = useRecordAPPaymentMutation();

  const ap = (data as any)?.data;
  console.log('AP Data:', ap);

  // Fetch payment accounts for this supplier
  const { 
    data: paymentAccountsData, 
    isLoading: paymentAccountsLoading 
  } = useGetSupplierPaymentAccountsQuery(ap?.supplier_id, {
    skip: !ap?.supplier_id,
  });

  // The API returns: { success: true, data: [...] }
  const paymentAccounts = (paymentAccountsData as any)?.data || [];

  // Auto-select current payment account when available
  useEffect(() => {
    if (ap?.payment_account_id) {
      setSelectedAccountId(String(ap.payment_account_id));
    }
  }, [ap]);

  const handleRecordPayment = async () => {
    const amount = parseFloat(paymentAmount);

    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (amount > num(ap.outstanding_amount)) {
      alert(`Payment amount cannot exceed outstanding amount (${ap.currency} ${num(ap.outstanding_amount).toFixed(3)})`);
      return;
    }

    if (!selectedAccountId) {
      alert('Please select a payment account');
      return;
    }

    setIsRecording(true);
    try {
      const payload = {
        id: apId,
        payment_amount: amount,
        payment_account_id: parseInt(selectedAccountId),
      };
      console.log('Sending payload:', payload);

      await recordPayment(payload).unwrap();

      refetch();
      setShowPaymentModal(false);
      setPaymentAmount('');
      alert('Payment recorded successfully!');
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMsg = err?.data?.message || err?.message || 'Failed to record payment';
      alert(errorMsg);
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

  if (!ap) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-red-500 font-medium">AP record not found</p>
          <button
            onClick={() => navigate(`${basePath}/accounting/accounts-payable`)}
            className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Back to Accounts Payable
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const isOverdue = new Date(ap.due_date) < new Date() && ap.outstanding_amount > 0;
  const displayStatus = isOverdue && ap.status === 'Unpaid' ? 'Overdue' : ap.status;

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <button
              onClick={() => navigate(`${basePath}/accounting/accounts-payable`)}
              className="flex-shrink-0 mt-1"
            >
              <img src={arrow_back_icon} alt="" className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{ap.ap_number}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[displayStatus]}`}>
                  {displayStatus}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">
                {ap.supplier?.supplier_name} · Invoice: {ap.invoice_number}
              </p>
            </div>
          </div>

          {ap.status !== 'Paid' && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base"
            >
              <img src={payment_icon} alt="" className="w-4 h-4" />
              Record Payment
            </button>
          )}
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Invoice Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Invoice Number</p>
                  <p className="text-sm font-medium text-gray-900 mt-1 break-words">{ap.invoice_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Invoice Date</p>
                  <p className="text-sm text-gray-900 mt-1">{new Date(ap.invoice_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(ap.due_date).toLocaleDateString()}
                    {ap.days_overdue > 0 && (
                      <span className="ml-2 text-xs text-red-600 font-medium whitespace-nowrap">
                        {ap.days_overdue} days overdue
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Currency</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{ap.currency}</p>
                </div>
              </div>
            </div>

            {ap.purchaseOrder && (
              <div className="bg-white rounded-xl p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Purchase Order</h2>
                <button
                  onClick={() => navigate(`${basePath}/purchase/orders/${ap.purchase_order_id}`)}
                  className="text-left w-full p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm font-medium text-blue-600 break-words">{ap.purchaseOrder.po_number}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Date: {new Date(ap.purchaseOrder.order_date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 break-words">
                    Total: {ap.purchaseOrder.currency} {num(ap.purchaseOrder.total_amount).toFixed(3)}
                  </p>
                </button>
              </div>
            )}

            {ap.notes && (
              <div className="bg-white rounded-xl p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Notes</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{ap.notes}</p>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Amount Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Invoice Amount</span>
                  <span className="font-mono font-medium text-gray-900 break-words text-right">
                    {ap.currency} {num(ap.invoice_amount).toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Paid Amount</span>
                  <span className="font-mono font-medium text-green-600 break-words text-right">
                    {ap.currency} {num(ap.paid_amount).toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm font-semibold">Outstanding</span>
                  <span className="text-base sm:text-lg font-bold text-orange-600 break-words text-right">
                    {ap.currency} {num(ap.outstanding_amount).toFixed(3)}
                  </span>
                </div>
              </div>
            </div>

            {ap.supplier && (
              <div className="bg-white rounded-xl p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Supplier Information</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <button
                      onClick={() => navigate(`${basePath}/purchase/suppliers/${ap.supplier.id}`)}
                      className="text-sm font-medium text-blue-600 hover:underline mt-1 break-words text-left"
                    >
                      {ap.supplier.supplier_name}
                    </button>
                  </div>
                  {ap.supplier.email && (
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-gray-900 mt-1 break-words">{ap.supplier.email}</p>
                    </div>
                  )}
                  {ap.supplier.phone && (
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm text-gray-900 mt-1">{ap.supplier.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Created</span>
                  <span className="text-xs text-gray-900">{new Date(ap.created_at).toLocaleDateString()}</span>
                </div>
                {ap.paid_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Last Payment</span>
                    <span className="text-xs text-gray-900">{new Date(ap.paid_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 sm:mx-auto p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Record Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <p className="text-xs text-gray-500">Outstanding Amount</p>
                <p className="text-lg sm:text-xl font-bold text-orange-600 break-words">
                  {ap.currency} {num(ap.outstanding_amount).toFixed(3)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Payment Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Enter amount in ${ap.currency}`}
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Payment Account <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedAccountId || ap.payment_account_id || ''}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    required
                  >
                    <option value="">Select Payment Account</option>
                    {paymentAccounts.map((account: any) => (
                      <option key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name} 
                        {ap.payment_account_id === account.id && ' (Current)'}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                  </div>
                </div>
                {ap.payment_account && (
                  <p className="text-xs text-blue-600 mt-1">
                    Current: {ap.payment_account.account_code} - {ap.payment_account.account_name}
                  </p>
                )}
                {paymentAccounts.length === 0 && !paymentAccountsLoading && (
                  <p className="text-xs text-yellow-600 mt-1">
                    No payment accounts found for this supplier. Please add a payment account first.
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordPayment}
                  disabled={isRecording || paymentAccounts.length === 0}
                  className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm sm:text-base"
                >
                  {isRecording ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}