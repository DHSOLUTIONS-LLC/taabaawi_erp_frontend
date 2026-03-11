// src/features/accounting/pages/budgets/CreateBudgetPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { 
  useCreateBudgetMutation,
  useGetChartOfAccountsQuery 
} from '../../../../services/accountingApi';
import BudgetLines from '../../components/BudgetLines';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

interface BudgetLineItem {
  id: string;
  account_id: string;
  budgeted_amount: number;
  notes: string;
}

export default function CreateBudgetPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [formData, setFormData] = useState({
    budget_name: '',
    fiscal_year: new Date().getFullYear(),
    period_type: 'Yearly' as 'Monthly' | 'Quarterly' | 'Yearly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    notes: '',
  });

  const [lines, setLines] = useState<BudgetLineItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const [createBudget, { isLoading }] = useCreateBudgetMutation();

  // Fetch accounts for budget lines
  const { data: accountsData } = useGetChartOfAccountsQuery({
    account_type: 'Revenue',
    is_active: 1 as any,
    per_page: 1000,
  });

  const accounts = accountsData?.data ?? [];
  console.log('bugets lines accounts:', accounts)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-calculate end date based on period type
    if (name === 'period_type' || name === 'start_date') {
      const startDate = name === 'start_date' ? new Date(value) : new Date(formData.start_date);
      const periodType = name === 'period_type' ? value : formData.period_type;
      
      let endDate = new Date(startDate);
      if (periodType === 'Monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (periodType === 'Quarterly') {
        endDate.setMonth(endDate.getMonth() + 3);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      
      setFormData(prev => ({ 
        ...prev, 
        end_date: endDate.toISOString().split('T')[0] 
      }));
    }
  };

  const addLine = () => {
    const newLine: BudgetLineItem = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      account_id: '',
      budgeted_amount: 0,
      notes: '',
    };
    setLines([...lines, newLine]);
  };

  const updateLine = (id: string, updates: Partial<BudgetLineItem>) => {
    setLines(lines.map(line => 
      line.id === id ? { ...line, ...updates } : line
    ));
  };

  const removeLine = (id: string) => {
    setLines(lines.filter(line => line.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lines.length === 0) {
      alert('Please add at least one budget line');
      return;
    }

    try {
      const payload = {
        budget_name: formData.budget_name,
        fiscal_year: formData.fiscal_year,
        period_type: formData.period_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        notes: formData.notes || undefined,
        lines: lines
          .filter(l => l.account_id && l.budgeted_amount > 0)
          .map(l => ({
            account_id: parseInt(l.account_id),
            budgeted_amount: l.budgeted_amount,
            notes: l.notes || undefined,
          })),
      };
      
      const result = await createBudget(payload).unwrap();
      navigate(`${basePath}/accounting/budgets/${(result as any).data?.id}`);
    } catch (err: any) {
      if (err.data?.errors) {
        setErrors(err.data.errors);
      } else {
        alert(err?.data?.message || 'Failed to create budget');
      }
    }
  };

  const totalBudgetAmount = lines.reduce((sum, l) => sum + (l.budgeted_amount || 0), 0);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`${basePath}/accounting/budgets`)}>
            <img src={arrow_back_icon} alt="" className="w-8 h-8" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Budget</h1>
            <p className="text-sm text-gray-500 mt-0.5">Create a new budget plan</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Budget Details */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Budget Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Budget Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="budget_name"
                  value={formData.budget_name}
                  onChange={handleChange}
                  placeholder="e.g. Operating Budget 2025"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                {errors.budget_name && (
                  <p className="text-xs text-red-500 mt-1">{errors.budget_name[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Fiscal Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="fiscal_year"
                  value={formData.fiscal_year}
                  onChange={handleChange}
                  min="2020"
                  max="2100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Period Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="period_type"
                    value={formData.period_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="Yearly">Yearly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  min={formData.start_date}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Budget Lines */}
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Budget Lines</h2>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Line
              </button>
            </div>

            <BudgetLines
              lines={lines}
              accounts={accounts}
              onUpdate={updateLine}
              onRemove={removeLine}
            />

            {/* Total */}
            {lines.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-end items-center gap-4">
                  <span className="text-sm font-semibold text-gray-700">Total Budget:</span>
                  <span className="text-xl font-bold text-blue-600">
                    KWD {totalBudgetAmount.toFixed(3)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Notes</h2>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Additional notes about this budget..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`${basePath}/accounting/budgets`)}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}