// src/features/accounting/pages/bank-accounts/CreateBankAccountPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { 
  useCreateBankAccountMutation,
  useGetChartOfAccountsQuery 
} from '../../../../services/accountingApi';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

const CURRENCIES = ['KWD', 'USD', 'EUR', 'GBP', 'SAR', 'AED'];

export default function CreateBankAccountPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [formData, setFormData] = useState({
    account_number: '',
    account_name: '',
    bank_name: '',
    branch_name: '',
    iban: '',
    swift_code: '',
    currency: 'KWD',
    opening_balance: 0,
    gl_account_id: '',
    is_active: true,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const [createAccount, { isLoading }] = useCreateBankAccountMutation();

  // Fetch GL accounts for mapping
  const { data: accountsData } = useGetChartOfAccountsQuery({
    account_type: 'Asset',
    is_active: 1 as any,
    per_page: 1000,
  });

  const glAccounts = (accountsData as any)?.data?.data || (accountsData as any)?.data || [];

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
        gl_account_id: formData.gl_account_id ? parseInt(formData.gl_account_id) : undefined,
      };
      
      await createAccount(payload).unwrap();
      navigate(`${basePath}/accounting/bank-accounts`);
    } catch (err: any) {
      if (err.data?.errors) {
        setErrors(err.data.errors);
      } else {
        alert(err?.data?.message || 'Failed to create bank account');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={() => navigate(`${basePath}/accounting/bank-accounts`)} className="flex-shrink-0 mt-1">
            <img src={arrow_back_icon} alt="" className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Create Bank Account</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Add a new bank account to your system</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Basic Information</h3>
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="account_name"
                  value={formData.account_name}
                  onChange={handleChange}
                  placeholder="e.g. Main Operating Account"
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  required
                />
                {errors.account_name && (
                  <p className="text-xs text-red-500 mt-1">{errors.account_name[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleChange}
                  placeholder="e.g. National Bank of Kuwait"
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  required
                />
                {errors.bank_name && (
                  <p className="text-xs text-red-500 mt-1">{errors.bank_name[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleChange}
                  placeholder="e.g. 1234567890"
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  required
                />
                {errors.account_number && (
                  <p className="text-xs text-red-500 mt-1">{errors.account_number[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Branch Name
                </label>
                <input
                  type="text"
                  name="branch_name"
                  value={formData.branch_name}
                  onChange={handleChange}
                  placeholder="e.g. Head Office Branch"
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Bank Details</h3>
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  IBAN
                </label>
                <input
                  type="text"
                  name="iban"
                  value={formData.iban}
                  onChange={handleChange}
                  placeholder="e.g. KW81CBKU00000000000012345601"
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  SWIFT Code
                </label>
                <input
                  type="text"
                  name="swift_code"
                  value={formData.swift_code}
                  onChange={handleChange}
                  placeholder="e.g. NBKKKWKW"
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Currency <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    required
                  >
                    {CURRENCIES.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                  </div>
                </div>
              </div>

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
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* GL Account Mapping */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              General Ledger Account
            </label>
            <div className="relative">
              <select
                name="gl_account_id"
                value={formData.gl_account_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              >
                <option value="">Select GL Account (Optional)</option>
                {glAccounts.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_code} - {acc.account_name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Link to a GL account for automatic journal entries
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional notes about this account..."
              className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm sm:text-base"
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
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate(`${basePath}/accounting/bank-accounts`)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base"
            >
              {isLoading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}