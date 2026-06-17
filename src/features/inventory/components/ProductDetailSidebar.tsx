// src/components/ProductDetailsSidebar.tsx
import { useState } from "react";
import TransferStockModal from "../components/Transferstockmodal";
import ReportDamageModal from "../components/Reportdamagemodal";
import AddStockModal from "../components/AddStockModal";
import EditProductModal from "../components/Editproductmodal";
import InventoryMovementModal from "../components/ViewInventoryMovementModel";
import edit_icon from "../../../assets/icons/edit_icon.svg";
import restock_icon from "../../../assets/icons/restock_icon.svg";
import transfer_stock_icon from "../../../assets/icons/transfer_stock.svg";
import view_products from "../../../assets/icons/view_inventory.svg";
import low_inventory from "../../../assets/icons/low_stock.svg";
import { useAppSelector } from "../../../app/hooks";
import type { RootState } from "../../../app/store";
import RequestStockModal from "./RequestStockModal";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "https://erp-backend.ttexpresskw.com";

interface Product {
  id: number;
  product_name: string;
  name_en: string;
  name_ar?: string | null;
  title_en?: string | null;
  title_ar?: string | null;
  brand_en?: string | null;
  brand_ar?: string | null;
  category_en?: string | null;
  category_ar?: string | null;
  sub_category_en?: string | null;
  sub_category_ar?: string | null;
  description?: string | null;
  description_en?: string | null;
  description_ar?: string | null;
  slug?: string | null;
  sku: string;
  barcode?: string | null;
  barcode_image?: string | null;
  category: string | { category_name: string } | null;
  branch: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
  average_cost_price?: number | null;
  status: string;
  image: string;
  weight?: number | null;
  dimensions?: string | null;
  color?: string | null;
  unit?: string | null;
  size?: string | null;
  low_stock_alert?: number | null;
  is_active?: boolean | null;
  images?: Array<{
    id: number;
    image_path: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  variants?: Array<any>;
  inventory?: Array<any>;
  created_at?: string;
  updated_at?: string;
  // For backward compatibility with old component props
  name?: string;
  cost?: number;
  price?: number;
}

interface ProductDetailsSidebarProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  currentBranchId?: number;
  currentBranchName?: string;
}

