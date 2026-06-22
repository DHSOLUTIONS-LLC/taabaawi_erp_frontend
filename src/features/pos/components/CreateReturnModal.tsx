// src/features/pos/components/CreateReturnModal.tsx
import { useState, useEffect } from 'react';
import { useGetSaleByIdQuery, useCreateReturnMutation } from '../../../services/posApi';
import ReturnReceiptModal from './ReturnReceiptModal';

interface CreateReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  saleId?: number;
}

type RefundMethod = 'Cash' | 'Card' | 'Store Credit';

export default function CreateReturnModal({ isOpen, onClose, onSuccess, saleId: initialSaleId }: CreateReturnModalProps) {
  const [saleIdInput, setSaleIdInput] = useState(initialSaleId?.toString() || '');
  const [lookupSaleId, setLookupSaleId] = useState<number | undefined>(initialSaleId);
  const [showReceipt, setShowReceipt] = useState(false);
  const [returnData, setReturnData] = useState<any>(null);
  const [returnId, setReturnId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<{
    sale_item_id: number;
    quantity: number;
    max_quantity: number;
    condition: string;
    unit_price: number;
    product_name: string;
    variant_name?: string;
    total: number;
  }[]>([]);
  const [refundMethod, setRefundMethod] = useState<RefundMethod>('Cash');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  // Sync when saleId prop changes — useState only runs on first mount
  // so if modal is already mounted and saleId updates, we need useEffect
  useEffect(() => {
    if (initialSaleId) {
      setSaleIdInput(initialSaleId.toString());
      setLookupSaleId(initialSaleId);
      setSelectedItems([]);
    }
  }, [initialSaleId]);

  // Reset everything when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (!initialSaleId) {
        setSaleIdInput('');
        setLookupSaleId(undefined);
      }
      setSelectedItems([]);
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const { data: saleResponse, isLoading: saleLoading, error: saleError } = useGetSaleByIdQuery(lookupSaleId!, {
    skip: !lookupSaleId,
  });
  const sale = saleResponse?.data;

  const [createReturn, { isLoading }] = useCreateReturnMutation();

  const handleLookupSale = () => {
    const id = parseInt(saleIdInput);
    if (!isNaN(id) && id > 0) {
      setLookupSaleId(id);
      setSelectedItems([]);
    }
  };

  const handleToggleItem = (item: any) => {
    const exists = selectedItems.find(s => s.sale_item_id === item.id);
    if (exists) {
      setSelectedItems(prev => prev.filter(s => s.sale_item_id !== item.id));
    } else {
      setSelectedItems(prev => [...prev, {
        sale_item_id: item.id,
        quantity: 1,
        max_quantity: item.quantity,
        condition: 'Good',
        unit_price: parseFloat(item.unit_price),
        product_name: item.product?.product_name || '',
        variant_name: item.variant?.variant_name,
        total: parseFloat(item.total),
      }]);
    }
  };

  const handleQtyChange = (saleItemId: number, qty: number) => {
    setSelectedItems(prev => prev.map(s =>
      s.sale_item_id === saleItemId
        ? { ...s, quantity: Math.max(1, Math.min(qty, s.max_quantity)) }
        : s
    ));
  };

  const handleConditionChange = (saleItemId: number, condition: string) => {
    setSelectedItems(prev => prev.map(s =>
      s.sale_item_id === saleItemId ? { ...s, condition } : s
    ));
  };

  const returnTotal = selectedItems.reduce((sum, item) => {
    const saleItem = sale?.items?.find((i: any) => i.id === item.sale_item_id);
    if (!saleItem) return sum;
    return sum + (parseFloat(saleItem.total) / saleItem.quantity) * item.quantity;
  }, 0);

  const handleSubmit = async () => {
    setError('');
    if (!lookupSaleId) { setError('Please look up a sale first'); return; }
    if (selectedItems.length === 0) { setError('Please select at least one item to return'); return; }

    try {
      const result = await createReturn({
        sale_id: lookupSaleId,
        refund_method: refundMethod,
        reason,
        items: selectedItems.map(item => ({
          sale_item_id: item.sale_item_id,
          quantity: item.quantity,
          condition: item.condition,
        })),
      }).unwrap();

      console.log('✅ Return successful:', result);

      // Store return data for receipt
      const returnIdValue = result.data?.id || result?.id || null;
      setReturnData(result.data);
      setReturnId(returnIdValue);
      setShowReceipt(true);

      // DON'T reset form or close modal - keep it open behind the receipt
      // Only reset after receipt is closed via onNewReturn or onClose

    } catch (err: any) {
      console.error('❌ Return error:', err);
      setError(err?.data?.message || 'Failed to process return');
    }
  };

  if (!isOpen) return null;

  const refundMethods: RefundMethod[] = ['Cash', 'Card', 'Store Credit'];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4  text-center sm:py-5 flex items-center justify-between shrink-0">
          <div className="min-w-0 flex-1 pr-2">
            <h2 className="text-lg sm:text-xl font-bold text-black truncate">Process Return</h2>
            <p className="text-black text-xs sm:text-sm mt-0.5 truncate">Select items to return from a sale</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white shrink-0 ml-2">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Sale Lookup */}
          {!initialSaleId && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sale ID / Receipt Number</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  value={saleIdInput}
                  onChange={(e) => setSaleIdInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookupSale()}
                  placeholder="Enter Sale ID..."
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
                <button
                  onClick={handleLookupSale}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#1773CF] text-white rounded-lg hover:bg-blue-700 font-medium text-sm sm:text-base"
                >
                  Look Up
                </button>
              </div>
            </div>
          )}

          {/* Sale Info */}
          {saleLoading && (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {saleError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
              Sale not found. Please check the ID and try again.
            </div>
          )}

          {sale && (
            <>
              {/* Sale Summary */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 sm:p-4 text-sm">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div>
                    <p className="text-blue-600 text-xs font-medium">Sale #</p>
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm break-words">{sale.sale_number}</p>
                  </div>
                  <div>
                    <p className="text-blue-600 text-xs font-medium">Total</p>
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm break-words">KWD {parseFloat(sale.total_amount).toFixed(3)}</p>
                  </div>
                  <div>
                    <p className="text-blue-600 text-xs font-medium">Status</p>
                    <span className={`inline-block px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${sale.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{sale.status}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Select Items to Return</p>
                <div className="space-y-2 sm:space-y-3">
                  {sale.items?.map((item: any) => {
                    const selected = selectedItems.find(s => s.sale_item_id === item.id);
                    return (
                      <div
                        key={item.id}
                        className={`border-2 rounded-xl p-3 sm:p-4 transition-all ${selected ? 'border-[#1773CF] bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                          <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={() => handleToggleItem(item)}
                            className="mt-0.5 sm:mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 text-sm sm:text-base break-words">{item.product?.product_name}</p>
                                {item.variant && <p className="text-xs text-gray-500 break-words">{item.variant.variant_name}</p>}
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Qty: {item.quantity} × KWD {parseFloat(item.unit_price).toFixed(3)}
                                </p>
                              </div>
                              <p className="font-semibold text-gray-900 text-sm sm:text-base shrink-0">KWD {parseFloat(item.total).toFixed(3)}</p>
                            </div>

                            {selected && (
                              <div className="mt-3 flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Return Qty</label>
                                  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1 w-fit">
                                    <button
                                      onClick={() => handleQtyChange(item.id, selected.quantity - 1)}
                                      className="text-gray-500 hover:text-gray-700 w-5 h-5 flex items-center justify-center"
                                    >−</button>
                                    <span className="w-8 text-center font-medium text-sm">{selected.quantity}</span>
                                    <button
                                      onClick={() => handleQtyChange(item.id, selected.quantity + 1)}
                                      className="text-gray-500 hover:text-gray-700 w-5 h-5 flex items-center justify-center"
                                    >+</button>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <label className="text-xs text-gray-600 mb-1 block">Condition</label>
                                  <select
                                    value={selected.condition}
                                    onChange={(e) => handleConditionChange(item.id, e.target.value)}
                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="Good">Good</option>
                                    <option value="Damaged">Damaged</option>
                                    <option value="Defective">Defective</option>
                                    <option value="Wrong Item">Wrong Item</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Refund Method */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Refund Method</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {refundMethods.map(method => (
                    <button
                      key={method}
                      onClick={() => setRefundMethod(method)}
                      className={`py-2 sm:py-2.5 rounded-xl border-2 text-xs sm:text-sm font-medium transition-all ${refundMethod === method
                        ? 'border-[#1773CF] bg-blue-50 text-[#1773CF]'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason (Optional)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  placeholder="Reason for return..."
                />
              </div>

              {/* Return Summary */}
              {selectedItems.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Return Summary</p>
                      <p className="text-xs text-amber-600">{selectedItems.length} item(s) selected</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-amber-600">Refund Amount</p>
                      <p className="text-lg sm:text-xl font-bold text-amber-800">KWD {returnTotal.toFixed(3)}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-300 bg-gray-50 flex gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2 sm:py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || selectedItems.length === 0 || !sale}
            className="flex-1 py-2 sm:py-3 bg-[#1773CF] text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {isLoading ? 'Processing...' : `Process Return — KWD ${returnTotal.toFixed(3)}`}
          </button>
        </div>
      </div>
      <ReturnReceiptModal
        isOpen={showReceipt}
        onClose={() => {
          setShowReceipt(false);
          setReturnId(null);
          onClose();
        }}
        returnId={returnId || 0}
        onNewReturn={() => {
          setShowReceipt(false);
          setReturnId(null);
          onClose();
        }}
      />
    </div>
  );
}