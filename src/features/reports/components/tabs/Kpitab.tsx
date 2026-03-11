import { useDispatch, useSelector } from 'react-redux';
import { Plus, RefreshCw } from 'lucide-react';
import { openKpiModal, setKpiFilters } from '../../reportsSlice';
import {
  useGetKpiMetricsQuery,
  useRecalculateAllKpisMutation,
  useCreateKpiMetricMutation,
  useUpdateKpiMetricMutation,
} from '../../../../services/reportsApi';
import { KpiCard } from '../KpiCard';
import type { RootState } from '../../../../app/store';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { closeKpiModal } from '../../reportsSlice';

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-100 rounded animate-pulse ${className}`} />
);

const KpiModal = () => {
  const dispatch = useDispatch();
  const { selectedKpi, kpiModalMode } = useSelector((s: RootState) => s.reports);
  const isEdit = kpiModalMode === 'edit';

  const [createKpi, { isLoading: creating }] = useCreateKpiMetricMutation();
  const [updateKpi, { isLoading: updating }] = useUpdateKpiMetricMutation();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      kpi_name:          selectedKpi?.kpi_name          ?? '',
      kpi_category:      selectedKpi?.kpi_category      ?? 'Sales',
      description:       selectedKpi?.description       ?? '',
      calculation_type:  selectedKpi?.calculation_type  ?? 'Count',
      data_source:       selectedKpi?.data_source       ?? '',
      target_value:      selectedKpi?.target_value      ?? '',
      warning_threshold: selectedKpi?.warning_threshold ?? '',
      critical_threshold:selectedKpi?.critical_threshold?? '',
      unit:              selectedKpi?.unit              ?? '',
      trend_direction:   selectedKpi?.trend_direction   ?? 'Neutral',
    },
  });

  const onSubmit = async (data: any) => {
    if (isEdit && selectedKpi) {
      await updateKpi({ id: selectedKpi.id, data }).unwrap();
    } else {
      await createKpi(data).unwrap();
    }
    dispatch(closeKpiModal());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{isEdit ? 'Edit KPI' : 'New KPI Metric'}</h2>
          <button onClick={() => dispatch(closeKpiModal())} className="p-1 hover:bg-gray-100 rounded"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">KPI Name *</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" {...register('kpi_name', { required: true })} />
              {errors.kpi_name && <p className="text-xs text-red-500 mt-1">Required</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" {...register('kpi_category', { required: true })}>
                {['Sales','Financial','Inventory','HR','Customer','Operations'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Calculation Type *</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" {...register('calculation_type', { required: true })}>
                {['Count','Sum','Average','Percentage','Ratio','Custom'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data Source *</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="e.g. orders" {...register('data_source', { required: true })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Target</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" {...register('target_value')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Warning</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" {...register('warning_threshold')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Critical</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" {...register('critical_threshold')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="e.g. KWD, %" {...register('unit')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Trend Direction</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" {...register('trend_direction')}>
                {['Up is Good','Down is Good','Neutral'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" {...register('description')} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => dispatch(closeKpiModal())} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={creating || updating} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {creating || updating ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const KpiTab = () => {
  const dispatch = useDispatch();
  const filters  = useSelector((s: RootState) => s.reports.kpiFilters);
  const { isKpiModalOpen } = useSelector((s: RootState) => s.reports);

  const [recalculateAll, { isLoading: recalculating }] = useRecalculateAllKpisMutation();

  const { data, isLoading } = useGetKpiMetricsQuery({
    kpi_category: filters.kpi_category || undefined,
    page:         filters.page,
    per_page:     filters.per_page,
  });

  const kpis       = Array.isArray(data?.data) ? data.data : [];
  const meta       = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / filters.per_page) : 1;
  const set        = (patch: any) => dispatch(setKpiFilters(patch));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={filters.kpi_category} onChange={e => set({ kpi_category: e.target.value, page: 1 })}>
            <option value="">All Categories</option>
            {['Sales','Financial','Inventory','HR','Customer','Operations'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
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
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> New KPI
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading
        ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        )
        : kpis.length === 0
        ? <p className="text-sm text-gray-400 py-10 text-center">No KPI metrics found</p>
        : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi: any) => <KpiCard key={kpi.id} kpi={kpi} />)}
          </div>
        )
      }

      {/* Pagination */}
      {meta && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Showing {(filters.page - 1) * filters.per_page + 1}–{Math.min(filters.page * filters.per_page, meta.total)} of {meta.total}</span>
          <div className="flex items-center gap-1">
            <button disabled={filters.page === 1} onClick={() => set({ page: filters.page - 1 })} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <span className="px-3 py-1.5">{filters.page} / {totalPages}</span>
            <button disabled={filters.page === totalPages} onClick={() => set({ page: filters.page + 1 })} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}

      {isKpiModalOpen && <KpiModal />}
    </div>
  );
};