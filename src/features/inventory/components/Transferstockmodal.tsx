// src/components/TransferStockModal.tsx
import { useState, useEffect } from "react";
import { inventoryApi } from "../../../services/inventoryApi";
import { useGetBranchesQuery } from "../../../services/superAdminApi";

import exclaimation_icon from "../../../assets/icons/exclaimation_icon.svg";
import dashed_arrow from "../../../assets/icons/dashed_arrow.svg";
import dropdown_arrow_icon from "../../../assets/icons/dropdown_arrow_icon.svg";

interface TransferStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: number;
    name: string;
    sku: string;
  } | null;
  onTransferComplete?: () => void; // Add this
  preFillData?: {
    // Add this
    fromBranchId?: number;
    toBranchId?: number;
    items?: Array<{
      product_id: number;
      variant_id: number | null;
      quantity: number;
    }>;
  };
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

export default function TransferStockModal({
  isOpen,
  onClose,
  product,
}: TransferStockModalProps) {
  const [fromBranchId, setFromBranchId] = useState<number | null>(null);
  const [toBranchId, setToBranchId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(10);
  const [customQuantity, setCustomQuantity] = useState<string>("");
  const [isCustomQuantity, setIsCustomQuantity] = useState(false);
  const [transferNotes, setTransferNotes] = useState<string>("");

  // Get all branches
  const { data: branchesData = [], isLoading: branchesLoading } =
    useGetBranchesQuery();
  const branches = Array.isArray(branchesData) ? branchesData : [];

  // Get product stock by branch
  const [
    getProductStock,
    { data: stockData, isLoading: stockLoading, error: stockError },
  ] = inventoryApi.endpoints.getProductStock.useLazyQuery();

  // Use the stock transfer mutation
  const [createStockTransfer, { isLoading: transferring }] =
    inventoryApi.endpoints.createStockTransfer.useMutation();

  // Fetch stock when modal opens and product changes
  useEffect(() => {
    if (isOpen && product?.id) {
      getProductStock(product.id);
    }
  }, [isOpen, product?.id, getProductStock]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFromBranchId(null);
      setToBranchId(null);
      setQuantity(10);
      setCustomQuantity("");
      setIsCustomQuantity(false);
      setTransferNotes("");
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const branchStock: BranchStock[] = stockData?.data?.stock_by_branch || [];
  console.log("Branch Stock Data:", branchStock);

  const totalQuantity = stockData?.data?.total_quantity || 0;
  const totalAvailable = stockData?.data?.total_available || 0;
  // console.log("branchStock", totalAvailable);
  // Get available quantity for selected "from" branch
  const fromBranchStock = branchStock.find((b) => b.branch_id === fromBranchId);
  const maxAvailable = fromBranchStock?.available || 0;

  // Get final quantity to transfer
  const finalQuantity = isCustomQuantity
    ? parseInt(customQuantity) || 0
    : quantity;

  // Determine transfer type
  const getTransferType = () => {
    if (!fromBranchStock || !toBranchId) return "Transfer";

    const fromType = fromBranchStock.branch_type;
    const toType = branches.find((b: any) => b.id === toBranchId)?.branch_type;

    if (fromType === "Warehouse" && toType !== "Warehouse") {
      return "Warehouse-to-Branch";
    } else if (fromType !== "Warehouse" && toType === "Warehouse") {
      return "Branch-to-Warehouse";
    } else if (fromType !== "Warehouse" && toType !== "Warehouse") {
      return "Branch-to-Branch";
    } else {
      return "Warehouse-to-Warehouse";
    }
  };

  const handleQuantityChange = (value: string) => {
    if (value === "custom") {
      setIsCustomQuantity(true);
    } else {
      setIsCustomQuantity(false);
      setQuantity(parseInt(value));
    }
  };

  const handleConfirmTransfer = async () => {
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
    if (finalQuantity <= 0) {
      alert("Please enter a valid quantity");
      return;
    }
    if (finalQuantity > maxAvailable) {
      alert(
        `Only ${maxAvailable} units available in ${fromBranchStock?.branch_name}`,
      );
      return;
    }

    const fromBranchName = fromBranchStock?.branch_name;
    const toBranchName = branches.find(
      (b: any) => b.id === toBranchId,
    )?.branch_name;

    try {
      const transferData = {
        from_branch_id: fromBranchId,
        to_branch_id: toBranchId,
        transfer_type: getTransferType(),
        notes:
          transferNotes ||
          `Transfer ${finalQuantity} units from ${fromBranchName} to ${toBranchName}`,
        items: [
          {
            product_id: product.id,
            variant_id: null,
            quantity: finalQuantity, // Changed from requested_quantity
            notes: `${product.name} - ${product.sku}`,
          },
        ],
      };

      console.log("📦 Creating stock transfer:", transferData);

      const result = await createStockTransfer(transferData).unwrap();

      console.log("Transfer completed:", result);

      if (result.success) {
        alert(
          `Successfully transferred ${finalQuantity} units from ${fromBranchName} to ${toBranchName}`,
        );

        onClose();
        // Refresh stock data
        getProductStock(product.id);
      }
    } catch (error: any) {
      console.error("Transfer failed:", error);
      console.error("Error details:", {
        status: error?.status,
        message: error?.data?.message,
        errors: error?.data?.errors,
      });

      // Show detailed error message
      const errorMessage =
        error?.data?.message ||
        error?.data?.errors?.[Object.keys(error?.data?.errors || {})[0]]?.[0] ||
        "Unknown error occurred";

      alert(`Transfer failed: ${errorMessage}`);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-opacity-50 z-60 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-200 bg-white rounded-2xl shadow-2xl z-70 flex flex-col h-[90vh]">
        {/* Header */}
        <div className="px-8 pt-6 pb-4 border-b border-gray-200 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 text-center">
            TRANSFER STOCK
          </h2>
          <p className="text-sm text-gray-500 text-center mt-1">
            {product.name} - SKU: {product.sku}
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-6 space-y-6">
            {/* Info Alert */}
            <div className="flex items-start space-x-3 bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="shrink-0 mt-0.5">
                <img src={exclaimation_icon} alt="" className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Total Stock: {totalQuantity} units | Available:{" "}
                  {totalAvailable} units
                </p>
                {fromBranchId && (
                  <p className="text-xs text-blue-700 mt-1">
                    Available in {fromBranchStock?.branch_name}: {maxAvailable}{" "}
                    units
                  </p>
                )}
                {fromBranchId && toBranchId && (
                  <p className="text-xs text-blue-700 mt-1">
                    Transfer Type:{" "}
                    <span className="font-semibold">{getTransferType()}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Stock By Branch Table */}
            <div className="bg-white shadow-md rounded-lg border border-gray-200">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-base font-bold text-gray-900">
                  Stock By Branch
                </h3>
              </div>

              {/* Loading State */}
              {stockLoading && (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading stock data...</p>
                </div>
              )}

              {/* Error State */}
              {stockError && (
                <div className="p-6 bg-red-50 border-t border-red-200">
                  <div className="flex items-center text-red-700">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="font-medium">Failed to load stock data</p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!stockLoading && !stockError && branchStock.length === 0 && (
                <div className="p-12 text-center">
                  <svg
                    className="w-16 h-16 text-gray-300 mx-auto mb-4"
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Stock Available
                  </h3>
                  <p className="text-gray-500">
                    This product has no inventory in any branch.
                  </p>
                </div>
              )}

              {/* Table */}
              {!stockLoading && !stockError && branchStock.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-[#37638F] uppercase tracking-wider">
                          Branch
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-[#37638F] uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-[#37638F] uppercase tracking-wider">
                          Available
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-[#37638F] uppercase tracking-wider">
                          Reserved
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-[#37638F] uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-[#37638F] uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {branchStock.map((branch) => (
                        <tr
                          key={branch.branch_id}
                          className={`hover:bg-gray-50 ${
                            branch.branch_id === fromBranchId
                              ? "bg-blue-50"
                              : branch.branch_id === toBranchId
                                ? "bg-green-50"
                                : ""
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {branch.branch_name}
                              {branch.branch_id === fromBranchId && (
                                <span className="ml-2 text-xs text-blue-600 font-semibold">
                                  FROM
                                </span>
                              )}
                              {branch.branch_id === toBranchId && (
                                <span className="ml-2 text-xs text-green-600 font-semibold">
                                  TO
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                              {branch.branch_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-green-600">
                              {branch.available}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-yellow-600">
                              {branch.reserved}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-gray-900">
                              {branch.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {branch.is_low_stock ? (
                              <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                Low Stock
                              </span>
                            ) : branch.available > 0 ? (
                              <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                In Stock
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                Out of Stock
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Transfer Form */}
            {branchStock.length > 0 && (
              <>
                {/* Transfer Section with Arrow */}
                <div className="relative">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    {/* From Location */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        From Branch <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={fromBranchId || ""}
                        onChange={(e) =>
                          setFromBranchId(Number(e.target.value))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900 font-medium cursor-pointer"
                        disabled={branchesLoading || branchStock.length === 0}
                      >
                        <option value="">Select source branch</option>
                        {branchStock
                          .filter((b) => b.available > 0)
                          .map((branch) => (
                            <option
                              key={branch.branch_id}
                              value={branch.branch_id}
                            >
                              {branch.branch_name} ({branch.available}{" "}
                              available)
                            </option>
                          ))}
                      </select>
                      <div className="absolute right-3 top-11 pointer-events-none">
                        <img
                          src={dropdown_arrow_icon}
                          alt=""
                          className="w-4 h-4"
                        />
                      </div>
                    </div>

                    {/* Arrow Column */}
                    <div className="flex justify-center pb-3">
                      <img src={dashed_arrow} alt="" className="w-100 mb-6" />
                    </div>

                    {/* To Location */}
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
                        <option value="">Select destination branch</option>
                        {branches
                          .filter((b: any) => b.id !== fromBranchId)
                          .map((branch: any) => (
                            <option key={branch.id} value={branch.id}>
                              {branch.branch_name}
                            </option>
                          ))}
                      </select>
                      <div className="absolute right-3 top-11 pointer-events-none">
                        <img
                          src={dropdown_arrow_icon}
                          alt=""
                          className="w-4 h-4"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quantity and Notes Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity to Transfer{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900 font-medium cursor-pointer"
                    ></input>
                    <div className="absolute right-3 top-11 pointer-events-none">
                      <img
                        src={dropdown_arrow_icon}
                        alt=""
                        className="w-4 h-4"
                      />
                    </div>
                  </div>

                  {isCustomQuantity && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter Custom Quantity
                      </label>
                      <input
                        type="number"
                        value={customQuantity}
                        onChange={(e) => setCustomQuantity(e.target.value)}
                        placeholder={`Max: ${maxAvailable}`}
                        min="1"
                        max={maxAvailable}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Transfer Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transfer Notes (Optional)
                  </label>
                  <textarea
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    placeholder="Add any notes about this transfer..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer Buttons - Fixed at Bottom */}
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
              onClick={handleConfirmTransfer}
              disabled={
                transferring ||
                !fromBranchId ||
                !toBranchId ||
                finalQuantity <= 0 ||
                finalQuantity > maxAvailable ||
                branchStock.length === 0
              }
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {transferring ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Transfer...
                </>
              ) : (
                "Confirm Transfer"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
function onTransferComplete() {
  throw new Error("Function not implemented.");
}
