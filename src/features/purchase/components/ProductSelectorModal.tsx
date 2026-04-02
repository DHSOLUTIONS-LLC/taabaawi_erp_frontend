// src/features/purchase/components/ProductSelectorModal.tsx
import { useState, useMemo } from 'react';
import { useGetProductsQuery, useGetCategoriesQuery } from '../../../services/inventoryApi';


const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://erp-backend.ttexpresskw.com';


interface POProduct {
  id: string;
  product_id: number;
  variant_id: number | null;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  discount_percentage: number;
  tax_percentage: number;
  image: string;
  image_url: string;
}

interface ProductSelectorModalProps {
  onClose: () => void;
  onAddProduct: (product: POProduct) => void;
  selectedProducts: POProduct[];
}

export default function ProductSelectorModal({
  onClose,
  onAddProduct,
  selectedProducts,
}: ProductSelectorModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [justAdded, setJustAdded] = useState<Set<number>>(new Set());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: productsResponse, isLoading } = useGetProductsQuery(undefined as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: categoriesResponse } = useGetCategoriesQuery(undefined as any);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawProducts: any[] = (productsResponse as any)?.data?.data ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoriesData: any[] = (categoriesResponse as any)?.data?.data ?? [];

  const categories = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cats = categoriesData.filter((c: any) => c.is_active).map((c: any) => c.category_name as string);
    return ['All', ...cats];
  }, [categoriesData]);

  interface MappedProduct {
    id: number;
    product_id: number;
    name: string;
    sku: string;
    price: number;
    stock: number;
    image: string;
    category: string;
  }

  const products = useMemo((): MappedProduct[] => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rawProducts
      .map((p: any) => {
        const totalStock: number =
          p.total_stock != null
            ? Number(p.total_stock)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            : (p.inventory ?? []).reduce((sum: number, inv: any) =>
                sum + (inv.available_quantity ?? inv.quantity ?? 0), 0
              );
        return {
          id: p.id as number,
          product_id: p.id as number,
          name: (p.product_name as string) || '',
          sku: (p.sku as string) || '',
          price: parseFloat(p.selling_price as string) || 0,
          stock: totalStock,
          image: p.primary_image?.image_path 
  ? `${API_BASE_URL}/storage/${p.primary_image.image_path}` 
  : 'https://images.unsplash.com/photo-1541275055241-329bbdf9a191?w=500&auto=format&fit=crop&q=60',
          category: (p.category?.category_name as string) || 'Uncategorized',
        };
      })
      .filter((p: MappedProduct) => p.stock > 0); // only in-stock
  }, [rawProducts]);

  const filteredProducts = useMemo((): MappedProduct[] => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCategory]);

  const getInPOQty = (productId: number): number => {
    const existing = selectedProducts.find((p) => p.product_id === productId);
    return existing ? existing.quantity : 0;
  };

  const getQtyInput = (productId: number) => quantities[productId] ?? 1;

  const handleQtyChange = (productId: number, val: number) =>
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(1, val) }));

  const handleAdd = (product: MappedProduct) => {
    const qty = getQtyInput(product.id);
    onAddProduct({
      id: `po-${product.product_id}-${Date.now()}`,
      product_id: product.product_id,
      variant_id: null,
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity: qty,
      discount_percentage: 0,
      tax_percentage: 0,
      image: product.image,
      image_url: product.image,
    });
    setJustAdded((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setJustAdded((prev) => { const s = new Set(prev); s.delete(product.id); return s; });
    }, 1000);
    setQuantities((prev) => ({ ...prev, [product.id]: 1 }));
  };

  const totalInPO = selectedProducts.length;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">Select Products</h2>
            {totalInPO > 0 && (
              <span className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                {totalInPO} in order
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search + Categories */}
        <div className="px-6 py-4 border-b border-gray-100 space-y-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3" />
              <p className="text-sm text-gray-500">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-gray-500 font-medium">No products found</p>
              <p className="text-xs text-gray-400 mt-1">
                {products.length === 0 ? 'All products are out of stock' : 'Try a different search or category'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const inPOQty = getInPOQty(product.id);
                const isJustAdded = justAdded.has(product.id);
                const qtyInput = getQtyInput(product.id);
                return (
                  <div
                    key={product.id}
                    className={`border rounded-xl overflow-hidden bg-white transition-all ${
                      inPOQty > 0 ? 'border-blue-400 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="relative h-36 bg-gray-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1541275055241-329bbdf9a191?w=200&auto=format&fit=crop';
                        }}
                      />
                      <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        product.stock <= 5 ? 'bg-orange-500 text-white' : 'bg-white/90 text-gray-700'
                      }`}>
                        {product.stock} left
                      </div>
                      {inPOQty > 0 && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          ×{inPOQty}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-gray-900 truncate" title={product.name}>
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-400 mb-2 truncate">SKU: {product.sku}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-blue-600">KWD {product.price.toFixed(3)}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[80px]">
                          {product.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          <button
                            onClick={() => handleQtyChange(product.id, qtyInput - 1)}
                            className="w-7 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold"
                          >−</button>
                          <input
                            type="number" min="1" max={product.stock} value={qtyInput}
                            onChange={(e) => handleQtyChange(product.id, parseInt(e.target.value) || 1)}
                            className="w-9 h-8 text-center text-sm font-semibold border-0 focus:ring-0 focus:outline-none"
                          />
                          <button
                            onClick={() => handleQtyChange(product.id, Math.min(product.stock, qtyInput + 1))}
                            className="w-7 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold"
                          >+</button>
                        </div>
                        <button
                          onClick={() => handleAdd(product)}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                            isJustAdded
                              ? 'bg-green-500 text-white'
                              : inPOQty > 0
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isJustAdded ? '✓ Added!' : inPOQty > 0 ? 'Add More' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {totalInPO > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="font-bold text-gray-900">{totalInPO}</span>{' '}
              product{totalInPO !== 1 ? 's' : ''} added to order
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done — Add to Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}