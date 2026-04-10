// src/features/purchase/pages/goods-receipts/GoodsReceiptsPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import {
  useGetGoodsReceiptNotesQuery,
} from '../../../../services/purchaseApi';

import search_icon from '../../../../assets/icons/search_icon.svg';
import add_icon from '../../../../assets/icons/add.svg';
import date_icon from '../../../../assets/icons/date_icon.svg';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Verified: 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

// const num = (v: any) => parseFloat(v) || 0;

export default function GoodsReceiptsPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useGetGoodsReceiptNotesQuery({
    search: search || undefined,
    status: statusFilter || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    page: currentPage,
    per_page: 15,
  });

  const receipts = (data as any)?.data?.data || (data as any)?.data || [];
  console.log('goods reciepts:', receipts)
  const pagination = (data as any)?.data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
     {/* Header - Responsive */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div>
    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Goods Receipt Notes</h1>
    <p className="text-xs md:text-sm text-gray-500 mt-1">Receive and verify purchase orders</p>
  </div>
  <button
    onClick={() => navigate(`${basePath}/purchase/goods-receipts/create`)}
    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
  >
    <img src={add_icon} alt="" className="w-4 h-4" />
    New Receipt
  </button>
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
      placeholder="Search GRN # or PO #..."
      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
    />
  </div>

  {/* Filter Controls - Responsive Grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-3">
    {/* Status Filter */}
    <div className="relative sm:col-span-1">
      <select
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white appearance-none pr-10 focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Statuses</option>
        <option value="Pending">Pending</option>
        <option value="Verified">Verified</option>
        <option value="Completed">Completed</option>
        <option value="Cancelled">Cancelled</option>
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
      </div>
    </div>

    {/* Start Date */}
    <div className="relative">
      <img src={date_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
      <input
        type="date"
        value={startDate}
        onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        placeholder="Start Date"
      />
    </div>

    {/* End Date */}
    <div className="relative">
      <img src={date_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
      <input
        type="date"
        value={endDate}
        min={startDate}
        onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        placeholder="End Date"
      />
    </div>

    {/* Clear Button */}
    {(search || statusFilter || startDate || endDate) && (
      <button
        onClick={() => { setSearch(''); setStatusFilter(''); setStartDate(''); setEndDate(''); setCurrentPage(1); }}
        className="px-4 py-2.5 text-sm text-gray-500 hover:text-red-500 border border-gray-300 rounded-lg transition-colors"
      >
        Clear Filters
      </button>
    )}
  </div>
</div>

        {/* Table */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : receipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No receipts found</p>
              <p className="text-sm text-gray-400 mt-1">Create a receipt from an approved purchase order</p>
              <button
                onClick={() => navigate(`${basePath}/purchase/goods-receipts/create`)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Create Receipt
              </button>
            </div>
          ) : (
             <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
  <div className="xl:col-span-4 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">GRN #</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">PO Number</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Receipt Date</th>
                    {/* <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Items</th> */}
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {receipts.map((receipt: any) => (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`${basePath}/purchase/goods-receipts/${receipt.id}`)}
                          className="text-sm font-semibold text-blue-600 hover:underline"
                        >
                          {receipt.grn_number}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`${basePath}/purchase/orders/${receipt.purchase_order_id}`)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {receipt.purchaseOrder?.po_number ?? `#${receipt.purchase_order_id}`}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {receipt.purchase_order?.supplier?.contact_person_name ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(receipt.receipt_date).toLocaleDateString()}
                      </td>
                      {/* <td className="px-6 py-4 text-sm text-gray-700">
                        {receipt.items?.length || 0} items
                      </td> */}
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[receipt.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {receipt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => navigate(`${basePath}/purchase/goods-receipts/${receipt.id}`)}
                          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
             </div>
          
          )}
        </div>

        {/* Pagination */}
        {pagination?.last_page > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.current_page} of {pagination.last_page}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))}
                disabled={currentPage === pagination.last_page}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
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