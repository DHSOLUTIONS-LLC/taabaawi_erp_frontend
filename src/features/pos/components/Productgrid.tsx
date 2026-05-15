import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronDown } from "lucide-react";
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

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

    // Check if user is Super Admin (no branch restriction)
    const isSuperAdmin = !branchId;

    return apiProducts
      .map((product: any) => {
        let stock = 0;

        if (isSuperAdmin) {
          // Super Admin: Show total stock across ALL branches
          stock =
            product.inventory?.reduce(
              (sum: number, inv: any) =>
                sum + (inv.available_quantity ?? inv.quantity ?? 0),
              0,
            ) || 0;
        } else {
          // Other users: Filter by specific branch
          const branchInventory = product.inventory?.find(
            (inv: any) => inv.branch_id === branchId,
          );
          if (!branchInventory) return null; // Product not available in this branch
          stock =
            branchInventory.available_quantity ?? branchInventory.quantity ?? 0;
        }

        const imagePath = product.primary_image?.image_path
          ? `https://puristic-filmily-bula.ngrok-free.dev/storage/${product.primary_image.image_path}`
          : "https://images.unsplash.com/photo-1541275055241-329bbdf9a191?w=500&auto=format&fit=crop&q=60";

        console.log("imagePath", imagePath);

        return {
          id: product.id.toString(),
          product_id: product.id,
          name: product.product_name || "",
          sku: product.sku || "",
          price:
            typeof product.selling_price === "string"
              ? parseFloat(product.selling_price)
              : product.selling_price || 0,
          stock: stock,
          outOfStock: stock <= 0,
          image: imagePath,
          image_url: imagePath,
          category: product.category?.category_name || "All Items",
        };
      })
      .filter(Boolean);
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
      <div className="relative md:hidden mt-4">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <span className="text-gray-700">
            {selectedCategory || "Select Category"}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            <div className="py-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 ${
                    selectedCategory === category
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Button View - visible only on md screens and above */}
      <div className="hidden md:flex flex-wrap gap-3 mt-4 py-6">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1.5 rounded-md font-medium text-sm whitespace-nowrap transition-all duration-200 cursor-pointer ${
              selectedCategory === category
                ? "border border-[#1773CF] text-black shadow-md shadow-blue-200 bg-white"
                : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
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
