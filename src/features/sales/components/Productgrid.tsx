import { useState, useEffect, useMemo } from "react";
import ProductCard from "../components/Productcard";
import {
  useGetProductsQuery,
  useGetCategoriesQuery,
} from "../../../services/inventoryApi";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  image: string;
  category: string;
  product_name?: string;
  selling_price?: number;
  quantity?: number;
  stock_quantity?: number;
  primary_image?: {
    image_path?: string;
  };
  category_name?: string;
  image_url?: string;
}

interface ProductGridProps {
  searchQuery: string;
  selectedCategory: string;
  onAddToCart: (product: Product) => void;
   branchId?: number; 
}

export default function ProductGrid({
  searchQuery,
  onAddToCart,
   branchId, 
}: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  const { data: productsResponse, isLoading, error } = useGetProductsQuery();
  const { data: categoriesResponse } = useGetCategoriesQuery();

  const categoriesData = categoriesResponse?.data?.data || [];
  const categories = [
    "All Items",
    ...categoriesData
      .filter((cat: any) => cat.is_active)
      .map((cat: any) => cat.category_name),
  ];

  // Use useMemo to prevent recreating products on every render
  const products = useMemo(() => {
  const apiProducts = productsResponse?.data?.data || [];
  
  return apiProducts
    .map((product: any) => {
      // Find inventory for this specific branch
      const branchInventory = branchId
        ? product.inventory?.find((inv: any) => inv.branch_id === branchId)
        : null;

      // If branchId is set and product has NO inventory record for this branch → exclude
      if (branchId && !branchInventory) return null;

      const branchStock = branchInventory?.available_quantity ?? branchInventory?.quantity ?? 0;

      const imagePath = product.primary_image?.image_path 
  ? `/storage/${product.primary_image.image_path}` 
  : 'https://images.unsplash.com/photo-1541275055241-329bbdf9a191?w=500&auto=format&fit=crop&q=60';


      return {
        id: product.id.toString(),
        product_id: product.id,           // ← needed for sale creation
        name: product.product_name || '',
        sku: product.sku || '',
        price: typeof product.selling_price === 'string'
          ? parseFloat(product.selling_price)
          : product.selling_price || 0,
        stock: branchStock,               // ← branch-specific stock
        outOfStock: branchStock <= 0,     // ← flag for UI
        image:imagePath,
        category:
          product.category?.category_name || 'All Items',
      };
    })
    .filter(Boolean); // remove nulls (products not in this branch)
}, [productsResponse, branchId]);

  // Filter products when search, category, or products change
  useEffect(() => {
    if (!products.length) {
      setFilteredProducts([]);
      return;
    }

    let filtered = products;

    if (selectedCategory !== "All Items") {
      filtered = filtered.filter(
        (product: any) =>
          product.category
            .toLowerCase()
            .includes(selectedCategory.toLowerCase()) ||
          selectedCategory
            .toLowerCase()
            .includes(product.category.toLowerCase()),
      );
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product: any) =>
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query),
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]); // Include products in dependency array

  if (isLoading) {
    return (
      <div className="max-w-480 mx-auto px-4 sm:px-6 bg-white rounded-lg py-20">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-480 mx-auto px-4 sm:px-6 bg-white rounded-lg py-20">
        <div className="flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to load products
          </h3>
          <p className="text-gray-600 text-center max-w-sm">
            Please try again later or check your connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-480 mx-auto px-4 sm:px-6 bg-white rounded-lg">
      <div className="grid grid-cols-5 gap-3 mt-4 py-6">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-6 py-3 rounded-md font-medium text-sm whitespace-nowrap transition-all duration-200 cursor-pointer ${
              selectedCategory === category
                ? "border border-[#1773CF] text-black shadow-md shadow-blue-200"
                : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No products found
          </h3>
          <p className="text-gray-600 text-center max-w-sm">
            Try adjusting your search or filter to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
}
