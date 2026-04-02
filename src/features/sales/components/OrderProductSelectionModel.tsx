// src/features/sales/components/OrderProductSelectionModel.tsx
// src/features/sales/components/ProductSelectionModal.tsx
import { useState, useEffect, useMemo } from 'react';
import { useGetProductsQuery, useGetCategoriesQuery } from '../../../services/inventoryApi';
import {  useAppDispatch } from '../../../app/hooks';
import { addOrderProduct } from '../salesSlice';
import ProductCard from './Productcard';
import ProductPopup from './Productpopup';
import { XMarkIcon } from '@heroicons/react/24/outline';
import search_icon from '../../../assets/icons/search_icon.svg';
import barcode_icon from '../../../assets/icons/barcode_icon.svg';


const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://erp-backend.ttexpresskw.com';


interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MappedProduct {
  id: string;
  product_id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  image: string;
  image_url: string;
  category: string;
  outOfStock: boolean;
}

export default function ProductSelectionModal({ isOpen, onClose }: ProductSelectionModalProps) {
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [isProductPopupOpen, setIsProductPopupOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<MappedProduct | null>(null);

  // ─── Real API ─────────────────────────────────────────────────
  const { data: productsResponse, isLoading, error } = useGetProductsQuery();
  const { data: categoriesResponse } = useGetCategoriesQuery();

  const categories = useMemo(() => {
    const apiCategories = categoriesResponse?.data?.data || [];
    return [
      'All Items',
      ...apiCategories
        .filter((cat: any) => cat.is_active)
        .map((cat: any) => cat.category_name),
    ];
  }, [categoriesResponse]);

  const products: MappedProduct[] = useMemo(() => {
    const apiProducts = productsResponse?.data?.data || [];

    
    return apiProducts.map((product: any) => {
      const totalStock = product.inventory?.reduce(
        (sum: number, inv: any) => sum + (inv.available_quantity ?? inv.quantity ?? 0), 0
      ) || 0;

     const imagePath = product.primary_image?.image_path 
  ? `${API_BASE_URL}/storage/${product.primary_image.image_path}` 
  : 'https://images.unsplash.com/photo-1541275055241-329bbdf9a191?w=500&auto=format&fit=crop&q=60';

      return {
        id: product.id.toString(),
        product_id: product.id,
        name: product.product_name || '',
        sku: product.sku || '',
        price: typeof product.selling_price === 'string'
          ? parseFloat(product.selling_price)
          : product.selling_price || 0,
        stock: totalStock,
        outOfStock: totalStock <= 0,
        image:imagePath,
        image_url: product.primary_image?.image_path || '',
        category: product.category?.category_name || 'All Items',
      };
    });
  }, [productsResponse]);

  const [filteredProducts, setFilteredProducts] = useState<MappedProduct[]>([]);

  useEffect(() => {
    let filtered = products;
    if (selectedCategory !== 'All Items') {
      filtered = filtered.filter(p =>
        p.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query)
      );
    }
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  const handleProductClick = (product: MappedProduct) => {
    setCurrentProduct(product);
    setIsProductPopupOpen(true);
  };

  const handleAddToSelection = (productWithDetails: any) => {
    const uniqueId = `${currentProduct?.product_id}-${productWithDetails.variant_id || 'default'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
      const fullImageUrl = currentProduct?.image || '';

    dispatch(addOrderProduct({
      id: uniqueId,
      product_id: currentProduct?.product_id || 0,
      name: productWithDetails.name || currentProduct?.name || '',
      sku: productWithDetails.sku || currentProduct?.sku || '',
      price: productWithDetails.price || currentProduct?.price || 0,
      size: productWithDetails.size || 'Default',
      variant_id: productWithDetails.variant_id ?? null,
      quantity: productWithDetails.quantity || 1,
      image: currentProduct?.image || '',
      image_url: fullImageUrl, 
    }));
    
    setIsProductPopupOpen(false);
    setCurrentProduct(null);
    onClose(); // Close the modal after adding
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">Select Products</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <img src={search_icon} alt="" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, SKU, or barcode"
              className="w-full pl-12 pr-16 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg" title="Scan Barcode">
              <img src={barcode_icon} alt="" />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="grid grid-cols-5 gap-3 mt-4 p-6 bg-gray-50 rounded-lg">
            {categories.map((category: string) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-md font-medium text-sm whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedCategory === category
                    ? 'border border-[#1773CF] text-black shadow-md shadow-blue-200 bg-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                <p className="text-gray-500 text-sm">Loading products...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-red-500 font-medium">Failed to load products. Please try again.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6 p-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => handleProductClick(product)}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 text-center max-w-sm">Try adjusting your search or filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Nested Product Popup */}
      {isProductPopupOpen && currentProduct && (
        <ProductPopup
          product={currentProduct}
          onClose={() => { setIsProductPopupOpen(false); setCurrentProduct(null); }}
          onAdd={handleAddToSelection}
        />
      )}
    </div>
  );
}