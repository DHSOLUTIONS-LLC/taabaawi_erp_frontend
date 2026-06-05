// src/features/pos/components/CartSidebar.tsx
import { useEffect, useState } from "react";
import {
  useValidateCouponMutation,
  useValidateDiscountMutation,
} from "../../../services/posApi";
import PaymentModal from "./PaymentModal";
import ReceiptModal from "./ReceiptModal";
import { useAppSelector } from "../../../app/hooks";
import type { RootState } from "../../../app/store";
// import BarcodeScanner from './BarcodeScanner';

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

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onAddToCart?: (item: CartItem) => void;
  onClearCart: () => void;
  registerId?: number;
  branchId?: number;
}

export default function CartSidebar({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  registerId,
  branchId,
}: CartSidebarProps) {
  const { user } = useAppSelector((state: RootState) => state.auth);

  const [giftReceipt, setGiftReceipt] = useState(false);
  const [isEmployeePurchase, setIsEmployeePurchase] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    message: string;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [itemDiscounts, setItemDiscounts] = useState<Record<string, number>>(
    {},
  );
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(
    null,
  );
  const [showPayment, setShowPayment] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState<number | null>(null);

  const [validateCoupon, { isLoading: validatingCoupon }] =
    useValidateCouponMutation();
  const [validateDiscount] = useValidateDiscountMutation();
  const [discountError, setDiscountError] = useState<Record<string, string>>(
    {},
  );

  // DEBUG - remove after fixing
  console.log("CartSidebar props:", { registerId, branchId });
  console.log("localStorage pos_session:", localStorage.getItem("pos_session"));
  console.log(
    "Parsed session:",
    JSON.parse(localStorage.getItem("pos_session") || "{}"),
  );

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const itemDiscountTotal = cartItems.reduce((sum, item) => {
    const discPct = itemDiscounts[item.id] || 0;
    return sum + (item.price * item.quantity * discPct) / 100;
  }, 0);
  const couponDiscount = appliedCoupon?.discount || 0;
  const employeeDiscount = isEmployeePurchase
    ? (subtotal - itemDiscountTotal) * 0.2
    : 0;
  const total =
    subtotal - itemDiscountTotal - couponDiscount - employeeDiscount;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const orderDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleApplyCoupon = async () => {
    setCouponError("");
    setAppliedCoupon(null);
    if (!promoCode.trim()) return;

     console.log("Sending coupon request:", {
    coupon_code: promoCode.trim(),
    total_amount: subtotal - itemDiscountTotal,
    branch_id: branchId,
  });

  
    try {
      const result = await validateCoupon({
        coupon_code: promoCode.trim(),
        total_amount: subtotal - itemDiscountTotal,
        branch_id: branchId,
      }).unwrap();

      setAppliedCoupon({
        code: promoCode.trim(),
        discount: result.data.discount_amount,
        message: result.message,
      });
    } catch (err: any) {
      setCouponError(err?.data?.message || "Invalid coupon code");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setPromoCode("");
    setCouponError("");
  };

  const handleSetItemDiscount = async (itemId: string, pct: number) => {
    setDiscountError((prev) => ({ ...prev, [itemId]: "" }));

    if (pct === 0) {
      setItemDiscounts((prev) => ({ ...prev, [itemId]: 0 }));
      setEditingDiscountId(null);
      return;
    }

    try {
      console.log("Calling validateDiscount with:", {
        discount_percentage: pct,
        branch_id: branchId || 0,
      });

      const result = await validateDiscount({
        discount_percentage: pct,
        branch_id: branchId || 0,
      }).unwrap();

      console.log("Validation result:", result);

      if (result.data.allowed) {
        setItemDiscounts((prev) => ({ ...prev, [itemId]: pct }));
        setEditingDiscountId(null);
        setDiscountError((prev) => ({ ...prev, [itemId]: "" }));
      } else {
        setDiscountError((prev) => ({
          ...prev,
          [itemId]:
            result.data.message ||
            `Maximum allowed discount is ${result.data.max_discount}%`,
        }));
        setItemDiscounts((prev) => ({ ...prev, [itemId]: 0 }));
      }
    } catch (err: any) {
      console.error("Validation error:", err);
      console.error("Error response:", err?.data);
      setDiscountError((prev) => ({
        ...prev,
        [itemId]: err?.data?.message || "Failed to validate discount",
      }));
      setItemDiscounts((prev) => ({ ...prev, [itemId]: 0 }));
    }
  };

  const handleSaleSuccess = (sale: any) => {
    setCompletedSaleId(sale.id);
    setShowPayment(false);
  };

  const handleNewSale = () => {
    onClearCart();
    setAppliedCoupon(null);
    setPromoCode("");
    setGiftReceipt(false);
    setIsEmployeePurchase(false);
    setItemDiscounts({});
    setCompletedSaleId(null);
    onClose();
  };

  const cartItemsWithDiscount = cartItems.map((item) => ({
    ...item,
    discount_percentage: itemDiscounts[item.id] || 0,
  }));

  const handleBarcodeProductFound = (product: any) => {
    console.log("✅ Barcode Product Received:", product);

    const existingItem = cartItems.find(
      (item) =>
        item.product_id === product.product_id &&
        (item.variant_id || null) === (product.variant_id || null),
    );

    if (existingItem) {
      // Increase quantity if already in cart
      onUpdateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        id: `${product.product_id}-${product.variant_id || "default"}-${Date.now()}`,
        product_id: product.product_id,
        variant_id: product.variant_id,
        name: product.product_name || product.name || "Unknown Product",
        sku: product.sku || "",
        price: parseFloat(
          product.selling_price || product.sale_price || product.price || "0",
        ),
        quantity: 1,
        image: product.image_url || "",
      };

      // ACTUALLY ADD TO CART - Use the onAddToCart prop
      if (onAddToCart) {
        onAddToCart(newItem);
      } else {
        // Fallback: Try to use a custom event or direct modification
        console.error(
          "onAddToCart prop is missing! Please pass it from parent component.",
        );

        // Temporary workaround: If you have access to the parent's cart state setter
        // You'll need to pass a function from parent
      }
    }
  };
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0   transition-opacity duration-300 z-40 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-[460px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-5 border-b  border-gray-300  bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-[#1773CF]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Cart</p>
                  <p className="text-xs text-gray-500">
                    {itemCount} item{itemCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
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

            {/* Order Info */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-gray-400">Cashier</p>
                <p className="font-semibold text-gray-800 truncate">
                  {user?.name || "N/A"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-gray-400">Date</p>
                <p className="font-semibold text-gray-800">{orderDate}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-gray-400">Register</p>
                <p className="font-semibold text-gray-800">
                  #{registerId || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-10 h-10 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Cart is empty
                </h3>
                <p className="text-sm text-gray-500">
                  Add products to get started
                </p>
              </div>
            ) : (
              <>
                {cartItems.map((item) => {
                  const discPct = itemDiscounts[item.id] || 0;
                  const discAmount =
                    (item.price * item.quantity * discPct) / 100;
                  const lineTotal = item.price * item.quantity - discAmount;

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm"
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-2">
                              <h4 className="font-semibold text-gray-900 text-sm truncate">
                                {item.name}
                              </h4>
                              <p className="text-xs text-gray-400">
                                SKU: {item.sku}
                              </p>
                            </div>
                            <button
                              onClick={() => onRemoveItem(item.id)}
                              className="text-red-400 hover:text-red-600 p-0.5 hover:bg-red-50 rounded transition-colors"
                            >
                              <svg
                                className="w-4 h-4"
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

                          <div className="flex items-center justify-between mt-2">
                            {/* Qty */}
                            <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg p-0.5">
                              <button
                                onClick={() =>
                                  onUpdateQuantity(item.id, item.quantity - 1)
                                }
                                className="w-6 h-6 flex items-center justify-center rounded bg-white hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors"
                              >
                                −
                              </button>
                              <span className="w-6 text-center font-semibold text-sm text-gray-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  onUpdateQuantity(item.id, item.quantity + 1)
                                }
                                className="w-6 h-6 flex items-center justify-center rounded bg-white hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors"
                              >
                                +
                              </button>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <p className="font-bold text-sm text-gray-900">
                                KD {lineTotal.toFixed(3)}
                              </p>
                              {discPct > 0 && (
                                <p className="text-xs text-red-500 line-through">
                                  KD {(item.price * item.quantity).toFixed(3)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Discount */}
                          <div className="mt-2">
                            {editingDiscountId === item.id ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    defaultValue={discPct}
                                    autoFocus
                                    onBlur={(e) => {
                                      let value =
                                        parseFloat(e.target.value) || 0;
                                      if (value > 100) value = 100;
                                      if (value < 0) value = 0;

                                      handleSetItemDiscount(item.id, value);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        let value =
                                          parseFloat(
                                            (e.target as HTMLInputElement)
                                              .value,
                                          ) || 0;
                                        if (value > 100) value = 100;
                                        if (value < 0) value = 0;

                                        handleSetItemDiscount(item.id, value);
                                      }
                                    }}
                                    onInput={(e) => {
                                      const input =
                                        e.target as HTMLInputElement;
                                      let value = parseFloat(input.value);

                                      if (value > 100) {
                                        input.value = "100";
                                      }
                                    }}
                                    className="w-16 px-2 py-0.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="%"
                                  />
                                  <span className="text-xs text-gray-500">
                                    % off
                                  </span>
                                </div>

                                {discountError[item.id] && (
                                  <p className="text-xs text-red-500">
                                    {discountError[item.id]}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingDiscountId(item.id)}
                                className="text-xs text-[#1773CF] hover:underline"
                              >
                                {discPct > 0
                                  ? `${discPct}% discount applied`
                                  : "+ Add discount"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={onClearCart}
                  className="w-full py-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                  Clear Cart
                </button>
              </>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 p-5 space-y-4">
              {/* Toggles */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setGiftReceipt(!giftReceipt)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${giftReceipt ? "bg-[#1773CF]" : "bg-gray-300"}`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${giftReceipt ? "translate-x-4.5" : "translate-x-0.5"}`}
                    />
                  </button>
                  <span className="text-sm text-gray-700">🎁 Gift Receipt</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEmployeePurchase(!isEmployeePurchase)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isEmployeePurchase ? "bg-purple-500" : "bg-gray-300"}`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isEmployeePurchase ? "translate-x-4.5" : "translate-x-0.5"}`}
                    />
                  </button>
                  <span className="text-sm text-gray-700">👤 Employee</span>
                </div>
              </div>

              {/* Coupon */}
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      setCouponError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    placeholder="Promo / Coupon Code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !promoCode.trim()}
                    className="px-4 py-2 bg-cyan-400 hover:bg-cyan-500 text-white font-medium rounded-lg text-sm disabled:opacity-50 transition-colors"
                  >
                    {validatingCoupon ? "..." : "Apply"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-xs text-green-600 font-medium">
                      {appliedCoupon.code} applied
                    </p>
                    <p className="text-sm font-bold text-green-700">
                      -KD {appliedCoupon.discount.toFixed(3)}
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-green-600 hover:text-green-800 text-xs underline"
                  >
                    Remove
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-xs text-red-500 -mt-2">{couponError}</p>
              )}

              {/* Totals */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>KD {subtotal.toFixed(3)}</span>
                </div>
                {itemDiscountTotal > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Item Discounts</span>
                    <span>-KD {itemDiscountTotal.toFixed(3)}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon</span>
                    <span>-KD {couponDiscount.toFixed(3)}</span>
                  </div>
                )}
                {employeeDiscount > 0 && (
                  <div className="flex justify-between text-purple-600">
                    <span>Employee (20%)</span>
                    <span>-KD {employeeDiscount.toFixed(3)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base">
                  <span>Total Due</span>
                  <span className="text-[#1773CF] text-lg">
                    KD {total.toFixed(3)}
                  </span>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={() => {
                  // Add validation before opening payment modal
                  if (!branchId || branchId === 0) {
                    alert(
                      "No active branch found. Please reopen the POS session.",
                    );
                    console.error("Invalid branchId:", branchId);
                    return;
                  }
                  if (!registerId || registerId === 0) {
                    alert(
                      "No active register found. Please reopen the POS session.",
                    );
                    console.error("Invalid registerId:", registerId);
                    return;
                  }
                  setShowPayment(true);
                }}
                className="w-full py-3.5 bg-[#1773CF] hover:bg-blue-700 text-white rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2"
              >
                Charge KD {total.toFixed(3)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        cartItems={cartItemsWithDiscount}
        subtotal={subtotal}
        discount={itemDiscountTotal}
        couponDiscount={couponDiscount}
        couponCode={appliedCoupon?.code || ""}
        isGift={giftReceipt}
        isEmployeePurchase={isEmployeePurchase}
        registerId={registerId}
        branchId={branchId || 0}
        onSuccess={handleSaleSuccess}
      />

      {/* Receipt Modal */}
      {completedSaleId && (
        <ReceiptModal
          isOpen={!!completedSaleId}
          onClose={() => setCompletedSaleId(null)}
          saleId={completedSaleId}
          onNewSale={handleNewSale}
        />
      )}
    </>
  );
}
// function onAddToCart(newItem: CartItem) {
//   throw new Error("Function not implemented.");
// }
