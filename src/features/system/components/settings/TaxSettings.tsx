import React from 'react';
import type { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import type { SystemSettings } from '../../../../types/system';

interface Props {
  register: UseFormRegister<SystemSettings>;
  errors: FieldErrors<SystemSettings>;
  watch: UseFormWatch<SystemSettings>;
}

const TaxSettings: React.FC<Props> = ({ register, watch }) => {
  const enableTax = watch('enable_tax');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Tax Settings</h2>
      
      <div className="space-y-4">
        {/* Enable Tax */}
        <div className="flex items-center">
          <input
            id="enable_tax"
            type="checkbox"
            {...register('enable_tax')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="enable_tax" className="ml-2 block text-sm text-gray-900">
            Enable Tax
          </label>
        </div>

        {enableTax && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Default Tax Rate */}
              <div>
                <label htmlFor="default_tax_rate" className="block text-sm font-medium text-gray-700 mb-2">
                  Default Tax Rate (%)
                </label>
                <input
                  id="default_tax_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('default_tax_rate')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="10"
                />
              </div>

              {/* Tax Label */}
              <div>
                <label htmlFor="tax_label" className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Label
                </label>
                <input
                  id="tax_label"
                  type="text"
                  {...register('tax_label')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="VAT"
                />
              </div>

              {/* Tax Inclusive */}
              <div className="flex items-center">
                <input
                  id="tax_inclusive"
                  type="checkbox"
                  {...register('tax_inclusive')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="tax_inclusive" className="ml-2 block text-sm text-gray-900">
                  Prices include tax
                </label>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-blue-400">ℹ️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Tax will be calculated based on these settings. You can override tax rates for specific products.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TaxSettings;