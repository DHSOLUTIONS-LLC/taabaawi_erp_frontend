// src/features/pos/components/CreateReturnModal.tsx
import { useState, useEffect } from 'react';
import { useGetSaleByIdQuery, useCreateReturnMutation } from '../../../services/posApi';

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
      await createReturn({
        sale_id: lookupSaleId,
        refund_method: refundMethod,
        reason,
        items: selectedItems.map(item => ({
          sale_item_id: item.sale_item_id,
          quantity: item.quantity,
          condition: item.condition,
        })),
      }).unwrap();
      onSuccess();
      onClose();
      // Reset
      setSaleIdInput('');
      setLookupSaleId(undefined);
      setSelectedItems([]);
      setReason('');
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to process return');
    }
  };

  if (!isOpen) return null;

  const refundMethods: RefundMethod[] = ['Cash', 'Card', 'Store Credit'];

  return (
    <div className="fixed inset-0  flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1773CF] px-6 py-5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Process Return</h2>
            <p className="text-blue-100 text-sm mt-0.5">Select items to return from a sale</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Sale Lookup */}
          {!initialSaleId && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sale ID / Receipt Number</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={saleIdInput}
                  onChange={(e) => setSaleIdInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookupSale()}
                  placeholder="Enter Sale ID..."
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleLookupSale}
                  className="px-5 py-2.5 bg-[#1773CF] text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Look Up
                </button>
              </div>
            </div>
          )}

          {/* Sale Info */}
          {saleLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {saleError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              Sale not found. Please check the ID and try again.
            </div>
          )}

          {sale && (
            <>
              {/* Sale Summary */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-blue-600 text-xs font-medium">Sale #</p>
                    <p className="font-semibold text-gray-900">{sale.sale_number}</p>
                  </div>
                  <div>
                    <p className="text-blue-600 text-xs font-medium">Total</p>
                    <p className="font-semibold text-gray-900">KD {parseFloat(sale.total_amount).toFixed(3)}</p>
                  </div>
                  <div>
                    <p className="text-blue-600 text-xs font-medium">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      sale.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{sale.status}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Select Items to Return</p>
                <div className="space-y-3">
                  {sale.items?.map((item: any) => {
                    const selected = selectedItems.find(s => s.sale_item_id === item.id);
                    return (
                      <div
                        key={item.id}
                        className={`border-2 rounded-xl p-4 transition-all ${
                          selected ? 'border-[#1773CF] bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={() => handleToggleItem(item)}
                            className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{item.product?.product_name}</p>
                                {item.variant && <p className="text-xs text-gray-500">{item.variant.variant_name}</p>}
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Qty: {item.quantity} × KD {parseFloat(item.unit_price).toFixed(3)}
                                </p>
                              </div>
                              <p className="font-semibold text-gray-900">KD {parseFloat(item.total).toFixed(3)}</p>
                            </div>

                            {selected && (
                              <div className="mt-3 flex gap-4">
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Return Qty</label>
                                  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1">
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
                <div className="grid grid-cols-3 gap-2">
                  {refundMethods.map(method => (
                    <button
                      key={method}
                      onClick={() => setRefundMethod(method)}
                      className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        refundMethod === method
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  placeholder="Reason for return..."
                />
              </div>

              {/* Return Summary */}
              {selectedItems.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Return Summary</p>
                      <p className="text-xs text-amber-600">{selectedItems.length} item(s) selected</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-amber-600">Refund Amount</p>
                      <p className="text-xl font-bold text-amber-800">KD {returnTotal.toFixed(3)}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || selectedItems.length === 0 || !sale}
            className="flex-1 py-3 bg-[#1773CF] text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : `Process Return — KD ${returnTotal.toFixed(3)}`}
          </button>
        </div>
      </div>
    </div>
  );
}