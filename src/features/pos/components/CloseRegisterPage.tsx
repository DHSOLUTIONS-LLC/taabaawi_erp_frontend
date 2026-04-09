// src/features/pos/components/CloseRegisterPage.tsx
import { useState } from "react";
import {
  useClosePOSMutation,
  useGenerateShiftReportMutation,
} from "../../../services/posApi";

interface CloseRegisterPageProps {
  register: {
    id: number;
    branch?: { branch_name: string };
    user?: { name: string };
    expected_balance?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function CloseRegisterPage({
  register,
  onClose,
  onSuccess,
}: CloseRegisterPageProps) {
  const [closingBalance, setClosingBalance] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [step, setStep] = useState<"form" | "generating" | "done">("form");
  const [shiftReport, setShiftReport] = useState<any>(null);
  const [error, setError] = useState("");

  const [closeRegister, { isLoading: isClosing }] = useClosePOSMutation();
  const [generateShiftReport, { isLoading: isGenerating }] =
    useGenerateShiftReportMutation();

  const expectedBalance = parseFloat(register.expected_balance || "0");
  const difference = closingBalance
    ? parseFloat(closingBalance) - expectedBalance
    : null;

  const handleCloseRegister = async () => {
    setError("");
    if (!register?.id || !closingBalance) return;

    const balanceValue = parseFloat(closingBalance);
    if (balanceValue < 0) {
      setError("Closing balance cannot be negative");
      return;
    }
    if (balanceValue > 1000000) {
      setError("Closing balance seems too high. Please verify.");
      return;
    }

    try {
      // Step 1 — Close the register
      await closeRegister({
        id: register.id,
        closing_balance: balanceValue,
        closing_notes: closingNotes,
      }).unwrap();

      setStep("generating");

      // Step 2 — Auto-generate shift report after close
      const reportResult = await generateShiftReport(register.id).unwrap();
      setShiftReport(reportResult?.data);
      setStep("done");
    } catch (err: any) {
      setError(
        err?.data?.message || "Failed to close register. Please try again.",
      );
      setStep("form");
    }
  };

  const handleDone = () => {
    setStep("form");
    setClosingBalance("");
    setClosingNotes("");
    setShiftReport(null);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className={`px-6 py-5 ${step === "done" ? "bg-green-600" : "bg-red-600"}`}
        >
          <h2 className="text-xl font-bold text-white">
            {step === "done" ? "✓ Register Closed" : "Close Register"}
          </h2>
          <p className="text-white/70 text-sm mt-0.5">
            {step === "form" && "Enter closing balance to end your shift"}
            {step === "generating" && "Generating shift report..."}
            {step === "done" && "Shift report has been generated successfully"}
          </p>
        </div>

        <div className="p-6">
          {/* Generating spinner */}
          {step === "generating" && (
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              <p className="text-gray-600 font-medium">
                Generating your shift report...
              </p>
            </div>
          )}

          {/* Done — show shift summary */}
          {step === "done" && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="font-bold text-green-800">
                  Report #{shiftReport?.report_number || "—"}
                </p>
                <p className="text-green-600 text-sm">
                  Shift closed & report saved
                </p>
              </div>
              {shiftReport && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  {[
                    {
                      label: "Total Sales",
                      value: `KD ${parseFloat(shiftReport.total_sales || 0).toFixed(3)}`,
                    },
                    {
                      label: "Total Transactions",
                      value: shiftReport.total_transactions || 0,
                    },
                    {
                      label: "Opening Balance",
                      value: `KD ${parseFloat(shiftReport.opening_balance || 0).toFixed(3)}`,
                    },
                    {
                      label: "Closing Balance",
                      value: `KD ${parseFloat(shiftReport.closing_balance || 0).toFixed(3)}`,
                    },
                    {
                      label: "Cash Difference",
                      value: `KD ${parseFloat(shiftReport.cash_difference || 0).toFixed(3)}`,
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-semibold text-gray-900">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={handleDone}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* Form */}
          {step === "form" && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl text-sm space-y-1">
                <p>
                  <span className="font-medium text-gray-600">Branch:</span>{" "}
                  {register?.branch?.branch_name || "N/A"}
                </p>
                <p>
                  <span className="font-medium text-gray-600">Cashier:</span>{" "}
                  {register.user?.name || "N/A"}
                </p>
                <p>
                  <span className="font-medium text-gray-600">
                    Expected Balance:
                  </span>{" "}
                  KD {expectedBalance.toFixed(3)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Closing Balance (KD) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  max="1000000"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-lg font-semibold"
                  placeholder="0.000"
                />
                {difference !== null && (
                  <p
                    className={`mt-1.5 text-xs font-medium ${
                      difference === 0
                        ? "text-green-600"
                        : difference > 0
                          ? "text-blue-600"
                          : "text-red-600"
                    }`}
                  >
                    {difference === 0
                      ? "✓ Balanced"
                      : difference > 0
                        ? `↑ Over by KD ${difference.toFixed(3)}`
                        : `↓ Short by KD ${Math.abs(difference).toFixed(3)}`}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-sm"
                  rows={3}
                  placeholder="Add any notes about this shift..."
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseRegister}
                  disabled={!closingBalance || isClosing || isGenerating}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isClosing
                    ? "Closing..."
                    : isGenerating
                      ? "Generating..."
                      : "Close Register"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
