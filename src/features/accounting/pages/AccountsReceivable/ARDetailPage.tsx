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

export default function ARDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const arId = id ? parseInt(id, 10) : 0;
  const { data, isLoading, refetch } = useGetARByIdQuery(arId);
  const [recordReceipt] = useRecordARReceiptMutation();

  // Fetch chart of accounts for dropdown (only active asset/cash accounts)
  const { data: accountsData } = useGetChartOfAccountsQuery({
    is_active: 1 as any,
    per_page: 1000,
  });

  const ar = (data as any)?.data;
  
  // Filter accounts - receipt should go to Cash/Bank accounts
  const accounts = (accountsData as any)?.data?.data || (accountsData as any)?.data || [];
  
  // Filter only Asset accounts (Cash, Bank, etc.) for receipt
  const receiptAccounts = accounts.filter((account: any) => 
    account.account_type === 'Asset' && 
    account.is_active === true
  );

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

    if (!selectedAccountId) {
      alert('Please select a receipt account');
      return;
    }

    setIsRecording(true);
    try {
      await recordReceipt({ 
        id: arId, 
        receipt_amount: amount,
        receipt_account_id: parseInt(selectedAccountId)
      }).unwrap();
      refetch();
      setShowReceiptModal(false);
      setReceiptAmount('');
      setSelectedAccountId('');
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
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <button
              onClick={() => navigate(`${basePath}/accounting/accounts-receivable`)}
              className="flex-shrink-0 mt-1"
            >
              <img src={arrow_back_icon} alt="" className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{ar.ar_number}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[displayStatus]}`}>
                  {displayStatus}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">
                {ar.customer?.name} · Invoice: {ar.invoice_number}
              </p>
            </div>
          </div>

          {ar.status !== 'Paid' && (
            <button
              onClick={() => setShowReceiptModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base"
            >
              <img src={payment_icon} alt="" className="w-4 h-4" />
              Record Receipt
            </button>
          )}
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - 2/3 width on desktop, full width on mobile */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Invoice Details */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Invoice Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Invoice Number</p>
                  <p className="text-sm font-medium text-gray-900 mt-1 break-words">{ar.invoice_number}</p>
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
                      <span className="ml-2 text-xs text-red-600 font-medium whitespace-nowrap">
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
              <div className="bg-white rounded-xl p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Order Information</h2>
                <button
                  onClick={() => navigate(`${basePath}/sales/orders/${ar.order_id}`)}
                  className="text-left w-full p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm font-medium text-blue-600 break-words">{ar.order.order_number}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Date: {new Date(ar.order.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 break-words">
                    Total: {ar.order.currency} {num(ar.order.total_amount).toFixed(3)}
                  </p>
                </button>
              </div>
            )}

            {/* Notes */}
            {ar.notes && (
              <div className="bg-white rounded-xl p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Notes</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{ar.notes}</p>
              </div>
            )}
          </div>

          {/* Right Column - 1/3 width on desktop, full width on mobile */}
          <div className="space-y-4 sm:space-y-6">
            {/* Amount Summary */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Amount Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Invoice Amount</span>
                  <span className="font-mono font-medium text-gray-900 break-words text-right">
                    {ar.currency} {num(ar.invoice_amount).toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Received Amount</span>
                  <span className="font-mono font-medium text-green-600 break-words text-right">
                    {ar.currency} {num(ar.received_amount).toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm font-semibold">Outstanding</span>
                  <span className="text-base sm:text-lg font-bold text-orange-600 break-words text-right">
                    {ar.currency} {num(ar.outstanding_amount).toFixed(3)}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            {ar.customer && (
              <div className="bg-white rounded-xl p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Customer Information</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <button
                      onClick={() => navigate(`${basePath}/customers/${ar.customer.id}`)}
                      className="text-sm font-medium text-blue-600 hover:underline mt-1 break-words text-left"
                    >
                      {ar.customer.name}
                    </button>
                  </div>
                  {ar.customer.email && (
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-gray-900 mt-1 break-words">{ar.customer.email}</p>
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

            {/* Timeline */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Created</span>
                  <span className="text-xs text-gray-900">{new Date(ar.created_at).toLocaleDateString()}</span>
                </div>
                {ar.paid_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Last Receipt</span>
                    <span className="text-xs text-gray-900">{new Date(ar.paid_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal with Chart of Accounts */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 sm:mx-auto p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Record Receipt</h3>
              <button
                onClick={() => setShowReceiptModal(false)}
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
                  {ar.currency} {num(ar.outstanding_amount).toFixed(3)}
                </p>
              </div>

              {/* Receipt Amount */}
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
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  autoFocus
                />
              </div>

              {/* Chart of Accounts Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Receipt Account <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    required
                  >
                    <option value="">Select Receipt Account</option>
                    {receiptAccounts.map((account: any) => (
                      <option key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name} ({account.account_type})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Select the cash/bank account where the payment is received
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordReceipt}
                  disabled={isRecording}
                  className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm sm:text-base"
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