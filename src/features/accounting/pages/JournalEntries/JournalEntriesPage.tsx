// src/features/accounting/pages/journal-entries/JournalEntriesPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { useGetJournalEntriesQuery } from '../../../../services/accountingApi';

import search_icon from '../../../../assets/icons/search_icon.svg';
import add_icon from '../../../../assets/icons/add.svg';
import date_icon from '../../../../assets/icons/date_icon.svg';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Posted: 'bg-green-100 text-green-700',
  Reversed: 'bg-red-100 text-red-700',
};

const num = (v: any) => parseFloat(v) || 0;

export default function JournalEntriesPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const { data, isLoading } = useGetJournalEntriesQuery({
    search: search || undefined,
    status: statusFilter as any|| undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    page: currentPage,
    per_page: 15,
  });

  const journals = (data as any)?.data?.data || (data as any)?.data || [];
  const pagination = (data as any)?.data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1>
            <p className="text-sm text-gray-500 mt-1">Record and manage financial transactions</p>
          </div>
          <button
            onClick={() => navigate(`${basePath}/accounting/journal-entries/create`)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <img src={add_icon} alt="" className="w-4 h-4 " />
            New Journal Entry
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <img src={search_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by journal number..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative min-w-[150px]">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white appearance-none pr-10"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Posted">Posted</option>
              <option value="Reversed">Reversed</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
            </div>
          </div>

          <div className="relative">
            <img src={date_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              placeholder="Start Date"
            />
          </div>
          <div className="relative">
            <img src={date_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              placeholder="End Date"
            />
          </div>

          {(search || statusFilter || startDate || endDate) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setStartDate(''); setEndDate(''); setCurrentPage(1); }}
              className="px-4 py-2.5 text-sm text-gray-500 hover:text-red-500 border border-gray-300 rounded-lg"
            >
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : journals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No journal entries found</p>
              <p className="text-sm text-gray-400 mt-1">Create your first journal entry</p>
              <button
                onClick={() => navigate(`${basePath}/accounting/journal-entries/create`)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Create Journal Entry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Journal #</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Debit</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Credit</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {journals.map((journal: any) => (
                    <tr key={journal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`${basePath}/accounting/journal-entries/${journal.id}`)}
                          className="text-sm font-semibold text-blue-600 hover:underline"
                        >
                          {journal.journal_number}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(journal.entry_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 truncate max-w-xs">{journal.description}</div>
                        {journal.reference_number && (
                          <div className="text-xs text-gray-500">Ref: {journal.reference_number}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-mono text-gray-900">
                        {num(journal.total_debit).toFixed(3)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-mono text-gray-900">
                        {num(journal.total_credit).toFixed(3)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[journal.status]}`}>
                          {journal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => navigate(`${basePath}/accounting/journal-entries/${journal.id}`)}
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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