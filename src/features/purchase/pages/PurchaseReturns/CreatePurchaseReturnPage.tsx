// src/features/purchase/pages/PurchaseReturns/CreatePurchaseReturnPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import {
  useCreatePurchaseReturnMutation,
  useGetPurchaseOrderByIdQuery,
  useGetPurchaseOrdersQuery,
} from '../../../../services/purchaseApi';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

const RETURN_REASONS = ['Damaged', 'Defective', 'Wrong Item', 'Excess Quantity', 'Other'] as const;

interface ReturnItem {
  po_item_id: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity_received: number;
  unit_price: number;
  return_quantity: number;
  selected: boolean;
}

export default function CreatePurchaseReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  // Pre-fill PO if coming from PO detail page
  const prefilledPoId = searchParams.get('po_id');

  const [selectedPoId, setSelectedPoId] = useState<string>(prefilledPoId ?? '');
  const [reason, setReason] = useState<typeof RETURN_REASONS[number]>('Damaged');
  const [reasonDetails, setReasonDetails] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [createReturn, { isLoading }] = useCreatePurchaseReturnMutation();

  // Load all POs - filter to received ones; falls back to all approved/ordered if none received yet
  const { data: posData } = useGetPurchaseOrdersQuery({ per_page: 200 });

  const allPOs = (() => {
    const raw = posData as any;
    const list: any[] =
      Array.isArray(raw?.data?.data) ? raw.data.data :
      Array.isArray(raw?.data)       ? raw.data :
      Array.isArray(raw)             ? raw : [];

    // Prefer fully/partially received, fallback to any non-cancelled PO for testing
    const received = list.filter((p: any) =>
      p.status === 'Received' || p.status === 'Partially Received'
    );
    return received.length > 0
      ? received
      : list.filter((p: any) => !['Cancelled', 'Draft'].includes(p.status));
  })();

  // Load selected PO details
  const { data: poData } = useGetPurchaseOrderByIdQuery(
    parseInt(selectedPoId),
    { skip: !selectedPoId }
  );
  const po = poData?.data;

  // Populate return items when PO loads
  useEffect(() => {
    if (po?.items) {
      setReturnItems(
        po.items.map((item: any) => ({
          po_item_id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          sku: item.sku ?? '',
          quantity_received: parseFloat(item.quantity_received) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
          return_quantity: 1,
          selected: false,
        }))
      );
    }
  }, [po]);

  const toggleItem = (idx: number) =>
    setReturnItems((prev) => prev.map((item, i) => i === idx ? { ...item, selected: !item.selected } : item));

  const updateQty = (idx: number, qty: number) =>
    setReturnItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, return_quantity: Math.max(1, Math.min(item.quantity_received, qty)) } : item
      )
    );

  const selectedItems = returnItems.filter((i) => i.selected);
  const returnTotal = selectedItems.reduce((sum, i) => sum + i.unit_price * i.return_quantity, 0);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedPoId) errs.po = 'Select a purchase order';
    if (selectedItems.length === 0) errs.items = 'Select at least one item to return';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      const res = await createReturn({
        purchase_order_id: parseInt(selectedPoId),
        supplier_id: po!.supplier_id,
        branch_id: po!.branch_id,
        return_date: returnDate,
        reason,
        reason_details: reasonDetails || null,
        currency: po!.currency,
        items: selectedItems.map((item) => ({
          po_item_id: item.po_item_id,
          product_id: item.product_id,
          quantity: item.return_quantity,
          unit_price: item.unit_price,
          total: item.unit_price * item.return_quantity,
        })),
      }).unwrap() as any;
      const returnId = res?.data?.id;
      navigate(returnId ? `${basePath}/purchase/returns/${returnId}` : `${basePath}/purchase/returns`);
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to create return');
    }
  };

  return (
    <DashboardLayout>
  <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">

    {/* Header - Responsive */}
    <div className="flex items-center gap-3 md:gap-4">
      <button onClick={() => navigate(`${basePath}/purchase/returns`)} className="shrink-0">
        <img src={arrow_back_icon} alt="" className="w-6 h-6 md:w-8 md:h-8" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 break-words">Create Purchase Return</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5">Return items from a received purchase order</p>
      </div>
    </div>

    {/* Main Content - Responsive Layout */}
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
      
      {/* Left Column - Full width on mobile, 2/3 on desktop */}
      <div className="lg:col-span-2 space-y-4 md:space-y-6 order-2 lg:order-1">
        
        {/* PO Selection */}
        <div className="bg-white rounded-xl p-4 md:p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Select Purchase Order</h2>
          <div className="relative">
            <select
              value={selectedPoId}
              onChange={(e) => { setSelectedPoId(e.target.value); setErrors({}); }}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md appearance-none bg-white pr-8 sm:pr-10 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                errors.po ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <option value="">Select a received PO...</option>
              {allPOs.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.po_number} — {p.supplier?.supplier_name} ({p.status})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
              <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
          {errors.po && <p className="text-xs text-red-500 mt-1">{errors.po}</p>}

          {/* PO Quick Info - Responsive Grid */}
          {po && (
            <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Supplier</p>
                <p className="font-medium text-gray-900 break-words">{po.supplier?.supplier_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">PO Total</p>
                <p className="font-medium text-blue-700 break-words">{po.currency} {parseFloat(String(po.total_amount)).toFixed(3)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-medium text-gray-900">{po.status}</p>
              </div>
            </div>
          )}
        </div>

        {/* Items Selection */}
        {po && returnItems.length > 0 && (
          <div className="bg-white rounded-xl p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h2 className="text-base font-semibold text-gray-900">Select Items to Return</h2>
              <p className="text-xs text-gray-500">{selectedItems.length} of {returnItems.length} selected</p>
            </div>

            {errors.items && (
              <p className="text-xs text-red-500 mb-3">{errors.items}</p>
            )}

            <div className="space-y-3">
              {returnItems.map((item, idx) => (
                <div
                  key={item.po_item_id}
                  className={`border rounded-xl p-3 sm:p-4 transition-colors cursor-pointer ${
                    item.selected ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  } ${item.quantity_received <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                  onClick={() => item.quantity_received > 0 && toggleItem(idx)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => item.quantity_received > 0 && toggleItem(idx)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={item.quantity_received <= 0}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded shrink-0"
                      />
                      <div className="flex-1 min-w-0 sm:hidden">
                        <p className="text-sm font-medium text-gray-900 break-words">{item.product_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">SKU: {item.sku}</p>
                        <p className="text-xs text-gray-500">Received: {item.quantity_received}</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Desktop view */}
                      <div className="hidden sm:block">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                          <p className="text-sm font-semibold text-blue-600 ml-2 shrink-0">
                            {po.currency} {(item.unit_price * item.return_quantity).toFixed(3)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">SKU: {item.sku} · Received: {item.quantity_received}</p>
                      </div>

                      {/* Mobile view price */}
                      <div className="sm:hidden flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500">Return value:</p>
                        <p className="text-sm font-semibold text-blue-600">
                          {po.currency} {(item.unit_price * item.return_quantity).toFixed(3)}
                        </p>
                      </div>

                      {item.selected && (
                        <div className="mt-3 flex flex-wrap items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          <label className="text-xs text-gray-600 shrink-0">Return Qty:</label>
                          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateQty(idx, item.return_quantity - 1)}
                              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold text-sm"
                            >−</button>
                            <input
                              type="number"
                              min={1}
                              max={item.quantity_received}
                              value={item.return_quantity}
                              onChange={(e) => updateQty(idx, parseInt(e.target.value) || 1)}
                              className="w-10 sm:w-12 h-7 sm:h-8 text-center text-sm border-0 focus:ring-0 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => updateQty(idx, item.return_quantity + 1)}
                              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold text-sm"
                            >+</button>
                          </div>
                          <span className="text-xs text-gray-500">max {item.quantity_received}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Full width on mobile, 1/3 on desktop */}
      <div className="space-y-4 md:space-y-6 order-1 lg:order-2">
        
        {/* Return Details */}
        <div className="bg-white rounded-xl p-4 md:p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Return Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Return Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={returnDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {RETURN_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`w-full px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium border text-left transition-colors ${
                    reason === r
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Additional Details <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
              rows={3}
              placeholder="Describe the issue in more detail..."
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            />
          </div>
        </div>

        {/* Summary */}
        {selectedItems.length > 0 && po && (
          <div className="bg-white rounded-xl p-4 md:p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Return Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Items</span>
                <span className="font-medium">{selectedItems.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Qty</span>
                <span className="font-medium">{selectedItems.reduce((s, i) => s + i.return_quantity, 0)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="text-sm font-semibold">Return Value</span>
                <span className="text-base md:text-lg font-bold text-blue-600 break-words">
                  {po.currency} {returnTotal.toFixed(3)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions - Responsive Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !selectedPoId}
            className="w-full py-2.5 sm:py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {isLoading && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {isLoading ? 'Submitting...' : 'Submit Return'}
          </button>
          <button
            onClick={() => navigate(`${basePath}/purchase/returns`)}
            className="w-full py-2.5 sm:py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</DashboardLayout>
  );
}