// src/features/accounting/components/DebitCreditInput.tsx
import { useState } from 'react';

interface DebitCreditInputProps {
  value: { debit: number; credit: number };
  onChange: (value: { debit: number; credit: number }) => void;
  disabled?: boolean;
  error?: string;
}

export default function DebitCreditInput({ value, onChange, disabled = false, error }: DebitCreditInputProps) {
  const [activeField, setActiveField] = useState<'debit' | 'credit' | null>(null);

  const handleDebitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const debit = parseFloat(e.target.value) || 0;
    onChange({ debit, credit: 0 }); // Auto-clear credit when debit is entered
  };

  const handleCreditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const credit = parseFloat(e.target.value) || 0;
    onChange({ debit: 0, credit }); // Auto-clear debit when credit is entered
  };

  const isDebitActive = value.debit > 0 || activeField === 'debit';
  const isCreditActive = value.credit > 0 || activeField === 'credit';

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-2 gap-2">
        {/* Debit Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-sm font-medium text-gray-500">Dr</span>
          </div>
          <input
            type="number"
            step="0.001"
            min="0"
            value={value.debit || ''}
            onChange={handleDebitChange}
            onFocus={() => setActiveField('debit')}
            onBlur={() => setActiveField(null)}
            placeholder="0.000"
            disabled={disabled || isCreditActive}
            className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm text-right font-mono ${
              isDebitActive 
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                : error 
                  ? 'border-red-500' 
                  : 'border-gray-300'
            } ${(disabled || isCreditActive) ? 'bg-gray-50 cursor-not-allowed' : ''}`}
          />
        </div>

        {/* Credit Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-sm font-medium text-gray-500">Cr</span>
          </div>
          <input
            type="number"
            step="0.001"
            min="0"
            value={value.credit || ''}
            onChange={handleCreditChange}
            onFocus={() => setActiveField('credit')}
            onBlur={() => setActiveField(null)}
            placeholder="0.000"
            disabled={disabled || isDebitActive}
            className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm text-right font-mono ${
              isCreditActive 
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                : error 
                  ? 'border-red-500' 
                  : 'border-gray-300'
            } ${(disabled || isDebitActive) ? 'bg-gray-50 cursor-not-allowed' : ''}`}
          />
        </div>
      </div>

      {/* Validation Message */}
      {value.debit > 0 && value.credit > 0 && (
        <p className="text-xs text-red-500">Cannot have both debit and credit</p>
      )}
      {value.debit === 0 && value.credit === 0 && !error && (
        <p className="text-xs text-gray-400">Enter either debit or credit amount</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}