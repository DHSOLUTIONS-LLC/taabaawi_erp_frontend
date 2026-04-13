import React, { useState } from 'react';
import { useCalculateFeeMutation } from '../../../../services/paymentMethodApi';
import type { PaymentMethod } from '../../../../types/payment-method';

interface Props {
  method: PaymentMethod;
}

const FeeCalculator: React.FC<Props> = ({ method }) => {
  const [amount, setAmount] = useState<string>('');
  const [calculateFee, { data, isLoading }] = useCalculateFeeMutation();

  const handleCalculate = async () => {
    if (!amount || isNaN(Number(amount))) return;
    await calculateFee({ id: method.id, amount: Number(amount) });
  };

  const result = data?.data;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <h4 className="text-sm font-semibold text-gray-900">Calculate Transaction Fee</h4>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label htmlFor="amount" className="block text-xs font-medium text-gray-600 mb-1.5">
            Enter Amount (KWD)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">KWD</span>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleCalculate}
              disabled={isLoading || !amount}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Calculating...
                </div>
              ) : (
                'Calculate'
              )}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg p-3 sm:p-4 space-y-2 shadow-sm border border-gray-200 animate-fadeIn">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Transaction Amount:</span>
              <span className="font-semibold text-gray-900">{result.amount}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Fee ({method.transaction_fee_percentage}% + {method.transaction_fee_fixed}):</span>
              <span className="font-semibold text-orange-600">{result.fee}</span>
            </div>
            <div className="flex justify-between items-center pt-2 mt-1 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-800">Total Amount:</span>
              <span className="text-base font-bold text-green-600">{result.total_with_fee}</span>
            </div>
          </div>
        )}

        {/* Fee breakdown hint */}
        <div className="text-xs text-gray-400 text-center pt-1">
          Fee = {method.transaction_fee_percentage}% of amount + {method.transaction_fee_fixed}
        </div>
      </div>
    </div>
  );
};

export default FeeCalculator;