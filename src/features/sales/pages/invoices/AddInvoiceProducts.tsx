// src/features/sales/pages/addInvoiceProducts.tsx
import { useState, useEffect, useMemo } from "react";
import ProductCard from "../../components/Productcard";
import ProductPopup from "../../components/Productpopup";
import DashboardLayout from "../../../../layouts/DashboardLayout";
import {
  useGetProductsQuery,
  useGetCategoriesQuery,
} from "../../../../services/inventoryApi";
import { useAppSelector, useAppDispatch } from "../../../../app/hooks";
import type { RootState } from "../../../../app/store";
import { addInvoiceProduct } from "../../salesSlice";
import { useNavigate } from "react-router-dom";
import barcode_icon from "../../../../assets/icons/barcode_icon.svg";
import search_icon from "../../../../assets/icons/search_icon.svg";
import arrow_back_icon from "../../../../assets/icons/arrow_back_icon.svg";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "https://erp-backend.ttexpresskw.com";

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

export default function AddInvoiceProducts() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const basePath = isSuperAdmin ? "/admin" : "";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<MappedProduct | null>(
    null,
  );

  // ─── Real API ─────────────────────────────────────────────────
  const { data: productsResponse, isLoading, error } = useGetProductsQuery();
  const { data: categoriesResponse } = useGetCategoriesQuery();

  const categories = useMemo(() => {
    const apiCategories = categoriesResponse?.data?.data || [];
    return [
      "All Items",
      ...apiCategories
        .filter((cat: any) => cat.is_active)
        .map((cat: any) => cat.category_name),
    ];
  }, [categoriesResponse]);

  const products: MappedProduct[] = useMemo(() => {
    const apiProducts = productsResponse?.data?.data || [];
    console.log("api products", apiProducts);
    return apiProducts.map((product: any) => {
      const totalStock =
        product.inventory?.reduce(
          (sum: number, inv: any) =>
            sum + (inv.available_quantity ?? inv.quantity ?? 0),
          0,
        ) || 0;

      const imagePath = product.primary_image?.image_path
        ? `${API_BASE_URL}/storage/${product.primary_image.image_path}`
        : "https://images.unsplash.com/photo-1541275055241-329bbdf9a191?w=500&auto=format&fit=crop&q=60";

      return {
        id: product.id.toString(),
        product_id: product.id,
        name: product.product_name || "",
        sku: product.sku || "",
        price:
          typeof product.selling_price === "string"
            ? parseFloat(product.selling_price)
            : product.selling_price || 0,
        stock: totalStock,
        outOfStock: totalStock <= 0,
        image: imagePath,
        image_url: product.primary_image?.image_path
          ? `${API_BASE_URL}/storage/${product.primary_image.image_path}`
          : "",
        category: product.category?.category_name || "All Items",
      };
    });
  }, [productsResponse]);

  const [filteredProducts, setFilteredProducts] = useState<MappedProduct[]>([]);

  useEffect(() => {
    let filtered = products;
    if (selectedCategory !== "All Items") {
      filtered = filtered.filter((p) =>
        p.category.toLowerCase().includes(selectedCategory.toLowerCase()),
      );
    }
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query),
      );
    }
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  const handleProductClick = (product: MappedProduct) => {
    setCurrentProduct(product);
    setIsPopupOpen(true);
  };

  // Dispatch to Redux — no localStorage, no navigation state
  const handleAddToSelection = (productWithDetails: any) => {
    // Generate a unique ID for this cart item
    const uniqueId = `${currentProduct?.product_id}-${productWithDetails.variant_id || "default"}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    dispatch(
      addInvoiceProduct({
        id: uniqueId,
        product_id: currentProduct?.product_id || 0,
        name: productWithDetails.name || currentProduct?.name || "",
        sku: productWithDetails.sku || currentProduct?.sku || "",
        price: productWithDetails.price || currentProduct?.price || 0,
        size: productWithDetails.size || "Default",
        variant_id: productWithDetails.variant_id ?? null,
        quantity: productWithDetails.quantity || 1,
        image: currentProduct?.image || "",
        image_url: currentProduct?.image_url || currentProduct?.image || "",
      }),
    );

    // Close the popup after adding
    setIsPopupOpen(false);
    setCurrentProduct(null);
  };

  // Go back to CreateInvoice — Redux already has the products
  const handleMoveForward = () => {
    navigate(`${basePath}/sales/create_invoice`);
  };

  const handleBack = () => {
    navigate(`${basePath}/sales/create_invoice`);
  };

  // Read how many are in Redux to show badge
  const invoiceProducts = useAppSelector(
    (state: RootState) => state.sales.invoiceProducts,
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            <p className="text-gray-500 text-sm">Loading products...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <p className="text-red-500 font-medium">
            Failed to load products. Please try again.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1920px] mx-auto mb-4">
        {/* Header */}
        <div className="flex flex-row justify-between mb-8 items-center">
          <button onClick={handleBack}>
            <img src={arrow_back_icon} alt="" className="w-8 h-8" />
          </button>
          <button
            onClick={handleMoveForward}
            className="py-2 px-4 border border-blue-600 rounded-md cursor-pointer hover:bg-blue-600 hover:text-white hover:font-semibold transition-all relative"
          >
            Move Forward
            {invoiceProducts.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {invoiceProducts.length}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
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
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg"
            title="Scan Barcode"
          >
            <img src={barcode_icon} alt="" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className=" gap-2 mt-4 p-3 bg-white rounded-lg">
          {categories.map((category: string) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`lg:px-6 lg:py-3 px-3 py-2 mx-1 rounded-md font-medium text-sm whitespace-nowrap transition-all duration-200 cursor-pointer ${
                selectedCategory === category
                  ? "border border-[#1773CF] text-black shadow-md shadow-blue-200"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6 p-3 bg-white">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={() => handleProductClick(product)}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && !isLoading && (
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
              Try adjusting your search or filter.
            </p>
          </div>
        )}

        {/* Product Popup */}
        {isPopupOpen && currentProduct && (
          <ProductPopup
            product={currentProduct}
            onClose={() => {
              setIsPopupOpen(false);
              setCurrentProduct(null);
            }}
            onAdd={handleAddToSelection}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
