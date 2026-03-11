// src/features/pos/posSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { CartItem, POSProduct } from '../../types/pos';

interface CartState {
  items: CartItem[];
  customerId?: number;
  customerName?: string;
  discountType: 'percentage' | 'amount';
  discountValue: number;
  paymentMethod: 'cash' | 'card' | 'knet' | 'bank_transfer';
  cashReceived: number;
  notes: string;
}

interface POSState {
  cart: CartState;
  selectedProduct: POSProduct | null;
  currentShift: {
    id: number | null;
    isOpen: boolean;
  };
  viewMode: 'products' | 'cart' | 'payment';
  searchQuery: string;
  selectedCategory: string;
  isLoading: boolean;
  lastTransaction?: {
    invoiceNumber: string;
    amount: number;
    time: string;
  };
}

const initialCartState: CartState = {
  items: [],
  discountType: 'percentage',
  discountValue: 0,
  paymentMethod: 'cash',
  cashReceived: 0,
  notes: '',
};

const initialState: POSState = {
  cart: initialCartState,
  selectedProduct: null,
  currentShift: {
    id: null,
    isOpen: false,
  },
  viewMode: 'products',
  searchQuery: '',
  selectedCategory: 'all',
  isLoading: false,
};

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    // Cart Actions
    addToCart: (state, action: PayloadAction<{ product: POSProduct; quantity: number }>) => {
      const { product, quantity } = action.payload;
      const existingItem = state.cart.items.find(item => item.product.id === product.id);
      
      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.total = existingItem.quantity * existingItem.product.price;
      } else {
        const newItem: CartItem = {
          product,
          quantity,
          discount: 0,
          tax: product.price * quantity * (product.tax_rate / 100),
          total: product.price * quantity,
        };
        state.cart.items.push(newItem);
      }
    },

    removeFromCart: (state, action: PayloadAction<number>) => {
      state.cart.items = state.cart.items.filter(item => item.product.id !== action.payload);
    },

    updateCartItem: (state, action: PayloadAction<{ productId: number; quantity: number }>) => {
      const { productId, quantity } = action.payload;
      const item = state.cart.items.find(item => item.product.id === productId);
      
      if (item) {
        item.quantity = quantity;
        item.total = item.quantity * item.product.price;
      }
    },

    applyDiscountToItem: (state, action: PayloadAction<{ productId: number; discount: number }>) => {
      const { productId, discount } = action.payload;
      const item = state.cart.items.find(item => item.product.id === productId);
      
      if (item) {
        item.discount = discount;
        item.total = (item.quantity * item.product.price) - discount;
      }
    },

    setCartDiscount: (state, action: PayloadAction<{ type: 'percentage' | 'amount'; value: number }>) => {
      state.cart.discountType = action.payload.type;
      state.cart.discountValue = action.payload.value;
    },

    setPaymentMethod: (state, action: PayloadAction<POSState['cart']['paymentMethod']>) => {
      state.cart.paymentMethod = action.payload;
    },

    setCashReceived: (state, action: PayloadAction<number>) => {
      state.cart.cashReceived = action.payload;
    },

    setCustomer: (state, action: PayloadAction<{ id?: number; name?: string }>) => {
      if (action.payload.id) state.cart.customerId = action.payload.id;
      if (action.payload.name) state.cart.customerName = action.payload.name;
    },

    clearCart: (state) => {
      state.cart = initialCartState;
    },

    // POS UI Actions
    setSelectedProduct: (state, action: PayloadAction<POSProduct | null>) => {
      state.selectedProduct = action.payload;
    },

    setViewMode: (state, action: PayloadAction<POSState['viewMode']>) => {
      state.viewMode = action.payload;
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },

    // Shift Actions
    setCurrentShift: (state, action: PayloadAction<{ id: number; isOpen: boolean }>) => {
      state.currentShift = action.payload;
    },

    closeShift: (state) => {
      state.currentShift = { id: null, isOpen: false };
    },

    setLastTransaction: (state, action: PayloadAction<POSState['lastTransaction']>) => {
      state.lastTransaction = action.payload;
    },

    // Reset
    resetPOS: (state) => {
      return { ...initialState, currentShift: state.currentShift };
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateCartItem,
  applyDiscountToItem,
  setCartDiscount,
  setPaymentMethod,
  setCashReceived,
  setCustomer,
  clearCart,
  setSelectedProduct,
  setViewMode,
  setSearchQuery,
  setSelectedCategory,
  setCurrentShift,
  closeShift,
  setLastTransaction,
  resetPOS,
} = posSlice.actions;

// Selectors
export const selectCartItems = (state: { pos: POSState }) => state.pos.cart.items;
export const selectCartTotal = (state: { pos: POSState }) => 
  state.pos.cart.items.reduce((sum, item) => sum + item.total, 0);
export const selectCartDiscount = (state: { pos: POSState }) => {
  const total = selectCartTotal(state);
  const { discountType, discountValue } = state.pos.cart;
  
  if (discountType === 'percentage') {
    return total * (discountValue / 100);
  }
  return discountValue;
};
export const selectCartTax = (state: { pos: POSState }) =>
  state.pos.cart.items.reduce((sum, item) => sum + item.tax, 0);
export const selectGrandTotal = (state: { pos: POSState }) => {
  const total = selectCartTotal(state);
  const discount = selectCartDiscount(state);
  const tax = selectCartTax(state);
  
  return total - discount + tax;
};
export const selectChangeDue = (state: { pos: POSState }) => {
  const grandTotal = selectGrandTotal(state);
  return state.pos.cart.cashReceived - grandTotal;
};

export default posSlice.reducer;