// src/features/accounting/pages/journal-entries/CreateJournalEntryPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { useCreateJournalEntryMutation } from '../../../../services/accountingApi';
import JournalEntryLines from '../../components/JournalEntryLines';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

interface LineItem {
  id: string;
  account_id: string;
  description: string;
  debit: number;
  credit: number;
}

const num = (v: any) => parseFloat(v) || 0;

export default function CreateJournalEntryPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
    reference_type: '',
    reference_number: '',
    notes: '',
  });

  const [lines, setLines] = useState<LineItem[]>([
    { id: `temp-${Date.now()}-1`, account_id: '', description: '', debit: 0, credit: 0 },
    { id: `temp-${Date.now()}-2`, account_id: '', description: '', debit: 0, credit: 0 },
  ]);

  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const [createJournal, { isLoading }] = useCreateJournalEntryMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: [] }));
  };

  // Computed balance values
  const totalDebit  = lines.reduce((sum, l) => sum + num(l.debit), 0);
  const totalCredit = lines.reduce((sum, l) => sum + num(l.credit), 0);
  const isBalanced  = Math.abs(totalDebit - totalCredit) <= 0.001;

  const validate = () => {
    const newErrors: Record<string, string[]> = {};

    if (!formData.entry_date)  newErrors.entry_date  = ['Entry date is required'];
    if (!formData.description) newErrors.description = ['Description is required'];

    // Need at least 2 valid lines (backend requires min:2)
    const validLines = lines.filter(l => l.account_id && (l.debit > 0 || l.credit > 0));
    if (validLines.length < 2) {
      newErrors.lines = ['At least 2 lines with account and amount are required'];
    }

    // Backend enforces balance — check here to give a clear message before sending
    if (validLines.length >= 2 && !isBalanced) {
      newErrors.balance = [`Journal entry must be balanced. Debit: ${totalDebit.toFixed(3)}, Credit: ${totalCredit.toFixed(3)}`];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload = {
        entry_date: formData.entry_date,
        description: formData.description,
        reference_type: formData.reference_type || undefined,
        reference_number: formData.reference_number || undefined,
        notes: formData.notes || undefined,
        lines: lines
          .filter(l => l.account_id && (l.debit > 0 || l.credit > 0))
          .map(l => ({
            account_id: parseInt(l.account_id),
            description: l.description || formData.description,
            debit: l.debit || 0,
            credit: l.credit || 0,
          })),
      };

      const result = await createJournal(payload).unwrap();
      navigate(`${basePath}/accounting/journal-entries/${(result as any).data?.id}`);
    } catch (err: any) {
      if (err.data?.errors) {
        setErrors(err.data.errors);
      } else {
        alert(err?.data?.message || 'Failed to create journal entry');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`${basePath}/accounting/journal-entries`)}>
            <img src={arrow_back_icon} alt="" className="w-8 h-8" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Journal Entry</h1>
            <p className="text-sm text-gray-500 mt-0.5">Record a new financial transaction</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Entry Details */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Entry Details</h2>
            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Entry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="entry_date"
                  value={formData.entry_date}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.entry_date ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {errors.entry_date && <p className="text-xs text-red-500 mt-1">{errors.entry_date[0]}</p>}
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
                  placeholder="Brief description of the transaction"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Reference Type</label>
                <div className="relative">
                  <select
                    name="reference_type"
                    value={formData.reference_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Purchase">Purchase</option>
                    <option value="Payment">Payment</option>
                    <option value="Receipt">Receipt</option>
                    <option value="Journal">Journal</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Reference Number</label>
                <input
                  type="text"
                  name="reference_number"
                  value={formData.reference_number}
                  onChange={handleChange}
                  placeholder="e.g. INV-2025-001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Journal Lines */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Journal Lines</h2>
            <JournalEntryLines lines={lines} onChange={setLines} currency="KWD" />
            {errors.lines && (
              <p className="text-xs text-red-500 mt-2">{errors.lines[0]}</p>
            )}
            {/* Balance error shown only after clicking submit */}
            {errors.balance && (
              <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">{errors.balance[0]}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Additional Notes</h2>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional notes about this entry..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`${basePath}/accounting/journal-entries`)}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {isLoading ? 'Creating...' : 'Create Journal Entry'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}