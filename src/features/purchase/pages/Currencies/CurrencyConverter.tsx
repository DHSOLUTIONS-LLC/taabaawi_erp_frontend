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
  console.log("Active currencies:", activeCurrencies);

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
  <div className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4 bg-black/50 overflow-y-auto">
    <div className="bg-white rounded-2xl w-full max-w-lg shadow-lg my-auto mx-3 sm:mx-4">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Currency Converter</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">Amount</label>
          <input
            type="number"
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            placeholder="Enter amount"
          />
        </div>

        {/* Currency Selection - Responsive Grid */}
        <div className="flex flex-col sm:grid sm:grid-cols-5 gap-3 sm:gap-2 items-stretch sm:items-center">
          {/* From Currency */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">From</label>
            <div className="relative">
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-8 sm:pr-10 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              >
                {activeCurrencies.map((c: any) => (
                  <option key={c.id} value={c.currency_code}>
                    {c.currency_code} - {c.currency_name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center sm:col-span-1 sm:mt-6">
            <button
              onClick={handleSwap}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors w-10 h-10 flex items-center justify-center"
              type="button"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          </div>

          {/* To Currency */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">To</label>
            <div className="relative">
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-8 sm:pr-10 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              >
                {activeCurrencies.map((c: any) => (
                  <option key={c.id} value={c.currency_code}>
                    {c.currency_code} - {c.currency_name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs sm:text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Converted Amount:</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600 break-words">
              {result.converted_amount.toFixed(3)} {result.to_currency}
            </p>
            <p className="text-xs text-gray-500 mt-2 break-words">
              Exchange Rate: 1 {result.from_currency} = {result.exchange_rate.toFixed(6)} {result.to_currency}
            </p>
          </div>
        )}

        {/* Action Buttons - Responsive */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 sm:pt-4">
          <button
            onClick={onClose}
            className="sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            Close
          </button>
          <button
            onClick={handleConvert}
            disabled={loading}
            className="sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
          >
            {loading ? 'Converting...' : 'Convert'}
          </button>
        </div>
      </div>
    </div>
  </div>
);
}