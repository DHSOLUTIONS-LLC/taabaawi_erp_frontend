// src/features/purchase/pages/SupplierPayments/CreatePaymentModal.tsx
import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCreateSupplierPaymentMutation } from '../../../../services/purchaseApi';
import type { PurchaseOrder } from '../../../../services/purchaseApi';

interface CreatePaymentModalProps {
  po: PurchaseOrder;
  onClose: () => void;
  onSuccess: () => void;
}

const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'Cheque',
  'Credit Card',
  'Online Payment',
] as const;

export default function CreatePaymentModal({ po, onClose, onSuccess }: CreatePaymentModalProps) {
  const outstanding = po.outstanding_amount ?? po.total_amount - (po.total_paid ?? 0);

  const [formData, setFormData] = useState({
    amount: outstanding > 0 ? outstanding.toFixed(3) : '',
    payment_method: 'Bank Transfer' as typeof PAYMENT_METHODS[number],
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [createPayment, { isLoading }] = useCreateSupplierPaymentMutation();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    const amt = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount';
    if (amt > outstanding + 0.001) errs.amount = `Amount cannot exceed outstanding KWD ${outstanding.toFixed(3)}`;
    if (!formData.payment_date) errs.payment_date = 'Payment date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await createPayment({
        purchase_order_id: po.id,
        supplier_id: po.supplier_id,
        amount: parseFloat(formData.amount),
        currency: po.currency,
        exchange_rate: po.exchange_rate,
        payment_method: formData.payment_method,
        payment_date: formData.payment_date,
        reference_number: formData.reference_number || null,
        notes: formData.notes || null,
      }).unwrap();
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to record payment');
    }
  };

  const num = (v: any) => (typeof v === 'number' ? v : parseFloat(v) || 0);

return (
  <div className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4 bg-black/50 overflow-y-auto">
    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl my-auto mx-3 sm:mx-4">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 break-words">Record Payment</h2>
          <p className="text-xs text-gray-500 mt-0.5 break-words">{po.po_number} — {po.supplier?.supplier_name}</p>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Payment Summary - Responsive grid */}
      <div className="px-4 sm:px-6 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Total Amount</p>
          <p className="text-sm font-bold text-gray-900 break-words">
            {po.currency} {num(po.total_amount).toFixed(3)}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Paid So Far</p>
          <p className="text-sm font-bold text-green-700 break-words">
            {po.currency} {num(po.total_paid).toFixed(3)}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Outstanding</p>
          <p className="text-sm font-bold text-orange-700 break-words">
            {po.currency} {outstanding.toFixed(3)}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Payment Amount ({po.currency}) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
              {po.currency}
            </span>
            <input
              type="number"
              name="amount"
              step="0.001"
              min="0.001"
              max={outstanding}
              value={formData.amount}
              onChange={handleChange}
              className={`w-full pl-14 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-right font-mono text-sm sm:text-base ${
                errors.amount ? 'border-red-400' : 'border-gray-300'
              }`}
              placeholder="0.000"
            />
          </div>
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          {outstanding > 0 && (
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, amount: outstanding.toFixed(3) }))}
              className="mt-1.5 text-xs text-blue-600 hover:underline"
            >
              Pay full outstanding ({po.currency} {outstanding.toFixed(3)})
            </button>
          )}
        </div>

        {/* Payment Method - Responsive grid */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Payment Method <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setFormData((p) => ({ ...p, payment_method: method }))}
                className={`px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
                  formData.payment_method === method
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Payment Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="payment_date"
            value={formData.payment_date}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
            className={`w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
              errors.payment_date ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {errors.payment_date && (
            <p className="text-xs text-red-500 mt-1">{errors.payment_date}</p>
          )}
        </div>

        {/* Reference Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Reference / Cheque Number
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <input
            type="text"
            name="reference_number"
            value={formData.reference_number}
            onChange={handleChange}
            placeholder="e.g. TXN-123456"
            className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={2}
            placeholder="Any additional notes..."
            className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          />
        </div>

        {/* Footer - Responsive buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto sm:flex-1 py-2.5 sm:py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto sm:flex-1 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {isLoading && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {isLoading ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </div>
  </div>
);
}