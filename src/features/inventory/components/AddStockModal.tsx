// src/features/auth/components/AddStockModal.tsx
import { useState } from "react";
import { inventoryApi } from "../../../services/inventoryApi";
import { useGetBranchesQuery } from "../../../services/superAdminApi";

import dropdown_arrow_icon from "../../../assets/icons/dropdown_arrow_icon.svg";
import { useAppSelector } from "../../../app/hooks";
import type { RootState } from "../../../app/store";

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: number;
    name: string;
    sku: string;
  } | null;
}

export default function AddStockModal({
  isOpen,
  onClose,
  product,
}: AddStockModalProps) {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === "Super Admin";

  if (!isSuperAdmin) {
    return null;
  }

  const [branchId, setBranchId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch branches from API
  const {
    data: branchesData = [],
    isLoading: branchesLoading,
    error: branchesError,
  } = useGetBranchesQuery();

  const branches = Array.isArray(branchesData) ? branchesData : [];

  // Filter to show ONLY warehouses
  const warehouses = branches.filter(
    (branch: any) =>
      branch.branch_type === "Warehouse" || branch.branch_type === "warehouse", // Handle case variations
  );

  // Get mutation hook for adding stock
  const [addStock, { isLoading: adding }] =
    inventoryApi.endpoints.addStock.useMutation();

  if (!isOpen || !product) return null;

  // Reset form when modal closes
  const handleClose = () => {
    setBranchId(null);
    setQuantity("");
    setNotes("");
    onClose();
  };

  // REAL API CALL - Add stock to branch
  const handleAddStock = async () => {
    // Validation
    if (!branchId) {
      alert("Please select a warehouse");
      return;
    }
    if (!quantity || parseInt(quantity) <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    const selectedWarehouse = warehouses.find((b) => b.id === branchId);

    try {
      const result = await addStock({
        product_id: product.id,
        variant_id: null, // null for simple products, set ID for variants
        branch_id: branchId,
        quantity: parseInt(quantity),
        notes: notes || `Added stock to ${selectedWarehouse?.branch_name}`,
      }).unwrap();

      console.log("Add Stock Success:", result);

      if (result.success) {
        alert(
          `Successfully added ${quantity} units of ${product.name} to ${selectedWarehouse?.branch_name}`,
        );
        handleClose();
      }
    } catch (error: any) {
      console.error("Add Stock Failed:", error);
      alert(
        `Failed to add stock: ${error?.data?.message || error?.message || "Unknown error"}`,
      );
    }
  };

  return (
    <>
      {/* Overlay - Responsive backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal - Fully responsive with mobile-first approach */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95%] sm:w-[90%] md:w-[85%] lg:w-[80%] xl:max-w-2xl bg-white rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
        {/* Header - Responsive padding */}
        <div className="px-4 sm:px-6 md:px-8 pt-4 sm:pt-5 md:pt-6 pb-3 sm:pb-4 border-b border-gray-200 text-center sticky top-0 bg-white z-10">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
            ADD STOCK TO WAREHOUSE
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">
            {product.name} - SKU: {product.sku}
          </p>
        </div>

        {/* Body - Responsive padding and spacing */}
        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 space-y-4 sm:space-y-5 md:space-y-6">
          {/* Info Alert - Responsive layout */}
          <div className="flex items-start space-x-2 sm:space-x-3 bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h4 className="text-xs sm:text-sm font-medium text-blue-900">
                Initial Stock Allocation
              </h4>
              <p className="text-xs sm:text-sm text-blue-700 mt-0.5 sm:mt-1">
                Add inventory to a warehouse. You can transfer stock to retail
                branches afterward.
              </p>
            </div>
          </div>

          {/* Warehouse Selection - Responsive with better touch targets */}
          <div className="relative">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Select Warehouse <span className="text-red-500">*</span>
            </label>
            <select
              value={branchId || ""}
              onChange={(e) =>
                setBranchId(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900 font-medium cursor-pointer"
              disabled={branchesLoading || adding}
            >
              <option value="">Choose a warehouse...</option>
              {branchesLoading ? (
                <option disabled>Loading warehouses...</option>
              ) : branchesError ? (
                <option disabled>Failed to load warehouses</option>
              ) : warehouses.length === 0 ? (
                <option disabled>No warehouses found</option>
              ) : (
                warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.branch_name}
                  </option>
                ))
              )}
            </select>
            <div className="absolute right-3 top-[2.35rem] sm:top-[2.7rem] md:top-11 pointer-events-none">
              <img
                src={dropdown_arrow_icon}
                alt=""
                className="w-3 h-3 sm:w-4 sm:h-4"
              />
            </div>
            {branchesLoading && (
              <p className="text-xs text-gray-500 mt-1">
                Loading warehouses...
              </p>
            )}
            {!branchesLoading && warehouses.length === 0 && !branchesError && (
              <p className="text-xs text-red-500 mt-1">
                ⚠️ No warehouses available. Please create a warehouse first.
              </p>
            )}
          </div>

          {/* Quantity Input - Responsive */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
              placeholder="Enter quantity to add"
              min="1"
              disabled={adding}
            />
          </div>

          {/* Notes (Optional) - Responsive textarea */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              placeholder="E.g., Purchase Order #PO-2026-001, Supplier delivery, etc."
              rows={3}
              disabled={adding}
            />
          </div>

          {/* Summary Preview - Responsive */}
          {branchId && quantity && parseInt(quantity) > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                Summary
              </h4>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-gray-600">Product:</span>
                  <span className="font-medium text-gray-900 break-words sm:text-right">
                    {product.name}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-gray-600">Warehouse:</span>
                  <span className="font-medium text-gray-900 break-words sm:text-right">
                    {warehouses.find((b) => b.id === branchId)?.branch_name}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-bold text-green-600">
                    {quantity} units
                  </span>
                </div>
                {notes && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-600 block mb-1">Notes:</span>
                    <span className="text-gray-900 text-xs italic break-words">
                      {notes}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer - Responsive buttons */}
        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 border-t border-gray-200 bg-white rounded-b-2xl sticky bottom-0 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <button
              onClick={handleClose}
              disabled={adding}
              className="order-2 sm:order-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleAddStock}
              disabled={
                adding ||
                !branchId ||
                !quantity ||
                parseInt(quantity) <= 0 ||
                warehouses.length === 0
              }
              className="order-1 sm:order-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer text-sm sm:text-base"
            >
              {adding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                  Adding Stock...
                </>
              ) : (
                "Add Stock to Warehouse"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
