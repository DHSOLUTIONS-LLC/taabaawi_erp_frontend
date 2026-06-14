// src/features/sales/components/ProductPopup.tsx
import { useState, useEffect } from "react";
import { useGetProductsQuery } from "../../../services/inventoryApi";
import add_product_icon from "../../../assets/icons/add_product_icon.svg";
import add_product_icon_2 from "../../../assets/icons/add.svg";

interface Product {
  id: string;
  product_id?: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  image: string;
  image_url?: string;
  category: string;
  outOfStock?: boolean;
}

interface ProductPopupProps {
  product: Product;
  onClose: () => void;
  onAdd: (productWithDetails: {
    id: string;
    product_id: number;
    name: string;
    sku: string;
    price: number;
    size: string;
    variant_id: number | null;
    quantity: number;
    image: string;
    image_url: string;
  }) => void;
}

interface Variant {
  id: number;
  variant_name: string;
  sku: string;
  selling_price: number | string;
  stock?: number;
}

export default function ProductPopup({
  product,
  onClose,
  onAdd,
}: ProductPopupProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [inputValue, setInputValue] = useState("1");

  // ─── Fetch full product detail to get variants ────────────────
  const { data: productsResponse } = useGetProductsQuery();

  useEffect(() => {
    if (!productsResponse) return;

    const apiProducts = productsResponse?.data?.data || [];
    const productId = product.product_id || parseInt(product.id);
    const found = apiProducts.find((p: any) => p.id === productId);

    if (found?.variants && found.variants.length > 0) {
      const mappedVariants: Variant[] = found.variants.map((v: any) => ({
        id: v.id,
        variant_name: v.variant_name || v.name || "",
        sku: v.sku || product.sku,
        selling_price: v.selling_price ?? v.price ?? product.price,
      }));
      setVariants(mappedVariants);
      setSelectedVariant(mappedVariants[0]); // default select first
    } else {
      // No variants — treat as single product with no variant
      setVariants([]);
      setSelectedVariant(null);
    }
  }, [productsResponse, product]);

  // Price shown: variant price if selected, else product price
  const currentPrice = selectedVariant
    ? typeof selectedVariant.selling_price === "string"
      ? parseFloat(selectedVariant.selling_price)
      : selectedVariant.selling_price
    : product.price;

  const currentSku = selectedVariant?.sku || product.sku;

  const handleAddProduct = () => {
    onAdd({
      id: `${product.id}-${selectedVariant?.id ?? "default"}-${Date.now()}`,
      product_id: product.product_id || parseInt(product.id),
      name: product.name,
      sku: currentSku,
      price: currentPrice,
      size: selectedVariant?.variant_name || "Default",
      variant_id: selectedVariant?.id ?? null,
      quantity,
      image: product.image,
      image_url: product.image_url || product.image,
    });

    setShowSuccess(true);
    setTimeout(() => handleClose(), 2000);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 300);
  };

  const handleQuantityChange = (change: number) => {
    const newQty = quantity + change;
    if (newQty >= 1 && newQty <= product.stock) {
      setQuantity(newQty);
      setInputValue(newQty.toString());
    }
  };

  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Allow empty string for typing
    if (value === "") {
      setInputValue("");
      return;
    }
    
    // Remove leading zeros
    if (value.startsWith("0") && value.length > 1) {
      value = value.replace(/^0+/, "");
    }
    
    // Only allow positive integers
    if (/^\d+$/.test(value)) {
      const numValue = parseInt(value, 10);
      if (numValue >= 1 && numValue <= product.stock) {
        setQuantity(numValue);
        setInputValue(value);
      } else if (numValue > product.stock) {
        setQuantity(product.stock);
        setInputValue(product.stock.toString());
      }
    }
  };

  const handleQuantityBlur = () => {
    if (inputValue === "" || parseInt(inputValue, 10) < 1) {
      setQuantity(1);
      setInputValue("1");
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 transition-all duration-300 ${isClosing ? "opacity-0" : "opacity-100"}`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Popup */}
      <div
        className={`relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-[95%] sm:max-w-md w-full p-4 sm:p-6 md:p-8 transform transition-all duration-300 max-h-[90vh] overflow-y-auto ${isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 bg-white/95 rounded-xl sm:rounded-2xl flex items-center justify-center z-10 animate-fadeIn">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <img
                src={add_product_icon}
                alt=""
                className="w-12 h-12 sm:w-auto sm:h-auto"
              />
              <p className="text-green-600 font-semibold text-sm sm:text-base">
                Added successfully!
              </p>
            </div>
          </div>
        )}

        {/* Product Image */}
        <div className="w-full h-32 sm:h-36 md:h-40 rounded-lg sm:rounded-xl overflow-hidden mb-3 sm:mb-4">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4">
          <div className="w-full sm:w-auto">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 break-words pr-2">
              {product.name}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 break-all">
              SKU: {currentSku}
            </p>
          </div>
          <p className="text-lg sm:text-xl font-semibold text-gray-900">
            KWD {currentPrice.toFixed(3)}
          </p>
        </div>

        {/* Variants (if exist) */}
        {variants.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Select Variant
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {variants.map((variant) => (
                <label
                  key={variant.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="mb-1 sm:mb-0">
                    <span className="font-medium text-gray-900 text-sm sm:text-base">
                      {variant.variant_name}
                    </span>
                    <span className="text-xs text-gray-500 ml-0 sm:ml-2 block sm:inline">
                      SKU: {variant.sku}
                    </span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 mt-1 sm:mt-0">
                    <span className="text-sm font-medium text-gray-700">
                      KWD{" "}
                      {(typeof variant.selling_price === "string"
                        ? parseFloat(variant.selling_price)
                        : variant.selling_price
                      ).toFixed(3)}
                    </span>
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
                      style={{
                        borderColor:
                          selectedVariant?.id === variant.id
                            ? "#000000"
                            : "#9CA3AF",
                        backgroundColor: "white",
                      }}
                      onClick={() => setSelectedVariant(variant)}
                    >
                      {selectedVariant?.id === variant.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-black" />
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* No variants message */}
        {variants.length === 0 && (
          <div className="mb-4 px-3 py-2 bg-gray-50 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-500">
              No variants available — single item
            </p>
          </div>
        )}

        {/* Quantity Controls */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-[#74ABE233] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors font-bold text-lg rounded-lg hover:bg-[#74ABE244]"
              >
                −
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={handleQuantityInput}
                onBlur={handleQuantityBlur}
                className="w-12 h-12 sm:w-14 sm:h-14 text-center bg-[#74ABE2] text-black font-bold text-lg rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              />
              <button
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= product.stock}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-[#74ABE233] text-black disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors font-bold text-lg rounded-lg hover:bg-[#74ABE244]"
              >
                +
              </button>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2 px-2 sm:px-0">
              <p className="text-sm sm:text-base font-semibold text-gray-700">
                Total:
              </p>
              <p className="text-base sm:text-lg font-bold text-gray-900">
                KWD {(currentPrice * quantity).toFixed(3)}
              </p>
            </div>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={handleAddProduct}
          disabled={showSuccess || product.outOfStock}
          className="w-full py-3 sm:py-4 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg font-semibold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[48px]"
        >
          <img
            src={add_product_icon_2}
            alt=""
            className="w-4 h-4 sm:w-5 sm:h-5"
          />
          <span>{product.outOfStock ? "Out of Stock" : "Add"}</span>
        </button>
      </div>

      <style>{`
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
      .animate-fadeIn {
        animation: fadeIn 0.4s ease-out forwards;
      }
      
      /* Custom scrollbar for variants */
      .max-h-48::-webkit-scrollbar {
        width: 4px;
      }
      
      .max-h-48::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
      }
      
      .max-h-48::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 10px;
      }
      
      .max-h-48::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
    `}</style>
    </div>
  );
}