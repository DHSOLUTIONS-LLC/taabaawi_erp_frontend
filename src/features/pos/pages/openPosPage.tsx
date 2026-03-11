// src/features/pos/pages/POSPage.tsx
import { useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import ProductGrid from "../components/Productgrid";
import CartSidebar from "../components/posProductDetailsSidebar";

import barcode_icon from "../../../assets/icons/barcode_icon.svg";
import search_icon from "../../../assets/icons/search_icon.svg";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  sku: string;
}

export default function POSPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, _setSelectedCategory] = useState("All Items");
 
  const session = JSON.parse(localStorage.getItem('pos_session') || '{}');
console.log('POSPage session:', session);


  const handleAddToCart = (product: any) => {
    const existingItem = cartItems.find((item) => item.id === product.id);

    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
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

  const handleScanBarcode = () => {
    // Implement barcode scanning logic
    alert("Barcode scanner activated");
  };

  return (
    <DashboardLayout>
      <div className="relative ">
        {/* Header with Search */}
        <div className="sticky  backdrop-blur-lg ">
          <div className="max-w-[1920px]  px-4 sm:px-6 py-4">
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
                onClick={handleScanBarcode}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="Scan Barcode"
              >
                <img src={barcode_icon} alt="" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className={`transition-all duration-300 `}>
          <ProductGrid
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onAddToCart={handleAddToCart}
             branchId={session.branchId} 
          />
        </div>

        {/* Cart Sidebar */}
        <CartSidebar
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
            registerId={session.registerId}   // ← this
  branchId={session.branchId}       // ← this
        />

        {/* Floating Cart Button - Only show when cart is closed and has items */}
        {/* {!isCartOpen && cartItems.length > 0 && (
          <button
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all duration-200 z-40 hover:scale-110 active:scale-95"
          >
            <div className="relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
          </button>
        )} */}
      </div>
    </DashboardLayout>
  );
}
