// src/features/accounting/pages/accounts-receivable/AccountsReceivablePage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { useGetAccountsReceivableQuery } from '../../../../services/accountingApi';

import search_icon from '../../../../assets/icons/search_icon.svg';
import add_icon from '../../../../assets/icons/add.svg';
import date_icon from '../../../../assets/icons/date_icon.svg';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

const STATUS_COLORS: Record<string, string> = {
  Unpaid: 'bg-red-100 text-red-700',
  Partial: 'bg-yellow-100 text-yellow-700',
  Paid: 'bg-green-100 text-green-700',
  Overdue: 'bg-orange-100 text-orange-700',
};

const num = (v: any) => parseFloat(v) || 0;

export default function AccountsReceivablePage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, _setCustomerFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showOverdue, setShowOverdue] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const { data, isLoading } = useGetAccountsReceivableQuery({
    search: search || undefined,
    status: statusFilter || undefined,
    customer_id: customerFilter ? parseInt(customerFilter) : undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    overdue: showOverdue || undefined,
    page: currentPage,
    per_page: 15,
  });

  const receivables = (data as any)?.data?.data || (data as any)?.data || [];
  const pagination = (data as any)?.data;

  // Calculate totals
  const totalOutstanding = receivables.reduce((sum: number, ar: any) => sum + num(ar.outstanding_amount), 0);
  const totalOverdue = receivables
    .filter((ar: any) => ar.status === 'Overdue')
    .reduce((sum: number, ar: any) => sum + num(ar.outstanding_amount), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Accounts Receivable</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage money owed by customers</p>
          </div>
          <div className='flex flex-col sm:flex-row gap-2 sm:space-x-2'>
            <button
              onClick={() => navigate(`${basePath}/accounting/accounts-receivable/create`)}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:text-white transition-colors cursor-pointer text-sm sm:text-base"
            >
              <img src={add_icon} alt="" className="w-4 h-4" />
              New AR
            </button>
            <button
              onClick={() => navigate(`${basePath}/accounting/accounts-receivable/aging-report`)}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 border border-blue-600 text-black rounded-lg hover:bg-blue-700 hover:text-white transition-colors cursor-pointer text-sm sm:text-base"
            >
              <img src={add_icon} alt="" className="w-4 h-4" />
              AR Aging Reports
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
            <p className="text-xs text-gray-400 mt-1">{receivables.length} invoices</p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-gray-500">Overdue Amount</p>
            <p className="text-lg sm:text-2xl font-bold text-orange-600 mt-1 break-words">
              KWD {totalOverdue.toFixed(3)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {receivables.filter((ar: any) => ar.status === 'Overdue').length} overdue
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5 sm:col-span-2 lg:col-span-1">
            <p className="text-xs sm:text-sm text-gray-500">This Month</p>
            <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1 break-words">
              KWD {receivables
                .filter((ar: any) => {
                  const date = new Date(ar.invoice_date);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                })
                .reduce((sum: number, ar: any) => sum + num(ar.invoice_amount), 0)
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
                placeholder="Search by invoice or AR number..."
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
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : receivables.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No accounts receivable found</p>
              <p className="text-sm text-gray-400 mt-1">Create your first AR record</p>
              <button
                onClick={() => navigate(`${basePath}/accounting/accounts-receivable/create`)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Create AR
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
              <div className="xl:col-span-4 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">AR #</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Invoice #</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Invoice Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Due Date</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Received</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Outstanding</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {receivables.map((ar: any) => {
                      const isOverdue = new Date(ar.due_date) < new Date() && ar.outstanding_amount > 0;
                      const displayStatus = isOverdue && ar.status === 'Unpaid' ? 'Overdue' : ar.status;

                      return (
                        <tr key={ar.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <button
                              onClick={() => navigate(`${basePath}/accounting/accounts-receivable/${ar.id}`)}
                              className="text-sm font-semibold text-blue-600 hover:underline"
                            >
                              {ar.ar_number}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{ar.customer?.name || '—'}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{ar.invoice_number}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {new Date(ar.invoice_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {new Date(ar.due_date).toLocaleDateString()}
                            {isOverdue && (
                              <span className="ml-2 text-xs text-red-600 font-medium">Overdue</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-mono text-gray-900">
                            {ar.currency} {num(ar.invoice_amount).toFixed(3)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-mono text-green-600">
                            {ar.currency} {num(ar.received_amount).toFixed(3)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-mono font-bold text-orange-600">
                            {ar.currency} {num(ar.outstanding_amount).toFixed(3)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[displayStatus]}`}>
                              {displayStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => navigate(`${basePath}/accounting/accounts-receivable/${ar.id}`)}
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