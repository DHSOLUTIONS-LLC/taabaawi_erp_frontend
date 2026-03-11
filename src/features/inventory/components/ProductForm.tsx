import React, { useState } from 'react';
import type { Product } from '../../../types/inventory';
import { useAppSelector } from '../../../app/hooks';

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ product, onSubmit, onCancel }) => {
  const { categories, suppliers } = useAppSelector((state) => state.inventory);
  
  const [formData, setFormData] = useState({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    categoryId: product?.categoryId || '',
    supplierId: product?.supplierId || '',
    price: product?.price || 0,
    cost: product?.cost || 0,
    stockQuantity: product?.stockQuantity || 0,
    lowStockThreshold: product?.lowStockThreshold || 5,
    unit: product?.unit || 'pcs',
    barcode: product?.barcode || '',
    isActive: product?.isActive ?? true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>SKU:</label>
        <input
          type="text"
          name="sku"
          value={formData.sku}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Product Name:</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Description:</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Category:</label>
        <select
          name="categoryId"
          value={formData.categoryId}
          onChange={handleChange}
          required
        >
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Supplier:</label>
        <select
          name="supplierId"
          value={formData.supplierId}
          onChange={handleChange}
          required
        >
          <option value="">Select Supplier</option>
          {suppliers.map(sup => (
            <option key={sup.id} value={sup.id}>{sup.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Price ($):</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          min="0"
          step="0.01"
          required
        />
      </div>

      <div>
        <label>Cost ($):</label>
        <input
          type="number"
          name="cost"
          value={formData.cost}
          onChange={handleChange}
          min="0"
          step="0.01"
          required
        />
      </div>

      <div>
        <label>Stock Quantity:</label>
        <input
          type="number"
          name="stockQuantity"
          value={formData.stockQuantity}
          onChange={handleChange}
          min="0"
          required
        />
      </div>

      <div>
        <label>Low Stock Threshold:</label>
        <input
          type="number"
          name="lowStockThreshold"
          value={formData.lowStockThreshold}
          onChange={handleChange}
          min="0"
          required
        />
      </div>

      <div>
        <label>Unit:</label>
        <input
          type="text"
          name="unit"
          value={formData.unit}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Barcode:</label>
        <input
          type="text"
          name="barcode"
          value={formData.barcode}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
          />
          Active
        </label>
      </div>

      <button type="submit">{product ? 'Update Product' : 'Add Product'}</button>
      {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
    </form>
  );
};