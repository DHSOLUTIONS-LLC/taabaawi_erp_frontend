// src/features/accounting/components/BudgetLines.tsx
import { useState } from 'react';
import dropdown_arrow_icon from '../../../assets/icons/dropdown_arrow_icon.svg';

interface BudgetLine {
  id: string;
  account_id: string;
  budgeted_amount: number;
  notes: string;
}

interface BudgetLinesProps {
  lines: BudgetLine[];
  accounts: any[];
  onUpdate: (id: string, updates: Partial<BudgetLine>) => void;
  onRemove: (id: string) => void;
  readOnly?: boolean;
}

export default function BudgetLines({
  lines,
  accounts,
  onUpdate,
  onRemove,
  readOnly = false,
}: BudgetLinesProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});


  const validateLine = (line: BudgetLine) => {
    const newErrors: Record<string, string> = {};
    if (!line.account_id) {
      newErrors[`line_${line.id}_account`] = 'Account is required';
    }
    if (line.budgeted_amount <= 0) {
      newErrors[`line_${line.id}_amount`] = 'Amount must be greater than 0';
    }
    return newErrors;
  };

  const handleUpdate = (id: string, updates: Partial<BudgetLine>) => {
    onUpdate(id, updates);

    const line = { ...lines.find(l => l.id === id), ...updates } as BudgetLine;
    const lineErrors = validateLine(line);
    setErrors(prev => ({ ...prev, ...lineErrors }));
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-y border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Account</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Budgeted Amount</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Notes</th>
            {!readOnly && (
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lines.length === 0 ? (
            <tr>
              <td colSpan={readOnly ? 3 : 4} className="px-4 py-8 text-center text-gray-500">
                No budget lines added yet
              </td>
            </tr>
          ) : (
            lines.map((line) => (
              <tr key={line.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="relative">
                    <select
                      value={line.account_id}
                      onChange={(e) => handleUpdate(line.id, { account_id: e.target.value })}
                      disabled={readOnly}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm appearance-none bg-white pr-8 ${errors[`line_${line.id}_account`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                      <option value="">Select Account</option>
                      {accounts.map((acc: any) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.account_name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <img src={dropdown_arrow_icon} alt="" className="w-3 h-3" />
                    </div>
                  </div>
                  {errors[`line_${line.id}_account`] && (
                    <p className="text-xs text-red-500 mt-1">{errors[`line_${line.id}_account`]}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.001"
                    value={line.budgeted_amount || ''}
                    onChange={(e) => handleUpdate(line.id, {
                      budgeted_amount: parseFloat(e.target.value) || 0
                    })}
                    placeholder="0.000"
                    disabled={readOnly}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-right ${errors[`line_${line.id}_amount`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors[`line_${line.id}_amount`] && (
                    <p className="text-xs text-red-500 mt-1">{errors[`line_${line.id}_amount`]}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={line.notes || ''}
                    onChange={(e) => handleUpdate(line.id, { notes: e.target.value })}
                    placeholder="Notes"
                    disabled={readOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </td>
                {!readOnly && (
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onRemove(line.id)}
                      className="text-red-500 hover:text-red-700"
                      disabled={lines.length <= 1}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}