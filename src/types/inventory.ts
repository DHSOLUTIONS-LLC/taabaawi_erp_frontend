export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  supplierId: string;
  price: number;
  cost: number;
  stockQuantity: number;
  lowStockThreshold: number;
  unit: string;
  barcode?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  productCount: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  productCount: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  reference?: string;
  performedBy: string;
  createdAt: string;
}

export interface InventoryFilters {
  category?: string;
  supplier?: string;
  lowStock?: boolean;
  search?: string;
  status?: 'active' | 'inactive';
}