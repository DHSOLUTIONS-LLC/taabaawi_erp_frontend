// src/features/purchase/purchaseSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

// ─── Purchase Order Product type ─────────────────────────────
export interface PurchaseOrderProduct {
  id: string;
  product_id: number;
  variant_id: number | null;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  discount_percentage: number;
  tax_percentage: number;
  image: string;
  image_url: string;
}

// ─── Purchase Order Form type ────────────────────────────────
export interface PurchaseOrderForm {
  supplier_id: string;
  branch_id: string;
  currency: string;
  exchange_rate: number;
  order_date: string;
  expected_delivery_date: string;
  shipping_cost: number;
  terms_and_conditions: string;
  notes: string;
  internal_notes: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Ordered';
}

// ─── Purchase Return Product type ────────────────────────────
export interface ReturnProduct {
  id: string;
  po_item_id: number;
  product_id: number;
  variant_id: number | null;
  name: string;
  sku: string;
  quantity_ordered: number;
  quantity_received: number;
  quantity_returned: number;
  unit_price: number;
  total: number;
  condition: string;
}

// ─── Purchase Return Form type ───────────────────────────────
export interface PurchaseReturnForm {
  purchase_order_id: string;
  supplier_id: string;
  branch_id: string;
  return_date: string;
  reason: 'Damaged' | 'Defective' | 'Wrong Item' | 'Excess Quantity' | 'Other';
  reason_details: string;
}

// ─── Supplier Payment Form type ──────────────────────────────
export interface SupplierPaymentForm {
  purchase_order_id: string;
  supplier_id: string;
  payment_date: string;
  amount: number;
  currency: string;
  payment_method: 'Cash' | 'Bank Transfer' | 'Cheque' | 'Credit Card' | 'Online Payment';
  reference_number: string;
  notes: string;
}

// ─── GRN Form type ───────────────────────────────────────────
export interface GrnForm {
  purchase_order_id: string;
  branch_id: string;
  receipt_date: string;
  supplier_invoice_number: string;
  supplier_invoice_date: string;
  notes: string;
}

interface PurchaseState {
  // ─── Purchase Order products ───────────────────────────────
  poProducts: PurchaseOrderProduct[];
  
  // ─── Purchase Order form ───────────────────────────────────
  poForm: PurchaseOrderForm;

  // ─── Purchase Return products ──────────────────────────────
  returnProducts: ReturnProduct[];
  
  // ─── Purchase Return form ──────────────────────────────────
  returnForm: PurchaseReturnForm;

  // ─── Supplier Payment form ─────────────────────────────────
  paymentForm: SupplierPaymentForm;

  // ─── GRN form ──────────────────────────────────────────────
  grnForm: GrnForm;

  // ─── Selected IDs ──────────────────────────────────────────
  selectedPOId: number | null;
  selectedReturnId: number | null;
  selectedPaymentId: number | null;
  selectedGrnId: number | null;

  // ─── Filters ───────────────────────────────────────────────
  poFilters: {
    supplier_id: string;
    branch_id: string;
    status: string;
    payment_status: string;
    currency: string;
    start_date: string;
    end_date: string;
    search: string;
  };
  
  returnFilters: {
    supplier_id: string;
    branch_id: string;
    status: string;
    reason: string;
    start_date: string;
    end_date: string;
    search: string;
  };
  
  paymentFilters: {
    supplier_id: string;
    purchase_order_id: string;
    payment_method: string;
    start_date: string;
    end_date: string;
    search: string;
  };
  
  grnFilters: {
    purchase_order_id: string;
    branch_id: string;
    status: string;
    start_date: string;
    end_date: string;
    search: string;
  };
}

const initialPOForm: PurchaseOrderForm = {
  supplier_id: '',
  branch_id: '',
  currency: 'KWD',
  exchange_rate: 1.000000,
  order_date: new Date().toISOString().split('T')[0],
  expected_delivery_date: '',
  shipping_cost: 0,
  terms_and_conditions: '',
  notes: '',
  internal_notes: '',
  status: 'Draft',
};

const initialReturnForm: PurchaseReturnForm = {
  purchase_order_id: '',
  supplier_id: '',
  branch_id: '',
  return_date: new Date().toISOString().split('T')[0],
  reason: 'Damaged',
  reason_details: '',
};

