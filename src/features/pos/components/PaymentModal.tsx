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

type PaymentMethod = 'Cash' | 'Card' | 'K-Net' | 'Mobile Payment' | 'Mixed';

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
  const [cardAmount, setCardAmount] = useState('');
  const [cardReference, setCardReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const total = subtotal - discount - couponDiscount;
  const change = paymentMethod === 'Cash' && cashReceived ? parseFloat(cashReceived) - total : 0;

  const [createSale, { isLoading }] = useCreateSaleMutation();

  if (!isOpen) return null;

  const handleQuickCash = (amount: number) => {
    setCashReceived(amount.toFixed(3));
  };

  const getQuickAmounts = () => {
    const rounded = Math.ceil(total);
    return [rounded, rounded + 5, rounded + 10, rounded + 20].filter(a => a >= total);
  };

  const handleProcessPayment = async () => {
    setError('');

    if (paymentMethod === 'Cash') {
      if (!cashReceived || parseFloat(cashReceived) < total) {
        setError('Cash received must be at least the total amount');
        return;
      }
    }

    if (paymentMethod === 'Mixed') {
      if (!cashReceived && !cardAmount) {
        setError('Please enter cash and/or card amounts');
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
      if (paymentMethod === 'Cash' || paymentMethod === 'Mixed') {
        payload.cash_received = parseFloat(cashReceived) || 0;
      }
      if (paymentMethod === 'Card' || paymentMethod === 'Mixed') {
        payload.card_amount = parseFloat(cardAmount) || 0;
        payload.card_reference = cardReference;
      }

      const result = await createSale(payload).unwrap();
      onSuccess(result.data);
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to process payment. Please try again.');
    }
  };

  const paymentMethods: { key: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    {
      key: 'Cash',
      label: 'Cash',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      key: 'Card',
      label: 'Card',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      key: 'K-Net',
      label: 'K-Net',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      key: 'Mobile Payment',
      label: 'Mobile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: 'Mixed',
      label: 'Mixed',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed inset-0  flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#1773CF] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Process Payment</h2>
            <p className="text-blue-100 text-sm mt-0.5">{cartItems.length} item(s) in cart</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>KD {subtotal.toFixed(3)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount</span>
                <span>-KD {discount.toFixed(3)}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Coupon ({couponCode})</span>
                <span>-KD {couponDiscount.toFixed(3)}</span>
              </div>
            )}
            {isEmployeePurchase && (
              <div className="flex justify-between text-sm text-purple-600">
                <span>Employee Discount (20%)</span>
                <span>-KD {((subtotal - discount) * 0.2).toFixed(3)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total Due</span>
              <span className="text-[#1773CF]">KD {total.toFixed(3)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Payment Method</p>
            <div className="grid grid-cols-5 gap-2">
              {paymentMethods.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setPaymentMethod(key)}
                  className={`flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all text-xs font-medium gap-1.5 ${paymentMethod === key
                      ? 'border-[#1773CF] bg-blue-50 text-[#1773CF]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Cash Fields */}
          {(paymentMethod === 'Cash' || paymentMethod === 'Mixed') && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Cash Received (KD)</label>
                <input
                  type="number"
                  step="0.001"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                  placeholder="0.000"
                />
                {/* Quick amounts */}
                <div className="flex gap-2 mt-2">
                  {getQuickAmounts().map(amount => (
                    <button
                      key={amount}
                      onClick={() => handleQuickCash(amount)}
                      className="flex-1 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 font-medium"
                    >
                      KD {amount}
                    </button>
                  ))}
                </div>
              </div>
              {paymentMethod === 'Cash' && parseFloat(cashReceived) >= total && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex justify-between">
                  <span className="text-green-700 font-medium">Change</span>
                  <span className="text-green-700 font-bold">KD {change.toFixed(3)}</span>
                </div>
              )}
            </div>
          )}

          {/* Card Fields */}
          {(paymentMethod === 'Card' || paymentMethod === 'K-Net' || paymentMethod === 'Mixed') && (
            <div className="space-y-3">
              {paymentMethod === 'Mixed' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Card Amount (KWD)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.000"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Card Reference (Optional)</label>
                <input
                  type="text"
                  value={cardReference}
                  onChange={(e) => setCardReference(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Transaction reference number"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add order notes..."
            />
          </div>

          {/* Flags */}
          <div className="flex gap-3">
            {isGift && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">
                🎁 Gift Receipt
              </span>
            )}
            {isEmployeePurchase && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                👤 Employee Purchase
              </span>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleProcessPayment}
              disabled={isLoading}
              className="flex-1 py-3 bg-[#1773CF] hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : `Charge KD ${total.toFixed(3)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}