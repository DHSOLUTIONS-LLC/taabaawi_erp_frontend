// src/features/sales/pages/EditInvoice.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppDispatch } from '../../../../app/hooks';
import { useGetInvoiceByIdQuery } from '../../../../services/invoiceApi';
import { useUpdateInvoiceMutation } from '../../../../services/invoiceApi';
import { setInvoiceFormField, setInvoiceProducts, clearInvoiceForm } from '../../salesSlice';
import CreateInvoice from './CreateInvoice';
import DashboardLayout from '../../../../layouts/DashboardLayout';

export default function EditInvoice() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const invoiceId = id ? parseInt(id, 10) : 0;
  const { data, isLoading, error } = useGetInvoiceByIdQuery(invoiceId, {
    skip: !invoiceId,
  });
  const [updateInvoice] = useUpdateInvoiceMutation();

  useEffect(() => {
    if (data?.data) {
      const invoice = data.data;
      
      // Clear any existing form data first
      dispatch(clearInvoiceForm());
      
      // Populate form fields
      dispatch(setInvoiceFormField({
        invoiceType: invoice.invoice_type,
        source: invoice.source || 'Manual',
        branchId: invoice.branch_id?.toString() || '',
        
        // B2C fields
        customerName: invoice.customer_name || '',
        customerPhone: invoice.customer_phone || '',
        customerType: invoice.customer_type || 'B2C',
        
        // B2B fields
        companyName: invoice.company_name || '',
        contactPerson: invoice.contact_person || '',
        companyPhone: invoice.company_phone || '',
        companyAddress: invoice.company_address || '',
        
        // Quotation fields
        quotationCustomer: invoice.customer_name || '',
        validTill: invoice.valid_till || '',
        quotationStatus: invoice.quotation_status || 'Draft',
        incoTerms: invoice.inco_terms || '',
        
        // Payment fields
        paymentMethod: invoice.payment_method || 'CASH',
        paymentStatus: invoice.payment_status || 'Unpaid',
      }));

      // Populate products
      if (invoice.items && invoice.items.length > 0) {
        const products = invoice.items.map((item: any) => ({
          id: `existing-${item.id}`,
          product_id: item.product_id,
          variant_id: item.variant_id,
          name: item.product_name,
          sku: item.sku || '',
          price: parseFloat(item.unit_price || 0),
          quantity: item.quantity || 1,
          size: item.variant_name || 'Default',
          image: item.image_url || '',
          image_url: item.image_url || '',
        }));
        dispatch(setInvoiceProducts(products));
      }
    }
  }, [data, dispatch]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-40">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            <p className="text-gray-500 text-sm">Loading invoice...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data?.data) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-red-500 font-medium">Failed to load invoice</p>
          <button 
            onClick={() => navigate('/admin/sales/invoices')}
            className="mt-4 px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Back to Invoices
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <CreateInvoice 
      isEditMode={true} 
      invoiceId={invoiceId} 
      updateInvoice={updateInvoice}
    />
  );
}