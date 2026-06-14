// src/features/sales/pages/CreateInvoice.tsx
import DashboardLayout from "../../../../layouts/DashboardLayout";
import dropdown_arrow_icon from "../../../../assets/icons/dropdown_arrow_icon.svg";
import add_icon from "../../../../assets/icons/add.svg";
import arrow_back_icon from "../../../../assets/icons/arrow_back_icon.svg";

import { Link, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../../../app/hooks";
import type { RootState } from "../../../../app/store";
import {
  removeInvoiceProduct,
  updateInvoiceProductQty,
  clearInvoiceForm,
  setInvoiceFormField,
} from "../../salesSlice";
import { useCreateInvoiceMutation } from "../../../../services/invoiceApi";
import { useGetBranchesQuery } from "../../../../services/superAdminApi";

interface CreateInvoiceProps {
  isEditMode?: boolean;
  invoiceId?: number;
  updateInvoice?: any;
}

export default function CreateInvoice({
  isEditMode = false,
  invoiceId,
  updateInvoice,
}: CreateInvoiceProps) {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const basePath = isSuperAdmin ? "/admin" : "";

  // ─── Everything from Redux — survives navigation ──────────────
  const selectedProducts = useAppSelector(
    (state: RootState) => state.sales.invoiceProducts,
  );
  console.log("selected products:", selectedProducts);
  const form = useAppSelector((state: RootState) => state.sales.invoiceForm);

  // One dispatcher for all form fields
  const setField = (fields: Partial<typeof form>) => {
    dispatch(setInvoiceFormField(fields));
  };

  // ─── APIs ─────────────────────────────────────────────────────
  const [createInvoice, { isLoading: isSaving }] = useCreateInvoiceMutation();
  const { data: branchesResponse } = useGetBranchesQuery();
  const branches = branchesResponse || [];

  // ─── Calculations ─────────────────────────────────────────────
  const TAX_RATE = 0.05;
  const subtotal = selectedProducts.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0,
  );
  const taxAmount = subtotal * TAX_RATE;
  const grandTotal = subtotal + taxAmount;

  // ─── Handlers ─────────────────────────────────────────────────
  const handleRemoveProduct = (id: string) =>
    dispatch(removeInvoiceProduct(id));

  const handleUpdateQuantity = (id: string, quantity: number) => {
    dispatch(updateInvoiceProductQty({ id, quantity }));
  };

  const handleAddProduct = () => navigate(`${basePath}/sales/add_product`);

  const handleSaveInvoice = async () => {
    if (selectedProducts.length === 0) {
      alert("Please add at least one product.");
      return;
    }

    if (!form.quotationCustomer.trim()) {
      alert("Customer is required for Quotation.");
      return;
    }

    try {
      const payload: any = {
        invoice_type: "quotation",
        source: form.source || "Manual",
        branch_id: form.branchId ? parseInt(form.branchId) : undefined,
        payment_method: "CASH",
        payment_status: "Unpaid",
        items: selectedProducts.map((p) => ({
          product_id: p.product_id,
          variant_id: p.variant_id ?? undefined,
          product_name: p.name,
          variant_name: p.size !== "Default" ? p.size : undefined,
          sku: p.sku,
          image_url: p.image_url || p.image,
          quantity: p.quantity,
          unit_price: p.price,
          discount_percentage: 0,
          tax_percentage: 5,
        })),
        customer_name: form.quotationCustomer,
        valid_till: form.validTill,
        quotation_status: form.quotationStatus,
        inco_terms: form.incoTerms,
      };

      let result;
      if (isEditMode && invoiceId) {
        // Update existing invoice
        result = await updateInvoice({ id: invoiceId, data: payload }).unwrap();
        alert("Quotation updated successfully!");
      } else {
        // Create new quotation
        result = await createInvoice(payload).unwrap();
        alert("Quotation created successfully!");
      }

      console.log("Quotation saved:", result);
      dispatch(clearInvoiceForm());
      navigate(`${basePath}/sales/quotations/${result.data.id || invoiceId}`);
    } catch (error: any) {
      console.error("Failed to save quotation:", error);
      alert(
        error?.data?.message || "Failed to save quotation. Please try again.",
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 sm:p-0">
        {/* Header */}
        <div className="flex flex-row gap-4 mb-4 sm:mb-8">
          <Link to={`${basePath}/sales`} className="flex-shrink-0">
            <img
              src={arrow_back_icon}
              alt=""
              className="w-6 h-6 sm:w-8 sm:h-8"
            />
          </Link>
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
            {isEditMode ? "Edit Quotation" : "Create New Quotation"}
          </h1>
          <div className="w-6 sm:w-8"></div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Quotation Header Section */}
          <div className="bg-white space-y-4 sm:space-y-6 lg:p-4 rounded-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                  Source
                </label>
                <div className="relative">
                  <select
                    value={form.source}
                    onChange={(e) => setField({ source: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-8 sm:pr-10"
                  >
                    <option value="Manual">Manual</option>
                    <option value="POS">POS</option>
                    <option value="Website">Website</option>
                    <option value="Mobile App">Mobile App</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                    <img
                      src={dropdown_arrow_icon}
                      alt=""
                      className="w-3 h-3 sm:w-4 sm:h-4"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                  Branch
                </label>
                <div className="relative">
                  <select
                    value={form.branchId}
                    onChange={(e) => setField({ branchId: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-8 sm:pr-10"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b: any) => (
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
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                Cashier
              </label>
              <input
                type="text"
                value={user?.name || ""}
                readOnly
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                Date
              </label>
              <input
                type="text"
                readOnly
                value={new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Customer Information Section */}
          <div className="space-y-3 sm:space-y-4 bg-white rounded-xl p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                  Customer / Company
                </label>
                <input
                  type="text"
                  value={form.quotationCustomer}
                  onChange={(e) =>
                    setField({ quotationCustomer: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter customer or company name"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                  Valid Till
                </label>
                <input
                  type="date"
                  value={form.validTill}
                  onChange={(e) => setField({ validTill: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                Status
              </label>
              <div className="relative">
                <select
                  value={form.quotationStatus}
                  onChange={(e) =>
                    setField({ quotationStatus: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-8 sm:pr-10"
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                  <img
                    src={dropdown_arrow_icon}
                    alt=""
                    className="w-3 h-3 sm:w-4 sm:h-4"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                IncoTerms
              </label>
              <input
                type="text"
                value={form.incoTerms}
                onChange={(e) => setField({ incoTerms: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., CIF, FOB, EXW"
              />
            </div>
          </div>

          {/* Products Section */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Products
                  {selectedProducts.length > 0 && (
                    <span className="ml-2 text-xs sm:text-sm font-normal text-blue-600">
                      ({selectedProducts.length} items)
                    </span>
                  )}
                </h3>
                <button
                  onClick={handleAddProduct}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer text-sm"
                >
                  <img src={add_icon} alt="" className="w-4 h-4" />
                  <span className="font-medium">Add Product</span>
                </button>
              </div>

              {/* Products Table */}
              {selectedProducts.length > 0 && (
                <div className="bg-white rounded-lg overflow-hidden">
                  <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
                    <div className="xl:col-span-4 overflow-x-auto">
                      <div className="min-w-[800px] lg:min-w-full">
                        <table className="w-full shadow-lg">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Image
                              </th>
                              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Product
                              </th>
                              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                                SKU
                              </th>
                              <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Qty
                              </th>
                              <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Price
                              </th>
                              <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                                Tax (5%)
                              </th>
                              <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Total
                              </th>
                              <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Remove
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedProducts.map((product) => {
                              const itemSubtotal =
                                product.price * product.quantity;
                              const itemTax = itemSubtotal * TAX_RATE;
                              const itemTotal = itemSubtotal + itemTax;
                              return (
                                <tr
                                  key={product.id}
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                    <img
                                      src={product.image_url || product.image}
                                      alt={product.name}
                                      className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-md"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          "https://images.unsplash.com/photo-1541275055241-329bbdf9a191?w=100&auto=format&fit=crop";
                                      }}
                                    />
                                  </td>
                                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                                    <div className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                                      {product.name}
                                    </div>
                                    {product.size &&
                                      product.size !== "Default" && (
                                        <div className="text-xs text-gray-500">
                                          Variant: {product.size}
                                        </div>
                                      )}
                                    <div className="text-xs text-gray-500 md:hidden mt-1">
                                      SKU: {product.sku}
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                                    <div className="text-xs sm:text-sm text-gray-900">
                                      {product.sku}
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                                      <button
                                        onClick={() =>
                                          handleUpdateQuantity(
                                            product.id,
                                            product.quantity - 1,
                                          )
                                        }
                                        className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                      >
                                        <span className="text-gray-600 font-semibold text-sm">
                                          -
                                        </span>
                                      </button>
                                      <input
                                        type="text"
                                        value={product.quantity}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (value === "") {
                                            handleUpdateQuantity(product.id, 0);
                                            return;
                                          }
                                          const numValue = parseInt(value, 10);
                                          if (
                                            !isNaN(numValue) &&
                                            numValue >= 0
                                          ) {
                                            handleUpdateQuantity(
                                              product.id,
                                              numValue,
                                            );
                                          }
                                        }}
                                        className="w-12 sm:w-16 text-center font-medium text-gray-900 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent px-1 py-1"
                                      />
                                      <button
                                        onClick={() =>
                                          handleUpdateQuantity(
                                            product.id,
                                            product.quantity + 1,
                                          )
                                        }
                                        className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                      >
                                        <span className="font-semibold text-sm">
                                          +
                                        </span>
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                    <div className="text-xs sm:text-sm font-medium text-gray-900">
                                      KWD {product.price.toFixed(3)}
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right hidden sm:table-cell">
                                    <div className="text-xs sm:text-sm text-gray-900">
                                      KWD {itemTax.toFixed(3)}
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                    <div className="text-xs sm:text-sm font-semibold text-gray-900">
                                      KWD {itemTotal.toFixed(3)}
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                                    <button
                                      onClick={() =>
                                        handleRemoveProduct(product.id)
                                      }
                                      className="inline-flex items-center justify-center p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                      <svg
                                        className="w-4 h-4 sm:w-5 sm:h-5"
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
                </div>
              )}

              {/* Empty state */}
              {selectedProducts.length === 0 && (
                <div className="bg-white p-8 sm:p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    No products added yet. Click "Add Product" to get started.
                  </p>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-lg p-4 sm:p-6">
              <h4 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">
                Summary
              </h4>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 uppercase">
                    Subtotal
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                    {selectedProducts.length > 0
                      ? `KWD ${subtotal.toFixed(3)}`
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 uppercase">
                    Tax (5%)
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                    {selectedProducts.length > 0
                      ? `KWD ${taxAmount.toFixed(3)}`
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 uppercase">
                    Discount
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                    KWD 0.000
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-200">
                  <span className="text-xs sm:text-sm text-gray-900 font-semibold uppercase">
                    Grand Total
                  </span>
                  <span className="text-base sm:text-lg font-semibold text-gray-900">
                    {selectedProducts.length > 0
                      ? `KWD ${grandTotal.toFixed(3)}`
                      : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {selectedProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4">
                <button
                  onClick={() => window.print()}
                  className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-white border border-blue-300 rounded-lg text-gray-700 font-medium hover:bg-blue-500 hover:text-white transition-colors cursor-pointer text-sm"
                >
                  Print
                </button>
                <button
                  onClick={handleSaveInvoice}
                  disabled={isSaving}
                  className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isSaving
                    ? "Saving..."
                    : isEditMode
                      ? "Update Quotation"
                      : "Save Quotation"}
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-white border border-blue-300 rounded-lg text-gray-700 font-medium hover:bg-blue-500 hover:text-white transition-colors cursor-pointer text-sm"
                >
                  Export PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
