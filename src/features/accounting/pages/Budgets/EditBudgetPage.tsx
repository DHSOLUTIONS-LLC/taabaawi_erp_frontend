// src/features/accounting/pages/budgets/EditBudgetPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import {
  useGetBudgetByIdQuery,
  useUpdateBudgetMutation,
  useGetChartOfAccountsQuery
} from '../../../../services/accountingApi';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
// import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

interface BudgetLineItem {
  id: string;
  account_id: string;
  budgeted_amount: number;
  notes: string;
}

export default function EditBudgetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [formData, setFormData] = useState({
    budget_name: '',
    start_date: '',
    end_date: '',
    notes: '',
  });

  const [lines, setLines] = useState<BudgetLineItem[]>([]);
  const [_errors, setErrors] = useState<Record<string, string[]>>({});

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const budgetId = id ? parseInt(id, 10) : 0;
  const { data, isLoading } = useGetBudgetByIdQuery(budgetId);
  const [updateBudget, { isLoading: isUpdating }] = useUpdateBudgetMutation();

  const { data: accountsData } = useGetChartOfAccountsQuery({
    is_active: 1 as any,
    per_page: 1000,
  });

  const accounts = accountsData?.data ?? [];
  console.log('edit... lines', accounts)
  const budget = (data as any)?.data;

  useEffect(() => {
    if (budget) {
      setFormData({
        budget_name: budget.budget_name,
        start_date: budget.start_date.split('T')[0],
        end_date: budget.end_date.split('T')[0],
        notes: budget.notes || '',
      });

      if (budget.lines) {
        setLines(budget.lines.map((line: any) => ({
          id: `line-${line.id}`,
          account_id: line.account_id?.toString() || '',
          budgeted_amount: parseFloat(line.budgeted_amount) || 0,
          notes: line.notes || '',
        })));
      }
    }
  }, [budget]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  //   const updateLine = (id: string, updates: Partial<BudgetLineItem>) => {
  //     setLines(lines.map(line => 
  //       line.id === id ? { ...line, ...updates } : line
  //     ));
  //   };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        budget_name: formData.budget_name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        notes: formData.notes || undefined,
      };

      await updateBudget({ id: budgetId, data: payload }).unwrap();
      navigate(`${basePath}/accounting/budgets/${budgetId}`);
    } catch (err: any) {
      if (err.data?.errors) {
        setErrors(err.data.errors);
      } else {
        alert(err?.data?.message || 'Failed to update budget');
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

  if (!budget) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-red-500 font-medium">Budget not found</p>
          <button
            onClick={() => navigate(`${basePath}/accounting/budgets`)}
            className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Back to Budgets
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (budget.status !== 'Draft') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-red-500 font-medium">Only draft budgets can be edited</p>
          <button
            onClick={() => navigate(`${basePath}/accounting/budgets/${budgetId}`)}
            className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Back to Budget
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const totalBudgetAmount = lines.reduce((sum, l) => sum + (l.budgeted_amount || 0), 0);

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`${basePath}/accounting/budgets/${budgetId}`)}>
            <img src={arrow_back_icon} alt="" className="w-8 h-8" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Budget</h1>
            <p className="text-sm text-gray-500 mt-0.5">{budget.budget_name}</p>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
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

          {/* Budget Lines (Read-only in edit) */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Budget Lines</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Account</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Budgeted Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((line) => {
                    const account = accounts.find((a: any) => a.id.toString() === line.account_id);
                    return (
                      <tr key={line.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {account ? `${account.account_code} - ${account.account_name}` : `Account #${line.account_id}`}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-mono text-gray-900">
                          KWD {line.budgeted_amount.toFixed(3)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {line.notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">Total</td>
                    <td className="px-4 py-3 text-right text-sm font-mono font-bold text-blue-600">
                      KWD {totalBudgetAmount.toFixed(3)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Notes</h2>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`${basePath}/accounting/budgets/${budgetId}`)}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : 'Update Budget'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}