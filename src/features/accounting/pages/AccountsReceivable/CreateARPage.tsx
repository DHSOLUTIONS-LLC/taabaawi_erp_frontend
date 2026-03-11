// src/features/accounting/pages/accounts-receivable/CreateARPage.tsx
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { 
  useCreateARMutation,
  useGetCustomersQuery 
} from '../../../../services/accountingApi';
import { useGetOrdersQuery } from '../../../../services/salesApi';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';

const CURRENCIES = ['KWD', 'USD', 'EUR', 'GBP', 'SAR', 'AED'];

export default function CreateARPage() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId?: string }>();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [formData, setFormData] = useState({
    customer_id: '',
    order_id: orderId || '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    invoice_amount: 0,
    currency: 'KWD',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const [createAR, { isLoading }] = useCreateARMutation();

  // Fetch customers (users with role 'Customer')
  const { data: customersData } = useGetCustomersQuery({ 
    is_active: true,
    per_page: 1000,
  });
  const customers = (customersData as any)?.data?.data || (customersData as any)?.data || [];

  // Fetch orders for dropdown
  const { data: ordersData } = useGetOrdersQuery({
    per_page: 1000,
  });
  const orders = (ordersData as any)?.data?.data || (ordersData as any)?.data || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value;
    setFormData(prev => ({ ...prev, customer_id: customerId }));
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orderId = e.target.value;
    setFormData(prev => ({ ...prev, order_id: orderId }));
    
    // Auto-fill customer if order selected
    if (orderId) {
      const selectedOrder = orders.find((order: any) => order.id.toString() === orderId);
      if (selectedOrder) {
        setFormData(prev => ({ 
          ...prev, 
          customer_id: selectedOrder.customer_id?.toString() || '',
          currency: selectedOrder.currency || 'KWD',
          invoice_amount: selectedOrder.total_amount || 0,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        customer_id: parseInt(formData.customer_id),
        order_id: formData.order_id ? parseInt(formData.order_id) : undefined,
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        invoice_amount: parseFloat(formData.invoice_amount.toString()),
        currency: formData.currency,
        notes: formData.notes || undefined,
      };
      
      const result = await createAR(payload).unwrap();
      navigate(`${basePath}/accounting/accounts-receivable/${(result as any).data?.id}`);
    } catch (err: any) {
      if (err.data?.errors) {
        setErrors(err.data.errors);
      } else {
        alert(err?.data?.message || 'Failed to create AR record');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`${basePath}/accounting/accounts-receivable`)}>
            <img src={arrow_back_icon} alt="" className="w-8 h-8" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Accounts Receivable</h1>
            <p className="text-sm text-gray-500 mt-0.5">Record a new customer invoice</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 space-y-6">
          {/* Customer Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Customer <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleCustomerChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer: any) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                </div>
              </div>
              {errors.customer_id && (
                <p className="text-xs text-red-500 mt-1">{errors.customer_id[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Order
              </label>
              <div className="relative">
                <select
                  name="order_id"
                  value={formData.order_id}
                  onChange={handleOrderChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {orders.map((order: any) => (
                    <option key={order.id} value={order.id}>
                      {order.order_number} - {order.customer_name} ({order.currency} {parseFloat(order.total_amount).toFixed(3)})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                </div>
              </div>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
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
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate(`${basePath}/accounting/accounts-receivable`)}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create AR'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}