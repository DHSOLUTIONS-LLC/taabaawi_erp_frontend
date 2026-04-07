// src/features/pos/components/PaymentModal.tsx
import { useState } from 'react';
import { useCreateSaleMutation } from '../../../services/posApi';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  sku: string;
  product_id?: number;
  variant_id?: number;
  discount_percentage?: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  subtotal: number;
  discount: number;
  couponDiscount: number;
  couponCode: string;
  isGift: boolean;
  isEmployeePurchase: boolean;
  registerId?: number;
  branchId: number;
  salesStaffId?: number;
  customerId?: number;
  onSuccess: (sale: any) => void;
}

type PaymentMethod = 'Cash' | 'Card' | 'K-Net';

export default function PaymentModal({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  discount,
  couponDiscount,
  couponCode,
  isGift,
  isEmployeePurchase,
  registerId,
  branchId,
  salesStaffId,
  customerId,
  onSuccess,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [cashReceived, setCashReceived] = useState('');
  const [cardReference, setCardReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const total = subtotal - discount - couponDiscount;
  const change = paymentMethod === 'Cash' && cashReceived ? parseFloat(cashReceived) - total : 0;

  const [createSale, { isLoading }] = useCreateSaleMutation();

  if (!isOpen) return null;

  const handleProcessPayment = async () => {
    setError('');

    if (paymentMethod === 'Cash') {
      if (!cashReceived || parseFloat(cashReceived) < total) {
        setError('Cash received must be at least the total amount');
        return;
      }
    }

    try {
      const items = cartItems.map(item => ({
        product_id: item.product_id || parseInt(item.id),
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price: item.price,
        discount_percentage: item.discount_percentage || 0,
      }));

      const payload: any = {
        branch_id: branchId,
        cash_register_id: registerId,
        sales_staff_id: salesStaffId,
        customer_id: customerId,
        payment_method: paymentMethod,
        is_gift: isGift,
        is_employee_purchase: isEmployeePurchase,
        notes,
        items,
      };

      if (couponCode) payload.coupon_code = couponCode;
      if (paymentMethod === 'Cash') {
        payload.cash_received = parseFloat(cashReceived) || 0;
      }
      if (paymentMethod === 'Card' || paymentMethod === 'K-Net') {
        payload.card_reference = cardReference;
      }

      const result = await createSale(payload).unwrap();
      onSuccess(result.data);
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to process payment. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#1773CF] px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Payment</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Total Amount */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Total Amount</p>
            <p className="text-2xl font-bold text-[#1773CF]">KD {total.toFixed(3)}</p>
            <p className="text-xs text-gray-400 mt-1">{cartItems.length} item(s)</p>
          </div>

          {/* Payment Method */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {(['Cash', 'Card', 'K-Net'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2.5 rounded-lg border-2 transition-all text-sm font-medium ${
                    paymentMethod === method
                      ? 'border-[#1773CF] bg-blue-50 text-[#1773CF]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Cash Amount */}
          {paymentMethod === 'Cash' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Cash Received (KD)</label>
              <input
                type="number"
                step="0.001"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.000"
                autoFocus
              />
              {cashReceived && parseFloat(cashReceived) >= total && (
                <div className="mt-2 text-sm text-green-600">
                  Change: KD {change.toFixed(3)}
                </div>
              )}
            </div>
          )}

          {/* Card Reference */}
          {(paymentMethod === 'Card' || paymentMethod === 'K-Net') && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Card Reference</label>
              <input
                type="text"
                value={cardReference}
                onChange={(e) => setCardReference(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Transaction ID"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add notes..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleProcessPayment}
              disabled={isLoading || (paymentMethod === 'Cash' && (!cashReceived || parseFloat(cashReceived) < total))}
              className="flex-1 py-2.5 bg-[#1773CF] hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : `Pay KD ${total.toFixed(3)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}