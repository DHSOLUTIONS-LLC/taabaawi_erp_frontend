import React, { useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout';
import PaymentMethodsList from '../components/payment-methods/PaymentMethodsList';
import PaymentMethodForm from '../components/payment-methods/PaymentMethodForm';
import FeeCalculator from '../components/payment-methods/FeeCalculator';
import type { PaymentMethod } from '../../../types/payment-method';

const PaymentMethodsPage: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'details' | 'form'>('list');

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setMobileView('details');
    if (window.innerWidth < 1024) {
      // On mobile/tablet, switch to details view
      setMobileView('details');
    }
  };

  const handleEditClick = () => {
    setShowForm(true);
    setMobileView('form');
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedMethod(null);
    setMobileView('list');
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedMethod(null);
    setMobileView('list');
  };

  const handleBackToList = () => {
    setMobileView('list');
    setSelectedMethod(null);
    setShowForm(false);
  };

  const handleBackToDetails = () => {
    setMobileView('details');
    setShowForm(false);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto px-2 py-2">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            Configure payment methods, fees, and branch availability
          </p>
        </div>

        {/* Mobile Navigation Header */}
        {(mobileView === 'details' || mobileView === 'form') && (
          <div className="lg:hidden mb-4 flex items-center gap-3">
            <button
              onClick={mobileView === 'form' ? handleBackToDetails : handleBackToList}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back</span>
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {mobileView === 'form' ? 'Edit Payment Method' : selectedMethod?.method_name}
            </h2>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - List - Hidden on mobile when viewing details/form */}
          <div className={`
            ${mobileView === 'list' ? 'block' : 'hidden lg:block'}
            lg:col-span-2
          `}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 sm:p-5 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                    All Payment Methods
                  </h2>
                  <div className="text-xs sm:text-sm text-gray-500">
                    Click on any method to view details
                  </div>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <PaymentMethodsList onSelectMethod={handleSelectMethod} />
              </div>
            </div>
          </div>

          {/* Right Column - Details/Form - Visible on mobile when selected */}
          <div className={`
            ${mobileView === 'details' || mobileView === 'form' ? 'block' : 'hidden lg:block'}
            lg:col-span-1
          `}>
            {showForm && selectedMethod ? (
              // Edit Form View
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 sm:p-5 border-b border-gray-200">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-800">Edit Payment Method</h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Update method details and fee structure
                  </p>
                </div>
                <div className="p-4 sm:p-5">
                  <PaymentMethodForm
                    method={selectedMethod}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                  />
                </div>
              </div>
            ) : selectedMethod ? (
              // Details View
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 sm:p-5 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                        {selectedMethod.method_name}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {selectedMethod.description || 'No description provided'}
                      </p>
                    </div>
                    {selectedMethod.is_active && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                  {/* Fee Information */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700">Transaction Fees</h3>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Percentage Fee</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedMethod.transaction_fee_percentage}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Fixed Fee</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedMethod.transaction_fee_fixed}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-700">Total Fee</span>
                          <span className="text-sm font-bold text-blue-600">
                            {selectedMethod.transaction_fee_percentage}% + {selectedMethod.transaction_fee_fixed}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fee Calculator */}
                  <FeeCalculator method={selectedMethod} />

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      onClick={handleEditClick}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                    >
                      Edit Method
                    </button>
                    <button
                      onClick={handleBackToList}
                      className="lg:hidden flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                    >
                      Back to List
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Empty State
              <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M6 14h12M6 18h6M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">Select a payment method</p>
                <p className="text-sm text-gray-400 mt-1">Click on any method to view details and configure fees</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentMethodsPage;