// src/components/BulkTransferModal.tsx
import { useState, useEffect } from "react";
import { inventoryApi } from "../../../services/inventoryApi";
import { useGetBranchesQuery } from "../../../services/superAdminApi";

import dropdown_arrow_icon from "../../../assets/icons/dropdown_arrow_icon.svg";
import dashed_arrow from "../../../assets/icons/dashed_arrow.svg";
import exclaimation_icon from "../../../assets/icons/exclaimation_icon.svg";

interface BulkTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Array<{
    id: number;
    name: string;
    sku: string;
  }>;
}

interface ProductQuantity {
  product_id: number;
  quantity: number;
  available: number;
}

interface BranchStock {
  branch_id: number;
  branch_name: string;
  branch_type: string;
  quantity: number;
  reserved: number;
  available: number;
  is_low_stock: boolean;
}

export default function BulkTransferModal({
  isOpen,
  onClose,
  selectedProducts,
}: BulkTransferModalProps) {
  const [fromBranchId, setFromBranchId] = useState<number | null>(null);
  const [toBranchId, setToBranchId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [productQuantities, setProductQuantities] = useState<ProductQuantity[]>(
    [],
  );
  const [productsStock, setProductsStock] = useState<
    Map<number, BranchStock[]>
  >(new Map());
  const [loadingStock, setLoadingStock] = useState(false);

  // Get branches
  const { data: branchesData = [], isLoading: branchesLoading } =
    useGetBranchesQuery();
  const branches = Array.isArray(branchesData) ? branchesData : [];

  // Filter warehouses
  const warehouses = branches.filter(
    (branch: any) =>
      branch.branch_type === "Warehouse" || branch.branch_type === "warehouse",
  );

  // Mutation
  const [createTransfer, { isLoading: transferring }] =
    inventoryApi.endpoints.createStockTransfer.useMutation();

  // Fetch stock for all selected products
  const fetchProductsStock = async () => {
    if (!selectedProducts.length) return;

    setLoadingStock(true);
    const stockMap = new Map<number, BranchStock[]>();

    try {
      const auth = localStorage.getItem("erp_auth");
      const token = auth ? JSON.parse(auth)?.token : null;

      for (const product of selectedProducts) {
        const response = await fetch(
          `https://puristic-filmily-bula.ngrok-free.dev/api/products/${product.id}/stock`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true",
            },
          },
        );

        const result = await response.json();
        if (result.success && result.data?.stock_by_branch) {
          stockMap.set(product.id, result.data.stock_by_branch);
        }
      }

      setProductsStock(stockMap);
    } catch (error) {
      console.error("Failed to fetch stock:", error);
    } finally {
      setLoadingStock(false);
    }
  };

  // Fetch stock when modal opens
  useEffect(() => {
    if (isOpen && selectedProducts.length > 0) {
      fetchProductsStock();
    }
  }, [isOpen, selectedProducts]);

  // Update quantities when from branch changes
  useEffect(() => {
    if (fromBranchId) {
      const newQuantities: ProductQuantity[] = [];

      selectedProducts.forEach((product) => {
        const stockData = productsStock.get(product.id);
        const branchStock = stockData?.find(
          (b) => b.branch_id === fromBranchId,
        );

        if (branchStock && branchStock.available > 0) {
          newQuantities.push({
            product_id: product.id,
            quantity: Math.min(10, branchStock.available),
            available: branchStock.available,
          });
        }
      });

      setProductQuantities(newQuantities);
    } else {
      setProductQuantities([]);
    }
  }, [fromBranchId, productsStock, selectedProducts]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFromBranchId(null);
      setToBranchId(null);
      setNotes("");
      setProductQuantities([]);
      setProductsStock(new Map());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter products that have stock in selected from branch
  const availableProducts = selectedProducts.filter((product) => {
    if (!fromBranchId) return false;
    const stockData = productsStock.get(product.id);
    const branchStock = stockData?.find((b) => b.branch_id === fromBranchId);
    return branchStock && branchStock.available > 0;
  });

  const handleQuantityChange = (productId: number, quantity: string) => {
    const qty = parseInt(quantity) || 0;
    setProductQuantities((prev) =>
      prev.map((pq) => {
        if (pq.product_id === productId) {
          return { ...pq, quantity: Math.min(qty, pq.available) };
        }
        return pq;
      }),
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!fromBranchId) {
      alert("Please select a source branch");
      return;
    }
    if (!toBranchId) {
      alert("Please select a destination branch");
      return;
    }
    if (fromBranchId === toBranchId) {
      alert("Source and destination branches must be different");
      return;
    }

    if (productQuantities.length === 0) {
      alert("No products available to transfer from selected branch");
      return;
    }

    const invalidQuantities = productQuantities.filter(
      (pq) => pq.quantity <= 0 || pq.quantity > pq.available,
    );
    if (invalidQuantities.length > 0) {
      alert("Some quantities are invalid. Please check and try again.");
      return;
    }

    try {
      const fromBranchName = branches.find(
        (b: any) => b.id === fromBranchId,
      )?.branch_name;
      const toBranchName = branches.find(
        (b: any) => b.id === toBranchId,
      )?.branch_name;

      const fromType = branches.find(
        (b: any) => b.id === fromBranchId,
      )?.branch_type;
      const toType = branches.find(
        (b: any) => b.id === toBranchId,
      )?.branch_type;

      let transferType = "Branch-to-Branch";
      if (fromType === "Warehouse" && toType !== "Warehouse") {
        transferType = "Warehouse-to-Branch";
      } else if (fromType !== "Warehouse" && toType === "Warehouse") {
        transferType = "Branch-to-Warehouse";
      }

      const result = await createTransfer({
        from_branch_id: fromBranchId,
        to_branch_id: toBranchId,
        transfer_type: transferType,
        notes:
          notes ||
          `Bulk transfer of ${productQuantities.length} products from ${fromBranchName} to ${toBranchName}`,
        items: productQuantities.map((pq) => ({
          product_id: pq.product_id,
          variant_id: null,
          quantity: pq.quantity,
          notes:
            selectedProducts.find((p) => p.id === pq.product_id)?.name || "",
        })),
      }).unwrap();

      if (result.success) {
        alert(
          `Successfully transferred ${productQuantities.length} products from ${fromBranchName} to ${toBranchName}`,
        );
        onClose();
      }
    } catch (error: any) {
      console.error("Transfer failed:", error);
      const errorMessage = error?.data?.message || "Transfer failed";
      alert(`${errorMessage}`);
    }
  };

  const fromBranchName = branches.find(
    (b: any) => b.id === fromBranchId,
  )?.branch_name;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0  bg-opacity-50 z-60 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-4xl bg-white rounded-2xl shadow-2xl z-70 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 pt-6 pb-4 border-b border-gray-200 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 text-center">
            BULK STOCK TRANSFER
          </h2>
          <p className="text-sm text-gray-500 text-center mt-1">
            {selectedProducts.length} products selected
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* Info Alert */}
          <div className="flex items-start space-x-3 bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
            <div className="shrink-0 mt-0.5">
              <img src={exclaimation_icon} alt="" className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Transfer Stock Between Branches
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Select source branch to see available stock. Only products with
                available inventory will be shown.
              </p>
            </div>
          </div>

          {/* Branch Selection */}
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-4 items-center">
              {/* From Branch */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Branch <span className="text-red-500">*</span>
                </label>
                <select
                  value={fromBranchId || ""}
                  onChange={(e) => setFromBranchId(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900 font-medium cursor-pointer"
                  disabled={branchesLoading || loadingStock}
                >
                  <option value="">Select source</option>
                  {warehouses.map((warehouse: any) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.branch_name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-11 pointer-events-none">
                  <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center pt-6">
                <img src={dashed_arrow} alt="" className="w-16" />
              </div>

              {/* To Branch */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Branch <span className="text-red-500">*</span>
                </label>
                <select
                  value={toBranchId || ""}
                  onChange={(e) => setToBranchId(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900 font-medium cursor-pointer"
                  disabled={branchesLoading || !fromBranchId}
                >
                  <option value="">Select destination</option>
                  {branches
                    .filter((b: any) => b.id !== fromBranchId)
                    .map((branch: any) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branch_name}
                      </option>
                    ))}
                </select>
                <div className="absolute right-3 top-11 pointer-events-none">
                  <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                </div>
              </div>
            </div>

            {fromBranchId && (
              <p className="text-xs text-blue-600 mt-2">
                Available in {fromBranchName}: {availableProducts.length} of{" "}
                {selectedProducts.length} products have stock
              </p>
            )}
          </div>

          {/* Loading State */}
          {loadingStock && (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading stock information...</p>
            </div>
          )}

          {/* Products List with Quantities */}
          {!loadingStock && fromBranchId && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Set Quantities for Each Product
              </label>

              {availableProducts.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    No Available Stock
                  </h3>
                  <p className="text-xs text-gray-500">
                    None of the selected products have available inventory in{" "}
                    {fromBranchName}.
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          SKU
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Available
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {availableProducts.map((product) => {
                        const pq = productQuantities.find(
                          (q) => q.product_id === product.id,
                        );
                        const available = pq?.available || 0;
                        const qty = pq?.quantity || 0;

                        return (
                          <tr key={product.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {product.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                              {product.sku}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                {available} units
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={qty}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    product.id,
                                    e.target.value,
                                  )
                                }
                                min="1"
                                max={available}
                                placeholder={`Max: ${available}`}
                                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {fromBranchId && availableProducts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this transfer..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-200 shrink-0 bg-white rounded-b-2xl">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onClose}
              disabled={transferring}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                transferring ||
                !fromBranchId ||
                !toBranchId ||
                productQuantities.length === 0
              }
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {transferring ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Transferring...
                </>
              ) : (
                "Transfer Stock"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
