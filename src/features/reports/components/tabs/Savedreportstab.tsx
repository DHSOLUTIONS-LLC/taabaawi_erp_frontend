import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Plus, Search, X, Play, Edit2, Trash2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { openReportModal, setReportFilters, resetReportFilters } from '../../reportsSlice';
import {
  useGetReportsQuery,
  useDeleteReportMutation,
  useExecuteReportMutation,
  useGetExecutionHistoryQuery,
} from '../../../../services/reportsApi';
import { ReportModal } from '../ReportModal';
import type { RootState } from '../../../../app/store';
import { useSelector as useReduxSelector } from 'react-redux';

const visibilityColor: Record<string, string> = {
  Private: 'bg-gray-100 text-gray-600',
  Public: 'bg-green-100 text-green-700',
  Shared: 'bg-blue-100 text-blue-700',
};

const ExecutionHistory = ({ reportId }: { reportId: number }) => {
  const { data, isLoading } = useGetExecutionHistoryQuery({ id: reportId, per_page: 5 });
  const history = Array.isArray(data?.data) ? data.data : [];

  if (isLoading) return <p className="text-xs text-gray-400 px-4 py-2">Loading history...</p>;
  if (!history.length) return <p className="text-xs text-gray-400 px-4 py-2">No executions yet</p>;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
      <div className='xl:col-span-4 overflow-x-auto'>
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              {['Executed At', 'Records', 'Time (ms)', 'Status', 'Export'].map(h => (
                <th key={h} className="px-4 py-2 text-left font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {history.map((e: any) => (
              <tr key={e.id}>
                <td className="px-4 py-2 text-gray-600">{new Date(e.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 text-gray-600">{e.records_count ?? '—'}</td>
                <td className="px-4 py-2 text-gray-600">{e.execution_time_ms ?? '—'}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-400">{e.export_format ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

  );
};

const ExecutionResult = ({ result }: { result: any }) => {
  if (!result?.data?.length) return <p className="text-xs text-gray-400 px-2 py-2">No data returned</p>;
  const cols = Object.keys(result.data[0]);
  return (
    <div className="px-4 pb-4">
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
        <span>{result.records_count} records</span>
        <span>{result.execution_time_ms}ms</span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
        <div className="xl:col-span-4 overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>{cols.map(c => <th key={c} className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">{c.replace(/_/g, ' ')}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result.data.slice(0, 20).map((row: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  {cols.map(c => <td key={c} className="px-3 py-2 text-gray-600 whitespace-nowrap">{row[c] != null ? String(row[c]) : '—'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export const SavedReportsTab = () => {
  const dispatch = useDispatch();
  const filters = useReduxSelector((s: RootState) => s.reports.reportFilters);
  const { isReportModalOpen } = useReduxSelector((s: RootState) => s.reports);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState<number | null>(null);
  const [execResults, setExecResults] = useState<Record<number, any>>({});

  const { data, isLoading } = useGetReportsQuery({
    search: filters.search || undefined,
    report_type: filters.report_type || undefined,
    visibility: filters.visibility || undefined,
    page: filters.page,
    per_page: filters.per_page,
  });

  const [deleteReport] = useDeleteReportMutation();
  const [executeReport, { isLoading: executing }] = useExecuteReportMutation();

  const reports = Array.isArray(data?.data) ? data.data : [];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / filters.per_page) : 1;

  const set = (patch: any) => dispatch(setReportFilters(patch));

  const handleExecute = async (id: number) => {
    const result = await executeReport(id).unwrap();
    setExecResults(p => ({ ...p, [id]: { data: result.data ?? [], record_count: result.records_count, execution_time_ms: result.execution_time_ms } }));
    setExpandedId(id);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete report "${name}"?`)) return;
    await deleteReport(id);
  };

  const handleExport = async (id: number, format: 'csv' | 'excel') => {
    const base = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');
    const res = await fetch(`${base}/api/report-export/${id}/${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${id}.${format === 'csv' ? 'csv' : 'xlsx'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Search reports..."
              value={filters.search}
              onChange={e => set({ search: e.target.value, page: 1 })}
            />
          </div>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={filters.report_type} onChange={e => set({ report_type: e.target.value, page: 1 })}>
            <option value="">All Types</option>
            {['Sales Report', 'Inventory Report', 'Financial Report', 'HR Report', 'Customer Report', 'Custom Report'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={filters.visibility} onChange={e => set({ visibility: e.target.value, page: 1 })}>
            <option value="">All Visibility</option>
            {['Private', 'Public', 'Shared'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={() => dispatch(resetReportFilters())} className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
            <X className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
        <button
          onClick={() => dispatch(openReportModal({ mode: 'create' }))}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> New Report
        </button>
      </div>

      {/* Table */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
        <div className="xl:col-span-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Type', 'Data Source', 'Chart', 'Visibility', 'Scheduled', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-2 py-2 text-left font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-2 py-2"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>
                    ))}
                  </tr>
                ))
                : reports.length === 0
                  ? <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No reports found</td></tr>
                  : reports.map((r: any) => (
                    <>
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-2 py-2">
                          <p className="font-medium text-gray-800">{r.report_name}</p>
                          <p className="text-xs text-gray-400">{r.report_code}</p>
                        </td>
                        <td className="px-2 py-2 text-gray-600 text-xs">{r.report_type}</td>
                        <td className="px-2 py-2 text-gray-600 text-xs">{r.data_source}</td>
                        <td className="px-2 py-2 text-gray-600 text-xs">{r.chart_type}</td>
                        <td className="px-2 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${visibilityColor[r.visibility] ?? ''}`}>{r.visibility}</span>
                        </td>
                        <td className="px-2 py-2 text-xs text-gray-500">{r.is_scheduled ? 'Yes' : 'No'}</td>
                        <td className="px-2 py-2 text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleExecute(r.id)} disabled={executing} title="Run" className="p-1.5 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded"><Play className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setShowHistory(showHistory === r.id ? null : r.id)} title="History" className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded"><Clock className="h-3.5 w-3.5" /></button>
                            <button onClick={() => dispatch(openReportModal({ mode: 'edit', report: r }))} title="Edit" className="p-1.5 hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 rounded"><Edit2 className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleDelete(r.id, r.report_name)} title="Delete" className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleExport(r.id, 'csv')} title="Export CSV" className="p-1.5 hover:bg-gray-100 text-gray-400 rounded text-xs font-medium">CSV</button>
                            <button onClick={() => handleExport(r.id, 'excel')} title="Export Excel" className="p-1.5 hover:bg-gray-100 text-gray-400 rounded text-xs font-medium">XLS</button>
                            {execResults[r.id] && (
                              <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} className="p-1.5 hover:bg-gray-100 text-gray-400 rounded">
                                {expandedId === r.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Execution result */}
                      {expandedId === r.id && execResults[r.id] && (
                        <tr key={`exec-${r.id}`}>
                          <td colSpan={8} className="bg-gray-50 border-t border-gray-100">
                            <ExecutionResult result={execResults[r.id]} />
                          </td>
                        </tr>
                      )}

                      {/* Execution history */}
                      {showHistory === r.id && (
                        <tr key={`hist-${r.id}`}>
                          <td colSpan={8} className="bg-gray-50 border-t border-gray-100">
                            <ExecutionHistory reportId={r.id} />
                          </td>
                        </tr>
                      )}
                    </>
                  ))
              }
            </tbody>
          </table>

          {/* Pagination */}
          {meta && (
            <div className="flex items-center justify-between px-2 py-2 border-t border-gray-100 text-sm text-gray-500">
              <span>Showing {(filters.page - 1) * filters.per_page + 1}–{Math.min(filters.page * filters.per_page, meta.total)} of {meta.total}</span>
              <div className="flex items-center gap-1">
                <button disabled={filters.page === 1} onClick={() => set({ page: filters.page - 1 })} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
                <span className="px-3 py-1.5">{filters.page} / {totalPages}</span>
                <button disabled={filters.page === totalPages} onClick={() => set({ page: filters.page + 1 })} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>


      {isReportModalOpen && <ReportModal />}
    </div>
  );
};