const initialPaymentForm: SupplierPaymentForm = {
  purchase_order_id: '',
  supplier_id: '',
  payment_date: new Date().toISOString().split('T')[0],
  amount: 0,
  currency: 'KWD',
  payment_method: 'Bank Transfer',
  reference_number: '',
  notes: '',
};

const initialGrnForm: GrnForm = {
  purchase_order_id: '',
  branch_id: '',
  receipt_date: new Date().toISOString().split('T')[0],
  supplier_invoice_number: '',
  supplier_invoice_date: '',
  notes: '',
};

const initialState: PurchaseState = {
  poProducts: [],
  poForm: initialPOForm,

  returnProducts: [],
  returnForm: initialReturnForm,

  paymentForm: initialPaymentForm,

  grnForm: initialGrnForm,

  selectedPOId: null,
  selectedReturnId: null,
  selectedPaymentId: null,
  selectedGrnId: null,

  poFilters: {
    supplier_id: '',
    branch_id: '',
    status: '',
    payment_status: '',
    currency: '',
    start_date: '',
    end_date: '',
    search: '',
  },

  returnFilters: {
    supplier_id: '',
    branch_id: '',
    status: '',
    reason: '',
    start_date: '',
    end_date: '',
    search: '',
  },

  paymentFilters: {
    supplier_id: '',
    purchase_order_id: '',
    payment_method: '',
    start_date: '',
    end_date: '',
    search: '',
  },

  grnFilters: {
    purchase_order_id: '',
    branch_id: '',
    status: '',
    start_date: '',
    end_date: '',
    search: '',
  },
};

