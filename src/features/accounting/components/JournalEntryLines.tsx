// src/features/accounting/components/JournalEntryLines.tsx
import { useGetChartOfAccountsQuery } from '../../../services/accountingApi';
import dropdown_arrow_icon from '../../../assets/icons/dropdown_arrow_icon.svg';

interface JournalEntryLine {
  id: string;
  account_id: string;
  description: string;
  debit: number;
  credit: number;
}

interface JournalEntryLinesProps {
  lines: JournalEntryLine[];
  onChange: (lines: JournalEntryLine[]) => void;
  currency?: string;
  readOnly?: boolean;
}

const num = (v: any) => parseFloat(v) || 0;

export default function JournalEntryLines({
  lines,
  onChange,
  currency = 'KWD',
  readOnly = false,
}: JournalEntryLinesProps) {

  const { data: accountsData } = useGetChartOfAccountsQuery({ per_page: 1000 });

  const accounts: any[] = (() => {
    const raw = accountsData as any;
    if (Array.isArray(raw?.data?.data)) return raw.data.data;
    if (Array.isArray(raw?.data))       return raw.data;
    if (Array.isArray(raw))             return raw;
    return [];
  })();

  const updateLine = (id: string, updates: Partial<JournalEntryLine>) => {
    onChange(lines.map((line) => (line.id === id ? { ...line, ...updates } : line)));
  };

  const removeLine = (id: string) => {
    onChange(lines.filter((line) => line.id !== id));
  };

  const addLine = () => {
    onChange([
      ...lines,
      {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        account_id: '',
        description: '',
        debit: 0,
        credit: 0,
      },
    ]);
  };

  const totalDebit  = lines.reduce((sum, l) => sum + num(l.debit), 0);
  const totalCredit = lines.reduce((sum, l) => sum + num(l.credit), 0);
  const bothSidesHaveValues = totalDebit > 0 && totalCredit > 0;
  const isBalanced = bothSidesHaveValues && Math.abs(totalDebit - totalCredit) <= 0.001;
  const diff = Math.abs(totalDebit - totalCredit);

  return (
    <div className="space-y-4">
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50 border-y border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Account</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Description</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Debit</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Credit</th>
              {!readOnly && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Del</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.map((line) => (
              <tr key={line.id} className="hover:bg-gray-50">
                {/* Account */}
                <td className="px-4 py-3 min-w-[220px]">
                  <div className="relative">
                    <select
                      value={line.account_id}
                      onChange={(e) => updateLine(line.id, { account_id: e.target.value })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white pr-8 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Account</option>
                      {accounts.map((acc: any) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.account_code} - {acc.account_name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <img src={dropdown_arrow_icon} alt="" className="w-3 h-3" />
                    </div>
                  </div>
                </td>

                {/* Description */}
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) => updateLine(line.id, { description: e.target.value })}
                    placeholder="Description"
                    disabled={readOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </td>

                {/* Debit */}
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={line.debit || ''}
                    onChange={(e) => updateLine(line.id, { debit: parseFloat(e.target.value) || 0 })}
                    placeholder="0.000"
                    disabled={readOnly || line.credit > 0}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500 ${
                      line.credit > 0 ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''
                    }`}
                  />
                </td>

                {/* Credit */}
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={line.credit || ''}
                    onChange={(e) => updateLine(line.id, { credit: parseFloat(e.target.value) || 0 })}
                    placeholder="0.000"
                    disabled={readOnly || line.debit > 0}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500 ${
                      line.debit > 0 ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
                    }`}
                  />
                </td>

                {/* Delete */}
                {!readOnly && (
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length <= 1}
                      className="text-red-400 hover:text-red-600 disabled:opacity-20 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>

          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            <tr>
              <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">
                Totals:
              </td>
              <td className="px-4 py-3 text-right text-sm font-mono font-bold text-blue-600 whitespace-nowrap">
                {currency} {totalDebit.toFixed(3)}
              </td>
              <td className="px-4 py-3 text-right text-sm font-mono font-bold text-blue-600 whitespace-nowrap">
                {currency} {totalCredit.toFixed(3)}
              </td>
              {!readOnly && <td />}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile Card View - Visible on mobile/tablet */}
      <div className="lg:hidden space-y-4">
        {lines.map((line, index) => (
          <div key={line.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase">Line {index + 1}</span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  disabled={lines.length <= 1}
                  className="text-red-400 hover:text-red-600 disabled:opacity-20 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            {/* Account Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Account *</label>
              <div className="relative">
                <select
                  value={line.account_id}
                  onChange={(e) => updateLine(line.id, { account_id: e.target.value })}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white pr-8 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Account</option>
                  {accounts.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_code} - {acc.account_name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <img src={dropdown_arrow_icon} alt="" className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input
                type="text"
                value={line.description}
                onChange={(e) => updateLine(line.id, { description: e.target.value })}
                placeholder="Transaction description"
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Debit and Credit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Debit</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={line.debit || ''}
                  onChange={(e) => updateLine(line.id, { debit: parseFloat(e.target.value) || 0 })}
                  placeholder="0.000"
                  disabled={readOnly || line.credit > 0}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500 ${
                    line.credit > 0 ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Credit</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={line.credit || ''}
                  onChange={(e) => updateLine(line.id, { credit: parseFloat(e.target.value) || 0 })}
                  placeholder="0.000"
                  disabled={readOnly || line.debit > 0}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500 ${
                    line.debit > 0 ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
                  }`}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Mobile Totals Card */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Total Debit:</span>
            <span className="text-sm font-mono font-bold text-blue-600">
              {currency} {totalDebit.toFixed(3)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Total Credit:</span>
            <span className="text-sm font-mono font-bold text-blue-600">
              {currency} {totalCredit.toFixed(3)}
            </span>
          </div>
        </div>
      </div>

      {/* Balance status — shown on both views */}
      {bothSidesHaveValues && (
        isBalanced ? (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 px-4 py-2.5 rounded-lg">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">Balanced</span>
          </div>
        ) : (
          <div className="flex items-start sm:items-center gap-2 text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg">
            <svg className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">
              Not balanced — difference: {currency} {diff.toFixed(3)}
            </span>
          </div>
        )
      )}

      {/* Add Line Button */}
      {!readOnly && (
        <button
          type="button"
          onClick={addLine}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Line
        </button>
      )}
    </div>
  );
}