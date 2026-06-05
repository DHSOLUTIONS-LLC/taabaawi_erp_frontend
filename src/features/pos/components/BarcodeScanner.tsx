// src/features/pos/components/BarcodeScannerPopup.tsx
import { useState, useEffect, useRef } from "react";
import { useScanBarcodeMutation } from "../../../services/posApi";
import barcode_icon from "../../../assets/icons/barcode_icon.svg";

interface BarcodeScannerPopupProps {
  onClose: () => void;
  onProductFound: (product: any) => void;
  branchId: number;
}

export default function BarcodeScannerPopup({
  onClose,
  onProductFound,
  branchId,
}: BarcodeScannerPopupProps) {
  const [barcode, setBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [scanBarcode, { isLoading }] = useScanBarcodeMutation();

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  const handleBarcodeSubmit = async () => {
    if (!barcode.trim()) {
      setError("Please scan or enter a barcode");
      return;
    }

    setError("");
    setIsScanning(true);

    try {
      const result = await scanBarcode({
        barcode: barcode.trim(),
        branch_id: branchId,
      }).unwrap();

      if (result.success && result.data) {
        console.log("✅ Barcode scan successful:", result.data);
        onProductFound(result.data);
        onClose();
      } else {
        setError(result.message || "Product not found");
      }
    } catch (err: any) {
      console.error("Barcode scan error:", err);
      setError(err?.data?.message || "Product not found");
    } finally {
      setIsScanning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBarcodeSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Scan Barcode</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <img
                  src={barcode_icon}
                  alt=""
                  className="w-5 h-5 text-gray-400"
                />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Scan barcode or enter manually..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm"
                disabled={isLoading || isScanning}
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBarcodeSubmit}
                disabled={!barcode.trim() || isLoading || isScanning}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading || isScanning ? "Adding..." : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
