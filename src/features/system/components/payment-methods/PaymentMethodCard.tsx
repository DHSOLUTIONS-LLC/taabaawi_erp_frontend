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
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-300 active:scale-[0.98]"
    >
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {method.icon ? (
              <img src={method.icon} alt={method.method_name} className="h-8 w-8 sm:h-10 sm:w-10 object-contain flex-shrink-0" />
            ) : (
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-gray-500 text-base sm:text-lg">💳</span>
              </div>
            )}
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              {method.method_name}
            </h3>
          </div>
          <span className={`px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full flex-shrink-0 ml-2 ${getStatusColor(method.is_active)}`}>
            {method.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Description */}
        {method.description && (
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">
            {method.description}
          </p>
        )}

        {/* Fee Information */}
        <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="text-gray-500">Fee Percentage:</span>
            <span className="font-semibold text-gray-900">{method.transaction_fee_percentage}%</span>
          </div>
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="text-gray-500">Fixed Fee:</span>
            <span className="font-semibold text-gray-900">{method.transaction_fee_fixed}</span>
          </div>
          <div className="flex justify-between items-center text-xs sm:text-sm pt-1 border-t border-gray-100">
            <span className="text-gray-500">Total Fee:</span>
            <span className="font-semibold text-blue-600">
              {method.transaction_fee_percentage}% + {method.transaction_fee_fixed}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {method.enabled_branches && method.enabled_branches.length > 0 && (
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                {method.enabled_branches.length} {method.enabled_branches.length === 1 ? 'Branch' : 'Branches'}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">
            Click to configure
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodCard;