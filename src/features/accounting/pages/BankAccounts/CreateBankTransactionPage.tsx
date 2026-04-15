// src/features/accounting/pages/bank-accounts/CreateBankTransactionPage.tsx
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { 
  useCreateBankTransactionMutation,
  useGetBankAccountByIdQuery,
  useGetJournalEntriesQuery 
} from '../../../../services/accountingApi';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

const TRANSACTION_TYPES = [
  'Deposit',
  'Withdrawal', 
  'Transfer',
  'Bank Charge',
  'Interest'
];

const REFERENCE_TYPES = [
  'Journal Entry',
  'Invoice',
  'Payment',
  'Receipt',
  'Transfer'
];

export default function CreateBankTransactionPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // bank account ID from URL
  const { user } = useAppSelector((state: RootState) => state.auth);
  
  const [formData, setFormData] = useState({
    bank_account_id: id || '',
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_type: 'Deposit',
    amount: '',
    reference_type: '',
    reference_number: '',
    reference_id: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [showJournalSelector, setShowJournalSelector] = useState(false);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  // Get bank account details
  const { data: bankAccount } = useGetBankAccountByIdQuery(parseInt(id || '0'), {
    skip: !id
  });

  // Get journal entries for reference
  const { data: journalsData } = useGetJournalEntriesQuery({ 
    per_page: 50,
    status: 'Posted' 
  });

  const [createTransaction, { isLoading }] = useCreateBankTransactionMutation();

  const journals = (journalsData as any)?.data || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: [] }));
  };

  const handleReferenceSelect = (journal: any) => {
    setFormData(prev => ({
      ...prev,
      reference_type: 'Journal Entry',
      reference_id: journal.id,
      reference_number: journal.journal_number,
      description: journal.description || prev.description
    }));
    setShowJournalSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        bank_account_id: parseInt(formData.bank_account_id),
        amount: parseFloat(formData.amount),
        reference_id: formData.reference_id ? parseInt(formData.reference_id) : undefined,
      };

      await createTransaction(payload).unwrap();
      navigate(`${basePath}/accounting/bank-accounts/${id}`);
    } catch (err: any) {
      if (err.data?.errors) {
        setErrors(err.data.errors);
      } else {
        alert(err?.data?.message || 'Failed to create bank transaction');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3 sm:gap-4">
          <button onClick={() => navigate(`${basePath}/accounting/bank-accounts/${id}`)} className="flex-shrink-0 mt-1">
            <img src={arrow_back_icon} alt="" className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Create Bank Transaction</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 break-words">
              {bankAccount?.data?.account_name} - {bankAccount?.data?.bank_name}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* Transaction Details */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Transaction Details</h3>
            
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Transaction Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="transaction_date"
                  value={formData.transaction_date}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                    errors.transaction_date ? 'border-red-400' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.transaction_date && <p className="text-xs text-red-500 mt-1">{errors.transaction_date[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Transaction Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="transaction_type"
                    value={formData.transaction_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    required
                  >
                    {TRANSACTION_TYPES.map(type => (
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
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.000"
                  className={`w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                    errors.amount ? 'border-red-400' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Transaction description"
                  className={`w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                    errors.description ? 'border-red-400' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description[0]}</p>}
              </div>
            </div>
          </div>

          {/* Reference Information */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Reference (Optional)</h3>
              <button
                type="button"
                onClick={() => setShowJournalSelector(!showJournalSelector)}
                className="text-sm text-blue-600 hover:text-blue-800 text-left sm:text-right"
              >
                {showJournalSelector ? 'Hide' : 'Link to Journal Entry'}
              </button>
            </div>

            {showJournalSelector && (
              <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Select Journal Entry:</h4>
                <div className="space-y-2">
                  {journals.map((journal: any) => (
                    <div
                      key={journal.id}
                      onClick={() => handleReferenceSelect(journal)}
                      className="p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                        <span className="font-medium text-sm">{journal.journal_number}</span>
                        <span className="text-xs text-gray-500">{journal.entry_date}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 break-words">{journal.description}</p>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 mt-2 text-xs">
                        <span>Debit: {journal.total_debit}</span>
                        <span>Credit: {journal.total_credit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Reference Type
                </label>
                <div className="relative">
                  <select
                    name="reference_type"
                    value={formData.reference_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  >
                    <option value="">None</option>
                    {REFERENCE_TYPES.map(type => (
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
                  Reference Number
                </label>
                <input
                  type="text"
                  name="reference_number"
                  value={formData.reference_number}
                  onChange={handleChange}
                  placeholder="e.g. JE-2024-0001"
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              {formData.reference_id && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Reference ID
                  </label>
                  <input
                    type="text"
                    name="reference_id"
                    value={formData.reference_id}
                    onChange={handleChange}
                    placeholder="Reference ID"
                    className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm sm:text-base"
                    readOnly
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate(`${basePath}/accounting/bank-accounts/${id}`)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base"
            >
              {isLoading ? 'Creating...' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}