const purchaseSlice = createSlice({
  name: 'purchase',
  initialState,
  reducers: {
    // ─── Purchase Order product reducers ─────────────────────
    addPOProduct: (state, action: PayloadAction<PurchaseOrderProduct>) => {
      const incoming = action.payload;
      const existing = state.poProducts.find(
        p => p.product_id === incoming.product_id && p.variant_id === incoming.variant_id
      );
      if (existing) {
        existing.quantity += incoming.quantity;
      } else {
        state.poProducts.push(incoming);
      }
    },

    removePOProduct: (state, action: PayloadAction<string>) => {
      state.poProducts = state.poProducts.filter(p => p.id !== action.payload);
    },

    updatePOProductQty: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.poProducts.find(p => p.id === action.payload.id);
      if (item && action.payload.quantity >= 1) {
        item.quantity = action.payload.quantity;
      }
    },

    updatePOProductDiscount: (state, action: PayloadAction<{ id: string; discount_percentage: number }>) => {
      const item = state.poProducts.find(p => p.id === action.payload.id);
      if (item) {
        item.discount_percentage = action.payload.discount_percentage;
      }
    },

    updatePOProductTax: (state, action: PayloadAction<{ id: string; tax_percentage: number }>) => {
      const item = state.poProducts.find(p => p.id === action.payload.id);
      if (item) {
        item.tax_percentage = action.payload.tax_percentage;
      }
    },

    updatePOProductPrice: (state, action: PayloadAction<{ id: string; price: number }>) => {
      const item = state.poProducts.find(p => p.id === action.payload.id);
      if (item) {
        item.price = action.payload.price;
      }
    },

    clearPOProducts: (state) => {
      state.poProducts = [];
    },

    setPOProducts: (state, action: PayloadAction<PurchaseOrderProduct[]>) => {
      state.poProducts = action.payload;
    },

    // ─── Purchase Order form reducers ────────────────────────
    setPOFormField: (state, action: PayloadAction<Partial<PurchaseOrderForm>>) => {
      state.poForm = { ...state.poForm, ...action.payload };
    },

    clearPOForm: (state) => {
      state.poForm = initialPOForm;
      state.poProducts = [];
    },

    // ─── Purchase Return product reducers ────────────────────
    addReturnProduct: (state, action: PayloadAction<ReturnProduct>) => {
      const incoming = action.payload;
      const existing = state.returnProducts.find(
        p => p.po_item_id === incoming.po_item_id
      );
      if (existing) {
        existing.quantity_returned += incoming.quantity_returned;
      } else {
        state.returnProducts.push(incoming);
      }
    },

    removeReturnProduct: (state, action: PayloadAction<string>) => {
      state.returnProducts = state.returnProducts.filter(p => p.id !== action.payload);
    },

    updateReturnProductQty: (state, action: PayloadAction<{ id: string; quantity_returned: number }>) => {
      const item = state.returnProducts.find(p => p.id === action.payload.id);
      if (item && action.payload.quantity_returned >= 0 && action.payload.quantity_returned <= item.quantity_received) {
        item.quantity_returned = action.payload.quantity_returned;
        item.total = item.unit_price * action.payload.quantity_returned;
      }
    },

    clearReturnProducts: (state) => {
      state.returnProducts = [];
    },

    setReturnProducts: (state, action: PayloadAction<ReturnProduct[]>) => {
      state.returnProducts = action.payload;
    },

    // ─── Purchase Return form reducers ───────────────────────
    setReturnFormField: (state, action: PayloadAction<Partial<PurchaseReturnForm>>) => {
      state.returnForm = { ...state.returnForm, ...action.payload };
    },

    clearReturnForm: (state) => {
      state.returnForm = initialReturnForm;
      state.returnProducts = [];
    },

    // ─── Supplier Payment form reducers ──────────────────────
    setPaymentFormField: (state, action: PayloadAction<Partial<SupplierPaymentForm>>) => {
      state.paymentForm = { ...state.paymentForm, ...action.payload };
    },

    clearPaymentForm: (state) => {
      state.paymentForm = initialPaymentForm;
    },

    // ─── GRN form reducers ───────────────────────────────────
    setGrnFormField: (state, action: PayloadAction<Partial<GrnForm>>) => {
      state.grnForm = { ...state.grnForm, ...action.payload };
    },

    clearGrnForm: (state) => {
      state.grnForm = initialGrnForm;
    },

    // ─── Selected IDs reducers ───────────────────────────────
    setSelectedPOId: (state, action: PayloadAction<number | null>) => {
      state.selectedPOId = action.payload;
    },

    setSelectedReturnId: (state, action: PayloadAction<number | null>) => {
      state.selectedReturnId = action.payload;
    },

    setSelectedPaymentId: (state, action: PayloadAction<number | null>) => {
      state.selectedPaymentId = action.payload;
    },

    setSelectedGrnId: (state, action: PayloadAction<number | null>) => {
      state.selectedGrnId = action.payload;
    },

    // ─── Filter reducers ─────────────────────────────────────
    setPOFilters: (state, action: PayloadAction<Partial<PurchaseState['poFilters']>>) => {
      state.poFilters = { ...state.poFilters, ...action.payload };
    },

    clearPOFilters: (state) => {
      state.poFilters = initialState.poFilters;
    },

    setReturnFilters: (state, action: PayloadAction<Partial<PurchaseState['returnFilters']>>) => {
      state.returnFilters = { ...state.returnFilters, ...action.payload };
    },

    clearReturnFilters: (state) => {
      state.returnFilters = initialState.returnFilters;
    },

    setPaymentFilters: (state, action: PayloadAction<Partial<PurchaseState['paymentFilters']>>) => {
      state.paymentFilters = { ...state.paymentFilters, ...action.payload };
    },

    clearPaymentFilters: (state) => {
      state.paymentFilters = initialState.paymentFilters;
    },

    setGrnFilters: (state, action: PayloadAction<Partial<PurchaseState['grnFilters']>>) => {
      state.grnFilters = { ...state.grnFilters, ...action.payload };
    },

    clearGrnFilters: (state) => {
      state.grnFilters = initialState.grnFilters;
    },
  },
});

export const {
  // PO Products
  addPOProduct,
  removePOProduct,
  updatePOProductQty,
  updatePOProductDiscount,
  updatePOProductTax,
  updatePOProductPrice,
  clearPOProducts,
  setPOProducts,

  // PO Form
  setPOFormField,
  clearPOForm,

  // Return Products
  addReturnProduct,
  removeReturnProduct,
  updateReturnProductQty,
  clearReturnProducts,
  setReturnProducts,

  // Return Form
  setReturnFormField,
  clearReturnForm,

  // Payment Form
  setPaymentFormField,
  clearPaymentForm,

  // GRN Form
  setGrnFormField,
  clearGrnForm,

  // Selected IDs
  setSelectedPOId,
  setSelectedReturnId,
  setSelectedPaymentId,
  setSelectedGrnId,

  // Filters
  setPOFilters,
  clearPOFilters,
  setReturnFilters,
  clearReturnFilters,
  setPaymentFilters,
  clearPaymentFilters,
  setGrnFilters,
  clearGrnFilters,
} = purchaseSlice.actions;

export default purchaseSlice.reducer;