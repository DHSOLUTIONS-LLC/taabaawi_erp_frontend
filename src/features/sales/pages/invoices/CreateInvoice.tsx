// src/features/sales/pages/CreateInvoice.tsx
import DashboardLayout from '../../../../layouts/DashboardLayout';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';
import add_icon from '../../../../assets/icons/add.svg';
import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';

import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import {
  removeInvoiceProduct,
  updateInvoiceProductQty,
  clearInvoiceForm,
  setInvoiceFormField,
} from '../../salesSlice';
import { useCreateInvoiceMutation } from '../../../../services/invoiceApi';
import { useGetBranchesQuery } from '../../../../services/superAdminApi';

interface CreateInvoiceProps {
  isEditMode?: boolean;
  invoiceId?: number;
  updateInvoice?: any;
}

export default function CreateInvoice({ isEditMode = false, invoiceId, updateInvoice }: CreateInvoiceProps) {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  // ─── Everything from Redux — survives navigation ──────────────
  const selectedProducts = useAppSelector((state: RootState) => state.sales.invoiceProducts);
  const form = useAppSelector((state: RootState) => state.sales.invoiceForm);

  // One dispatcher for all form fields
  const setField = (fields: Partial<typeof form>) => {
    dispatch(setInvoiceFormField(fields));
  };

  // ─── APIs ─────────────────────────────────────────────────────
  const [createInvoice, { isLoading: isSaving }] = useCreateInvoiceMutation();
  const { data: branchesResponse } = useGetBranchesQuery();
  const branches = branchesResponse || [];

  // ─── Calculations ─────────────────────────────────────────────
  const TAX_RATE = 0.05;
  const subtotal = selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const taxAmount = subtotal * TAX_RATE;
  const grandTotal = subtotal + taxAmount;

  // ─── Handlers ─────────────────────────────────────────────────
  const handleRemoveProduct = (id: string) => dispatch(removeInvoiceProduct(id));

  const handleUpdateQuantity = (id: string, quantity: number) => {
    dispatch(updateInvoiceProductQty({ id, quantity }));
  };

  const handleAddProduct = () => navigate(`${basePath}/sales/add_product`);

  const handleSaveInvoice = async () => {
    if (selectedProducts.length === 0) {
      alert('Please add at least one product.');
      return;
    }
    if (form.invoiceType === 'b2c' && !form.customerName.trim()) {
      alert('Customer name is required for B2C invoice.');
      return;
    }
    if (form.invoiceType === 'b2b' && !form.companyName.trim()) {
      alert('Company name is required for B2B invoice.');
      return;
    }
    if (form.invoiceType === 'quotation' && !form.quotationCustomer.trim()) {
      alert('Customer is required for Quotation.');
      return;
    }

    try {
      const payload: any = {
        invoice_type: form.invoiceType,
        source: form.source,
        branch_id: form.branchId ? parseInt(form.branchId) : undefined,
        payment_method: form.invoiceType === 'quotation' ? 'CASH' : form.paymentMethod,
        payment_status: form.invoiceType === 'quotation' ? 'Unpaid' : form.paymentStatus,
        items: selectedProducts.map(p => ({
          product_id: p.product_id,
          variant_id: p.variant_id ?? undefined,
          product_name: p.name,
          variant_name: p.size !== 'Default' ? p.size : undefined,
          sku: p.sku,
          image_url: p.image_url || p.image,
          quantity: p.quantity,
          unit_price: p.price,
          discount_percentage: 0,
          tax_percentage: 5,
        })),
      };

      if (form.invoiceType === 'b2c') {
        payload.customer_name = form.customerName;
        payload.customer_phone = form.customerPhone;
        payload.customer_type = form.customerType;
      }
      if (form.invoiceType === 'b2b') {
        payload.company_name = form.companyName;
        payload.contact_person = form.contactPerson;
        payload.company_phone = form.companyPhone;
        payload.company_address = form.companyAddress;
      }
      if (form.invoiceType === 'quotation') {
        payload.customer_name = form.quotationCustomer;
        payload.valid_till = form.validTill;
        payload.quotation_status = form.quotationStatus;
        payload.inco_terms = form.incoTerms;
      }

      let result;
      if (isEditMode && invoiceId) {
        // Update existing invoice
        result = await updateInvoice({ id: invoiceId, data: payload }).unwrap();
        alert('Invoice updated successfully!');
      } else {
        // Create new invoice
        result = await createInvoice(payload).unwrap();
        alert('Invoice created successfully!');
      }
      
      console.log('Invoice saved:', result);
      dispatch(clearInvoiceForm());
      navigate(`${basePath}/sales/invoices/${result.data.id || invoiceId}`);

    } catch (error: any) {
      console.error('Failed to save invoice:', error);
      alert(error?.data?.message || 'Failed to save invoice. Please try again.');
    }
  };


//   useEffect(() => {
 
//   if (!isEditMode) {
//     dispatch(clearInvoiceForm());
//   }
// }, [isEditMode, dispatch]);


  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-row justify-between mb-8 items-center">
          <Link to={`${basePath}/sales`}>
            <img src={arrow_back_icon} alt="" className="w-8 h-8" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">
            {isEditMode ? 'Edit Invoice' : 'Create New Invoice'}
          </h1>
          <div className="w-8"></div> {/* Spacer for alignment */}
        </div>

        <div className="space-y-6">

          {/* ── Invoice Type ── */}
          <div className="bg-white space-y-6 p-6 rounded-xl">
            <div className="flex gap-4">
              {(['b2c', 'b2b', 'quotation'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setField({ invoiceType: type })}
                  disabled={isEditMode} // Disable type change in edit mode
                  className={`flex-1 px-6 py-3 rounded-lg border-2 transition-all ${
                    form.invoiceType === type ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
                  } ${isEditMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${form.invoiceType === type ? 'text-blue-700' : 'text-gray-700'}`}>
                      {type === 'b2c' ? 'B2C Sales Invoice' : type === 'b2b' ? 'B2B Sales Invoice' : 'Quotation'}
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.invoiceType === type ? 'border-blue-500' : 'border-gray-300'}`}>
                      {form.invoiceType === type && <div className="w-3 h-3 rounded-full bg-blue-500" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── B2C Form ── */}
          {form.invoiceType === 'b2c' && (
            <>
              <div className="space-y-4 bg-white rounded-xl p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Source</label>
                    <div className="relative">
                      <select value={form.source} onChange={(e) => setField({ source: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-10">
                        <option value="Manual">Manual</option>
                        <option value="POS">POS</option>
                        <option value="Website">Website</option>
                        <option value="Mobile App">Mobile App</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Branch</label>
                    <div className="relative">
                      <select value={form.branchId} onChange={(e) => setField({ branchId: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-10">
                        <option value="">Select Branch</option>
                        {branches.map((b: any) => (
                          <option key={b.id} value={b.id}>{b.branch_name}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Cashier</label>
                  <input type="text" value={user?.name || ''} readOnly
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Date</label>
                  <input type="text" readOnly
                    value={new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed" />
                </div>
              </div>

              <div className="space-y-4 bg-white rounded-xl p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Customer Name</label>
                  <input type="text" value={form.customerName}
                    onChange={(e) => setField({ customerName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter customer name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Phone</label>
                  <input type="text" value={form.customerPhone}
                    onChange={(e) => setField({ customerPhone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="+965 XXXX XXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Customer Type</label>
                  <input type="text" value={form.customerType} readOnly
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    placeholder="B2C" />
                </div>
              </div>
            </>
          )}

          {/* ── B2B Form ── */}
          {form.invoiceType === 'b2b' && (
            <>
              <div className="space-y-4 bg-white rounded-lg p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Source</label>
                    <div className="relative">
                      <select value={form.source} onChange={(e) => setField({ source: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-10">
                        <option value="Manual">Manual</option>
                        <option value="POS">POS</option>
                        <option value="Website">Website</option>
                        <option value="Mobile App">Mobile App</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Branch</label>
                    <div className="relative">
                      <select value={form.branchId} onChange={(e) => setField({ branchId: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-10">
                        <option value="">Select Branch</option>
                        {branches.map((b: any) => (
                          <option key={b.id} value={b.id}>{b.branch_name}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Bank Account (Auto)</label>
                  <input type="text" readOnly value="Qurain – Main Account"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Sales Rep</label>
                  <input type="text" value={user?.name || ''} readOnly
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed" />
                </div>
              </div>

              <div className="space-y-4 bg-white rounded-lg p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Company Name</label>
                  <input type="text" value={form.companyName}
                    onChange={(e) => setField({ companyName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter company name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Contact Person</label>
                  <input type="text" value={form.contactPerson}
                    onChange={(e) => setField({ contactPerson: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Shahzad Diyal" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Phone</label>
                  <input type="text" value={form.companyPhone}
                    onChange={(e) => setField({ companyPhone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="+965 55 213 445" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Address</label>
                  <input type="text" value={form.companyAddress}
                    onChange={(e) => setField({ companyAddress: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Kuwait City" />
                </div>
              </div>
            </>
          )}

          {/* ── Quotation Form ── */}
          {form.invoiceType === 'quotation' && (
            <div className="space-y-4 bg-white rounded-xl p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Customer / Company</label>
                  <input type="text" value={form.quotationCustomer}
                    onChange={(e) => setField({ quotationCustomer: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="BlueTech LLC" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Valid Till</label>
                  <input type="date" value={form.validTill}
                    onChange={(e) => setField({ validTill: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Status</label>
                <div className="relative">
                  <select value={form.quotationStatus}
                    onChange={(e) => setField({ quotationStatus: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-10">
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">IncoTerms</label>
                <input type="text" value={form.incoTerms}
                  onChange={(e) => setField({ incoTerms: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="CIF" />
              </div>
            </div>
          )}

          {/* ── Products Section ── */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between bg-white p-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Products
                  {selectedProducts.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-blue-600">({selectedProducts.length} items)</span>
                  )}
                </h3>
                <button onClick={handleAddProduct}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                  <img src={add_icon} alt="" />
                  <span className="font-medium">Add Product</span>
                </button>
              </div>

              {/* Products Table */}
              {selectedProducts.length > 0 && (
                <div className="bg-white rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full shadow-lg">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Image</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SKU</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Tax (5%)</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedProducts.map((product) => {
                          const itemSubtotal = product.price * product.quantity;
                          const itemTax = itemSubtotal * TAX_RATE;
                          const itemTotal = itemSubtotal + itemTax;
                          return (
                            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <img src={product.image_url || product.image} alt={product.name}
                                  className="w-12 h-12 object-cover rounded-md"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      'https://images.unsplash.com/photo-1541275055241-329bbdf9a191?w=100&auto=format&fit=crop';
                                  }} />
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                {product.size && product.size !== 'Default' && (
                                  <div className="text-xs text-gray-500">Variant: {product.size}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{product.sku}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => handleUpdateQuantity(product.id, product.quantity - 1)}
                                    className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                                    <span className="text-gray-600 font-semibold">-</span>
                                  </button>
                                  <span className="w-10 text-center font-medium text-gray-900">{product.quantity}</span>
                                  <button onClick={() => handleUpdateQuantity(product.id, product.quantity + 1)}
                                    className="w-7 h-7 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
                                    <span className="font-semibold">+</span>
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="text-sm font-medium text-gray-900">KWD {product.price.toFixed(3)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="text-sm text-gray-900">KWD {itemTax.toFixed(3)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="text-sm font-semibold text-gray-900">KWD {itemTotal.toFixed(3)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <button onClick={() => handleRemoveProduct(product.id)}
                                  className="inline-flex items-center justify-center p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {selectedProducts.length === 0 && (
                <div className="bg-white p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No products added yet. Click "Add Product" to get started.</p>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-lg p-6">
              <h4 className="text-base font-semibold mb-4">Summary</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 uppercase">Subtotal</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedProducts.length > 0 ? `KWD ${subtotal.toFixed(3)}` : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 uppercase">Tax (5%)</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedProducts.length > 0 ? `KWD ${taxAmount.toFixed(3)}` : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 uppercase">Discount</span>
                  <span className="text-sm font-medium text-gray-900">KWD 0.000</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-sm text-gray-900 font-semibold uppercase">Grand Total</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {selectedProducts.length > 0 ? `KWD ${grandTotal.toFixed(3)}` : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment — hidden for quotation */}
            {selectedProducts.length > 0 && form.invoiceType !== 'quotation' && (
              <div className="bg-white rounded-lg p-6 space-y-6">
                <div>
                  <h4 className="text-base font-semibold mb-4">Payment Method</h4>
                  <div className="space-y-3">
                    {(['CASH', 'CARD', 'KNET'] as const).map((method) => (
                      <label key={method} className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-700">{method}</span>
                        <input type="radio" name="paymentMethod" value={method}
                          checked={form.paymentMethod === method}
                          onChange={() => setField({ paymentMethod: method })}
                          className="w-5 h-5 text-blue-600" />
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-semibold mb-4">Payment Status</h4>
                  <div className="space-y-3">
                    {(['Paid', 'Unpaid', 'Partially Paid'] as const).map((status) => (
                      <label key={status} className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-700">{status}</span>
                        <input type="radio" name="paymentStatus" value={status}
                          checked={form.paymentStatus === status}
                          onChange={() => setField({ paymentStatus: status })}
                          className="w-5 h-5 text-blue-600" />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {selectedProducts.length > 0 && (
              <div className="grid grid-cols-3 gap-4 pt-4">
                <button onClick={() => window.print()}
                  className="px-6 py-3 bg-white border border-blue-300 rounded-lg text-gray-700 font-medium hover:bg-blue-500 hover:text-white transition-colors cursor-pointer">
                  Print
                </button>
                <button onClick={handleSaveInvoice} disabled={isSaving}
                  className="px-6 py-3 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSaving ? 'Saving...' : (isEditMode ? 'Update Invoice' : 'Save Invoice')}
                </button>
                <button onClick={() => window.print()}
                  className="px-6 py-3 bg-white border border-blue-300 rounded-lg text-gray-700 font-medium hover:bg-blue-500 hover:text-white transition-colors cursor-pointer">
                  Export PDF
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}