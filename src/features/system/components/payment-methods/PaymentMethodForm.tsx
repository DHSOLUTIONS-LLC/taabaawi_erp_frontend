
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Method Name */}
        <div>
          <label htmlFor="method_name" className="block text-sm font-medium text-gray-700 mb-2">
            Method Name
          </label>
          <input
            id="method_name"
            type="text"
            {...register('method_name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            {...register('description')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Fee Percentage */}
        <div>
          <label htmlFor="transaction_fee_percentage" className="block text-sm font-medium text-gray-700 mb-2">
            Fee Percentage (%)
          </label>
          <input
            id="transaction_fee_percentage"
            type="number"
            step="0.01"
            min="0"
            {...register('transaction_fee_percentage')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Fixed Fee */}
        <div>
          <label htmlFor="transaction_fee_fixed" className="block text-sm font-medium text-gray-700 mb-2">
            Fixed Fee
          </label>
          <input
            id="transaction_fee_fixed"
            type="number"
            step="0.01"
            min="0"
            {...register('transaction_fee_fixed')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Sort Order */}
        <div>
          <label htmlFor="sort_order" className="block text-sm font-medium text-gray-700 mb-2">
            Sort Order
          </label>
          <input
            id="sort_order"
            type="number"
            {...register('sort_order')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Status Toggles */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center">
            <input
              id="is_active"
              type="checkbox"
              {...register('is_active')}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Active
            </label>
          </div>

           
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default PaymentMethodForm;