import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Copy, ScanSearch, RefreshCw } from 'lucide-react';
import { DuplicateTable } from '../components/duplicates/DuplicateTable';
import { MergeModal } from '../components/duplicates/MergeModal';
import { StatCard } from '../components/customers/CustomerCard';
import { setDuplicateFilters } from '../crmSlice';
import {
  useGetCustomerDuplicatesQuery,
  useDetectDuplicatesMutation,
  useGetMergeHistoryQuery,
} from '../../../services/crmApi';
import type { RootState } from '../../../app/store';
import DashboardLayout from '../../../layouts/DashboardLayout';

const TABS = ['pending', 'all', 'history'] as const;
type Tab = typeof TABS[number];

export const DuplicatesPage = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = React.useState<Tab>('pending');
  const filters = useSelector((s: RootState) => s.crm.duplicateFilters);
  const mergeFilters = useSelector((s: RootState) => s.crm.mergeHistoryFilters);

  const [detect, { isLoading: detecting }] = useDetectDuplicatesMutation();

  const { data: dupData, isLoading } = useGetCustomerDuplicatesQuery({
    ...filters,
    status: activeTab === 'pending' ? 'Pending' : filters.status,
  });

  const { data: historyData, isLoading: historyLoading } = useGetMergeHistoryQuery(
    mergeFilters,
    { skip: activeTab !== 'history' }
  );

  const duplicates = dupData?.data ?? [];
  const meta = dupData?.meta;
  const history = Array.isArray(historyData?.data) ? historyData.data :
    Array.isArray(historyData) ? historyData : [];



  return (
    <DashboardLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Duplicate Customers</h1>
            <p className="text-sm text-gray-500 mt-0.5">Detect and merge duplicate customer records</p>
          </div>
          <button
            onClick={() => detect()}
            disabled={detecting}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <ScanSearch className="h-4 w-4" />
            {detecting ? 'Scanning...' : 'Detect Duplicates'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Pending Review" value={meta?.total ?? '0'} icon={Copy} color="orange" loading={isLoading} />
          <StatCard label="Total Merged" value={historyData?.meta?.total ?? '0'} icon={RefreshCw} color="green" loading={historyLoading} />
          <StatCard label="Min Match Score" value={`${filters.min_score}%`} icon={ScanSearch} color="blue" />
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            {([
              { id: 'pending', label: 'Pending' },
              { id: 'all', label: 'All' },
              { id: 'history', label: 'Merge History' },
            ] as { id: Tab; label: string }[]).map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab !== 'history' && (
            <>
              {/* Status filter (only on "all" tab) */}
              {activeTab === 'all' && (
                <select
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={filters.status}
                  onChange={e => dispatch(setDuplicateFilters({ status: e.target.value, page: 1 }))}
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed Duplicate">Confirmed Duplicate</option>
                  <option value="Not Duplicate">Not Duplicate</option>
                  <option value="Ignored">Ignored</option>
                  <option value="Merged">Merged</option>
                </select>
              )}

              {/* Min score */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Min score:</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={filters.min_score}
                  onChange={e => dispatch(setDuplicateFilters({ min_score: Number(e.target.value), page: 1 }))}
                />
                <span>%</span>
              </div>
            </>
          )}
        </div>

        {/* Content */}
        {activeTab === 'history'
          ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Primary Customer', 'Merged Count', 'Orders Merged', 'Points Merged', 'Merged By', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>
                        ))}
                      </tr>
                    ))
                    : history.length === 0
                      ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No merge history</td></tr>
                      : history.map(h => (
                        <tr key={h.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{h.primaryCustomer?.full_name}</td>
                          <td className="px-4 py-3 text-gray-600">{h.merged_customer_ids?.length}</td>
                          <td className="px-4 py-3 text-gray-600">{h.orders_merged}</td>
                          <td className="px-4 py-3 text-gray-600">{h.points_merged?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-gray-500">{h.mergedBy?.name ?? '0'}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {new Date(h.merged_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          )
          : (
            <DuplicateTable
              duplicates={duplicates}
              meta={meta}
              isLoading={isLoading}
              currentPage={filters.page}
              perPage={filters.per_page}
            />
          )
        }

        <MergeModal />
      </div>
    </DashboardLayout>
  );
};