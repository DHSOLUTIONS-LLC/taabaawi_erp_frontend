import { useDispatch } from 'react-redux';
import { RefreshCw, Edit2, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { openKpiModal } from '../reportsSlice';
import { useCalculateKpiMutation, useDeleteKpiMetricMutation } from '../../../services/reportsApi';
import type { KpiMetric } from '../../../services/reportsApi';

const statusColor: Record<string, string> = {
  good: 'text-green-600 bg-green-50 border-green-200',
  warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  critical: 'text-red-600 bg-red-50 border-red-200',
  neutral: 'text-gray-600 bg-gray-50 border-gray-200',
};

export const KpiCard = ({ kpi }: { kpi: KpiMetric }) => {
  const dispatch = useDispatch();
  const [calculateKpi, { isLoading: calculating }] = useCalculateKpiMutation();
  const [deleteKpi] = useDeleteKpiMetricMutation();

  const status = kpi.status ?? 'neutral';
  const achievement = kpi.achievement_percentage ?? 0;

  const TrendIcon = kpi.trend_direction === 'Up is Good'
    ? TrendingUp
    : kpi.trend_direction === 'Down is Good'
      ? TrendingDown
      : Minus;

  const handleDelete = async () => {
    if (!confirm(`Delete KPI "${kpi.kpi_name}"?`)) return;
    await deleteKpi(kpi.id);
  };

  return (
    <div className={`border rounded-lg p-4 ${statusColor[status]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide opacity-70">{kpi.kpi_category}</p>
          <p className="font-semibold text-sm mt-0.5 truncate">{kpi.kpi_name}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => calculateKpi(kpi.id)} disabled={calculating} title="Recalculate" className="p-1 hover:opacity-70">
            <RefreshCw className={`h-3.5 w-3.5 ${calculating ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => dispatch(openKpiModal({ mode: 'edit', kpi }))} title="Edit" className="p-1 hover:opacity-70">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleDelete} title="Delete" className="p-1 hover:opacity-70">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <span className="text-2xl font-bold">
          {kpi.current_value?.toLocaleString() ?? '0'}
        </span>
        <span className="text-xs opacity-70 mb-1">{kpi.unit}</span>
        <TrendIcon className="h-4 w-4 mb-1 ml-auto opacity-60" />
      </div>

      {kpi.target_value != null && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs opacity-70 mb-1">
            <span>Target: {kpi.target_value.toLocaleString()} {kpi.unit}</span>
            <span>{achievement.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-white/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-current rounded-full transition-all"
              style={{ width: `${Math.min(achievement, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-xs opacity-60">
        <span className="capitalize font-medium">{status}</span>
        {kpi.last_calculated_at && (
          <span>Updated {new Date(kpi.last_calculated_at).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
};