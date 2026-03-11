// src/features/purchase/components/CurrencyConverter.tsx
import { useState } from 'react';
import { useConvertCurrencyMutation } from '../../../../services/purchaseApi';
import { XMarkIcon } from '@heroicons/react/24/outline';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

interface CurrencyConverterProps {
  currencies: any[];
  onClose: () => void;
}

export default function CurrencyConverter({ currencies, onClose }: CurrencyConverterProps) {
  const [amount, setAmount] = useState<string>('1');
  const [fromCurrency, setFromCurrency] = useState<string>('KWD');
  const [toCurrency, setToCurrency] = useState<string>('USD');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [convertCurrency] = useConvertCurrencyMutation();

  const activeCurrencies = currencies.filter((c: any) => c.is_active);

    const convertWithLiveAPI = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (fromCurrency === toCurrency) {
      setError('Please select different currencies');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Use live API directly
      const response = await fetch(`https://api.exchangerate.host/convert?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`);
      const data = await response.json();
      
      if (data.result) {
        setResult({
          converted_amount: data.result,
          from_currency: fromCurrency,
          to_currency: toCurrency,
          exchange_rate: data.info?.rate || 0
        });
      } else {
        throw new Error('Conversion failed');
      }
    } catch (err: any) {
      // Fallback to backend API
      try {
        const result = await convertCurrency({
          amount: parseFloat(amount),
          from_currency: fromCurrency,
          to_currency: toCurrency
        }).unwrap();
        setResult(result.data);
      } catch (backendErr: any) {
        setError(backendErr?.data?.message || 'Conversion failed');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleConvert = convertWithLiveAPI;

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-lg">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Currency Converter</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Amount</label>
            <input
              type="number"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
            />
          </div>

          {/* Currency Selection */}
          <div className="grid grid-cols-5 gap-2 items-center">
            {/* From Currency */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-2">From</label>
              <div className="relative">
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500"
                >
                  {activeCurrencies.map((c: any) => (
                    <option key={c.id} value={c.currency_code}>
                      {c.currency_code} - {c.currency_name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="col-span-1 flex justify-center mt-6">
              <button
                onClick={handleSwap}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                type="button"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
            </div>

            {/* To Currency */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-2">To</label>
              <div className="relative">
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500"
                >
                  {activeCurrencies.map((c: any) => (
                    <option key={c.id} value={c.currency_code}>
                      {c.currency_code} - {c.currency_name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Converted Amount:</p>
              <p className="text-2xl font-bold text-blue-600">
                {result.converted_amount.toFixed(3)} {result.to_currency}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Exchange Rate: 1 {result.from_currency} = {result.exchange_rate.toFixed(6)} {result.to_currency}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleConvert}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Converting...' : 'Convert'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}