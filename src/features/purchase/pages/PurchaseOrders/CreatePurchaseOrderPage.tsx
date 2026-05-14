// src/features/purchase/pages/purchase-orders/CreatePurchaseOrderPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../../layouts/DashboardLayout";
import { useAppSelector } from "../../../../app/hooks";
import type { RootState } from "../../../../app/store";
import {
  useCreatePurchaseOrderMutation,
  useGetSuppliersQuery,
} from "../../../../services/purchaseApi";
import { useGetBranchesQuery } from "../../../../services/superAdminApi";
import CurrencySelector from "../../components/CurrencySelector";
import ProductSelectorModal from "../../components/ProductSelectorModal";
import ExchangeRatePopUp from "../../components/ExchangeRatePopUp";

import arrow_back_icon from "../../../../assets/icons/arrow_back_icon.svg";
import add_icon from "../../../../assets/icons/add.svg";
import dropdown_arrow_icon from "../../../../assets/icons/dropdown_arrow_icon.svg";

interface POProduct {
  id: string;
  product_id: number;
  variant_id: number | null;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  discount_percentage: number;
  tax_percentage: number;
  image: string;
  image_url: string;
}

interface CreatePurchaseOrderPageProps {
  isEditMode?: boolean;
  poId?: number;
  updatePO?: (args: { id: number; data: unknown }) => {
    unwrap: () => Promise<{ data: { id: number } }>;
  };
}

