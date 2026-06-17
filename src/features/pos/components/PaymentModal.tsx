// src/features/pos/components/PaymentModal.tsx
import { useState, useEffect } from "react";
import { useCreateSaleMutation } from "../../../services/posApi";

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
  isDPPR: boolean;
  registerId?: number;
  branchId: number;
  salesStaffId?: number;
  customerId?: number;
  customerDetails?: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  onSuccess: (sale: any) => void;
}

type PaymentMethod = string;

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Card", "K-Net"];

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
  isDPPR, // ADDED - destructured from props
  registerId,
  branchId,
  salesStaffId,
  customerId,
  customerDetails, // ADDED - destructured from props
  onSuccess,
}: PaymentModalProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    ...DEFAULT_PAYMENT_METHODS,
  ]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [cardReference, setCardReference] = useState("");
  const [otherPaymentAmount, setOtherPaymentAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const total = subtotal - discount - couponDiscount;

  // For Cash: calculate change
  const change =
    paymentMethod === "Cash" && cashReceived
      ? parseFloat(cashReceived) - total
      : 0;

  const [createSale, { isLoading }] = useCreateSaleMutation();

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPaymentMethod("Cash");
      setCashReceived("");
      setCardReference("");
      setOtherPaymentAmount("");
      setNotes("");
      setError("");
      setShowAddPaymentMethod(false);
      setNewPaymentMethod("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProcessPayment = async () => {
    setError("");

    // Validate Cash payment
    if (paymentMethod === "Cash") {
      if (!cashReceived || parseFloat(cashReceived) < total) {
        setError("Cash received must be at least the total amount");
        return;
      }
    }

    // Validate Card/K-Net payment
    else if (paymentMethod === "Card" || paymentMethod === "K-Net") {
      if (!cardReference.trim()) {
        setError("Please enter card reference / transaction ID");
        return;
      }
    }

    // Validate Other payment methods (Bank Transfer, Wallet, etc.)
    else {
      if (!otherPaymentAmount || parseFloat(otherPaymentAmount) < total) {
        setError(`Payment amount must be at least KWD ${total.toFixed(3)}`);
        return;
      }
    }

    try {
      const items = cartItems.map((item) => ({
        product_id: item.product_id || parseInt(item.id),
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        unit_price: item.price,
        discount_percentage: item.discount_percentage || 0,
      }));

      // Build the payload
      const payload: any = {
        branch_id: branchId,
        cash_register_id: registerId,
        sales_staff_id: salesStaffId || null,
        customer_id: customerId || null,
        is_dppr: isDPPR, // Now works - isDPPR is defined
        is_gift: isGift,
        is_employee_purchase: isEmployeePurchase,
        payment_method: paymentMethod,
        notes: notes || null,
        items,
      };

      // Add customer details ONLY if DPPR is false AND customer details are provided
      if (!isDPPR && customerDetails) {
        // Now works - both are defined
        payload.customer_details = {
          name: customerDetails.name || null,
          phone: customerDetails.phone || null,
          email: customerDetails.email || null,
          address: customerDetails.address || null,
        };
      }

      // Add coupon code if applied
      if (couponCode) {
        payload.coupon_code = couponCode;
      }

      // Add payment-specific fields
      if (paymentMethod === "Cash") {
        payload.cash_received = parseFloat(cashReceived) || 0;
        payload.change_due = change;
        payload.card_reference = null;
        payload.amount_paid = null;
      } else if (paymentMethod === "Card" || paymentMethod === "K-Net") {
        payload.cash_received = null;
        payload.change_due = null;
        payload.card_reference = cardReference;
        payload.amount_paid = null;
      } else {
        // Other payment methods (Bank Transfer, Wallet, etc.)
        payload.cash_received = null;
        payload.change_due = null;
        payload.card_reference = null;
        payload.amount_paid = parseFloat(otherPaymentAmount) || 0;
      }

      console.log("Final Payment Payload:", JSON.stringify(payload, null, 2));

      const result = await createSale(payload).unwrap();
      onSuccess(result.data);
    } catch (err: any) {
      setError(
        err?.data?.message || "Failed to process payment. Please try again.",
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1773CF] px-5 py-4 sticky top-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Payment</h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Total Amount */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Total Amount</p>
            <p className="text-2xl font-bold text-[#1773CF]">
              KWD {total.toFixed(3)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {cartItems.length} item(s)
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </p>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method}
                  onClick={() => {
                    setPaymentMethod(method);
                    setShowAddPaymentMethod(false);
                  }}
                  className={`py-2.5 rounded-lg border-2 transition-all text-sm font-medium ${
                    paymentMethod === method
                      ? "border-[#1773CF] bg-blue-50 text-[#1773CF]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {method}
                </button>
              ))}
              <button
                onClick={() => setShowAddPaymentMethod(!showAddPaymentMethod)}
                className="py-2.5 rounded-lg border-2 border-dashed border-blue-400 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-all"
              >
                + Add New
              </button>
            </div>

            {/* Add New Payment Method Input */}
            {showAddPaymentMethod && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value)}
                  placeholder="Enter new payment method (e.g., 'Bank Transfer', 'Wallet')"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (newPaymentMethod.trim()) {
                      setPaymentMethods([
                        ...paymentMethods,
                        newPaymentMethod.trim(),
                      ]);
                      setPaymentMethod(newPaymentMethod.trim());
                      setShowAddPaymentMethod(false);
                      setNewPaymentMethod("");
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddPaymentMethod(false);
                    setNewPaymentMethod("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Cash Amount - Only for Cash */}
          {paymentMethod === "Cash" && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Cash Received (KD)
              </label>
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
                  Change: KWD {change.toFixed(3)}
                </div>
              )}
            </div>
          )}

          {/* Card Reference - Only for Card or K-Net */}
          {(paymentMethod === "Card" || paymentMethod === "K-Net") && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Card Reference / Transaction ID
              </label>
              <input
                type="text"
                value={cardReference}
                onChange={(e) => setCardReference(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Transaction ID"
              />
            </div>
          )}

          {/* Payment Amount - For Other Payment Methods */}
          {paymentMethod !== "Cash" &&
            paymentMethod !== "Card" &&
            paymentMethod !== "K-Net" && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Payment Amount (KD)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={otherPaymentAmount}
                  onChange={(e) => setOtherPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Minimum: ${total.toFixed(3)}`}
                  autoFocus
                />
                {otherPaymentAmount &&
                  parseFloat(otherPaymentAmount) >= total && (
                    <div className="mt-2 text-sm text-green-600">
                      Amount received: KWD{" "}
                      {parseFloat(otherPaymentAmount).toFixed(3)}
                    </div>
                  )}
              </div>
            )}

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add notes..."
            />
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>KWD {subtotal.toFixed(3)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Item Discount</span>
                <span>-KWD {discount.toFixed(3)}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Coupon Discount</span>
                <span>-KWD {couponDiscount.toFixed(3)}</span>
              </div>
            )}
            {isEmployeePurchase && (
              <div className="flex justify-between text-purple-600">
                <span>Employee Discount (30%)</span>
                <span>
                  -KWD{" "}
                  {((subtotal - discount - couponDiscount) * 0.3).toFixed(3)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200 font-bold">
              <span>Total</span>
              <span className="text-[#1773CF]">KWD {total.toFixed(3)}</span>
            </div>
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
              disabled={
                isLoading ||
                (paymentMethod === "Cash" &&
                  (!cashReceived || parseFloat(cashReceived) < total)) ||
                (paymentMethod !== "Cash" &&
                  paymentMethod !== "Card" &&
                  paymentMethod !== "K-Net" &&
                  (!otherPaymentAmount ||
                    parseFloat(otherPaymentAmount) < total))
              }
              className="flex-1 py-2.5 bg-[#1773CF] hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                `Pay KWD ${total.toFixed(3)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
