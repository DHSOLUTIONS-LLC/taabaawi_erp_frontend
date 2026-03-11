// src/features/purchase/pages/purchase-orders/EditPurchaseOrderPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import {  useEffect } from 'react';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector, useAppDispatch } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { 
  useGetPurchaseOrderByIdQuery,
  useUpdatePurchaseOrderMutation 
} from '../../../../services/purchaseApi';
import { setPOProducts, setPOFormField } from '../../purchaseSlice';
import CreatePurchaseOrderPage from './CreatePurchaseOrderPage';




export default function EditPurchaseOrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state: RootState) => state.auth);
  
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';
  
  const poId = id ? parseInt(id, 10) : 0;
  const { data, isLoading, error } = useGetPurchaseOrderByIdQuery(poId);
  const [updatePO] = useUpdatePurchaseOrderMutation();

  useEffect(() => {
    if (data?.data) {
      const po = data.data;
      
      // Populate form fields
      dispatch(setPOFormField({
        supplier_id: po.supplier_id?.toString() || '',
        branch_id: po.branch_id?.toString() || '',
        currency: po.currency,
        exchange_rate: po.exchange_rate,
        order_date: po.order_date,
        expected_delivery_date: po.expected_delivery_date || '',
        shipping_cost: po.shipping_cost || 0,
        terms_and_conditions: po.terms_and_conditions || '',
        notes: po.notes || '',
        internal_notes: po.internal_notes || '',
        // status: po.status,
      }));

      // Populate products
      if (po.items && po.items.length > 0) {
        const products = po.items.map((item: any) => ({
          id: `existing-${item.id}`,
          product_id: item.product_id,
          variant_id: item.variant_id,
          name: item.product_name,
          sku: item.sku,
          price: parseFloat(item.unit_price),
          quantity: item.quantity_ordered,
          discount_percentage: item.discount_percentage,
          tax_percentage: item.tax_percentage,
          image: item.image_url || '',
          image_url: item.image_url || '',
        }));
        dispatch(setPOProducts(products));
      }
    }
  }, [data, dispatch]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data?.data) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-red-500 font-medium">Failed to load purchase order</p>
          <button 
            onClick={() => navigate(`${basePath}/purchase/orders`)}
            className="mt-4 px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Back to Orders
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <CreatePurchaseOrderPage 
      isEditMode={true} 
      poId={poId} 
      updatePO={updatePO}
    />
  );
}