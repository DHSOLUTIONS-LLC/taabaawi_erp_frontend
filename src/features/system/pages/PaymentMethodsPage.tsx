import React, { useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout';
import PaymentMethodsList from '../components/payment-methods/PaymentMethodsList';
import PaymentMethodForm from '../components/payment-methods/PaymentMethodForm';
import FeeCalculator from '../components/payment-methods/FeeCalculator';
import type { PaymentMethod } from '../../../types/payment-method';

const PaymentMethodsPage: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedMethod(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedMethod(null);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-600 mt-2">
            Configure payment methods, fees, and branch availability
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">All Payment Methods</h2>
              </div>
              <div className="p-4">
                <PaymentMethodsList onSelectMethod={handleSelectMethod} />
              </div>
            </div>
          </div>

          {/* Right Column - Details/Form */}
          <div className="lg:col-span-1">
            {showForm && selectedMethod ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">Edit Method</h2>
                </div>
                <div className="p-4">
                  <PaymentMethodForm
                    method={selectedMethod}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                  />
                </div>
              </div>
            ) : selectedMethod ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">{selectedMethod.method_name}</h2>
                </div>
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">{selectedMethod.description}</p>
                    <div className="flex justify-between text-sm">
                      <span>Fee: {selectedMethod.transaction_fee_percentage}% + {selectedMethod.transaction_fee_fixed}</span>
                    </div>
                  </div>
                  
                  {/* Fee Calculator */}
                  <FeeCalculator method={selectedMethod} />
                  
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Edit Method
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                Select a payment method to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentMethodsPage;