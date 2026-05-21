// src/components/RequestStockModal.tsx
import { useState } from "react";
import { useCreateStockRequestMutation } from "../../../services/inventoryApi";
import { useGetBranchesQuery } from "../../../services/superAdminApi";
import dropdown_arrow_icon from "../../../assets/icons/dropdown_arrow_icon.svg";

interface RequestStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: number;
    name: string;
    sku: string;
  } | null;
  currentBranchId?: number;
  currentBranchName?: string;
}

export default function RequestStockModal({
  isOpen,
  onClose,
  product,
  currentBranchId,
  currentBranchName,
}: RequestStockModalProps) {
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState<
    "Low" | "Normal" | "High" | "Urgent"
  >("Normal");
  // const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);

  const [createRequest, { isLoading: requesting }] =
    useCreateStockRequestMutation();

  // Fetch warehouses (branches with type 'Warehouse')
  const { data: branchesData = [], isLoading: branchesLoading } =
    useGetBranchesQuery();
  const branches = Array.isArray(branchesData) ? branchesData : [];

  // Filter ONLY warehouses
  const warehouses = branches.filter(
    (branch: any) =>
      branch.branch_type === "Warehouse" || branch.branch_type === "warehouse",
  );

  if (!isOpen || !product) return null;

  const handleClose = () => {
    setQuantity("");
    setReason("");
    setPriority("Normal");
    onClose();
  };

  const handleSubmitRequest = async () => {
    if (!currentBranchId) {
      alert("No branch found. Please reopen the POS session.");
      return;
    }

    if (!quantity || parseInt(quantity) <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    // Debug: Check if token exists before sending
    const auth = JSON.parse(localStorage.getItem("employee_auth") || "{}");
    console.log(
      "Sending request with token:",
      auth.token ? "Token exists" : "NO TOKEN",
    );
    console.log("Current Branch ID:", currentBranchId);
    console.log("Payload:", {
      requesting_branch_id: currentBranchId,
      priority: priority,
      notes: reason,
      items: [
        {
          product_id: product.id,
          variant_id: null,
          requested_quantity: parseInt(quantity),
          notes: reason,
        },
      ],
    });

    try {
      const result = await createRequest({
        requesting_branch_id: currentBranchId,
        priority: priority,
        notes: reason,
        items: [
          {
            product_id: product.id,
            variant_id: null,
            requested_quantity: parseInt(quantity),
            notes: reason,
          },
        ],
      }).unwrap();

      if (result.success) {
        alert(`Stock request submitted for approval!`);
        handleClose();
      }
    } catch (error: any) {
      console.error("Full error object:", error);
      alert(
        `Failed to submit request: ${error?.data?.message || error?.message || "Unknown error"}`,
      );
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-2xl shadow-2xl z-50">
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 text-center">
          <h2 className="text-xl font-bold text-gray-900">REQUEST STOCK</h2>
          <p className="text-sm text-gray-500 mt-1">
            {product.name} - SKU: {product.sku}
          </p>
        </div>

        <div className="px-6 py-6 space-y-5">
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-sm text-yellow-800">
              ⚠️ This request will be sent to warehouse for approval. Stock will
              be transferred only after approval.
            </p>
          </div>

          {/* Requesting Branch (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requesting Branch <span className="text-red-500">*</span>
            </label>
            <div className="w-full px-4 py-3 bg-gray-100 border rounded-lg text-gray-700">
              {currentBranchName || "Loading..."}
            </div>
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter quantity"
              min="1"
            />
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Why do you need this stock?"
              rows={2}
            />
          </div>
        </div>

        <div className="px-6 py-5 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 border rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitRequest}
            className="flex-1 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 transition-colors"
          >
            {requesting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </>
  );
}
