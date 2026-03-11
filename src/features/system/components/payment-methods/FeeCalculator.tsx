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
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Calculate Transaction Fee</h4>
      
      <div className="space-y-3">
        <div>
          <label htmlFor="amount" className="block text-xs text-gray-600 mb-1">
            Enter Amount
          </label>
          <div className="flex space-x-2">
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <button
              onClick={handleCalculate}
              disabled={isLoading || !amount}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Calculate
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-md p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">{result.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fee:</span>
              <span className="font-medium text-orange-600">{result.fee}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-800 font-medium">Total:</span>
              <span className="font-bold text-green-600">{result.total_with_fee}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeeCalculator;