import { useDispatch } from 'react-redux';
import { RefreshCw, Plus } from 'lucide-react';
import { openKpiModal } from '../../reportsSlice';
import { useGetKpiSummaryQuery, useRecalculateAllKpisMutation } from '../../../../services/reportsApi';
import { KpiCard } from '../KpiCard';
import { PreBuiltReportViewer } from '../PreBuiltReportViewer';

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-100 rounded animate-pulse ${className}`} />
);

export const OverviewTab = () => {
  const dispatch = useDispatch();
  const { data: kpiSummary, isLoading: kpiLoading } = useGetKpiSummaryQuery({});
  const [recalculateAll, { isLoading: recalculating }] = useRecalculateAllKpisMutation();

  const kpis = kpiSummary?.kpis ?? [];

  return (
    <div className="space-y-6">

      {/* KPI Summary Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-gray-800">KPI Overview</h2>
          {kpiSummary && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-green-600 font-medium">{kpiSummary.good} Good</span>
              <span className="text-yellow-600 font-medium">{kpiSummary.warning} Warning</span>
              <span className="text-red-600 font-medium">{kpiSummary.critical} Critical</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => recalculateAll()}
            disabled={recalculating}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${recalculating ? 'animate-spin' : ''}`} />
            Recalculate All
          </button>
          <button
            onClick={() => dispatch(openKpiModal({ mode: 'create' }))}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5" /> New KPI
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {kpiLoading
        ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
          </div>
        )
        : kpis.length === 0
        ? <p className="text-sm text-gray-400 py-6 text-center">No KPIs configured yet. Create one to get started.</p>
        : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi: any) => <KpiCard key={kpi.id} kpi={kpi} />)}
          </div>
        )
      }

      {/* Pre-Built Reports */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">Pre-Built Reports</h2>
        <PreBuiltReportViewer />
      </div>
    </div>
  );
};