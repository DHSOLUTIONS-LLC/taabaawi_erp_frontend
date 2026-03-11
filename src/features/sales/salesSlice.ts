// src/features/sales/salesSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { CartItem, Customer } from '../../types/sales';

// ─── Invoice Product type ─────────────────────────────────────
export interface InvoiceProduct {
  id: string;
  product_id: number;
  name: string;
  sku: string;
  price: number;
  size: string;
  variant_id: number | null;
  quantity: number;
  image: string;
  image_url: string;
}

// ─── Order Product type ─────────────────────────────────────
export interface OrderProduct {
  id: string;
  product_id: number;
  name: string;
  sku: string;
  price: number;
  size: string;
  variant_id: number | null;
  quantity: number;
  image: string;
  image_url: string;
}

// ─── Order Form type ────────────────────────────────────────
export interface OrderForm {
  branchId: string;
  channel: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  paymentMethod: string;
  couponCode: string;
  customerNotes: string;
  shippingMethodId: string;
  shippingFee: number;
}

// ─── Invoice Form type ────────────────────────────────────────
export interface InvoiceForm {
  invoiceType: 'b2c' | 'b2b' | 'quotation';
  source: string;
  branchId: string;
  // B2C
  customerName: string;
  customerPhone: string;
  customerType: string;
  // B2B
  companyName: string;
  contactPerson: string;
  companyPhone: string;
  companyAddress: string;
  // Quotation
  quotationCustomer: string;
  validTill: string;
  quotationStatus: string;
  incoTerms: string;
  // Payment
  paymentMethod: 'CASH' | 'CARD' | 'KNET';
  paymentStatus: 'Paid' | 'Unpaid' | 'Partially Paid';
}

interface SalesState {
  cart: {
    items: CartItem[];
    customer: Customer | null;
    invoiceType: 'b2b' | 'b2c' | 'quotation';
    channel: string;
    branchId: number | null;
    couponCode: string;
    couponDiscount: number;
    shippingFee: number;
    notes: string;
  };

  // ─── Invoice products (separate from POS cart) ───────────────
  invoiceProducts: InvoiceProduct[];
  // ─── Invoice form fields ────────────────────────────────────
  invoiceForm: InvoiceForm;

  // ─── Order products ────────────────────────────────────────
  orderProducts: OrderProduct[];
  // ─── Order form fields ─────────────────────────────────────
  orderForm: OrderForm;

  selectedOrderId: number | null;
  filters: {
    order_status: string;
    payment_status: string;
    channel: string;
    start_date: string;
    end_date: string;
    search: string;
  };
}

const initialInvoiceForm: InvoiceForm = {
  invoiceType: 'b2c',
  source: 'Manual',
  branchId: '',
  customerName: '',
  customerPhone: '',
  customerType: 'B2C',
  companyName: '',
  contactPerson: '',
  companyPhone: '',
  companyAddress: '',
  quotationCustomer: '',
  validTill: '',
  quotationStatus: 'Draft',
  incoTerms: '',
  paymentMethod: 'CASH',
  paymentStatus: 'Unpaid',
};

const initialOrderForm: OrderForm = {
  branchId: '',
  channel: 'Website',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  shippingAddress: '',
  shippingCity: '',
  paymentMethod: 'Cash on Delivery',
  couponCode: '',
  customerNotes: '',
  shippingMethodId: '',
  shippingFee: 2.0,
};

