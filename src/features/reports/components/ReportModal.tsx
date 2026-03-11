import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { closeReportModal } from '../reportsSlice';
import { useCreateReportMutation, useUpdateReportMutation } from '../../../services/reportsApi';
import type { RootState } from '../../../app/store';

export const ReportModal = () => {
  const dispatch = useDispatch();
  const { selectedReport, reportModalMode } = useSelector((s: RootState) => s.reports);
  const isEdit = reportModalMode === 'edit';

  const [createReport, { isLoading: creating }] = useCreateReportMutation();
  const [updateReport, { isLoading: updating }] = useUpdateReportMutation();
  const isLoading = creating || updating;

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: isEdit && selectedReport ? {
      report_name:  selectedReport.report_name,
      report_type:  selectedReport.report_type,
      description:  selectedReport.description  ?? '',
      data_source:  selectedReport.data_source,
      chart_type:   selectedReport.chart_type   ?? 'None',
      visibility:   selectedReport.visibility   ?? 'Private',
      is_scheduled: selectedReport.is_scheduled ?? false,
    } : {
      report_name:  '',
      report_type:  'Sales Report',
      description:  '',
      data_source:  '',
      chart_type:   'None',
      visibility:   'Private',
      is_scheduled: false,
    },
  });

  const onSubmit = async (data: any) => {
    if (isEdit && selectedReport) {
      await updateReport({ id: selectedReport.id, data }).unwrap();
    } else {
      await createReport(data).unwrap();
    }
    dispatch(closeReportModal());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{isEdit ? 'Edit Report' : 'New Saved Report'}</h2>
          <button onClick={() => dispatch(closeReportModal())} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Report Name *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              {...register('report_name', { required: true })}
            />
            {errors.report_name && <p className="text-xs text-red-500 mt-1">Required</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Report Type *</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                {...register('report_type', { required: true })}
              >
                {['Sales Report', 'Inventory Report', 'Financial Report', 'HR Report', 'Customer Report', 'Custom Report'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data Source *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. orders, customers"
                {...register('data_source', { required: true })}
              />
              {errors.data_source && <p className="text-xs text-red-500 mt-1">Required</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Chart Type</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                {...register('chart_type')}
              >
                {['None', 'Bar Chart', 'Line Chart', 'Pie Chart', 'Area Chart', 'Table'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Visibility</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                {...register('visibility')}
              >
                {['Private', 'Public', 'Shared'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_scheduled"
              className="rounded"
              {...register('is_scheduled')}
            />
            <label htmlFor="is_scheduled" className="text-sm text-gray-600">Schedule this report</label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => dispatch(closeReportModal())}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};