// src/features/pos/pages/POSPage.tsx
import { useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import ProductGrid from "../components/Productgrid";
import CartSidebar from "../components/posProductDetailsSidebar";
import BarcodeScannerPopup from "../components/BarcodeScanner";

import barcode_icon from "../../../assets/icons/barcode_icon.svg";
import search_icon from "../../../assets/icons/search_icon.svg";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  sku: string;
  product_id?: number;
  variant_id?: number;
}

export default function POSPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, _setSelectedCategory] = useState("All Items");
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");

  const session = JSON.parse(localStorage.getItem("pos_session") || "{}");
  console.log("POSPage session:", session);

  // Add to cart function - used by both product grid and barcode scanner
  const handleAddToCart = (product: any) => {
    console.log("Adding to cart:", product);

    // Handle product from barcode scanner (different structure)
    const productId = product.product_id || product.id;
    const productName = product.product_name || product.name;
    const productPrice = parseFloat(
      product.selling_price || product.sale_price || product.price || 0,
    );
    const productSku = product.sku || "";
    const productImage = product.image_url || product.image || "";
    const variantId = product.variant_id || null;

    const existingItem = cartItems.find(
      (item) => item.product_id === productId && item.variant_id === variantId,
    );

    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item.product_id === productId && item.variant_id === variantId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      const newItem: CartItem = {
        id: `${productId}-${variantId || "default"}-${Date.now()}`,
        product_id: productId,
        variant_id: variantId,
        name: productName,
        sku: productSku,
        price: productPrice,
        quantity: 1,
        image: productImage,
      };
      setCartItems([...cartItems, newItem]);
    }

    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems(cartItems.filter((item) => item.id !== itemId));
    } else {
      setCartItems(
        cartItems.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item,
        ),
      );
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  return (
    <DashboardLayout>
      <div className="relative">
        {/* Header with Search */}
        <div className="sticky backdrop-blur-lg">
          <div className="max-w-[1920px] px-2 py-2">
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
                onClick={() => setShowBarcodeScanner(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="Scan Barcode"
              >
                <img src={barcode_icon} alt="" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className={`transition-all duration-300`}>
          <ProductGrid
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onAddToCart={handleAddToCart}
            branchId={session.branchId}
          />
        </div>

        {/* Cart Sidebar - Now passing onAddToCart */}
        <CartSidebar
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onAddToCart={handleAddToCart} // ← IMPORTANT: Pass this prop
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          registerId={session.registerId}
          branchId={session.branchId}
        />

        {/* Barcode Scanner Modal */}
        {showBarcodeScanner && (
          <BarcodeScannerPopup
            onClose={() => setShowBarcodeScanner(false)}
            onProductFound={handleAddToCart}
            branchId={session.branchId}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