const initialState: SalesState = {
  cart: {
    items: [],
    customer: null,
    invoiceType: 'b2c',
    channel: 'POS',
    branchId: null,
    couponCode: '',
    couponDiscount: 0,
    shippingFee: 2.0,
    notes: '',
  },

  invoiceProducts: [],
  invoiceForm: initialInvoiceForm,

  orderProducts: [],
  orderForm: initialOrderForm,

  selectedOrderId: null,
  filters: {
    order_status: '',
    payment_status: '',
    channel: '',
    start_date: '',
    end_date: '',
    search: '',
  },
};

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {

    // ─── Existing POS cart reducers (unchanged) ───────────────

    addToCart: (state, action: PayloadAction<Omit<CartItem, 'tax_amount' | 'total'>>) => {
      const item = action.payload;
      const existing = state.cart.items.find(
        i => i.product_id === item.product_id && i.variant_id === item.variant_id
      );
      if (existing) {
        existing.quantity += item.quantity;
        existing.tax_amount = existing.unit_price * existing.quantity * (existing.tax_rate / 100);
        existing.total = existing.unit_price * existing.quantity - existing.discount + existing.tax_amount;
      } else {
        const tax_amount = item.unit_price * item.quantity * (item.tax_rate / 100);
        const total = item.unit_price * item.quantity - item.discount + tax_amount;
        state.cart.items.push({ ...item, tax_amount, total });
      }
    },

    removeFromCart: (state, action: PayloadAction<{ product_id: number; variant_id: number | null }>) => {
      state.cart.items = state.cart.items.filter(
        i => !(i.product_id === action.payload.product_id && i.variant_id === action.payload.variant_id)
      );
    },

    updateCartItemQty: (state, action: PayloadAction<{ product_id: number; variant_id: number | null; quantity: number }>) => {
      const item = state.cart.items.find(
        i => i.product_id === action.payload.product_id && i.variant_id === action.payload.variant_id
      );
      if (item) {
        item.quantity = action.payload.quantity;
        item.tax_amount = item.unit_price * item.quantity * (item.tax_rate / 100);
        item.total = item.unit_price * item.quantity - item.discount + item.tax_amount;
      }
    },

    setCartCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.cart.customer = action.payload;
    },

    setCartBranch: (state, action: PayloadAction<number | null>) => {
      state.cart.branchId = action.payload;
    },

    setInvoiceType: (state, action: PayloadAction<'b2b' | 'b2c' | 'quotation'>) => {
      state.cart.invoiceType = action.payload;
    },

    setChannel: (state, action: PayloadAction<string>) => {
      state.cart.channel = action.payload;
    },

    setCoupon: (state, action: PayloadAction<{ code: string; discount: number }>) => {
      state.cart.couponCode = action.payload.code;
      state.cart.couponDiscount = action.payload.discount;
    },

    clearCoupon: (state) => {
      state.cart.couponCode = '';
      state.cart.couponDiscount = 0;
    },

    setShippingFee: (state, action: PayloadAction<number>) => {
      state.cart.shippingFee = action.payload;
    },

    setCartNotes: (state, action: PayloadAction<string>) => {
      state.cart.notes = action.payload;
    },

    clearCart: (state) => {
      state.cart = initialState.cart;
    },

    setSelectedOrderId: (state, action: PayloadAction<number | null>) => {
      state.selectedOrderId = action.payload;
    },

    setFilters: (state, action: PayloadAction<Partial<SalesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    clearFilters: (state) => {
      state.filters = initialState.filters;
    },

    // ─── Invoice product reducers ─────────────────────────────

    addInvoiceProduct: (state, action: PayloadAction<InvoiceProduct>) => {
      const incoming = action.payload;
      const existing = state.invoiceProducts.find(
        p => p.product_id === incoming.product_id && p.variant_id === incoming.variant_id
      );
      if (existing) {
        existing.quantity += incoming.quantity;
      } else {
        state.invoiceProducts.push(incoming);
      }
    },

    removeInvoiceProduct: (state, action: PayloadAction<string>) => {
      state.invoiceProducts = state.invoiceProducts.filter(p => p.id !== action.payload);
    },

    updateInvoiceProductQty: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.invoiceProducts.find(p => p.id === action.payload.id);
      if (item && action.payload.quantity >= 1) {
        item.quantity = action.payload.quantity;
      }
    },

    clearInvoiceProducts: (state) => {
      state.invoiceProducts = [];
    },

    setInvoiceProducts: (state, action: PayloadAction<any[]>) => {
      state.invoiceProducts = action.payload;
    },

    // ─── Invoice form reducers ────────────────────────────────

    setInvoiceFormField: (state, action: PayloadAction<Partial<InvoiceForm>>) => {
      state.invoiceForm = { ...state.invoiceForm, ...action.payload };
    },

    clearInvoiceForm: (state) => {
      state.invoiceForm = initialInvoiceForm;
      state.invoiceProducts = [];
    },

    // ─── Order product reducers ─────────────────────────────

    addOrderProduct: (state, action: PayloadAction<OrderProduct>) => {
      const incoming = action.payload;
      const existing = state.orderProducts.find(
        p => p.product_id === incoming.product_id && p.variant_id === incoming.variant_id
      );
      if (existing) {
        existing.quantity += incoming.quantity;
      } else {
        state.orderProducts.push(incoming);
      }
    },

    removeOrderProduct: (state, action: PayloadAction<string>) => {
      state.orderProducts = state.orderProducts.filter(p => p.id !== action.payload);
    },

    updateOrderProductQty: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.orderProducts.find(p => p.id === action.payload.id);
      if (item && action.payload.quantity >= 1) {
        item.quantity = action.payload.quantity;
      }
    },

    clearOrderProducts: (state) => {
      state.orderProducts = [];
    },

    setOrderProducts: (state, action: PayloadAction<any[]>) => {
      state.orderProducts = action.payload;
    },

    // ─── Order form reducers ────────────────────────────────

    setOrderFormField: (state, action: PayloadAction<Partial<OrderForm>>) => {
      state.orderForm = { ...state.orderForm, ...action.payload };
    },

    clearOrderForm: (state) => {
      state.orderForm = initialOrderForm;
      state.orderProducts = [];
    },
  },
});

export const {
  // POS cart
  addToCart,
  removeFromCart,
  updateCartItemQty,
  setCartCustomer,
  setCartBranch,
  setInvoiceType,
  setChannel,
  setCoupon,
  clearCoupon,
  setShippingFee,
  setCartNotes,
  clearCart,
  setSelectedOrderId,
  setFilters,
  clearFilters,
  // Invoice products
  addInvoiceProduct,
  removeInvoiceProduct,
  updateInvoiceProductQty,
  clearInvoiceProducts,
  setInvoiceProducts,
  // Invoice form
  setInvoiceFormField,
  clearInvoiceForm,
  // Order products
  addOrderProduct,
  removeOrderProduct,
  updateOrderProductQty,
  clearOrderProducts,
  setOrderProducts,
  // Order form
  setOrderFormField,
  clearOrderForm,
} = salesSlice.actions;

export default salesSlice.reducer;