// src/features/accounting/pages/chart-of-accounts/EditAccountPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import {
  useGetAccountByIdQuery,
  useUpdateAccountMutation,
  useGetChartOfAccountsQuery,
} from '../../../../services/accountingApi';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

const ACCOUNT_TYPES = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense', 'Cost of Goods Sold'] as const;

export default function EditAccountPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [formData, setFormData] = useState({
    account_code: '',
    account_name: '',
    account_type: 'Asset' as typeof ACCOUNT_TYPES[number],
    account_sub_type: '',
    parent_account_id: '',
    description: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const accountId = id ? parseInt(id, 10) : 0;
  const { data, isLoading } = useGetAccountByIdQuery(accountId);
  const [updateAccount, { isLoading: isUpdating }] = useUpdateAccountMutation();
  
  const { data: accountsData } = useGetChartOfAccountsQuery({ 
    is_active: true,
    per_page: 1000,
  });
  
  const accounts = (accountsData as any)?.data?.data || (accountsData as any)?.data || [];
  const account = (data as any)?.data;

  useEffect(() => {
    if (account) {
      setFormData({
        account_code: account.account_code,
        account_name: account.account_name,
        account_type: account.account_type,
        account_sub_type: account.account_sub_type || '',
        parent_account_id: account.parent_account_id?.toString() || '',
        description: account.description || '',
        is_active: account.is_active,
      });
    }
  }, [account]);

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
      
      await updateAccount({ id: accountId, data: payload }).unwrap();
      navigate(`${basePath}/accounting/chart-of-accounts/${accountId}`);
    } catch (err: any) {
      if (err.data?.errors) {
        setErrors(err.data.errors);
      } else {
        alert(err?.data?.message || 'Failed to update account');
      }
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!account) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-red-500 font-medium">Account not found</p>
          <button
            onClick={() => navigate(`${basePath}/accounting/chart-of-accounts`)}
            className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Back to Chart of Accounts
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (account.is_system_account) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-red-500 font-medium">System accounts cannot be edited</p>
          <button
            onClick={() => navigate(`${basePath}/accounting/chart-of-accounts/${accountId}`)}
            className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Back to Account Details
          </button>
        </div>
      </DashboardLayout>
    );
  }

 return (
    <DashboardLayout>
      <div className="max-w-full mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={() => navigate(`${basePath}/accounting/chart-of-accounts/${accountId}`)} 
            className="flex-shrink-0 -ml-1 sm:ml-0 mt-1"
          >
            <img src={arrow_back_icon} alt="Go back" className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Account</h1>
            <div className="flex flex-wrap items-center gap-1 mt-0.5">
              <span className="text-xs sm:text-sm text-gray-500 break-all">{account.account_code}</span>
              <span className="text-gray-400 text-xs sm:text-sm hidden sm:inline">-</span>
              <span className="text-xs sm:text-sm text-gray-500 break-words">{account.account_name}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Account Code and Name */}
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Account Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="account_code"
                value={formData.account_code}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                required
              />
              {errors.account_code && (
                <p className="text-xs text-red-500 mt-1">{errors.account_code[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="account_name"
                value={formData.account_name}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                required
              />
              {errors.account_name && (
                <p className="text-xs text-red-500 mt-1">{errors.account_name[0]}</p>
              )}
            </div>
          </div>

          {/* Account Type and Sub Type */}
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Account Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="account_type"
                  value={formData.account_type}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Account Sub Type
              </label>
              <input
                type="text"
                name="account_sub_type"
                value={formData.account_sub_type}
                onChange={handleChange}
                placeholder="e.g. Current Asset"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Parent Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Parent Account
            </label>
            <div className="relative">
              <select
                name="parent_account_id"
                value={formData.parent_account_id}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">None (Top Level Account)</option>
                {accounts
                  .filter((a: any) => a.id !== accountId && a.is_active)
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
            <p className="text-xs text-gray-500 mt-1">
              Parent accounts cannot be set to a child account
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Enter account description..."
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2 sm:gap-3 py-2">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Active <span className="text-xs text-gray-500">(Inactive accounts won't appear in transactions)</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-300">
            <button
              type="button"
              onClick={() => navigate(`${basePath}/accounting/chart-of-accounts/${accountId}`)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isUpdating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </span>
              ) : (
                'Update Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}