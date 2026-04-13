import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useUpdatePaymentMethodMutation } from '../../../../services/paymentMethodApi';
import type { PaymentMethod, UpdatePaymentMethodPayload } from '../../../../types/payment-method';

interface Props {
  method: PaymentMethod | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PaymentMethodForm: React.FC<Props> = ({ method, onSuccess, onCancel }) => {
  const [updateMethod, { isLoading }] = useUpdatePaymentMethodMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UpdatePaymentMethodPayload>({
    defaultValues: method || {},
  });

  useEffect(() => {
    if (method) {
      reset(method);
    }
  }, [method, reset]);

  const onSubmit = async (data: UpdatePaymentMethodPayload) => {
    if (!method) return;

    try {
      await updateMethod({ id: method.id, data }).unwrap();
      toast.success('Payment method updated successfully');
      onSuccess?.();
    } catch {
      toast.error('Failed to update payment method');
    }
  };

  if (!method) {
    return (
      <div className="text-center py-8 text-gray-500">
        Select a payment method to edit
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
      <div className="space-y-4 sm:space-y-6">
        {/* Method Name */}
        <div>
          <label htmlFor="method_name" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Method Name <span className="text-red-500">*</span>
          </label>
          <input
            id="method_name"
            type="text"
            {...register('method_name', { required: 'Method name is required' })}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />
          {errors.method_name && (
            <p className="text-xs text-red-500 mt-1">{errors.method_name.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            {...register('description')}
            placeholder="Brief description of this payment method..."
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base"
          />
        </div>

        {/* Fee Fields - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label htmlFor="transaction_fee_percentage" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Fee Percentage (%)
            </label>
            <input
              id="transaction_fee_percentage"
              type="number"
              step="0.01"
              min="0"
              {...register('transaction_fee_percentage')}
              placeholder="0.00"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>

          <div>
            <label htmlFor="transaction_fee_fixed" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Fixed Fee (KWD)
            </label>
            <input
              id="transaction_fee_fixed"
              type="number"
              step="0.01"
              min="0"
              {...register('transaction_fee_fixed')}
              placeholder="0.00"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Sort Order */}
        <div>
          <label htmlFor="sort_order" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Sort Order
          </label>
          <input
            id="sort_order"
            type="number"
            {...register('sort_order')}
            placeholder="Higher number = Higher priority"
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />
          <p className="text-xs text-gray-500 mt-1">Methods with higher sort order appear first</p>
        </div>

        {/* Status Toggles */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <input
              id="is_active"
              type="checkbox"
              {...register('is_active')}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Active
            </label>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  );
};

export default PaymentMethodForm;