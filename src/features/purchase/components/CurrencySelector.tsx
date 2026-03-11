// src/features/purchase/components/CurrencySelector.tsx
import { useState, useEffect } from 'react';
import { useGetCurrenciesQuery } from '../../../services/purchaseApi';
import dropdown_arrow_icon from '../../../assets/icons/dropdown_arrow_icon.svg';

interface CurrencySelectorProps {
  value: string;
  onChange: (currencyCode: string, exchangeRate: number) => void;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  showExchangeRate?: boolean;
}

export default function CurrencySelector({
  value,
  onChange,
  label = 'Currency',
  required = false,
  error,
  disabled = false,
  showExchangeRate = false,
}: CurrencySelectorProps) {
  const [customRate, setCustomRate] = useState<string>('');

  // ✅ Send 1 (number) not true (boolean) — Laravel WHERE is_active = 1
  const { data, isLoading } = useGetCurrenciesQuery({ is_active: 1 } as any);
  const currencies = data?.data || [];

  const baseCurrency =
    currencies.find((c: any) => c.is_base_currency) ||
    currencies.find((c: any) => c.currency_code === 'KWD');

  const selectedCurrency = currencies.find((c: any) => c.currency_code === value) || null;

  // Sync customRate whenever selected currency changes
  useEffect(() => {
    if (selectedCurrency) {
      setCustomRate(String(selectedCurrency.exchange_rate));
    }
  }, [value, currencies.length]);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const currency = currencies.find((c: any) => c.currency_code === code);
    if (currency) {
      const rate = Number(currency.exchange_rate);
      setCustomRate(String(rate));
      onChange(code, rate);
    }
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = e.target.value;
    setCustomRate(rate);
    if (selectedCurrency && rate) {
      onChange(selectedCurrency.currency_code, parseFloat(rate) || 0);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-600">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="h-12 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-600">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* ── Currency Dropdown ── */}
        <div className="relative">
          <select
            value={value || ''}
            onChange={handleCurrencyChange}
            disabled={disabled || currencies.length === 0}
            className={`w-full px-4 py-3 border rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 transition-colors ${
              error ? 'border-red-500' : 'border-gray-300'
            } ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''}`}
          >
            <option value="">Select Currency</option>
            {currencies.map((currency: any) => (
              <option key={currency.id} value={currency.currency_code}>
                {currency.currency_code} — {currency.currency_name} ({currency.currency_symbol})
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
          </div>
        </div>

        {/* ── Exchange Rate Input (non-base currencies) ── */}
        {showExchangeRate && selectedCurrency && !selectedCurrency.is_base_currency ? (
          <div>
            <input
              type="number"
              step="0.000001"
              min="0"
              value={customRate}
              onChange={handleRateChange}
              placeholder="Exchange Rate"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">
              1 {baseCurrency?.currency_code || 'KWD'} = {customRate || '?'} {value}
            </p>
          </div>
        ) : showExchangeRate && selectedCurrency?.is_base_currency ? (
          <div className="flex items-center px-4 py-3 bg-purple-50 border border-purple-200 rounded-lg">
            <span className="text-sm text-purple-700 font-medium">Base Currency</span>
          </div>
        ) : null}
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}