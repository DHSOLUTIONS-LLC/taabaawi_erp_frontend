// src/features/purchase/pages/PurchaseReturns/PurchaseReturnsPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import {
  useGetPurchaseReturnsQuery,
  useGetPurchaseReturnStatisticsQuery,
} from '../../../../services/purchaseApi';
import ReturnReasonBadge from '../../components/ReturnReasonBadge';

import search_icon from '../../../../assets/icons/search_icon.svg';
import add_icon from '../../../../assets/icons/add.svg';
import date_icon from '../../../../assets/icons/date_icon.svg';

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Approved: 'bg-blue-100 text-blue-700',
  Rejected: 'bg-red-100 text-red-700',
  Completed: 'bg-green-100 text-green-700',
};

const num = (v: any) => parseFloat(v) || 0;

export default function PurchaseReturnsPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useGetPurchaseReturnsQuery({
    search: search || undefined,
    status: statusFilter || undefined,
    reason: reasonFilter || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    page: currentPage,
    per_page: 15,
  });

  const { data: statsData } = useGetPurchaseReturnStatisticsQuery({
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  });

  const returns = (data as any)?.data?.data || (data as any)?.data || [];
  const pagination = (data as any)?.data;
  const stats = (statsData as any)?.data ?? (statsData as any);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Purchase Returns</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Manage and track supplier return requests</p>
          </div>
          <button
            onClick={() => navigate(`${basePath}/purchase/returns/create`)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
          >
            <img src={add_icon} alt="" className="w-4 h-4" />
            New Return
          </button>
        </div>

        {/* Stats - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white rounded-xl p-4 md:p-5">
            <p className="text-xs md:text-sm text-gray-500">Total Returns</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
              {stats?.total_returns ?? returns.length}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-5">
            <p className="text-xs md:text-sm text-gray-500">Pending Review</p>
            <p className="text-xl md:text-2xl font-bold text-yellow-600 mt-1">
              {stats?.pending ?? returns.filter((r: any) => r.status === 'Pending').length}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-5">
            <p className="text-xs md:text-sm text-gray-500">Total Return Value</p>
            <p className="text-lg md:text-2xl font-bold text-blue-600 mt-1 break-words">
              KWD {num(stats?.total_return_amount ??
                returns.reduce((sum: number, r: any) => sum + num(r.return_amount), 0)
              ).toFixed(3)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-5">
            <p className="text-xs md:text-sm text-gray-500">Completed</p>
            <p className="text-xl md:text-2xl font-bold text-green-600 mt-1">
              {stats?.completed ?? returns.filter((r: any) => r.status === 'Completed').length}
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
              placeholder="Search return number or PO..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Controls - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Reason Filter */}
            <select
              value={reasonFilter}
              onChange={(e) => { setReasonFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Reasons</option>
              <option value="Damaged">Damaged</option>
              <option value="Defective">Defective</option>
              <option value="Wrong Item">Wrong Item</option>
              <option value="Excess Quantity">Excess Quantity</option>
              <option value="Other">Other</option>
            </select>

            {/* Start Date */}
            <div className="relative">
              <img src={date_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
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
              />
            </div>

            {/* Clear Button */}
            {(search || statusFilter || reasonFilter || startDate || endDate) && (
              <button
                onClick={() => { setSearch(''); setStatusFilter(''); setReasonFilter(''); setStartDate(''); setEndDate(''); setCurrentPage(1); }}
                className="w-full sm:w-auto px-4 py-2.5 text-sm text-gray-500 hover:text-red-500 border border-gray-300 rounded-lg transition-colors"
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
          ) : returns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No returns found</p>
              <p className="text-sm text-gray-400 mt-1">Create a return from a received purchase order</p>
              <button
                onClick={() => navigate(`${basePath}/purchase/returns/create`)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                Create Return
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
              <div className="xl:col-span-4 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Return #</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">PO Number</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Reason</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {returns.map((ret: any) => (
                      <tr key={ret.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => navigate(`${basePath}/purchase/returns/${ret.id}`)}
                            className="text-sm font-semibold text-blue-600 hover:underline"
                          >
                            {ret.return_number}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => navigate(`${basePath}/purchase/orders/${ret.purchase_order_id}`)}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {ret.purchaseOrder?.po_number ?? `#${ret.purchase_order_id}`}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {ret.supplier?.supplier_name ?? '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {new Date(ret.return_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <ReturnReasonBadge reason={ret.reason} />
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                          {ret.currency ?? 'KWD'} {num(ret.return_amount).toFixed(3)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[ret.status] ?? 'bg-gray-100 text-gray-700'}`}>
                            {ret.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => navigate(`${basePath}/purchase/returns/${ret.id}`)}
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            {ret.status === 'Pending' ? 'Review' : 'View'}
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
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
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