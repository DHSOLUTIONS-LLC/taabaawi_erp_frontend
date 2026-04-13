// src/features/purchase/pages/SupplierPayments/PaymentDetailPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import {
  useGetSupplierPaymentByIdQuery,
  useDeleteSupplierPaymentMutation,
} from '../../../../services/purchaseApi';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import delete_icon from '../../../../assets/icons/delete-icon.png';

const METHOD_COLORS: Record<string, string> = {
  Cash: 'bg-green-100 text-green-700',
  'Bank Transfer': 'bg-blue-100 text-blue-700',
  Cheque: 'bg-purple-100 text-purple-700',
  'Credit Card': 'bg-orange-100 text-orange-700',
  'Online Payment': 'bg-indigo-100 text-indigo-700',
};

const num = (v: any) => parseFloat(v) || 0;

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const paymentId = id ? parseInt(id, 10) : 0;
  const { data, isLoading } = useGetSupplierPaymentByIdQuery(paymentId);
  const [deletePayment, { isLoading: isDeleting }] = useDeleteSupplierPaymentMutation();

  const payment = (data as any)?.data ?? (data as any);

  const handleDelete = async () => {
    if (!confirm('Delete this payment? The PO payment status will be updated accordingly.')) return;
    try {
      await deletePayment(paymentId).unwrap();
      navigate(`${basePath}/purchase/payments`);
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to delete payment');
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

  if (!payment) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-red-500 font-medium">Payment not found</p>
          <button
            onClick={() => navigate(`${basePath}/purchase/payments`)}
            className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Back to Payments
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 max-w-full mx-auto">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => navigate(`${basePath}/purchase/payments`)} className="shrink-0">
              <img src={arrow_back_icon} alt="" className="w-6 h-6 md:w-8 md:h-8" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 break-words">{payment.payment_number}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${METHOD_COLORS[payment.payment_method] ?? 'bg-gray-100 text-gray-700'}`}>
                  {payment.payment_method}
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Recorded on {new Date(payment.created_at).toLocaleDateString()}
                {payment.paidBy?.name ? ` by ${payment.paidBy.name}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
          >
            <img src={delete_icon} alt="" className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : 'Delete Payment'}
          </button>
        </div>

        {/* Main Content - Responsive Layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">

          {/* Left Column - Payment Details (Full width on mobile, 2/3 on desktop) */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6 order-2 lg:order-1">

            {/* Amount Card */}
            <div className="bg-white rounded-xl p-4 md:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Payment Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-3 sm:p-4 col-span-1 sm:col-span-2">
                  <p className="text-xs text-blue-600 mb-1">Amount Paid</p>
                  <p className="text-2xl md:text-3xl font-bold text-blue-700 break-words">
                    {payment.currency} {num(payment.amount).toFixed(3)}
                  </p>
                  {payment.currency !== 'KWD' && payment.exchange_rate && (
                    <p className="text-xs text-blue-500 mt-1 break-words">
                      KWD {(num(payment.amount) / num(payment.exchange_rate)).toFixed(3)} equivalent
                      &nbsp;(rate: {num(payment.exchange_rate).toFixed(6)})
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Payment Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(payment.payment_date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap inline-block ${METHOD_COLORS[payment.payment_method] ?? 'bg-gray-100 text-gray-700'}`}>
                    {payment.payment_method}
                  </span>
                </div>

                {payment.reference_number && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Reference / Cheque Number</p>
                    <p className="text-sm font-mono font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg break-words">
                      {payment.reference_number}
                    </p>
                  </div>
                )}

                {payment.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 px-3 py-2 rounded-lg break-words">
                      {payment.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Related Info (Full width on mobile, 1/3 on desktop) */}
          <div className="space-y-4 md:space-y-6 order-1 lg:order-2">

            {/* Purchase Order */}
            <div className="bg-white rounded-xl p-4 md:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Purchase Order</h2>
              {payment.purchaseOrder ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">PO Number</p>
                    <button
                      onClick={() => navigate(`${basePath}/purchase/orders/${payment.purchase_order_id}`)}
                      className="text-sm font-semibold text-blue-600 hover:underline break-words text-left"
                    >
                      {payment.purchaseOrder.po_number}
                    </button>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">PO Total</p>
                    <p className="text-sm font-medium text-gray-900 break-words">
                      {payment.currency} {num(payment.purchaseOrder.total_amount).toFixed(3)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Payment Status</p>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-block ${payment.purchaseOrder.payment_status === 'Paid'
                        ? 'bg-green-100 text-green-700'
                        : payment.purchaseOrder.payment_status === 'Partially Paid'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                      {payment.purchaseOrder.payment_status}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => navigate(`${basePath}/purchase/orders/${payment.purchase_order_id}`)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View PO #{payment.purchase_order_id}
                </button>
              )}
            </div>

            {/* Supplier */}
            <div className="bg-white rounded-xl p-4 md:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Supplier</h2>
              {payment.supplier ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <button
                      onClick={() => navigate(`${basePath}/purchase/suppliers/${payment.supplier_id}`)}
                      className="text-sm font-semibold text-blue-600 hover:underline break-words text-left"
                    >
                      {payment.supplier.supplier_name}
                    </button>
                  </div>
                  {payment.supplier.email && (
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-gray-900 break-words">{payment.supplier.email}</p>
                    </div>
                  )}
                  {payment.supplier.phone && (
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm text-gray-900 break-words">{payment.supplier.phone}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 break-words">Supplier #{payment.supplier_id}</p>
              )}
            </div>

            {/* Recorded By */}
            {payment.paidBy && (
              <div className="bg-white rounded-xl p-4 md:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Recorded By</h2>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900 break-words">{payment.paidBy.name}</p>
                  {payment.paidBy.email && (
                    <p className="text-xs text-gray-500 break-words">{payment.paidBy.email}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(payment.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}