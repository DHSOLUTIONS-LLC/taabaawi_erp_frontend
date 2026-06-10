// src/features/accounting/pages/accounts-payable/CreateAPPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import {
  useCreateAPMutation,
} from '../../../../services/accountingApi';
import { useGetPurchaseOrdersQuery, useGetSuppliersQuery } from '../../../../services/purchaseApi';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

const CURRENCIES = ['KWD', 'USD', 'EUR', 'GBP', 'SAR', 'AED'];

export default function CreateAPPage() {
  const navigate = useNavigate();
  const { poId } = useParams<{ poId?: string }>();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [formData, setFormData] = useState({
    supplier_id: '',
    purchase_order_id: poId || '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    invoice_amount: 0,
    currency: 'KWD',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [filteredPOs, setFilteredPOs] = useState<any[]>([]);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const [createAP, { isLoading }] = useCreateAPMutation();

  // Fetch suppliers
  const { data: suppliersData } = useGetSuppliersQuery({
    is_active: 1 as any,
    per_page: 1000,
  });
  const suppliers = (suppliersData as any)?.data?.data || (suppliersData as any)?.data || [];

  // Fetch purchase orders for dropdown
  const { data: posData } = useGetPurchaseOrdersQuery({
    per_page: 1000,
  });
  const purchaseOrders = (posData as any)?.data?.data || (posData as any)?.data || [];

  // Filter POs based on selected supplier
  useEffect(() => {
    if (formData.supplier_id) {
      const filtered = purchaseOrders.filter(
        (po: any) => po.supplier_id?.toString() === formData.supplier_id
      );
      setFilteredPOs(filtered);
    } else {
      setFilteredPOs([]);
    }
  }, [formData.supplier_id, purchaseOrders]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const supplierId = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      supplier_id: supplierId,
      purchase_order_id: '', // Reset PO when supplier changes
      invoice_number: '',
      invoice_amount: 0,
      currency: 'KWD',
    }));
  };

  const handlePOChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPOId = e.target.value;
    setFormData(prev => ({ ...prev, purchase_order_id: selectedPOId }));

    // Auto-fill fields based on selected PO
    if (selectedPOId) {
      const selectedPO = purchaseOrders.find((po: any) => po.id.toString() === selectedPOId);
      if (selectedPO) {
        setFormData(prev => ({
          ...prev,
          invoice_number: selectedPO.po_number || '',
          invoice_date: selectedPO.order_date ? new Date(selectedPO.order_date).toISOString().split('T')[0] : prev.invoice_date,
          due_date: selectedPO.expected_delivery_date ? new Date(selectedPO.expected_delivery_date).toISOString().split('T')[0] : prev.due_date,
          invoice_amount: selectedPO.total_amount || 0,
          currency: selectedPO.currency || 'KWD',
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        supplier_id: parseInt(formData.supplier_id),
        purchase_order_id: formData.purchase_order_id ? parseInt(formData.purchase_order_id) : undefined,
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        invoice_amount: parseFloat(formData.invoice_amount.toString()),
        currency: formData.currency,
        notes: formData.notes || undefined,
      };

      const result = await createAP(payload).unwrap();
      navigate(`${basePath}/accounting/accounts-payable/${(result as any).data?.id}`);
    } catch (err: any) {
      if (err.data?.errors) {
        setErrors(err.data.errors);
      } else {
        alert(err?.data?.message || 'Failed to create AP record');
      }
    }
  };

  const isPOSelected = !!formData.purchase_order_id;

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`${basePath}/accounting/accounts-payable`)}>
            <img src={arrow_back_icon} alt="" className="w-8 h-8" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Accounts Payable</h1>
            <p className="text-sm text-gray-500 mt-0.5">Record a new supplier invoice</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 space-y-6">
          {/* Supplier Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Supplier <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleSupplierChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier: any) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.supplier_name} ({supplier.company_name})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                </div>
              </div>
              {errors.supplier_id && (
                <p className="text-xs text-red-500 mt-1">{errors.supplier_id[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Purchase Order
              </label>
              <div className="relative">
                <select
                  name="purchase_order_id"
                  value={formData.purchase_order_id}
                  onChange={handlePOChange}
                  disabled={!formData.supplier_id}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Purchase Order</option>
                  {filteredPOs.map((po: any) => (
                    <option key={po.id} value={po.id}>
                      {po.po_number} - {po.currency} {parseFloat(po.total_amount).toFixed(3)}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                </div>
              </div>
              {!formData.supplier_id && (
                <p className="text-xs text-gray-400 mt-1">Select a supplier first to see their purchase orders</p>
              )}
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Invoice Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleChange}
                placeholder="e.g. INV-2025-001"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                required
                disabled={isPOSelected}
                readOnly={isPOSelected}
              />
              {errors.invoice_number && (
                <p className="text-xs text-red-500 mt-1">{errors.invoice_number[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="invoice_date"
                value={formData.invoice_date}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                required
                disabled={isPOSelected}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                min={formData.invoice_date}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                required
                disabled={isPOSelected}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Currency
              </label>
              <div className="relative">
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  disabled={isPOSelected}
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Invoice Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.001"
              name="invoice_amount"
              value={formData.invoice_amount}
              onChange={handleChange}
              placeholder="0.000"
              min="0.001"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              required
              disabled={isPOSelected}
            />
            {errors.invoice_amount && (
              <p className="text-xs text-red-500 mt-1">{errors.invoice_amount[0]}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Additional notes about this invoice..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-300">
            <button
              type="button"
              onClick={() => navigate(`${basePath}/accounting/accounts-payable`)}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create AP'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}