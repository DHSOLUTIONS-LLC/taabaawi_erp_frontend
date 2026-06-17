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
  onRegisterClosed?: () => void; // Add this callback
}

// Kuwait Currency Denominations
const KUWAIT_DENOMINATIONS = [
  { value: 20, label: "20 KWD", type: "note" },
  { value: 10, label: "10 KWD", type: "note" },
  { value: 5, label: "5 KWD", type: "note" },
  { value: 1, label: "1 KWD", type: "note" },
  { value: 0.5, label: "500 Fils", type: "coin" },
  { value: 0.25, label: "250 Fils", type: "coin" },
  { value: 0.1, label: "100 Fils", type: "coin" },
  { value: 0.05, label: "50 Fils", type: "coin" },
];

interface DenominationCount {
  [key: number]: number;
}

export default function CloseRegisterPage({
  register,
  onClose,
  onSuccess,
  onRegisterClosed, // Add this
}: CloseRegisterPageProps) {
  const [denominations, setDenominations] = useState<DenominationCount>({});
  const [closingNotes, setClosingNotes] = useState("");
  const [step, setStep] = useState<"form" | "generating" | "done">("form");
  const [shiftReport, setShiftReport] = useState<any>(null);
  const [error, setError] = useState("");
  const [useDenominationMode, setUseDenominationMode] = useState(true);

  const [closeRegister, { isLoading: isClosing }] = useClosePOSMutation();
  const [generateShiftReport, { isLoading: isGenerating }] =
    useGenerateShiftReportMutation();

  const expectedBalance = parseFloat(register.expected_balance || "0");

  // Calculate total from denominations
  const calculatedTotal = Object.entries(denominations).reduce(
    (sum, [value, count]) => sum + parseFloat(value) * (count || 0),
    0
  );

  // Get manual closing balance (if not using denominations)
  const [manualClosingBalance, setManualClosingBalance] = useState("");

  const closingBalance = useDenominationMode
    ? calculatedTotal
    : parseFloat(manualClosingBalance) || 0;

  const difference = closingBalance - expectedBalance;

  const handleDenominationChange = (value: number, count: number) => {
    setDenominations((prev) => ({
      ...prev,
      [value]: Math.max(0, count),
    }));
  };

  const handleCloseRegister = async () => {
    setError("");
    if (!register?.id) return;

    if (useDenominationMode && closingBalance === 0) {
      setError("Please enter at least one denomination count");
      return;
    }

    if (!useDenominationMode && (!manualClosingBalance || closingBalance < 0)) {
      setError("Please enter a valid closing balance");
      return;
    }

    if (closingBalance > 1000000) {
      setError("Closing balance seems too high. Please verify.");
      return;
    }

    try {
      // Build the payload
      const payload: {
        id: number;
        closing_balance: number;
        closing_notes?: string;
        denominations?: Record<string, number>;
      } = {
        id: register.id,
        closing_balance: closingBalance,
        closing_notes: closingNotes || undefined,
      };

      // Add denominations only if in denomination mode
      if (useDenominationMode && Object.keys(denominations).length > 0) {
        payload.denominations = denominations;
      }

      console.log("📤 Closing register payload:", payload);

      // Close the register
      await closeRegister(payload).unwrap();
      localStorage.removeItem("pos_session");

      // Call the callback to notify parent that register is closed
      if (onRegisterClosed) {
        onRegisterClosed();
      }

      setStep("generating");

      // Generate shift report
      const reportResult = await generateShiftReport(register.id).unwrap();
      setShiftReport(reportResult?.data);

      setStep("done");
    } catch (err: any) {
      console.error("Close register error:", err);
      setError(
        err?.data?.message || "Failed to close register. Please try again."
      );
      setStep("form");
    }
  };

  const handleDone = () => {
    setStep("form");
    setDenominations({});
    setManualClosingBalance("");
    setClosingNotes("");
    setShiftReport(null);
    setUseDenominationMode(true);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div
          className={`px-6 py-5 sticky top-0 ${step === "done" ? "bg-green-600" : "bg-red-600"
            }`}
        >
          <h2 className="text-xl font-bold text-white">
            {step === "done" ? "✓ Register Closed" : "Close Register"}
          </h2>
          <p className="text-white/70 text-sm mt-0.5">
            {step === "form" && "Count cash denominations to close your shift"}
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
          {step === "done" && shiftReport && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-600 text-sm">
                  Shift closed & report saved
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                {[
                  {
                    label: "Total Sales",
                    value: `KWD ${parseFloat(shiftReport.total_sales || 0).toFixed(
                      3
                    )}`,
                  },
                  {
                    label: "Total Transactions",
                    value: shiftReport.total_transactions || 0,
                  },
                  {
                    label: "Opening Balance",
                    value: `KWD ${parseFloat(
                      shiftReport.opening_balance || 0
                    ).toFixed(3)}`,
                  },
                  {
                    label: "Closing Balance",
                    value: `KWD ${parseFloat(
                      shiftReport.closing_balance || 0
                    ).toFixed(3)}`,
                  },
                  {
                    label: "Cash Difference",
                    value: `KWD ${parseFloat(
                      shiftReport.cash_difference || 0
                    ).toFixed(3)}`,
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-semibold text-gray-900">{value}</span>
                  </div>
                ))}
              </div>

              {/* Show counted denominations in done step */}
              {shiftReport.denominations && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">
                    Cash Count Breakdown
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {KUWAIT_DENOMINATIONS.map((denom) => {
                      const count = shiftReport.denominations[denom.value] || 0;
                      if (count > 0) {
                        return (
                          <div key={denom.value} className="flex justify-between">
                            <span className="text-gray-600">{denom.label}</span>
                            <span className="font-medium">
                              {count} × {denom.value} KWD ={" "}
                              {(count * denom.value).toFixed(3)} KWD
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
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
                    Expected Balance (System):
                  </span>{" "}
                  KWD {expectedBalance.toFixed(3)}
                </p>
              </div>

              {/* Toggle between denomination count and manual entry */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setUseDenominationMode(true);
                    setManualClosingBalance("");
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${useDenominationMode
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  Count Denominations
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseDenominationMode(false);
                    setDenominations({});
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!useDenominationMode
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  Enter Total Manually
                </button>
              </div>

              {/* Denomination Counting */}
              {useDenominationMode && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Count Cash by Denomination
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {KUWAIT_DENOMINATIONS.map((denom) => (
                      <div
                        key={denom.value}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-gray-700 w-20">
                            {denom.label}
                          </span>
                          {denom.type === "note" ? (
                            <span className="text-xs text-gray-400">Note</span>
                          ) : (
                            <span className="text-xs text-gray-400">Coin</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleDenominationChange(
                                denom.value,
                                (denominations[denom.value] || 0) - 1
                              )
                            }
                            className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-lg hover:bg-gray-300 text-lg font-bold"
                            disabled={(denominations[denom.value] || 0) <= 0}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={denominations[denom.value] || 0}
                            onChange={(e) =>
                              handleDenominationChange(
                                denom.value,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-16 text-center px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleDenominationChange(
                                denom.value,
                                (denominations[denom.value] || 0) + 1
                              )
                            }
                            className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-lg hover:bg-blue-700 text-white text-lg font-bold"
                          >
                            +
                          </button>
                          <span className="text-sm text-gray-500 w-24 text-right">
                            = {(denominations[denom.value] || 0) * denom.value} KWD
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total from denominations */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">
                        Total Cash Counted:
                      </span>
                      <span className="text-xl font-bold text-blue-600">
                        KWD {closingBalance.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Entry Mode */}
              {!useDenominationMode && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Closing Balance (KD) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="1000000"
                    value={manualClosingBalance}
                    onChange={(e) => setManualClosingBalance(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-lg font-semibold"
                    placeholder="0.000"
                  />
                </div>
              )}

              {/* Difference Display */}
              {closingBalance > 0 && (
                <div
                  className={`p-3 rounded-lg ${difference === 0
                      ? "bg-green-50 border border-green-200"
                      : difference > 0
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">
                      Expected Balance:
                    </span>
                    <span className="font-semibold">KWD {expectedBalance.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-medium text-gray-700">
                      Difference:
                    </span>
                    <span
                      className={`font-bold text-lg ${difference === 0
                          ? "text-green-600"
                          : difference > 0
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                    >
                      {difference === 0
                        ? "✓ Balanced"
                        : difference > 0
                          ? `+ KWD ${difference.toFixed(3)} (Over)`
                          : `- KWD ${Math.abs(difference).toFixed(3)} (Short)`}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Closing Notes (Optional)
                </label>
                <textarea
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-sm"
                  rows={2}
                  placeholder="Add any notes about this shift or discrepancies..."
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
                  disabled={
                    (!useDenominationMode && !manualClosingBalance) ||
                    isClosing ||
                    isGenerating
                  }
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