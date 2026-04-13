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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm sm:text-base">
            {isEdit ? 'Edit KPI' : 'New KPI Metric'}
          </h2>
          <button 
            onClick={() => dispatch(closeKpiModal())} 
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                KPI Name <span className="text-red-500">*</span>
              </label>
              <input 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                {...register('kpi_name', { required: true })} 
              />
              {errors.kpi_name && <p className="text-xs text-red-500 mt-1">Required</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                {...register('kpi_category', { required: true })}
              >
                {['Sales','Financial','Inventory','HR','Customer','Operations'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Calculation Type <span className="text-red-500">*</span>
              </label>
              <select 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                {...register('calculation_type', { required: true })}
              >
                {['Count','Sum','Average','Percentage','Ratio','Custom'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Data Source <span className="text-red-500">*</span>
              </label>
              <input 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="e.g. orders" 
                {...register('data_source', { required: true })} 
              />
            </div>
          </div>

          <div className="flex flex-col sm:grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Target</label>
              <input 
                type="number" 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                {...register('target_value')} 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Warning</label>
              <input 
                type="number" 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                {...register('warning_threshold')} 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Critical</label>
              <input 
                type="number" 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                {...register('critical_threshold')} 
              />
            </div>
          </div>

          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
              <input 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="e.g. KWD, %" 
                {...register('unit')} 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Trend Direction</label>
              <select 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                {...register('trend_direction')}
              >
                {['Up is Good','Down is Good','Neutral'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea 
              rows={3} 
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
              {...register('description')} 
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-gray-100">
            <button 
              type="button" 
              onClick={() => dispatch(closeKpiModal())} 
              className="w-full sm:w-auto px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={creating || updating} 
              className="w-full sm:w-auto px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
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
    <div className="space-y-4 sm:space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="w-full sm:w-auto">
          <select 
            className="w-full sm:w-auto border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
            value={filters.kpi_category} 
            onChange={e => set({ kpi_category: e.target.value, page: 1 })}
          >
            <option value="">All Categories</option>
            {['Sales','Financial','Inventory','HR','Customer','Operations'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={() => recalculateAll()}
            disabled={recalculating}
            className="flex items-center justify-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${recalculating ? 'animate-spin' : ''}`} />
            <span>Recalculate All</span>
          </button>
          <button
            onClick={() => dispatch(openKpiModal({ mode: 'create' }))}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> New KPI
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : kpis.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No KPI metrics found</p>
          <p className="text-xs text-gray-400 mt-1">Create your first KPI to start tracking</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {kpis.map((kpi: any) => <KpiCard key={kpi.id} kpi={kpi} />)}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.total > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-500">
          <span className="text-center sm:text-left text-xs sm:text-sm">
            Showing {(filters.page - 1) * filters.per_page + 1}–{Math.min(filters.page * filters.per_page, meta.total)} of {meta.total}
          </span>
          <div className="flex items-center justify-center gap-1">
            <button 
              disabled={filters.page === 1} 
              onClick={() => set({ page: filters.page - 1 })} 
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-xs sm:text-sm">
              Page {filters.page} of {totalPages}
            </span>
            <button 
              disabled={filters.page === totalPages} 
              onClick={() => set({ page: filters.page + 1 })} 
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {isKpiModalOpen && <KpiModal />}
    </div>
  );
};