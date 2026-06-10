// src/features/accounting/pages/accounts-payable/AccountsPayablePage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { useGetAccountsPayableQuery } from '../../../../services/accountingApi';
import { useGetPurchaseOrdersQuery } from '../../../../services/purchaseApi';

import search_icon from '../../../../assets/icons/search_icon.svg';
import add_icon from '../../../../assets/icons/add.svg';
import date_icon from '../../../../assets/icons/date_icon.svg';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

const STATUS_COLORS: Record<string, string> = {
  Unpaid: 'bg-red-100 text-red-700',
  Partial: 'bg-yellow-100 text-yellow-700',
  Paid: 'bg-green-100 text-green-700',
  Overdue: 'bg-orange-100 text-orange-700',
  Pending: 'bg-gray-100 text-gray-700',
};

const num = (v: any) => parseFloat(v) || 0;

export default function AccountsPayablePage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, _setSupplierFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showOverdue, setShowOverdue] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const { data, isLoading } = useGetAccountsPayableQuery({
    search: search || undefined,
    status: statusFilter || undefined,
    supplier_id: supplierFilter ? parseInt(supplierFilter) : undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    overdue: showOverdue || undefined,
    page: currentPage,
    per_page: 15,
  });

  const { data: posData, isLoading: posLoading } = useGetPurchaseOrdersQuery({
    search: search || undefined,
    page: currentPage,
    per_page: 15,
  });

  const payables = (data as any)?.data?.data || (data as any)?.data || [];
  const purchaseOrders = (posData as any)?.data?.data || (posData as any)?.data || [];

  // Transform purchase orders to match AP structure
  const transformedPOs = purchaseOrders.map((po: any) => ({
    id: `po-${po.id}`,
    ap_number: po.po_number || `PO-${po.id}`,
    supplier: { supplier_name: po.supplier?.supplier_name || '—' },
    invoice_number: po.po_number || '—',
    invoice_date: po.order_date,
    due_date: po.expected_delivery_date,
    invoice_amount: parseFloat(po.total_amount || 0),
    paid_amount: 0,
    outstanding_amount: parseFloat(po.total_amount || 0),
    currency: po.currency || 'KWD',
    status: 'Pending',
    type: 'Purchase Order'
  }));

  const allItems = [...payables, ...transformedPOs];

  // Sort by date (newest first)
  const sortedItems = allItems.sort((a, b) => {
    const dateA = new Date(a.invoice_date || a.created_at);
    const dateB = new Date(b.invoice_date || b.created_at);
    return dateB.getTime() - dateA.getTime();
  });

  const pagination = (data as any)?.data;

  // Calculate totals using sortedItems
  const totalOutstanding = sortedItems.reduce(
    (sum: number, item: any) => sum + num(item.outstanding_amount),
    0
  );

  const totalOverdue = sortedItems
    .filter((item: any) => item.status === 'Overdue')
    .reduce((sum: number, item: any) => sum + num(item.outstanding_amount), 0);

  const overdueCount = sortedItems.filter((item: any) => item.status === 'Overdue').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Accounts Payable</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage money owed to suppliers (AP + Purchase Orders)</p>
          </div>
          <div className='flex flex-col sm:flex-row gap-2 sm:space-x-2'>
            <button
              onClick={() => navigate(`${basePath}/accounting/accounts-payable/create`)}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-black rounded-lg border border-blue-600 hover:bg-blue-700 hover:text-white transition-colors cursor-pointer text-sm sm:text-base"
            >
              <img src={add_icon} alt="" className="w-4 h-4" />
              New AP
            </button>
            <button
              onClick={() => navigate(`${basePath}/accounting/accounts-payable/aging-report`)}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 border border-blue-600 text-black rounded-lg hover:bg-blue-700 hover:text-white transition-colors cursor-pointer text-sm sm:text-base"
            >
              <img src={add_icon} alt="" className="w-4 h-4" />
              AP Aging Reports
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-gray-500">Total Outstanding</p>
            <p className="text-lg sm:text-2xl font-bold text-blue-600 mt-1 break-words">
              KWD {totalOutstanding.toFixed(3)}
            </p>
            <p className="text-xs text-gray-400 mt-1">{sortedItems.length} items (AP + Orders)</p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-gray-500">Overdue Amount</p>
            <p className="text-lg sm:text-2xl font-bold text-orange-600 mt-1 break-words">
              KWD {totalOverdue.toFixed(3)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {overdueCount} overdue
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5 sm:col-span-2 lg:col-span-1">
            <p className="text-xs sm:text-sm text-gray-500">This Month</p>
            <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1 break-words">
              KWD {sortedItems
                .filter((item: any) => {
                  const date = new Date(item.invoice_date);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                })
                .reduce((sum: number, item: any) => sum + num(item.invoice_amount), 0)
                .toFixed(3)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-3 sm:p-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="relative flex-1 min-w-[200px]">
              <img src={search_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search by invoice, AP number or PO..."
                className="w-full pl-9 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative flex-1 sm:flex-initial min-w-[150px]">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm bg-white appearance-none pr-10"
              >
                <option value="">All Statuses</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
                <option value="Pending">Pending</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 sm:flex-initial">
                <img src={date_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                  className="w-full sm:w-auto pl-9 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm"
                  placeholder="Start Date"
                />
              </div>
              <div className="relative flex-1 sm:flex-initial">
                <img src={date_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                  className="w-full sm:w-auto pl-9 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm"
                  placeholder="End Date"
                />
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-normal gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showOverdue"
                  checked={showOverdue}
                  onChange={(e) => setShowOverdue(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="showOverdue" className="text-sm text-gray-700 whitespace-nowrap">Show overdue only</label>
              </div>

              {(search || statusFilter || startDate || endDate || showOverdue) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                    setStartDate('');
                    setEndDate('');
                    setShowOverdue(false);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-red-500 border border-gray-300 rounded-lg"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          {isLoading || posLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No records found</p>
              <p className="text-sm text-gray-400 mt-1">No AP records or purchase orders available</p>
              <button
                onClick={() => navigate(`${basePath}/accounting/accounts-payable/create`)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Create AP
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
              <div className="xl:col-span-4 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">AP / PO #</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Invoice / PO #</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Due Date</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Paid</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Outstanding</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedItems.map((item: any) => {
                      const isOverdue = new Date(item.due_date) < new Date() && item.outstanding_amount > 0;
                      const displayStatus = isOverdue && item.status === 'Unpaid' ? 'Overdue' : item.status;
                      const isPurchaseOrder = item.type === 'Purchase Order';

                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <button
                              onClick={() => navigate(
                                isPurchaseOrder
                                  ? `${basePath}/purchase/purchase/orders/${item.id.replace('po-', '')}`
                                  : `${basePath}/accounting/accounts-payable/${item.id}`
                              )}
                              className="text-sm font-semibold text-blue-600 hover:underline"
                            >
                              {item.ap_number}
                            </button>
                            {isPurchaseOrder && (
                              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                PO
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{item.supplier?.supplier_name || '—'}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{item.invoice_number}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {new Date(item.invoice_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {new Date(item.due_date).toLocaleDateString()}
                            {isOverdue && (
                              <span className="ml-2 text-xs text-red-600 font-medium">Overdue</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-mono text-gray-900">
                            {item.currency} {num(item.invoice_amount).toFixed(3)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-mono text-green-600">
                            {item.currency} {num(item.paid_amount).toFixed(3)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-mono font-bold text-orange-600">
                            {item.currency} {num(item.outstanding_amount).toFixed(3)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[displayStatus]}`}>
                              {displayStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => navigate(
                                  isPurchaseOrder
                                    ? `${basePath}/purchase/orders/${item.id.replace('po-', '')}`
                                    : `${basePath}/accounting/accounts-payable/${item.id}`
                                )}
                                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                              >
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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