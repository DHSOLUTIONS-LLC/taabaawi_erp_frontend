// src/features/purchase/components/ExchangeRatePopUp.tsx
import { useState, useEffect } from 'react';
import { useConvertCurrencyMutation } from '../../../services/purchaseApi';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ExchangeRatePopUpProps {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  onConfirm: (convertedAmount: number, exchangeRate: number) => void;
  onClose: () => void;
}

export default function ExchangeRatePopUp({ 
  fromCurrency, 
  toCurrency, 
  amount, 
  onConfirm, 
  onClose 
}: ExchangeRatePopUpProps) {
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [convertedAmount, setConvertedAmount] = useState<number>(amount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [convertCurrency] = useConvertCurrencyMutation();

  useEffect(() => {
    fetchExchangeRate();
  }, []);

  useEffect(() => {
    setConvertedAmount(amount * exchangeRate);
  }, [amount, exchangeRate]);


    const fetchExchangeRate = async () => {
    if (fromCurrency === toCurrency) {
      setExchangeRate(1);
      return;
    }

    setLoading(true);
    try {
      // Try live API first
      const response = await fetch(`https://api.exchangerate.host/convert?from=${fromCurrency}&to=${toCurrency}&amount=1`);
      const data = await response.json();
      
      if (data.info?.rate) {
        setExchangeRate(data.info.rate);
      } else {
        // Fallback to backend API
        const result = await convertCurrency({
          amount: 1,
          from_currency: fromCurrency,
          to_currency: toCurrency
        }).unwrap();
        setExchangeRate(result.data.exchange_rate);
      }
    } catch (err: any) {
      // Fallback to backend API
      try {
        const result = await convertCurrency({
          amount: 1,
          from_currency: fromCurrency,
          to_currency: toCurrency
        }).unwrap();
        setExchangeRate(result.data.exchange_rate);
      } catch (backendErr: any) {
        setError('Failed to fetch exchange rate');
      }
    } finally {
      setLoading(false);
    }
  };


  
  const handleConfirm = () => {
    onConfirm(convertedAmount, exchangeRate);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Confirm Exchange Rate</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : (
            <>
              {/* Original Amount */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Original Amount</p>
                <p className="text-xl font-bold text-gray-900">
                  {amount.toFixed(3)} {fromCurrency}
                </p>
              </div>

              {/* Exchange Rate */}
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-blue-600 mb-1">Exchange Rate</p>
                <p className="text-lg font-semibold text-blue-700">
                  1 {fromCurrency} = {exchangeRate.toFixed(6)} {toCurrency}
                </p>
              </div>

              {/* Converted Amount */}
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs text-green-600 mb-1">Converted Amount</p>
                <p className="text-2xl font-bold text-green-700">
                  {convertedAmount.toFixed(3)} {toCurrency}
                </p>
              </div>

              {/* Note */}
              <p className="text-xs text-gray-500">
                This exchange rate will be used for this transaction only.
              </p>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleConfirm}
              disabled={loading || !!error}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}