export default function ProductDetailsSidebar({
  isOpen,
  product,
  onClose,
  currentBranchId,
  currentBranchName,
}: ProductDetailsSidebarProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showRequestStockModal, setShowRequestStockModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedProductForDamage, setSelectedProductForDamage] = useState<{
    id: number;
    name: string;
    branch: string;
    branch_id: number;
    quantity: number;
    sku?: string;
  } | null>(null);

  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === "Super Admin";

  if (!product) return null;

  // Helper functions to get product data with fallbacks
  const getProductName = () => {
    return product.product_name || product.name || "Unknown Product";
  };

  const getProductDescription = () => {
    return product.description_en || product.description || "No description available";
  };

  const getCostPrice = () => {
    return product.cost_price || product.cost || 0;
  };

  const getSellingPrice = () => {
    return product.selling_price || product.price || 0;
  };

  const getCategoryName = () => {
    if (product.category_en) return product.category_en;
    if (product.category) {
      if (typeof product.category === "object" && product.category.category_name) {
        return product.category.category_name;
      }
      return product.category as string;
    }
    return "Not specified";
  };

  // ============ PROCESS PRODUCT IMAGES ============
  const productImages = (() => {
    if (
      product.images &&
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      return [...product.images]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((img) => `${API_BASE_URL}/storage/${img.image_path}`);
    }
    return [
      product.image ||
      "https://images.unsplash.com/photo-1457089328109-e5d9bd499191?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGZsb3dlcnN8ZW58MHwxfDB8fHww",
    ];
  })();

  // ============ DYNAMIC SPECIFICATIONS FROM API ============
  const specifications = [
    // { label: "English Name", value: product.name_en || product.product_name || "Not specified" },
    // { label: "Arabic Name", value: product.name_ar || "Not specified" },
    // { label: "English Title", value: product.title_en || "Not specified" },
    // { label: "Arabic Title", value: product.title_ar || "Not specified" },
    // { label: "English Brand", value: product.brand_en || "Not specified" },
    // { label: "Arabic Brand", value: product.brand_ar || "Not specified" },
    // { label: "English Category", value: product.category_en || "Not specified" },
    // { label: "Arabic Category", value: product.category_ar || "Not specified" },
    // { label: "English Sub Category", value: product.sub_category_en || "Not specified" },
    // { label: "Arabic Sub Category", value: product.sub_category_ar || "Not specified" },
    { label: "Description", value: product.description_en || product.description || "Not specified" },
    // { label: "Arabic Description", value: product.description_ar || "Description not available" },
    // { label: "Slug", value: product.slug || "Not specified" },
    { label: "SKU", value: product.sku || "N/A" },
    { label: "Barcode", value: product.barcode || "N/A", image: product.barcode_image },
    { label: "Unit", value: product.unit || "Piece" },
    { label: "Weight", value: product.weight ? `${product.weight} kg` : "Not specified" },
    { label: "Dimensions", value: product.dimensions || "Not specified" },
    { label: "Color", value: product.color || "Not specified" },
    { label: "Size", value: product.size || "Not specified" },
    // { label: "Average Cost Price", value: product.average_cost_price  },
    { label: "Low Stock Alert", value: product.low_stock_alert?.toString() || "10" },
    { label: "Status", value: product.is_active ? "Active" : "Inactive" },
  ];

  // ============ VARIANT SPECIFICATIONS ============
  const variantSpecifications =
    !product.variants || product.variants.length === 0
      ? []
      : product.variants.map((variant: any) => ({
        id: variant.id,
        name: variant.variant_name,
        value: variant.variant_value,
        sku: variant.sku,
        barcode: variant.barcode,
        barcode_image: variant.barcode_image,
        cost_price: variant.cost_price,
        selling_price: variant.selling_price,
        additional_price: variant.additional_price,
        is_active: variant.is_active,
      }));

  // ============ BRANCH STOCK DATA FROM API ============
  const branchStock =
    !product.inventory || product.inventory.length === 0
      ? [
        {
          name: "No Branch Data",
          available: 0,
          reserved: 0,
          total: 0,
          is_low_stock: false,
        },
      ]
      : product.inventory.map((inv) => ({
        name: inv.branch?.branch_name || "Unknown Branch",
        available: inv.available_quantity || 0,
        reserved: inv.reserved_quantity || 0,
        total: inv.quantity || 0,
        is_low_stock: inv.quantity <= (product.low_stock_alert || 10),
      }));

  // ============ VARIANT BRANCH STOCK ============
  const variantBranchStock = !product.variants
    ? []
    : product.variants.map((variant) => {
      const variantStock =
        variant.inventory?.map((inv) => ({
          branch_name: inv.branch?.branch_name || "Unknown Branch",
          quantity: inv.quantity || 0,
          available: inv.available_quantity || 0,
          reserved: inv.reserved_quantity || 0,
        })) || [];

      return {
        variant_name: `${variant.variant_name}: ${variant.variant_value}`,
        sku: variant.sku,
        stock: variantStock,
      };
    });

  // ============ PROFIT CALCULATIONS ============
  const costPrice = getCostPrice();
  const sellingPrice = getSellingPrice();

  const profitMargin = (() => {
    if (sellingPrice && costPrice && costPrice > 0) {
      return (((sellingPrice - costPrice) / costPrice) * 100).toFixed(1);
    }
    return "0.0";
  })();

  const profit = sellingPrice - costPrice;

  const totalStock = product.inventory
    ? product.inventory.reduce((sum, inv) => sum + (inv.quantity || 0), 0)
    : product.quantity || 0;

  // ============ HANDLERS ============
  const handleThumbnailClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleTransferStockClick = () => {
    setShowTransferModal(true);
  };

  const handleCloseTransferModal = () => {
    setShowTransferModal(false);
  };

  const handleRequestStockClick = () => {
    setShowRequestStockModal(true);
  };

  const handleReportDamageClick = () => {
    setSelectedProductForDamage({
      id: product.id,
      name: getProductName(),
      branch: branchStock[0]?.name || "Main Warehouse",
      branch_id: product.inventory?.[0]?.branch?.id || 1,
      quantity: totalStock,
      sku: product.sku,
    });
    setShowDamageModal(true);
  };

  const handleEditProductClick = () => {
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
  };

  const handleInventoryMovementClick = () => {
    setShowInventoryModal(true);
  };

  const handleCloseInventoryModal = () => {
    setShowInventoryModal(false);
  };

  const handleRestockClick = () => {
    setShowAddStockModal(true);
  };

  const handleCloseAddStockModal = () => {
    setShowAddStockModal(false);
  };

  // Generate barcode visualization
  const renderBarcode = (barcodeValue: string, barcodeImage?: string) => {
    if (!barcodeValue) return null;

    if (barcodeImage) {
      return (
        <div className="flex flex-col items-center">
          <img
            src={`${API_BASE_URL}/storage/${barcodeImage}`}
            alt={`Barcode ${barcodeValue}`}
            className="h-8 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <span className="text-xs font-mono leading-md">{barcodeValue}</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center">
        <span className="text-xs font-mono">{barcodeValue}</span>
      </div>
    );
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 transition-opacity duration-300 bg-opacity-30"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full md:w-175 lg:w-212.5 xl:w-237.5 bg-[#F8F8F8] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="h-full overflow-y-auto">
          {/* Sidebar Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                Product Details
              </h3>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Product Details Content */}
          <div className="p-6 space-y-6">
            {/* First Row: Main Image, Thumbnails, Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* First Column - Main Image */}
              <div className="md:col-span-5 lg:col-span-5">
                <div className="relative bg-gray-50 border border-[#0000001A] rounded-xl h-full min-h-125 md:min-h-100 lg:min-h-125 flex items-center justify-center overflow-hidden">
                  <img
                    src={productImages[selectedImageIndex]}
                    alt={getProductName()}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1457089328109-e5d9bd499191?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGZsb3dlcnN8ZW58MHwxfDB8fHww";
                    }}
                  />

                  {/* Barcode */}
                  {product.barcode && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-3 py-2 rounded-lg shadow-md">
                      {renderBarcode(product.barcode, product.barcode_image)}
                    </div>
                  )}
                </div>
              </div>

              {/* Second Column - Vertical Thumbnails */}
              <div className="md:col-span-2 lg:col-span-2">
                <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto h-full">
                  {productImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => handleThumbnailClick(index)}
                      className={`shrink-0 w-20 h-20 md:w-full md:h-24 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === index
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <div className="w-full h-full bg-gray-50 p-2">
                        <img
                          src={img}
                          alt={`${getProductName()} ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Third Column - Product Details */}
              <div className="md:col-span-5 lg:col-span-5 bg-white p-4 rounded-xl">
                <div className="space-y-4">
                  {/* Product Title */}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {getProductName().toUpperCase()}
                    </h2>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                      {getProductDescription()}
                    </p>
                  </div>

                  {/* Specifications */}
                  <div className="space-y-3">
                    {specifications.map((spec, index) => (
                      <div key={index} className="flex flex-col items-start">
                        <span className="text-sm text-gray-500 min-w-30">
                          {spec.label}
                        </span>
                        {spec.label === "Barcode" && spec.image ? (
                          <div className="flex flex-col">
                            <img
                              src={`${API_BASE_URL}/storage/${spec.image}`}
                              alt="Barcode"
                              className="h-8 w-auto object-contain mb-1"
                            />
                            <span className="text-sm text-gray-900 font-semibold">
                              {spec.value}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-900 font-semibold">
                            {spec.value}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Variant Specifications - Only show if product has variants */}
                  {variantSpecifications.length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Variant Specifications
                      </h4>
                      <div className="space-y-3">
                        {variantSpecifications.map((variant) => (
                          <div
                            key={variant.id}
                            className="bg-gray-50 p-3 rounded-lg"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {variant.name}: {variant.value}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${variant.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                                  }`}
                              >
                                {variant.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500">SKU:</span>
                                <span className="ml-1 font-mono">
                                  {variant.sku}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Barcode:</span>
                                <span className="ml-1 font-mono">
                                  {variant.barcode}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Cost:</span>
                                <span className="ml-1 font-semibold">
                                  KWD {variant.cost_price}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Price:</span>
                                <span className="ml-1 font-semibold">
                                  KWD {variant.selling_price}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">
                                  Additional:
                                </span>
                                <span className="ml-1">
                                  KWD {variant.additional_price}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Second Row: Price Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500 font-semibold mb-2">
                  Cost Price
                </p>
                <p className="text-xl font-semibold text-gray-900 border border-[#0088FF] p-2 rounded-md text-center">
                  KWD {costPrice.toFixed(3)}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500 font-semibold mb-2">
                  Selling Price
                </p>
                <p className="text-xl font-semibold text-gray-900 border border-[#0088FF] p-2 rounded-md text-center">
                  KWD {sellingPrice.toFixed(3)}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500 font-semibold mb-2">
                  Profit
                </p>
                <p className="text-xl font-semibold text-gray-900 border border-[#0088FF] p-2 rounded-md text-center">
                  KWD {profit.toFixed(3)}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500 font-semibold mb-2">
                  Margin
                </p>
                <p className="text-xl font-semibold text-gray-900 border border-[#0088FF] p-2 rounded-md text-center">
                  {profitMargin}%
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 bg-white px-4 py-8 rounded-xl">
              {/* Edit Product - Admin Only */}
              <button
                onClick={handleEditProductClick}
                disabled={!isSuperAdmin}
                className={`flex flex-col items-center justify-center px-4 py-10 rounded-lg border transition-colors ${isSuperAdmin
                  ? "border-[#0088FF] hover:bg-blue-50 cursor-pointer"
                  : "border-gray-300 opacity-50 cursor-not-allowed"
                  }`}
              >
                <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center mb-2">
                  <img src={edit_icon} alt="Edit" />
                </div>
                <span className="text-md font-medium text-gray-700 text-center">
                  Edit Product
                </span>
                <span className="text-md text-gray-500">Admin Only</span>
              </button>

              {/* Add/Restock - Super Admin only (Direct) */}
              {isSuperAdmin && (
                <button
                  onClick={handleRestockClick}
                  className="flex flex-col items-center justify-center px-4 py-8 rounded-lg border border-[#0088FF] hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center mb-2">
                    <img src={restock_icon} alt="Restock" />
                  </div>
                  <span className="text-md font-medium text-gray-700 text-center">
                    Add/Restock
                  </span>
                </button>
              )}

              {/* Request Stock - Non-Admin users (Requires Approval) */}
              {!isSuperAdmin && (
                <button
                  onClick={handleRequestStockClick}
                  className="flex flex-col items-center justify-center px-4 py-8 rounded-lg border border-yellow-500 bg-yellow-50 hover:bg-yellow-100 transition-colors cursor-pointer"
                >
                  <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-2">
                    <img src={restock_icon} alt="Request" />
                  </div>
                  <span className="text-md font-medium text-yellow-700 text-center">
                    Request Stock
                  </span>
                  <span className="text-xs text-yellow-500">
                    Needs Approval
                  </span>
                </button>
              )}

              {/* Transfer Stock - Same for all (but may need approval for non-admin) */}
              <button
                onClick={handleTransferStockClick}
                disabled={!isSuperAdmin}
                className={`flex flex-col items-center justify-center px-4 py-10 rounded-lg border transition-colors ${isSuperAdmin
                  ? "border-[#0088FF] hover:bg-blue-50 cursor-pointer"
                  : "border-gray-300 opacity-50 cursor-not-allowed"
                  }`}
              >
                <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center mb-2">
                  <img src={transfer_stock_icon} alt="Transfer" />
                </div>
                <span className="text-md font-medium text-gray-700 text-center">
                  Transfer Stock
                </span>
                {!isSuperAdmin && (
                  <span className="text-xs text-yellow-500">
                    Needs Approval
                  </span>
                )}
              </button>

              {/* View Inventory - All users */}
              <button
                onClick={handleInventoryMovementClick}
                className="flex flex-col items-center justify-center px-4 py-8 rounded-lg border border-[#0088FF] hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center mb-2">
                  <img src={view_products} alt="View Inventory" />
                </div>
                <span className="text-md font-medium text-gray-700 text-center">
                  View Inventory
                </span>
              </button>

              {/* Report Damage - All users */}
              <button
                onClick={handleReportDamageClick}
                className="flex flex-col items-center justify-center px-4 py-8 rounded-lg border border-[#0088FF] hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center mb-2">
                  <img src={low_inventory} alt="Report Damage" />
                </div>
                <span className="text-md font-medium text-gray-700 text-center">
                  Report Damage
                </span>
              </button>
            </div>

            {/* Stock By Branch Section */}
            <div className="shadow bg-white rounded-xl">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">
                  Stock By Branch
                </h3>
                {totalStock > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Total Stock: {totalStock} units
                  </p>
                )}
              </div>

              {branchStock.length > 0 &&
                branchStock[0].name !== "No Branch Data" ? (
                <div className="rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                            Branch
                          </th>
                          <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                            Available
                          </th>
                          <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                            Reserved
                          </th>
                          <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {branchStock.map((branch, index) => (
                          <tr key={index} className="hover:bg-gray-100">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {branch.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {branch.available}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {branch.reserved}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {branch.total}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${branch.is_low_stock
                                  ? "bg-yellow-100 text-yellow-800"
                                  : branch.total > 0
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                  }`}
                              >
                                {branch.is_low_stock
                                  ? "Low Stock"
                                  : branch.total > 0
                                    ? "In Stock"
                                    : "Out of Stock"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <p className="text-gray-600">
                    No inventory data available for this product
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Add stock to branches to see inventory distribution
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TransferStockModal
        isOpen={showTransferModal}
        onClose={handleCloseTransferModal}
        product={
          product
            ? {
              id: product.id,
              name: getProductName(),
              sku: product.sku,
            }
            : null
        }
      />

      {showDamageModal && selectedProductForDamage && (
        <ReportDamageModal
          isOpen={showDamageModal}
          onClose={() => {
            setShowDamageModal(false);
            setSelectedProductForDamage(null);
          }}
          onSuccess={() => {
            console.log("Damage reported successfully");
          }}
          product={selectedProductForDamage}
        />
      )}

      <EditProductModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        mode="edit"
        product={
          product
            ? {
              id: product.id,
              name: getProductName(),
              name_ar: product.name_ar,
              title_en: product.title_en,
              title_ar: product.title_ar,
              brand_en: product.brand_en,
              brand_ar: product.brand_ar,
              category: getCategoryName(),
              category_ar: product.category_ar,
              sub_category_en: product.sub_category_en,
              sub_category_ar: product.sub_category_ar,
              description: getProductDescription(),
              description_ar: product.description_ar,
              slug: product.slug,
              sku: product.sku,
              barcode: product.barcode,
              barcode_image: product.barcode_image,
              quantity: totalStock,
              cost: costPrice,
              price: sellingPrice,
              status: product.is_active ? "In Stock" : "Out of Stock",
              image: product.image,
              unit: product.unit,
              weight: product.weight,
              dimensions: product.dimensions,
              color: product.color,
              size: product.size,
              average_cost_price: product.average_cost_price,
              low_stock_alert: product.low_stock_alert,
              is_active: product.is_active,
            }
            : null
        }
      />

      <AddStockModal
        isOpen={showAddStockModal}
        onClose={handleCloseAddStockModal}
        product={
          product
            ? {
              id: product.id,
              name: getProductName(),
              sku: product.sku,
            }
            : null
        }
      />

      <InventoryMovementModal
        isOpen={showInventoryModal}
        onClose={handleCloseInventoryModal}
        product={
          product
            ? {
              name: getProductName(),
              sku: product.sku,
            }
            : null
        }
      />

      {showRequestStockModal && (
        <RequestStockModal
          isOpen={showRequestStockModal}
          onClose={() => setShowRequestStockModal(false)}
          product={product}
          currentBranchId={currentBranchId}
          currentBranchName={currentBranchName}
        />
      )}
    </>
  );
}