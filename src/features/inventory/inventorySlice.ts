import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type {  PayloadAction } from '@reduxjs/toolkit';
import type { Product, Category, Supplier, StockMovement, InventoryFilters } from '../../types/inventory';

// Static data
const initialProducts: Product[] = [
  {
    id: '1',
    sku: 'SKU-001',
    name: 'Laptop Pro',
    description: 'High performance laptop',
    categoryId: 'cat1',
    supplierId: 'sup1',
    price: 1299.99,
    cost: 850.00,
    stockQuantity: 15,
    lowStockThreshold: 10,
    unit: 'pcs',
    barcode: '8901234567890',
    imageUrl: 'https://via.placeholder.com/100',
    isActive: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
  },
  {
    id: '2',
    sku: 'SKU-002',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse',
    categoryId: 'cat2',
    supplierId: 'sup2',
    price: 49.99,
    cost: 25.00,
    stockQuantity: 5,
    lowStockThreshold: 10,
    unit: 'pcs',
    barcode: '8901234567891',
    isActive: true,
    createdAt: '2024-01-16',
    updatedAt: '2024-01-18',
  },
  {
    id: '3',
    sku: 'SKU-003',
    name: 'Mechanical Keyboard',
    description: 'RGB mechanical keyboard',
    categoryId: 'cat2',
    supplierId: 'sup3',
    price: 89.99,
    cost: 45.00,
    stockQuantity: 8,
    lowStockThreshold: 5,
    unit: 'pcs',
    barcode: '8901234567892',
    isActive: true,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-19',
  },
];

const initialCategories: Category[] = [
  { id: 'cat1', name: 'Electronics', description: 'Electronic devices', productCount: 15 },
  { id: 'cat2', name: 'Accessories', description: 'Computer accessories', productCount: 28 },
  { id: 'cat3', name: 'Office Supplies', description: 'Office equipment', productCount: 42 },
  { id: 'cat4', name: 'Furniture', description: 'Office furniture', productCount: 12 },
];

const initialSuppliers: Supplier[] = [
  {
    id: 'sup1',
    name: 'Tech Solutions Inc.',
    contactPerson: 'John Doe',
    email: 'john@techsolutions.com',
    phone: '+1-555-123-4567',
    address: '123 Tech Street, Silicon Valley, CA',
    productCount: 45,
  },
  {
    id: 'sup2',
    name: 'Office Supply Co.',
    contactPerson: 'Jane Smith',
    email: 'jane@officesupply.com',
    phone: '+1-555-987-6543',
    address: '456 Office Ave, New York, NY',
    productCount: 32,
  },
];

const initialStockMovements: StockMovement[] = [
  {
    id: 'mov1',
    productId: '1',
    type: 'IN',
    quantity: 20,
    reason: 'Initial stock',
    reference: 'PO-001',
    performedBy: 'Admin User',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'mov2',
    productId: '1',
    type: 'OUT',
    quantity: 5,
    reason: 'Sale',
    reference: 'SO-001',
    performedBy: 'Admin User',
    createdAt: '2024-01-18T14:20:00Z',
  },
  {
    id: 'mov3',
    productId: '2',
    type: 'IN',
    quantity: 10,
    reason: 'Restock',
    reference: 'PO-002',
    performedBy: 'Admin User',
    createdAt: '2024-01-16T09:15:00Z',
  },
];

interface InventoryState {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  stockMovements: StockMovement[];
  filters: InventoryFilters;
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  products: initialProducts,
  categories: initialCategories,
  suppliers: initialSuppliers,
  stockMovements: initialStockMovements,
  filters: {},
  selectedProduct: null,
  loading: false,
  error: null,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<InventoryFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    selectProduct: (state, action: PayloadAction<string>) => {
      state.selectedProduct = state.products.find(p => p.id === action.payload) || null;
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
    addProduct: (state, action: PayloadAction<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const newProduct: Product = {
        ...action.payload,
        id: `prod_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.products.unshift(newProduct);
    },
    updateProduct: (state, action: PayloadAction<Partial<Product> & { id: string }>) => {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = {
          ...state.products[index],
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    deleteProduct: (state, action: PayloadAction<string>) => {
      state.products = state.products.filter(p => p.id !== action.payload);
    },
    updateStock: (state, action: PayloadAction<{
      productId: string;
      quantity: number;
      type: 'IN' | 'OUT' | 'ADJUSTMENT';
      reason: string;
      reference?: string;
      performedBy: string;
    }>) => {
      const { productId, quantity, type, reason, reference, performedBy } = action.payload;
      const product = state.products.find(p => p.id === productId);
      
      if (product) {
        if (type === 'IN') {
          product.stockQuantity += quantity;
        } else if (type === 'OUT') {
          product.stockQuantity -= quantity;
        } else {
          product.stockQuantity = quantity;
        }
        
        const movement: StockMovement = {
          id: `mov_${Date.now()}`,
          productId,
          type,
          quantity,
          reason,
          reference,
          performedBy,
          createdAt: new Date().toISOString(),
        };
        
        state.stockMovements.unshift(movement);
      }
    },
  },
});

export const {
  setFilters,
  clearFilters,
  selectProduct,
  clearSelectedProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  updateStock,
} = inventorySlice.actions;

export default inventorySlice.reducer;