// src/features/pos/components/ProductCard.tsx
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  image: string;
  category: string;
  outOfStock?: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative rounded-md overflow-hidden cursor-pointer aspect-square w-full bg-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image Container */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`absolute inset-0 bg-cover transition-all duration-700 ease-out ${isHovered ? "bg-center scale-105" : "bg-right"
            }`}
          style={{ backgroundImage: `url(${product.image})` }}
        />
      </div>

      {/* Gradient Overlay - Only on hover */}
      <div
        className={`absolute inset-0 transition-all duration-500 ${isHovered
            ? "bg-linear-to-t from-white/90 via-white/40 to-transparent"
            : "opacity-0"
          }`}
      />

      {/* Stock Badge - Top Right */}
      <div className="absolute top-3 right-3 z-10">
        <div
          className={`px-3 py-2.5 rounded-md text-xs font-semibold backdrop-blur-md transition-all duration-300 ${product.stock <= 5
              ? "bg-red-500/90 text-white"
              : "bg-white/90 text-gray-900"
            }`}
        >
          {product.outOfStock ? 'Out of Stock' : `${product.stock} Left`}
        </div>
      </div>

      {/* Content Container */}
      <div className="absolute inset-0 p-4 flex flex-col justify-end">
        {/* Product Info - No background */}
        <div className="transition-all duration-300">
          {/* Product Name */}
          <h3
            className={`font-bold text-black mb-1 transition-all duration-300 line-clamp-2 ${isHovered ? "text-lg opacity-100" : "text-lg opacity-90"
              }`}
          >
            {product.name}
          </h3>

          {/* SKU */}
          <p
            className={`text-xs text-black/80 mb-2 transition-all duration-300 ${isHovered ? "opacity-100" : "opacity-70"
              }`}
          >
            SKU: {product.sku}
          </p>

          {/* Price and Add Button Row */}
          <div className="flex items-center justify-between">
            {/* Price */}
            <div
              className={`transition-all duration-300 ${isHovered ? "opacity-100" : "opacity-80"
                }`}
            >
              <span className="text-2xl font-bold text-black">
                ${product.price.toFixed(2)}
              </span>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!product.outOfStock) onAddToCart(product);
              }}
              className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 transform ${isHovered
                  ? "bg-blue-600 hover:bg-blue-700 scale-110"
                  : "bg-white/80 opacity-80 hover:opacity-100"
                } hover:scale-125 active:scale-95`}
              title="Add to cart"
            >
              <svg
                className={`w-5 h-5 transition-colors duration-300 ${isHovered ? "text-white" : "text-gray-700"
                  }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}