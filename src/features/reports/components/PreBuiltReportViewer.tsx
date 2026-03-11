import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Play, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { setPreBuiltDates } from '../reportsSlice';
import type { RootState } from '../../../app/store';
import {
  useGetSalesSummaryQuery,
  useGetTopSellingProductsQuery,
  useGetInventoryStatusQuery,
  useGetCustomerAnalysisQuery,
  useGetEmployeePerformanceQuery,
  useGetFinancialSummaryQuery,
} from '../../../services/reportsApi';

type ReportKey = 'sales' | 'products' | 'inventory' | 'customers' | 'employees' | 'financial';

const REPORT_CONFIG: Record<ReportKey, { label: string; description: string }> = {
  sales:     { label: 'Sales Summary',          description: 'Daily sales, revenue, discounts and tax' },
  products:  { label: 'Top Selling Products',   description: 'Best performing products by quantity sold' },
  inventory: { label: 'Inventory Status',       description: 'Stock levels, low stock and out of stock items' },
  customers: { label: 'Customer Analysis',      description: 'Customer activity, top spenders and segments' },
  employees: { label: 'Employee Performance',   description: 'Sales performance per employee' },
  financial: { label: 'Financial Summary',      description: 'Revenue, costs, gross and net profit' },
};

const ResultTable = ({ data }: { data: any[] }) => {
  if (!data?.length) return <p className="text-sm text-gray-400 py-4 text-center">No data</p>;
  const cols = Object.keys(data[0]);
  return (
    <div className="overflow-x-auto mt-3 max-w-full">
      <table className="text-xs border border-gray-200 rounded-lg overflow-hidden min-w-max">
        <thead className="bg-gray-50">
          <tr>
            {cols.map(c => (
              <th key={c} className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">
                {c.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.slice(0, 20).map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {cols.map(c => (
                <td key={c} className="px-3 py-2 text-gray-600 whitespace-nowrap">
                  {row[c] != null ? String(row[c]) : '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 20 && (
        <p className="text-xs text-gray-400 mt-1 text-center">Showing first 20 of {data.length} rows</p>
      )}
    </div>
  );
};

const ReportPanel = ({
  reportKey, dates, skipQuery, setSkipQuery,
}: {
  reportKey: ReportKey;
  dates: { start_date: string; end_date: string };
  skipQuery: boolean;
  setSkipQuery: (v: boolean) => void;
}) => {
  const [open, setOpen] = useState(false);

  const params = { start_date: dates.start_date, end_date: dates.end_date };

  const { data: sales,     isFetching: l1 } = useGetSalesSummaryQuery(params,        { skip: skipQuery || reportKey !== 'sales' });
  const { data: products,  isFetching: l2 } = useGetTopSellingProductsQuery(params,  { skip: skipQuery || reportKey !== 'products' });
  const { data: inventory, isFetching: l3 } = useGetInventoryStatusQuery({},         { skip: skipQuery || reportKey !== 'inventory' });
  const { data: customers, isFetching: l4 } = useGetCustomerAnalysisQuery(params,    { skip: skipQuery || reportKey !== 'customers' });
  const { data: employees, isFetching: l5 } = useGetEmployeePerformanceQuery(params, { skip: skipQuery || reportKey !== 'employees' });
  const { data: financial, isFetching: l6 } = useGetFinancialSummaryQuery(params,    { skip: skipQuery || reportKey !== 'financial' });

  const dataMap: Record<ReportKey, any> = { sales, products, inventory, customers, employees, financial };
  const loadingMap: Record<ReportKey, boolean> = {
    sales: l1, products: l2, inventory: l3, customers: l4, employees: l5, financial: l6,
  };

  const rawData    = dataMap[reportKey];
  const isLoading  = loadingMap[reportKey];
  const config     = REPORT_CONFIG[reportKey];

  // extract array from response
  const getRows = (): any[] => {
    if (!rawData) return [];
    if (Array.isArray(rawData)) return rawData;
    // each report nests data differently
    return rawData.daily_data
      ?? rawData.top_products
      ?? rawData.products
      ?? rawData.top_customers
      ?? rawData.employees
      ?? [];
  };

  const getSummary = () => {
    if (!rawData) return null;
    return rawData.totals ?? rawData.summary ?? null;
  };

  const rows    = getRows();
  const summary = getSummary();

  const handleRun = () => {
    setSkipQuery(false);
    setOpen(true);
  };

  const handleExport = () => {
    const csv = [Object.keys(rows[0]).join(','), ...rows.map(r => Object.values(r).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${reportKey}_report.csv`;
    a.click();
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white">
        <div>
          <p className="font-medium text-sm text-gray-800">{config.label}</p>
          <p className="text-xs text-gray-400">{config.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {rows.length > 0 && (
            <button onClick={handleExport} className="p-1.5 hover:bg-gray-100 rounded text-gray-500" title="Export CSV">
              <Download className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleRun}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <Play className="h-3 w-3" /> {isLoading ? 'Running...' : 'Run'}
          </button>
          {rawData && (
            <button onClick={() => setOpen(p => !p)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500">
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {open && rawData && (
        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
          {/* Summary cards */}
          {summary && (
            <div className="flex flex-wrap gap-3 pt-3">
              {Object.entries(summary).map(([k, v]) => (
                typeof v !== 'object' && (
                  <div key={k} className="bg-white border border-gray-200 rounded px-3 py-2 text-xs">
                    <p className="text-gray-400">{k.replace(/_/g, ' ')}</p>
                    <p className="font-semibold text-gray-800">{String(v)}</p>
                  </div>
                )
              ))}
            </div>
          )}
          <ResultTable data={rows} />
        </div>
      )}
    </div>
  );
};

export const PreBuiltReportViewer = () => {
  const dispatch = useDispatch();
  const dates    = useSelector((s: RootState) => s.reports.preBuiltDates);
  const [skipMap, setSkipMap] = useState<Record<ReportKey, boolean>>({
    sales: true, products: true, inventory: true, customers: true, employees: true, financial: true,
  });

  return (
    <div className="space-y-3">
      {/* Shared date range */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500">Period:</label>
        <input
          type="date"
          value={dates.start_date}
          onChange={e => dispatch(setPreBuiltDates({ start_date: e.target.value }))}
          className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-gray-400 text-sm">to</span>
        <input
          type="date"
          value={dates.end_date}
          onChange={e => dispatch(setPreBuiltDates({ end_date: e.target.value }))}
          className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {(Object.keys(REPORT_CONFIG) as ReportKey[]).map(key => (
        <ReportPanel
          key={key}
          reportKey={key}
          dates={dates}
          skipQuery={skipMap[key]}
          setSkipQuery={(v) => setSkipMap(p => ({ ...p, [key]: v }))}
        />
      ))}
    </div>
  );
};