// src/features/purchase/pages/SupplierPayments/SupplierPaymentsPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import {
  useGetSupplierPaymentsQuery,
  useDeleteSupplierPaymentMutation,
  // useGetSupplierPaymentStatisticsQuery,
} from '../../../../services/purchaseApi';

import search_icon from '../../../../assets/icons/search_icon.svg';
import delete_icon from '../../../../assets/icons/delete-icon.png';
import date_icon from '../../../../assets/icons/date_icon.svg';

const METHOD_COLORS: Record<string, string> = {
  Cash: 'bg-green-100 text-green-700',
  'Bank Transfer': 'bg-blue-100 text-blue-700',
  Cheque: 'bg-purple-100 text-purple-700',
  'Credit Card': 'bg-orange-100 text-orange-700',
  'Online Payment': 'bg-indigo-100 text-indigo-700',
};

const num = (v: any) => parseFloat(v) || 0;

export default function SupplierPaymentsPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, refetch } = useGetSupplierPaymentsQuery({
    search: search || undefined,
    payment_method: methodFilter || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    page: currentPage,
    per_page: 15,
  });

    console.log('suppliers:', data)

  // const { data: statsData } = useGetSupplierPaymentStatisticsQuery({
  //   start_date: startDate || undefined,
  //   end_date: endDate || undefined,
  // });



  const [deletePayment] = useDeleteSupplierPaymentMutation();

  const payments = (data as any)?.data?.data || (data as any)?.data || [];
  const pagination = (data as any)?.data;
  // const stats = (statsData as any)?.data ?? (statsData as any);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthPayments = payments.filter((p: any) => {
    const paymentDate = new Date(p.payment_date);
    return paymentDate.getMonth() === currentMonth && 
      paymentDate.getFullYear() === currentYear
  })

  const thisMonthAmount = thisMonthPayments.reduce((sum: number, p: any) =>  
    sum + num(p.amount), 0
  );

  const totalAmount = payments.reduce((sum: number, p: any) => 
  sum + num(p.amount), 0
);


  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment? This will update the PO payment status.')) return;
    try {
      await deletePayment(id).unwrap();
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to delete payment');
    }
  };

 return (
  <DashboardLayout>
    <div className="space-y-4 md:space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Supplier Payments</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Track all payments made to suppliers</p>
        </div>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white rounded-xl p-4 md:p-5">
          <p className="text-xs md:text-sm text-gray-500">Total Payments</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
            {payments.length}
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-4 md:p-5">
          <p className="text-xs md:text-sm text-gray-500">Total Amount Paid</p>
          <p className="text-lg md:text-2xl font-bold text-green-600 mt-1 break-words">
            KWD {totalAmount.toFixed(3)}
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-4 md:p-5">
          <p className="text-xs md:text-sm text-gray-500">This Month</p>
          <p className="text-lg md:text-2xl font-bold text-blue-600 mt-1 break-words">
            KWD {thisMonthAmount.toFixed(3)}
          </p>
        </div>
      </div>

      {/* Filters - Fully Responsive */}
      <div className="bg-white rounded-xl p-4">
        {/* Search - Full width on mobile */}
        <div className="relative mb-3">
          <img src={search_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search by payment number or PO..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Controls - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-3">
          <select
            value={methodFilter}
            onChange={(e) => { setMethodFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Online Payment">Online Payment</option>
          </select>

          <div className="relative">
            <img src={date_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <img src={date_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {(search || methodFilter || startDate || endDate) && (
            <button
              onClick={() => { setSearch(''); setMethodFilter(''); setStartDate(''); setEndDate(''); setCurrentPage(1); }}
              className="w-full sm:w-auto px-4 py-2.5 text-sm text-gray-500 hover:text-red-500 border border-gray-300 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table - Responsive */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No payments found</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-md">Payments appear here once recorded on a Purchase Order</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
   <div className="xl:col-span-4 overflow-x-auto">
            <div className="min-w-[800px] md:min-w-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase">Payment #</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase">PO Number</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-center text-xs font-semibold text-gray-600 uppercase">Method</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase">Reference</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-3 md:px-6 py-2 md:py-4">
                        <button
                          onClick={() => navigate(`${basePath}/purchase/payments/${payment.id}`)}
                          className="text-sm font-semibold text-blue-600 hover:underline break-words text-left"
                        >
                          {payment.payment_number}
                        </button>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-4">
                        <button
                          onClick={() => navigate(`${basePath}/purchase/orders/${payment.purchase_order_id}`)}
                          className="text-sm text-blue-600 hover:underline break-words text-left"
                        >
                          {payment.purchaseOrder?.po_number ?? `#${payment.purchase_order_id}`}
                        </button>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-4 text-sm text-gray-900 break-words">
                        {payment.supplier?.supplier_name ?? '—'}
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-4 text-sm text-gray-700 whitespace-nowrap">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-4 text-right text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {payment.currency} {num(payment.amount).toFixed(3)}
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${METHOD_COLORS[payment.payment_method] ?? 'bg-gray-100 text-gray-700'}`}>
                          {payment.payment_method}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-4 text-sm text-gray-500 break-words">
                        {payment.reference_number ?? '—'}
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-4">
                        <div className="flex items-center justify-center gap-1 md:gap-2">
                          <button
                            onClick={() => navigate(`${basePath}/purchase/payments/${payment.id}`)}
                            className="px-2 md:px-3 py-1 md:py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(payment.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete payment"
                          >
                            <img src={delete_icon} alt="Delete" className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </div>
       
        )}
      </div>

      {/* Pagination - Responsive */}
      {pagination?.last_page > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-500 order-2 sm:order-1">
            Page {pagination.current_page} of {pagination.last_page}
          </p>
          <div className="flex gap-2 order-1 sm:order-2 w-full sm:w-auto">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex-1 sm:flex-none px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
              disabled={currentPage === pagination.last_page}
              className="flex-1 sm:flex-none px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  </DashboardLayout>
);
}