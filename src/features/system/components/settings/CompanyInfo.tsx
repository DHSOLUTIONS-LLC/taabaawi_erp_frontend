import React from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { SystemSettings } from '../../../../types/system';

interface Props {
  register: UseFormRegister<SystemSettings>;
  errors: FieldErrors<SystemSettings>;
}

const CompanyInfo: React.FC<Props> = ({ register }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Company Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="company_legal_name" className="block text-sm font-medium text-gray-700 mb-2">
            Legal Name
          </label>
          <input
            id="company_legal_name"
            type="text"
            {...register('company_legal_name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="tax_number" className="block text-sm font-medium text-gray-700 mb-2">
            Tax Number
          </label>
          <input
            id="tax_number"
            type="text"
            {...register('tax_number')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700 mb-2">
            Registration Number
          </label>
          <input
            id="registration_number"
            type="text"
            {...register('registration_number')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="company_address" className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <input
            id="company_address"
            type="text"
            {...register('company_address')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
            City
          </label>
          <input
            id="city"
            type="text"
            {...register('city')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
            State
          </label>
          <input
            id="state"
            type="text"
            {...register('state')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <input
            id="country"
            type="text"
            {...register('country')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-2">
            Postal Code
          </label>
          <input
            id="postal_code"
            type="text"
            {...register('postal_code')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>
    </div>
  );
};

export default CompanyInfo;