export default function CreatePurchaseOrderPage({
  isEditMode,
  poId,
  updatePO,
}: CreatePurchaseOrderPageProps) {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const basePath = isSuperAdmin ? "/admin" : "";

  // Product list — pure local state, no Redux needed
  const [selectedProducts, setSelectedProducts] = useState<POProduct[]>([]);

  const [showProductModal, setShowProductModal] = useState(false);
  const [showExchangePopup, setShowExchangePopup] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [currency, setCurrency] = useState("KWD");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [terms, setTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createPO, { isLoading: isCreating }] =
    useCreatePurchaseOrderMutation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: suppliersData } = useGetSuppliersQuery({ is_active: 1 } as any);
  const { data: branchesData } = useGetBranchesQuery();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const suppliers: Array<{ id: number; supplier_name: string }> =
    (suppliersData as any)?.data ?? [];
  const branches: Array<{ id: number; branch_name: string }> =
    (branchesData as any) ?? [];

  // ── Totals ──────────────────────────────────────────────────
  const subtotal = selectedProducts.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0,
  );
  const discount = selectedProducts.reduce(
    (sum, p) =>
      sum + (p.price * p.quantity * (p.discount_percentage || 0)) / 100,
    0,
  );
  const tax = selectedProducts.reduce((sum, p) => {
    const afterDisc =
      p.price * p.quantity * (1 - (p.discount_percentage || 0) / 100);
    return sum + afterDisc * ((p.tax_percentage || 0) / 100);
  }, 0);
  const total = subtotal - discount + tax + shippingCost;

  // ── Product handlers ─────────────────────────────────────────
  const handleAddProduct = (product: POProduct) => {
    setSelectedProducts((prev) => {
      const existing = prev.find(
        (p) =>
          p.product_id === product.product_id &&
          p.variant_id === product.variant_id,
      );
      if (existing) {
        return prev.map((p) =>
          p.product_id === product.product_id &&
          p.variant_id === product.variant_id
            ? { ...p, quantity: p.quantity + product.quantity }
            : p,
        );
      }
      return [...prev, product];
    });
  };

  const handleRemoveProduct = (id: string) =>
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id));

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity } : p)),
    );
  };

  const handleUpdatePrice = (id: string, price: number) => {
    if (price < 0) return;
    setSelectedProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, price } : p)),
    );
  };

  const handleUpdateDiscount = (id: string, val: number) =>
    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, discount_percentage: Math.min(100, Math.max(0, val)) }
          : p,
      ),
    );

  const handleUpdateTax = (id: string, val: number) =>
    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, tax_percentage: Math.min(100, Math.max(0, val)) }
          : p,
      ),
    );

  // ── Submit ───────────────────────────────────────────────────
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!supplierId) errs.supplier = "Supplier is required";
    if (!branchId) errs.branch = "Branch is required";
    if (selectedProducts.length === 0)
      errs.products = "Add at least one product";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildPayload = (rate: number) => ({
    supplier_id: parseInt(supplierId),
    branch_id: parseInt(branchId),
    currency,
    exchange_rate: rate,
    order_date: orderDate,
    expected_delivery_date: expectedDelivery || null,
    shipping_cost: shippingCost,
    terms_and_conditions: terms || null,
    notes: notes || null,
    items: selectedProducts.map((p) => ({
      product_id: p.product_id,
      variant_id: p.variant_id ?? null,
      quantity: p.quantity,
      unit_price: p.price,
      discount_percentage: p.discount_percentage || 0,
      tax_percentage: p.tax_percentage || 0,
    })),
  });

  const submitOrder = async (rate = exchangeRate) => {
    setIsSubmitting(true);
    try {
      const payload = buildPayload(rate);
      let orderId: number;
      if (isEditMode && poId && updatePO) {
        const res = await updatePO({ id: poId, data: payload }).unwrap();
        orderId = res.data.id;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = (await createPO(payload).unwrap()) as any;
        orderId = res.data.id as number;
      }
      setSelectedProducts([]);
      navigate(`${basePath}/purchase/orders/${orderId}`);
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        `Failed to ${isEditMode ? "update" : "create"} purchase order`;
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (currency !== "KWD" && exchangeRate === 1) {
      setShowExchangePopup(true);
    } else {
      await submitOrder();
    }
  };

  const handleExchangeConfirm = (_amount: number, rate: number) => {
    setExchangeRate(rate);
    setShowExchangePopup(false);
    void submitOrder(rate);
  };

  const isLoading = isCreating || isSubmitting;

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto space-y-4 sm:space-y-6 sm:p-0">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate(`${basePath}/purchase/orders`)}
            className="flex-shrink-0"
          >
            <img
              src={arrow_back_icon}
              alt="Back"
              className="w-6 h-6 sm:w-8 sm:h-8"
            />
          </button>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
            {isEditMode ? "Edit Purchase Order" : "Create Purchase Order"}
          </h1>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Order Information */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4">
                Order Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Supplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg appearance-none bg-white pr-8 sm:pr-10 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.supplier_name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                      <img
                        src={dropdown_arrow_icon}
                        alt=""
                        className="w-3 h-3 sm:w-4 sm:h-4"
                      />
                    </div>
                  </div>
                  {errors.supplier && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.supplier}
                    </p>
                  )}
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg appearance-none bg-white pr-8 sm:pr-10 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Branch</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.branch_name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                      <img
                        src={dropdown_arrow_icon}
                        alt=""
                        className="w-3 h-3 sm:w-4 sm:h-4"
                      />
                    </div>
                  </div>
                  {errors.branch && (
                    <p className="text-xs text-red-500 mt-1">{errors.branch}</p>
                  )}
                </div>

                {/* Order Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Order Date
                  </label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Expected Delivery */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Expected Delivery
                  </label>
                  <input
                    type="date"
                    value={expectedDelivery}
                    onChange={(e) => setExpectedDelivery(e.target.value)}
                    min={orderDate}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Currency */}
                <div className="sm:col-span-2">
                  <CurrencySelector
                    value={currency}
                    onChange={(code: string, rate: number) => {
                      setCurrency(code);
                      setExchangeRate(rate);
                    }}
                    label="Currency"
                    required
                    showExchangeRate
                  />
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Products
                  {selectedProducts.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-blue-600">
                      ({selectedProducts.length} items)
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => setShowProductModal(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                >
                  <img src={add_icon} alt="" className="w-4 h-4" />
                  <span className="font-medium">Add Product</span>
                </button>
              </div>

              {selectedProducts.length === 0 ? (
                <div
                  onClick={() => setShowProductModal(true)}
                  className="bg-gray-50 rounded-lg p-6 sm:p-10 text-center border-2 border-dashed border-gray-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <img
                      src={add_icon}
                      alt=""
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    />
                  </div>
                  <p className="text-gray-500 font-medium text-sm sm:text-base">
                    No products added yet
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    Click here or "Add Product" to get started
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
                  <div className="xl:col-span-4 overflow-x-auto">
                    <div className="min-w-[768px] lg:min-w-full">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-y border-gray-200">
                          <tr>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                              Product
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                              Qty
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                              Unit Price
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase hidden sm:table-cell">
                              Disc %
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">
                              Tax %
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                              Total
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                              Del
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedProducts.map((product) => {
                            const s = product.price * product.quantity;
                            const d =
                              (s * (product.discount_percentage || 0)) / 100;
                            const t =
                              ((s - d) * (product.tax_percentage || 0)) / 100;
                            const rowTotal = s - d + t;
                            return (
                              <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-3 sm:px-4 py-3">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <img
                                      src={product.image_url || product.image}
                                      alt={product.name}
                                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          "https://images.unsplash.com/photo-1541275055241-329bbdf9a191?w=100&auto=format&fit=crop";
                                      }}
                                    />
                                    <div className="min-w-0">
                                      <div className="text-xs sm:text-sm font-medium text-gray-900 break-words max-w-[120px] sm:max-w-[180px]">
                                        {product.name}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {product.sku}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-4 py-3">
                                  <div className="flex justify-center">
                                    <input
                                      type="number"
                                      min="1"
                                      value={product.quantity}
                                      onChange={(e) =>
                                        handleUpdateQuantity(
                                          product.id,
                                          parseInt(e.target.value) || 1,
                                        )
                                      }
                                      className="w-16 sm:w-20 px-1.5 sm:px-2 py-1 sm:py-1.5 border border-gray-300 rounded text-center text-xs sm:text-sm focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    value={product.price}
                                    onChange={(e) =>
                                      handleUpdatePrice(
                                        product.id,
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="w-20 sm:w-24 px-1.5 sm:px-2 py-1 sm:py-1.5 border border-gray-300 rounded text-right text-xs sm:text-sm focus:ring-1 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-right hidden sm:table-cell">
                                  <div className="flex items-center justify-end gap-1">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={product.discount_percentage || 0}
                                      onChange={(e) =>
                                        handleUpdateDiscount(
                                          product.id,
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="w-14 sm:w-16 px-1.5 sm:px-2 py-1 sm:py-1.5 border border-gray-300 rounded text-right text-xs sm:text-sm focus:ring-1 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-500 text-xs sm:text-sm">
                                      %
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-right hidden md:table-cell">
                                  <div className="flex items-center justify-end gap-1">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={product.tax_percentage || 0}
                                      onChange={(e) =>
                                        handleUpdateTax(
                                          product.id,
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="w-14 sm:w-16 px-1.5 sm:px-2 py-1 sm:py-1.5 border border-gray-300 rounded text-right text-xs sm:text-sm focus:ring-1 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-500 text-xs sm:text-sm">
                                      %
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-right font-semibold text-xs sm:text-sm whitespace-nowrap">
                                  {currency} {rowTotal.toFixed(3)}
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-center">
                                  <button
                                    onClick={() =>
                                      handleRemoveProduct(product.id)
                                    }
                                    className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                  >
                                    <svg
                                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {errors.products && (
                <p className="text-xs text-red-500 mt-2">{errors.products}</p>
              )}
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="space-y-4 sm:space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4">
                Order Summary
              </h2>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Subtotal
                  </span>
                  <span className="font-medium text-xs sm:text-sm">
                    {currency} {subtotal.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Discount
                  </span>
                  <span className="font-medium text-red-600 text-xs sm:text-sm">
                    − {currency} {discount.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 text-xs sm:text-sm">Tax</span>
                  <span className="font-medium text-xs sm:text-sm">
                    {currency} {tax.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Shipping
                  </span>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={shippingCost}
                    onChange={(e) =>
                      setShippingCost(parseFloat(e.target.value) || 0)
                    }
                    className="w-24 sm:w-28 px-1.5 sm:px-2 py-1 border border-gray-300 rounded text-right text-xs sm:text-sm focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-between pt-2 sm:pt-3 border-t border-gray-200">
                  <span className="text-sm font-semibold">Grand Total</span>
                  <span className="text-base sm:text-lg font-bold text-blue-600">
                    {currency} {total.toFixed(3)}
                  </span>
                </div>
                {currency !== "KWD" && exchangeRate !== 1 && (
                  <div className="flex justify-between text-xs text-gray-500 pt-1">
                    <span>KWD Equivalent</span>
                    <span>KWD {(total / exchangeRate).toFixed(3)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Terms & Notes */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4">
                Terms & Notes
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Terms & Conditions
                  </label>
                  <textarea
                    value={terms}
                    rows={3}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="Enter terms and conditions..."
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg resize-none text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    value={notes}
                    rows={3}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Internal notes..."
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg resize-none text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => navigate(`${basePath}/purchase/orders`)}
                className="py-2 sm:py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSubmit()}
                disabled={isLoading}
                className="py-2 sm:py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
              >
                {isLoading && (
                  <svg
                    className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4"
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
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                )}
                {isLoading
                  ? isEditMode
                    ? "Saving..."
                    : "Creating..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create PO"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showProductModal && (
        <ProductSelectorModal
          onClose={() => setShowProductModal(false)}
          onAddProduct={handleAddProduct}
          selectedProducts={selectedProducts}
        />
      )}

      {showExchangePopup && (
        <ExchangeRatePopUp
          fromCurrency={currency}
          toCurrency="KWD"
          amount={total}
          onConfirm={handleExchangeConfirm}
          onClose={() => setShowExchangePopup(false)}
        />
      )}
    </DashboardLayout>
  );
}
