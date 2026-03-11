// src/features/accounting/pages/chart-of-accounts/CreateAccountPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import {
  useCreateAccountMutation,
  useGetChartOfAccountsQuery,
} from '../../../../services/accountingApi';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

const ACCOUNT_TYPES = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense', 'Cost of Goods Sold'] as const;

export default function CreateAccountPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [formData, setFormData] = useState({
    account_code: '',
    account_name: '',
    account_type: 'Asset' as typeof ACCOUNT_TYPES[number],
    account_sub_type: '',
    parent_account_id: '',
    description: '',
    opening_balance: 0,
    currency: 'KWD',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const [createAccount, { isLoading }] = useCreateAccountMutation();
  
  // Get existing accounts for parent dropdown
  const { data: accountsData } = useGetChartOfAccountsQuery({ 
    is_active: 1 as any,
    per_page: 1000,
  });
  
  const accounts = (accountsData as any)?.data?.data || (accountsData as any)?.data || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        parent_account_id: formData.parent_account_id ? parseInt(formData.parent_account_id) : undefined,
      };
      console.log('payload creating JE:', payload)
      
      await createAccount(payload).unwrap();
      navigate(`${basePath}/accounting/chart-of-accounts`);
    } catch (err: any) {
      if (err.data?.errors) {
        setErrors(err.data.errors);
      } else {
        alert(err?.data?.message || 'Failed to create account');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`${basePath}/accounting/chart-of-accounts`)}>
            <img src={arrow_back_icon} alt="" className="w-8 h-8" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Account</h1>
            <p className="text-sm text-gray-500 mt-0.5">Add a new account to your chart of accounts</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 space-y-6">
          {/* Account Code */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Account Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="account_code"
                value={formData.account_code}
                onChange={handleChange}
                placeholder="e.g. 1000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              {errors.account_code && (
                <p className="text-xs text-red-500 mt-1">{errors.account_code[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="account_name"
                value={formData.account_name}
                onChange={handleChange}
                placeholder="e.g. Cash"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              {errors.account_name && (
                <p className="text-xs text-red-500 mt-1">{errors.account_name[0]}</p>
              )}
            </div>
          </div>

          {/* Account Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Account Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="account_type"
                  value={formData.account_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {ACCOUNT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Account Sub Type
              </label>
              <input
                type="text"
                name="account_sub_type"
                value={formData.account_sub_type}
                onChange={handleChange}
                placeholder="e.g. Current Asset"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Parent Account */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Parent Account
            </label>
            <div className="relative">
              <select
                name="parent_account_id"
                value={formData.parent_account_id}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None (Top Level Account)</option>
                {accounts
                  .filter((a: any) => a.is_active)
                  .map((account: any) => (
                    <option key={account.id} value={account.id}>
                      {account.account_code} - {account.account_name} ({account.account_type})
                    </option>
                  ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Opening Balance */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Opening Balance (KWD)
            </label>
            <input
              type="number"
              step="0.001"
              name="opening_balance"
              value={formData.opening_balance}
              onChange={handleChange}
              placeholder="0.000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Initial balance for this account. Current balance will be updated automatically.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Enter account description..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate(`${basePath}/accounting/chart-of-accounts`)}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}