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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm sm:text-base">
            {isEdit ? 'Edit Report' : 'New Saved Report'}
          </h2>
          <button 
            onClick={() => dispatch(closeReportModal())} 
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Report Name <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter report name"
              {...register('report_name', { required: true })}
            />
            {errors.report_name && <p className="text-xs text-red-500 mt-1">Required</p>}
          </div>

          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Report Type <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                {...register('report_type', { required: true })}
              >
                <option value="">Select type</option>
                {['Sales Report', 'Inventory Report', 'Financial Report', 'HR Report', 'Customer Report', 'Custom Report'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Data Source <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. orders, customers"
                {...register('data_source', { required: true })}
              />
              {errors.data_source && <p className="text-xs text-red-500 mt-1">Required</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
            <textarea
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Brief description of this report..."
              {...register('description')}
            />
          </div>

          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Chart Type</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                {...register('chart_type')}
              >
                <option value="None">None</option>
                <option value="Bar Chart">Bar Chart</option>
                <option value="Line Chart">Line Chart</option>
                <option value="Pie Chart">Pie Chart</option>
                <option value="Area Chart">Area Chart</option>
                <option value="Table">Table</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Visibility</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                {...register('visibility')}
              >
                <option value="Private">Private</option>
                <option value="Public">Public</option>
                <option value="Shared">Shared</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              id="is_scheduled"
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              {...register('is_scheduled')}
            />
            <label htmlFor="is_scheduled" className="text-sm text-gray-700 cursor-pointer">
              Schedule this report
            </label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => dispatch(closeReportModal())}
              className="w-full sm:w-auto px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                isEdit ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};