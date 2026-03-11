import React from 'react';
import type { PaymentMethod } from '../../../../types/payment-method';

interface Props {
  method: PaymentMethod;
  onClick?: () => void;
}

const PaymentMethodCard: React.FC<Props> = ({ method, onClick }) => {
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {method.icon ? (
            <img src={method.icon} alt={method.method_name} className="h-10 w-10 object-contain" />
          ) : (
            <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-500 text-lg">💳</span>
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900">{method.method_name}</h3>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(method.is_active)}`}>
          {method.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {method.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{method.description}</p>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Fee Percentage:</span>
          <span className="font-medium text-gray-900">{method.transaction_fee_percentage}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Fixed Fee:</span>
          <span className="font-medium text-gray-900">{method.transaction_fee_fixed}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        
        {method.enabled_branches && method.enabled_branches.length > 0 && (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {method.enabled_branches.length} Branches
          </span>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodCard;