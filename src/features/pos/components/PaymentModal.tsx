// src/features/pos/components/PaymentModal.tsx
import { useState, useEffect } from "react";
import { useCreateSaleMutation } from "../../../services/posApi";
import { useGetActivePaymentMethodsQuery } from "../../../services/paymentMethodApi";
import dropdown_arrow_icon from "../../../assets/icons/dropdown_arrow_icon.svg";

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
  employeeDiscountPercent?: number; // ← ADD THIS - the percentage from sidebar
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
  employeeDiscountPercent = 0, // ← ADD THIS with default 0
  isDPPR,
  registerId,
  branchId,
  salesStaffId,
  customerId,
  customerDetails,
  onSuccess,
}: PaymentModalProps) {
  // Fetch active payment methods from API
  const { data: paymentMethodsData, isLoading: isLoadingPaymentMethods } =
    useGetActivePaymentMethodsQuery();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [cashReceived, setCashReceived] = useState("");
  const [cardReference, setCardReference] = useState("");
  const [otherPaymentAmount, setOtherPaymentAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  // Calculate employee discount based on the percentage
  const employeeDiscount = isEmployeePurchase
    ? (subtotal - discount) * (employeeDiscountPercent / 100)
    : 0;

  const total = subtotal - discount - couponDiscount - employeeDiscount;

  // For Cash: calculate change
  const change =
    paymentMethod === "Cash" && cashReceived
      ? parseFloat(cashReceived) - total
      : 0;

  const [createSale, { isLoading }] = useCreateSaleMutation();

  // Set payment methods from API response
  useEffect(() => {
    if (paymentMethodsData?.data) {
      const methods = paymentMethodsData.data.map(
        (method: any) => method.method_name
      );
      setPaymentMethods(methods);

      if (methods.length > 0) {
        setPaymentMethod(methods[0]);
      }
    }
  }, [paymentMethodsData]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPaymentMethod("Cash");
      setCashReceived("");
      setCardReference("");
      setOtherPaymentAmount("");
      setNotes("");
      setError("");
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

    // Validate Other payment methods
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

      const payload: any = {
        branch_id: branchId,
        cash_register_id: registerId,
        sales_staff_id: salesStaffId || null,
        customer_id: customerId || null,
        is_dppr: isDPPR,
        is_gift: isGift,
        is_employee_purchase: isEmployeePurchase,
        employee_discount_percentage: employeeDiscountPercent, // ← ADD THIS
        payment_method: paymentMethod,
        notes: notes || null,
        items,
      };

      if (!isDPPR && customerDetails) {
        payload.customer_details = {
          name: customerDetails.name || null,
          phone: customerDetails.phone || null,
          email: customerDetails.email || null,
          address: customerDetails.address || null,
        };
      }

      if (couponCode) {
        payload.coupon_code = couponCode;
      }

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

          {/* Payment Method - Dropdown */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Payment Method
            </label>
            {isLoadingPaymentMethods ? (
              <div className="flex items-center justify-center py-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                <span className="ml-2 text-sm text-gray-500">Loading...</span>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <img src={dropdown_arrow_icon} alt="Dropdown" className="w-4 h-4" />
                </div>
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
            {isEmployeePurchase && employeeDiscountPercent > 0 && (
              <div className="flex justify-between text-purple-600">
                <span>Employee Discount ({employeeDiscountPercent}%)</span>
                <span>-KWD {employeeDiscount.toFixed(3)}</span>
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
                isLoadingPaymentMethods ||
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