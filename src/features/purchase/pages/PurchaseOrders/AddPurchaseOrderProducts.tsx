// src/features/purchase/pages/purchase-orders/AddPurchaseOrderProducts.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector, useAppDispatch } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { useGetProductsQuery, useGetCategoriesQuery } from '../../../../services/inventoryApi';
import { addPOProduct } from '../../purchaseSlice';
import ProductCard from '../../../../features/pos/components/Productcard';
import ProductPopup from '../../../../features/pos/components/Productpopup';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import search_icon from '../../../../assets/icons/search_icon.svg';
import barcode_icon from '../../../../assets/icons/barcode_icon.svg';

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

export default function AddPurchaseOrderProducts() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<MappedProduct | null>(null);

  const { data: productsResponse, isLoading, error } = useGetProductsQuery();
  const { data: categoriesResponse } = useGetCategoriesQuery();

  const categories = ['All Items', ...(categoriesResponse?.data?.data?.map((c: any) => c.category_name) || [])];

  const products: MappedProduct[] = (productsResponse?.data?.data || []).map((product: any) => ({
    id: product.id.toString(),
    product_id: product.id,
    name: product.product_name || '',
    sku: product.sku || '',
    price: parseFloat(product.selling_price) || 0,
    stock: product.total_stock || 0,
    outOfStock: (product.total_stock || 0) <= 0,
    image: product.primary_image?.image_path || '',
    image_url: product.primary_image?.image_path || '',
    category: product.category?.category_name || 'All Items',
  }));

  const [filteredProducts, setFilteredProducts] = useState<MappedProduct[]>([]);

  useEffect(() => {
    let filtered = products;
    if (selectedCategory !== 'All Items') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.sku.toLowerCase().includes(query)
      );
    }
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  const handleProductClick = (product: MappedProduct) => {
    setCurrentProduct(product);
    setIsPopupOpen(true);
  };

  const handleAddToSelection = (productWithDetails: any) => {
    const uniqueId = `${currentProduct?.product_id}-${productWithDetails.variant_id || 'default'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    dispatch(addPOProduct({
      id: uniqueId,
      product_id: currentProduct?.product_id || 0,
      name: productWithDetails.name || currentProduct?.name || '',
      sku: productWithDetails.sku || currentProduct?.sku || '',
      price: productWithDetails.price || currentProduct?.price || 0,
      //size: productWithDetails.size || 'Default',
      variant_id: productWithDetails.variant_id ?? null,
      quantity: productWithDetails.quantity || 1,
      discount_percentage: 0,
      tax_percentage: 0,
      image: currentProduct?.image || '',
      image_url: currentProduct?.image_url || currentProduct?.image || '',
    }));
    
    setIsPopupOpen(false);
    setCurrentProduct(null);
  };

  const handleMoveForward = () => {
    navigate(`${basePath}/purchase/orders/create`);
  };

  const handleBack = () => {
    navigate(`${basePath}/purchase/orders/create`);
  };

  const orderProducts = useAppSelector((state: any) => state.purchase?.poProducts) || [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-32 text-red-500">Failed to load products</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 mb-4">
        {/* Header */}
        <div className="flex flex-row justify-between mb-8 items-center">
          <button onClick={handleBack}>
            <img src={arrow_back_icon} alt="" className="w-8 h-8" />
          </button>
          <button
            onClick={handleMoveForward}
            className="py-2 px-4 border border-blue-600 rounded-md cursor-pointer hover:bg-blue-600 hover:text-white transition-all relative"
          >
            Move Forward
            {orderProducts.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {orderProducts.length}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <img src={search_icon} alt="" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, SKU, or barcode"
            className="w-full pl-12 pr-16 py-3.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg">
            <img src={barcode_icon} alt="" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-5 gap-3 mt-4 p-6 bg-white rounded-lg">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-md font-medium text-sm transition-all ${
                selectedCategory === category
                  ? 'border border-blue-500 text-black shadow-md'
                  : 'border border-gray-200 text-gray-700 hover:border-blue-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-5 gap-6 p-6 bg-white">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={() => handleProductClick(product)}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500">No products found</p>
          </div>
        )}

        {/* Product Popup */}
        {isPopupOpen && currentProduct && (
          <ProductPopup
            product={currentProduct}
            onClose={() => { setIsPopupOpen(false); setCurrentProduct(null); }}
            onAdd={handleAddToSelection}
          />
        )}
      </div>
    </DashboardLayout>
  );
}