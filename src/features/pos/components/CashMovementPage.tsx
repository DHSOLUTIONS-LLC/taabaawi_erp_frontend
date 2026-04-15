// src/features/pos/components/CashMovementPage.tsx
import { useState } from "react";
import { useAddCashMovementMutation } from "../../../services/posApi";

interface CashMovementPageProps {
  registerId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CashMovementPage({
  registerId,
  onClose,
  onSuccess,
}: CashMovementPageProps) {
  const [movementType, setMovementType] = useState<"Cash In" | "Cash Out">(
    "Cash In",
  );
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const [addMovement, { isLoading }] = useAddCashMovementMutation();

  const handleAddMovement = async () => {
    if (!amount || !reason) return;

    try {
      await addMovement({
        cash_register_id: registerId,
        type: movementType,
        amount: parseFloat(amount),
        reason,
      }).unwrap();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to add movement:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Cash Movement</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={movementType}
              onChange={(e) =>
                setMovementType(e.target.value as "Cash In" | "Cash Out")
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="Cash In">Cash In</option>
              <option value="Cash Out">Cash Out</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Amount *</label>
            <input
              type="number"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Reason *</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Enter reason"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAddMovement}
            disabled={!amount || !reason || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Adding..." : "Add Movement"}
          </button>
        </div>
      </div>
    </div>
  );
}
