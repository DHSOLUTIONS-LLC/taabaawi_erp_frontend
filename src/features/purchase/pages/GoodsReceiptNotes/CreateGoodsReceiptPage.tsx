// src/features/purchase/pages/goods-receipts/CreateGoodsReceiptPage.tsx
import { useState, useEffect } from 'react';
import {  useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import {
  useCreateGoodsReceiptNoteMutation,
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
} from '../../../../services/purchaseApi';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';
// import check_icon from '../../../../assets/icons/check_icon.svg';
import warning_icon from '../../../../assets/icons/warning _icon.png';

interface ReceiptItem {
  po_item_id: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity_ordered: number;
  quantity_received: number;
  quantity_receiving: number;
  quantity_accepted: number;
  quantity_rejected: number;
  condition: 'Good' | 'Damaged' | 'Defective' | 'Expired';
  notes: string;
  unit_price: number;
}

export default function CreateGoodsReceiptPage() {
  const navigate = useNavigate();
  const { poId: prefilledPoId } = useParams<{ poId?: string }>();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const [selectedPoId, setSelectedPoId] = useState<string>(prefilledPoId ?? '');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [supplierInvoiceDate, setSupplierInvoiceDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [createReceipt, { isLoading }] = useCreateGoodsReceiptNoteMutation();

  // Load all POs that can be received
const { 
  data: posData, 
  isLoading: posLoading, 
  isSuccess: posSuccess 
} = useGetPurchaseOrdersQuery({
  per_page: 200,
});

console.log('posData:', posData);
console.log('posLoading:', posLoading);
console.log('posSuccess:', posSuccess);

  const allPOs = (() => {
  if (!posSuccess || !posData) return [];
  
  const raw = posData as any;
  console.log('Raw response:', raw);
  
  // Try different response structures
  if (raw?.data?.data && Array.isArray(raw.data.data)) {
    return raw.data.data;
  } else if (raw?.data && Array.isArray(raw.data)) {
    return raw.data;
  } else if (Array.isArray(raw)) {
    return raw;
  }
  
  return [];
})();

console.log('Extracted POs:', allPOs);

const approvedPOs = allPOs.filter((p: any) => 
  p?.status === 'Approved' || p?.status === 'Ordered' || p?.status === 'Partially Received'
);
const otherPOs = allPOs.filter((p: any) => 
  p?.status && !['Approved', 'Ordered', 'Partially Received', 'Cancelled', 'Draft'].includes(p.status)
);

  // Load selected PO details
  const { data: poData } = useGetPurchaseOrderByIdQuery(
    parseInt(selectedPoId),
    { skip: !selectedPoId }
  );
  const po = poData?.data;

  // Initialize items when PO loads
  useEffect(() => {
    if (po?.items) {
      setItems(
        po.items.map((item: any) => {
          const ordered = parseFloat(item.quantity_ordered) || 0;
          const received = parseFloat(item.quantity_received) || 0;
          const remaining = ordered - received;
          
          return {
            po_item_id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            sku: item.sku ?? '',
            quantity_ordered: ordered,
            quantity_received: received,
            quantity_receiving: remaining,
            quantity_accepted: remaining,
            quantity_rejected: 0,
            condition: 'Good',
            notes: '',
            unit_price: parseFloat(item.unit_price) || 0,
          };
        })
      );
    }
  }, [po]);

  const updateItem = (idx: number, updates: Partial<ReceiptItem>) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[idx] = { ...newItems[idx], ...updates };
      
      // Auto-calculate accepted/rejected
      const item = newItems[idx];
      if (updates.quantity_receiving !== undefined) {
        item.quantity_accepted = updates.quantity_receiving;
        item.quantity_rejected = 0;
      }
      if (updates.quantity_accepted !== undefined) {
        item.quantity_rejected = item.quantity_receiving - updates.quantity_accepted;
      }
      if (updates.quantity_rejected !== undefined) {
        item.quantity_accepted = item.quantity_receiving - updates.quantity_rejected;
      }
      
      return newItems;
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedPoId) errs.po = 'Select a purchase order';
    if (!receiptDate) errs.date = 'Receipt date is required';
    
    // Validate each item
    items.forEach((item, idx) => {
      if (item.quantity_receiving > (item.quantity_ordered - item.quantity_received)) {
        errs[`item_${idx}`] = `Cannot receive more than remaining quantity for ${item.product_name}`;
      }
      if (item.quantity_accepted < 0 || item.quantity_rejected < 0) {
        errs[`item_${idx}`] = `Invalid quantities for ${item.product_name}`;
      }
    });
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const payload = {
        purchase_order_id: parseInt(selectedPoId),
        branch_id: po?.branch_id,
        receipt_date: receiptDate,
        supplier_invoice_number: supplierInvoiceNumber || undefined,
        supplier_invoice_date: supplierInvoiceDate || undefined,
        notes: notes || undefined,
        items: items
          .filter(item => item.quantity_receiving > 0)
          .map(item => ({
            po_item_id: item.po_item_id,
            quantity_received: item.quantity_receiving,
            quantity_accepted: item.quantity_accepted,
            quantity_rejected: item.quantity_rejected,
            condition: item.condition,
            notes: item.notes || undefined,
          })),
      };

      const result = await createReceipt(payload).unwrap();
      navigate(`${basePath}/purchase/goods-receipts/${(result as any).data?.id || (result as any).id}`);
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to create receipt');
    }
  };

  const hasDiscrepancy = items.some(
    item => item.quantity_receiving > 0 && (
      item.quantity_accepted !== item.quantity_receiving ||
      item.condition !== 'Good'
    )
  );

  return (
   <DashboardLayout>
  <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
    {/* Header - Responsive */}
    <div className="flex items-center gap-3 md:gap-4">
      <button onClick={() => navigate(`${basePath}/purchase/goods-receipts`)} className="shrink-0">
        <img src={arrow_back_icon} alt="" className="w-6 h-6 md:w-8 md:h-8" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 break-words">Create Goods Receipt</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5">Receive items from a purchase order</p>
      </div>
    </div>

    {/* Main Content - Responsive Layout */}
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
      
      {/* Left Column - Full width on mobile, 2/3 on desktop */}
      <div className="lg:col-span-2 space-y-4 md:space-y-6 order-2 lg:order-1">
        
        {/* PO Selection */}
        <div className="bg-white rounded-xl p-2">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Purchase Order</h2>
          <div className="relative">
            <select
              value={selectedPoId}
              onChange={(e) => { setSelectedPoId(e.target.value); setErrors({}); }}
              disabled={!!prefilledPoId || posLoading}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg appearance-none bg-white pr-8 sm:pr-10 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                errors.po ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <option value="">Select a purchase order...</option>
              
              {posLoading ? (
                <option disabled>Loading purchase orders...</option>
              ) : !posSuccess ? (
                <option disabled>Failed to load orders</option>
              ) : allPOs.length === 0 ? (
                <option disabled>No purchase orders found</option>
              ) : (
                <>
                  {approvedPOs.length > 0 && (
                    <optgroup label="✓ Available for Receipt">
                      {approvedPOs.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.po_number || `PO #${p.id}`} — {p.supplier?.supplier_name || 'Unknown'} ({p.status})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  
                  {otherPOs.length > 0 && (
                    <optgroup label="⛔ Cannot Receive (Wrong Status)">
                      {otherPOs.map((p: any) => (
                        <option key={p.id} value={p.id} disabled className="text-gray-400">
                          {p.po_number || `PO #${p.id}`} — {p.supplier?.supplier_name || 'Unknown'} ({p.status})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </>
              )}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
              <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
          {errors.po && <p className="text-xs text-red-500 mt-1">{errors.po}</p>}

          {/* PO Info - Responsive Grid */}
          {po && (
            <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Supplier</p>
                <p className="font-medium text-gray-900 break-words">{po.supplier?.supplier_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">PO Total</p>
                <p className="font-medium text-blue-700 break-words">{po.currency} {(po.total_amount || 0).toFixed(3)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-medium text-gray-900">{po.status}</p>
              </div>
            </div>
          )}
        </div>

        {/* Receipt Details */}
        {po && (
          <div className="bg-white rounded-xl p-2">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Receipt Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Receipt Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
                {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Supplier Invoice #
                </label>
                <input
                  type="text"
                  value={supplierInvoiceNumber}
                  onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                  placeholder="INV-2025-001"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={supplierInvoiceDate}
                  onChange={(e) => setSupplierInvoiceDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Additional notes about this receipt..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        )}

        {/* Items to Receive */}
        {po && items.length > 0 && (
          <div className="bg-white rounded-xl p-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-semibold text-gray-900">Items to Receive</h2>
              {hasDiscrepancy && (
                <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-lg text-xs sm:text-sm">
                  <img src={warning_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Discrepancies detected</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => {
                const remaining = item.quantity_ordered - item.quantity_received;
                if (remaining <= 0) return null;

                return (
                  <div key={item.po_item_id} className="border border-gray-200 rounded-xl p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 break-words">{item.product_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">SKU: {item.sku}</p>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <p className="text-xs sm:text-sm text-gray-600">Ordered: {item.quantity_ordered}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Previously Received: {item.quantity_received}</p>
                        <p className="text-xs sm:text-sm font-semibold text-blue-600">Remaining: {remaining}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Receiving</label>
                        <input
                          type="number"
                          min={0}
                          max={remaining}
                          value={item.quantity_receiving}
                          onChange={(e) => updateItem(idx, { 
                            quantity_receiving: Math.min(remaining, parseInt(e.target.value) || 0)
                          })}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Accepted</label>
                        <input
                          type="number"
                          min={0}
                          max={item.quantity_receiving}
                          value={item.quantity_accepted}
                          onChange={(e) => updateItem(idx, { 
                            quantity_accepted: Math.min(item.quantity_receiving, parseInt(e.target.value) || 0)
                          })}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Rejected</label>
                        <input
                          type="number"
                          min={0}
                          max={item.quantity_receiving}
                          value={item.quantity_rejected}
                          onChange={(e) => updateItem(idx, { 
                            quantity_rejected: Math.min(item.quantity_receiving, parseInt(e.target.value) || 0)
                          })}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Condition</label>
                        <select
                          value={item.condition}
                          onChange={(e) => updateItem(idx, { condition: e.target.value as any })}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="Good">Good</option>
                          <option value="Damaged">Damaged</option>
                          <option value="Defective">Defective</option>
                          <option value="Expired">Expired</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-3">
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => updateItem(idx, { notes: e.target.value })}
                        placeholder="Item notes (optional)"
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>

                    {errors[`item_${idx}`] && (
                      <p className="text-xs text-red-500 mt-2">{errors[`item_${idx}`]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Full width on mobile, 1/3 on desktop */}
      <div className="space-y-4 md:space-y-6 order-1 lg:order-2">
        
        {/* Summary */}
        {po && items.length > 0 && (
          <div className="bg-white rounded-xl p-2">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Receipt Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Items</span>
                <span className="font-medium">{items.filter(i => i.quantity_receiving > 0).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Quantity</span>
                <span className="font-medium">
                  {items.reduce((sum, i) => sum + i.quantity_receiving, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Accepted</span>
                <span className="font-medium text-green-600">
                  {items.reduce((sum, i) => sum + i.quantity_accepted, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Rejected</span>
                <span className="font-medium text-red-600">
                  {items.reduce((sum, i) => sum + i.quantity_rejected, 0)}
                </span>
              </div>
              {hasDiscrepancy && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="bg-yellow-50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-yellow-800 mb-1">Discrepancy Alert</p>
                    <p className="text-xs text-yellow-700">
                      Some items have discrepancies. This will be noted in the receipt.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions - Responsive Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !selectedPoId || items.filter(i => i.quantity_receiving > 0).length === 0}
            className="w-full py-2.5 sm:py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {isLoading && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {isLoading ? 'Creating...' : 'Create Receipt'}
          </button>
          <button
            onClick={() => navigate(`${basePath}/purchase/goods-receipts`)}
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