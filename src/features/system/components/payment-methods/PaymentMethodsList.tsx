import React from 'react';
import { useGetPaymentMethodsQuery } from '../../../../services/paymentMethodApi';
import PaymentMethodCard from './PaymentMethodCard';
import type { PaymentMethod } from '../../../../types/payment-method';

interface Props {
  onSelectMethod?: (method: PaymentMethod) => void;
  showActiveOnly?: boolean;
}

const PaymentMethodsList: React.FC<Props> = ({ onSelectMethod, showActiveOnly = false }) => {
  const { data, isLoading, error } = useGetPaymentMethodsQuery(
    showActiveOnly ? { is_active: true } : undefined
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Failed to load payment methods
      </div>
    );
  }

  const methods = data?.data || [];

  if (methods.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No payment methods found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {methods.map((method) => (
        <PaymentMethodCard
          key={method.id}
          method={method}
          onClick={() => onSelectMethod?.(method)}
        />
      ))}
    </div>
  );
};

export default PaymentMethodsList;