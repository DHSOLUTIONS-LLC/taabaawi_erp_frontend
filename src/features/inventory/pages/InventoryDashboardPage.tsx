// src/features/auth/pages/DashboardPage.tsx
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import ProductDetailsSidebar from "../components/ProductDetailSidebar";
import EditProductModal from "../components/Editproductmodal";
import BulkTransferModal from "../components/BulkTransferModal";
import BulkDiscountModal from "../components/BulkDiscountModal";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "https://erp-backend.ttexpresskw.com";

import {
  useGetProductsQuery,
  useGetCategoriesQuery,
  useGetAllInventoryQuery,
  useGetLowStockProductsQuery,
} from "../../../services/inventoryApi";
import { exportToExcel, exportToPDF } from "../../../utils/exportUtils";
import { getProductImageUrl } from "../../../utils/imageHelpers";
import { useGetBranchesQuery } from "../../../services/superAdminApi";

import icon_1 from "../../../assets/icons/low_stock.svg";
import icon_2 from "../../../assets/icons/pending_transfer.svg";
import icon_3 from "../../../assets/icons/total_prod.svg";
import icon_4 from "../../../assets/icons/unit_stock.svg";
import addIcon from "../../../assets/icons/add.svg";
import transfer_stock from "../../../assets/icons/transfer_stock.svg";
import bulk_discount from "../../../assets/icons/bulk_discount.svg";
import inventory_report from "../../../assets/icons/inventory_report.svg";
import dropdown_arrow_icon from "../../../assets/icons/dropdown_arrow_icon.svg";
import export_excel from "../../../assets/icons/export_excel.svg";
import export_pdf from "../../../assets/icons/export_pdf.svg";
import search_icon from "../../../assets/icons/search_icon.svg";
import sort_asc from "../../../assets/icons/sort_icon.png";
import sort_desc from "../../../assets/icons/sort_icon.png";
import { useAppSelector } from "../../../app/hooks";
import type { RootState } from "../../../app/store";

interface Product {
  id: number;
  product_name: string;
  description: string;
  sku: string;
  barcode?: string;
  barcode_image?: string;
  barcode_image_url?: string;
  category?: {
    id: number;
    category_name: string;
  };
  category_name?: string;
  category_id?: number;
  cost_price: number | string;
  selling_price: number | string;
  is_active: boolean;
  stock_quantity?: number;
  quantity?: number;
  status?: string;
  low_stock_threshold?: number;
  image?: string;
  image_url?: string;
  branch?: string;
  branch_name?: string;
  cost?: number;
  price?: number;
  name?: string;
  primary_image?: {
    image_path?: string;
  };
  created_at?: string;
  images?: Array<{
    id: number;
    image_path: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  variants?: Array<any>;
  inventory?: Array<{
    id: number;
    product_id: number;
    variant_id: number | null;
    branch_id: number;
    quantity: number;
    reserved_quantity: number;
    available_quantity: number;
    reorder_point: number;
    last_updated: string;
    created_at: string;
    updated_at: string;
    branch?: {
      id: number;
      branch_name: string;
      branch_type: string;
      has_pos: boolean;
      has_inventory: boolean;
      address: string;
      phone: string;
      email: string;
      is_active: boolean;
    };
  }>;
  weight?: number | string;
  dimensions?: string;
  color?: string;
  unit?: string;
  low_stock_alert?: number;
  updated_at?: string;
}

interface SidebarProduct {
  id: number;
  name: string;
  description: string;
  sku: string;
  barcode?: string;
  barcode_image?: string;
  barcode_image_url?: string;
  weight?: number;
  dimensions?: string;
  color?: string;
  unit?: string;
  low_stock_alert?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  category: string;
  branch: string;
  quantity: number;
  cost: number;
  price: number;
  status: string;
  image: string;
  images?: Array<{
    id: number;
    image_path: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  variants?: any[];
  inventory?: Array<{
    quantity: number;
    available_quantity: number;
    reserved_quantity?: number;
    branch?: {
      id: number;
      branch_name: string;
    };
  }>;
}

interface Category {
  id: number;
  category_name: string;
  parent_id: number | null;
  description: string | null;
  image: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  parent: any | null;
  children: any[];
}

interface CategoryResponse {
  success: boolean;
  data: {
    current_page: number;
    data: Category[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{ url: string | null; label: string; active: boolean }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

type SortField =
  | "product_name"
  | "sku"
  | "category"
  | "cost_price"
  | "selling_price"
  | "created_at"
  | "status"
  | "dimensions"
  | "unit"
  | "weight"
  | "branch_name"
  | "stock"
  | "branches";
type SortOrder = "asc" | "desc";

export default function DashboardPage() {
  const { user } = useAppSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState<"products" | "inventory">("products");
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SidebarProduct | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showBulkTransfer, setShowBulkTransfer] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [showBulkTransferModal, setShowBulkTransferModal] = useState(false);
  const [showBulkDiscountModal, setShowBulkDiscountModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [branchId, setBranchId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("Date");
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [isCustomDateSelected, setIsCustomDateSelected] = useState(false);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);

  const datePickerRef = useRef<HTMLDivElement>(null);

  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useGetCategoriesQuery();

  const categories: Category[] = (categoriesResponse as CategoryResponse)?.data?.data || [];

  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const isEmp = user?.role?.role_name;
  const basePath = isSuperAdmin ? "/admin" : isEmp ? "" : "";

  const {
    data: branchesData = [],
    isLoading: branchesLoading,
    error: branchesError,
  } = useGetBranchesQuery();

  const branches = Array.isArray(branchesData) ? branchesData : [];

  const {
    data: productsResponse,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
  } = useGetProductsQuery();

  const { data: allInventoryResponse, isLoading: allInventoryLoading } = useGetAllInventoryQuery();
  const { data: lowStockResponse } = useGetLowStockProductsQuery();

  const products = productsResponse?.data?.data || [];
  const totalProductCount = productsResponse?.data?.total || 0;

  const statistics = useMemo(() => {
    const allInventoryItems = allInventoryResponse?.data?.data || [];
    const uniqueProductIds = new Set(allInventoryItems.map((item: any) => item.product_id));
    const totalProducts = uniqueProductIds.size;
    const totalStockUnits = allInventoryItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    const lowStockData = lowStockResponse?.data || [];
    const lowStockCount = lowStockData.length;

    return { totalProducts, totalStockUnits, lowStockCount };
  }, [allInventoryResponse, lowStockResponse]);

  const filteredProducts = products.filter((p: Product) => {
    const matchesSearch = searchQuery === "" ||
      p.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    let matchesBranch = true;
    if (activeTab === "inventory" && branchId) {
      matchesBranch = p.inventory?.some((inv) => inv.branch_id === branchId) || false;
    }

    if (!matchesBranch) return false;

    const matchesCategory = !selectedCategory ||
      (p.category && p.category.id?.toString() === selectedCategory) ||
      p.category_id?.toString() === selectedCategory;

    if (!matchesCategory) return false;

    let matchesStockStatus = true;
    if (selectedStockStatus) {
      const totalStock = p.inventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0;
      switch (selectedStockStatus) {
        case "In Stock":
          matchesStockStatus = totalStock > (p.low_stock_threshold || 10);
          break;
        case "Low Stock":
          matchesStockStatus = totalStock > 0 && totalStock <= (p.low_stock_threshold || 10);
          break;
        case "Out of Stock":
          matchesStockStatus = totalStock === 0;
          break;
        default:
          matchesStockStatus = true;
      }
    }

    if (!matchesStockStatus) return false;

    let matchesDateRange = true;
    if (dateRange !== "Date" && p.created_at && isCustomDateSelected && customStartDate && customEndDate) {
      const productDate = new Date(p.created_at);
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      matchesDateRange = productDate >= start && productDate <= end;
    }

    return matchesDateRange;
  });

  const sortProducts = (products: Product[]) => {
    return [...products].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "product_name":
          aValue = a.product_name || a.name || "";
          bValue = b.product_name || b.name || "";
          break;
        case "sku":
          aValue = a.sku || "";
          bValue = b.sku || "";
          break;
        case "category":
          aValue = a.category?.category_name || a.category_name || "";
          bValue = b.category?.category_name || b.category_name || "";
          break;
        case "cost_price":
          aValue = typeof a.cost_price === "string" ? parseFloat(a.cost_price) : a.cost_price || 0;
          bValue = typeof b.cost_price === "string" ? parseFloat(b.cost_price) : b.cost_price || 0;
          break;
        case "selling_price":
          aValue = typeof a.selling_price === "string" ? parseFloat(a.selling_price) : a.selling_price || 0;
          bValue = typeof b.selling_price === "string" ? parseFloat(b.selling_price) : b.selling_price || 0;
          break;
        case "created_at":
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
          break;
        case "unit":
          aValue = a.unit || "";
          bValue = b.unit || "";
          break;
        case "weight":
          aValue = a.weight ? Number(a.weight) : 0;
          bValue = b.weight ? Number(b.weight) : 0;
          break;
        case "branches":
          aValue = a.inventory?.length || 0;
          bValue = b.inventory?.length || 0;
          break;
        case "branch_name":
          aValue = a.inventory?.[0]?.branch?.branch_name || "";
          bValue = b.inventory?.[0]?.branch?.branch_name || "";
          break;
        case "stock":
          aValue = a.inventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0;
          bValue = b.inventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortOrder === "asc" ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
      }
    });
  };

  const productsWithInventory = filteredProducts.filter((product: Product) => {
    return product.inventory && Array.isArray(product.inventory) && product.inventory.length > 0;
  });

  const handleViewProduct = (product: Product) => {
    const sidebarProduct: SidebarProduct = {
      id: product.id,
      name: product.product_name || "",
      description: product.description || "",
      sku: product.sku || "N/A",
      barcode: product.barcode,
      barcode_image: product?.barcode_image,
      barcode_image_url: product?.barcode_image_url,
      category: product.category?.category_name || product.category_name || "Uncategorized",
      branch: product.branch || product.branch_name || "Main Warehouse",
      quantity: product.stock_quantity || product.quantity || 0,
      cost: typeof product.cost_price === "string" ? parseFloat(product.cost_price) : (product.cost_price as number) || 0,
      price: typeof product.selling_price === "string" ? parseFloat(product.selling_price) : (product.selling_price as number) || 0,
      status: product.status || (product.is_active ? "In Stock" : "Out of Stock"),
      image: getProductImageUrl({ image: product.image, primary_image: product.primary_image }),
      images: product.images || [],
      variants: product.variants || [],
      inventory: product.inventory || [],
      weight: product.weight ? Number(product.weight) : undefined,
      dimensions: product.dimensions || undefined,
      color: product.color || undefined,
      unit: product.unit || "piece",
      low_stock_alert: product.low_stock_alert || undefined,
      is_active: product.is_active,
      created_at: product.created_at,
      updated_at: product.updated_at,
    };
    setSelectedProduct(sidebarProduct);
    setShowProductDetails(true);
  };

  const productsToDisplay = activeTab === "products" ? sortProducts(filteredProducts) : sortProducts(productsWithInventory);
  const shouldPaginate = activeTab === "products";

  const indexOfLastProduct = shouldPaginate ? currentPage * productsPerPage : productsWithInventory.length;
  const indexOfFirstProduct = shouldPaginate ? indexOfLastProduct - productsPerPage : 0;
  const currentProducts = shouldPaginate ? productsToDisplay.slice(indexOfFirstProduct, indexOfLastProduct) : productsWithInventory;
  const totalPages = Math.ceil(productsToDisplay.length / productsPerPage);

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowCustomDatePicker(false);
      }
    };
    if (showCustomDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCustomDatePicker]);

  const handleProductSelect = (productId: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (filteredProducts.length === 0) return;
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((product: Product) => product.id));
    }
  };

  const handleBulkTransfer = () => {
    if (selectedProductIds.length === 0) {
      alert("Please select at least one product to transfer");
      return;
    }
    setShowBulkTransferModal(true);
  };

  const selectedProductsData = filteredProducts
    .filter((p: Product) => selectedProductIds.includes(p.id))
    .map((p: Product) => ({ id: p.id, name: p.product_name || p.name || "", sku: p.sku || "N/A" }));

  const statCards = [
    {
      label: "Total Products",
      value: String(totalProductCount),
      icon: icon_3,
      sub: `${totalProductCount} products in catalog`,
    },
    {
      label: "Total Stock Units",
      value: allInventoryLoading ? "..." : statistics.totalStockUnits.toLocaleString(),
      icon: icon_4,
      sub: `Across all branches`,
    },
    {
      label: "Low Stock Products",
      value: allInventoryLoading ? "..." : String(statistics.lowStockCount),
      icon: icon_1,
      sub: statistics.lowStockCount > 0 ? `${statistics.lowStockCount} items need restock` : "All stock levels good",
    },
    {
      label: "Pending Transfers",
      value: "0",
      icon: icon_2,
      sub: "No pending transfers",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 overflow-x-hidden min-w-0">

        {/* Stat Cards - Same UI as first dashboard */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 xl:gap-6">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white rounded-lg p-4 md:p-5 xl:p-6 min-w-0">
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-sm md:text-base font-medium text-gray-600 truncate">{card.label}</p>
                  <p className="text-lg md:text-xl xl:text-2xl font-semibold text-gray-900 mt-6 md:mt-8 break-words">
                    {card.value}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#F7F9FB] flex items-center justify-center shrink-0">
                  <img src={card.icon} alt="" className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center mt-2 gap-1">
                <p className={`text-xs md:text-sm font-semibold truncate ${card.label === "Low Stock Products" && statistics.lowStockCount > 0 ? "text-red-600" : "text-gray-600"}`}>
                  {card.sub}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm">
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-xl md:text-2xl font-semibold text-gray-900">Quick Actions</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="flex items-center gap-4 bg-white rounded-2xl p-2 border-2 border-[#0088FF] hover:border-blue-700 hover:shadow-md transition-all w-full group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#ECF0F4] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <img src={addIcon} alt="Add Product" className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-medium text-gray-900">Add Product</span>
                  </div>
                </button>

                <button
                  onClick={() => setShowBulkTransfer(!showBulkTransfer)}
                  className={`flex items-center gap-4 bg-white rounded-2xl p-2 border-2 border-[#0088FF] hover:border-blue-700 hover:shadow-md transition-all w-full group ${
                    showBulkTransfer ? "border-blue-700 bg-blue-50" : ""
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#ECF0F4] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <img src={transfer_stock} alt="Bulk Transfer" className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-medium text-gray-900">Bulk Transfer Stock</span>
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setShowBulkDiscountModal(true)}
                  className="flex items-center gap-4 bg-white rounded-2xl p-2 border-2 border-[#0088FF] hover:border-blue-700 hover:shadow-md transition-all w-full group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#ECF0F4] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <img src={bulk_discount} alt="Bulk Discount" className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-medium text-gray-900">Bulk Discount (Import Excel)</span>
                  </div>
                </button>

                <Link
                  to={`${basePath}/inventory/reports`}
                  className="flex items-center gap-4 bg-white rounded-2xl p-5 border-2 border-[#0088FF] hover:border-blue-700 hover:shadow-md transition-all w-full group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#ECF0F4] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <img src={inventory_report} alt="Reports" className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-medium text-gray-900">Inventory Reports</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Empty space for layout balance - can be removed if not needed */}
          <div className="hidden xl:block"></div>
        </div>

        {/* Main Table Section */}
        <div className="bg-white rounded-2xl shadow-sm">
          {/* Tabs */}
          <div className="border-b border-gray-200 px-4 sm:px-6 pt-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setActiveTab("products");
                  setShowBulkTransfer(false);
                  setCurrentPage(1);
                  setBranchId(null);
                }}
                className={`px-6 py-3 text-base font-medium transition-all relative ${
                  activeTab === "products"
                    ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Products
              </button>
              <button
                onClick={() => {
                  setActiveTab("inventory");
                  setShowBulkTransfer(false);
                  setCurrentPage(1);
                }}
                className={`px-6 py-3 text-base font-medium transition-all relative ${
                  activeTab === "inventory"
                    ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Inventory Details
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row gap-3 md:gap-4">
              <div className="flex-1 relative" ref={datePickerRef}>
                <button
                  onClick={() => {
                    setShowCustomDatePicker(true);
                    setIsCustomDateSelected(true);
                  }}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl text-left font-medium hover:border-gray-400 transition-colors"
                >
                  Custom Range
                  <img src={dropdown_arrow_icon} alt="" className="w-4 h-4 float-right mt-1" />
                </button>

                {showCustomDatePicker && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 p-5 w-full max-w-[340px]">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900">Select Date Range</h4>
                        <button
                          onClick={() => {
                            setShowCustomDatePicker(false);
                            setDateRange("Date");
                            setIsCustomDateSelected(false);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={() => {
                            setCustomStartDate("");
                            setCustomEndDate("");
                          }}
                          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => setShowCustomDatePicker(false)}
                          className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {activeTab === "inventory" && (
                <div className="flex-1 relative">
                  <select
                    value={branchId ?? ""}
                    onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl focus:border-blue-500 text-sm md:text-base appearance-none"
                    disabled={branchesLoading || !!branchesError}
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex-1 relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value === selectedCategory ? "" : e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl focus:border-blue-500 text-sm md:text-base appearance-none"
                >
                  <option value="">Category</option>
                  {categoriesLoading ? (
                    <option disabled>Loading...</option>
                  ) : categoriesError ? (
                    <option disabled>Error loading categories</option>
                  ) : (
                    categories.filter((cat: Category) => cat.is_active).map((category: Category) => (
                      <option key={category.id} value={category.id}>{category.category_name}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex-1 relative">
                <select
                  value={selectedStockStatus}
                  onChange={(e) => setSelectedStockStatus(e.target.value === selectedStockStatus ? "" : e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl focus:border-blue-500 text-sm md:text-base appearance-none"
                >
                  <option value="">Stock Status</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>

              <div className="flex-1 lg:w-80 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <img src={search_icon} alt="Search" className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Product Name, SKU..."
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-2xl focus:border-blue-500 text-sm md:text-base"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => exportToPDF(filteredProducts, "inventory_products")}
                disabled={productsLoading || filteredProducts.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-2xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <img src={export_pdf} alt="PDF" className="w-5 h-5" />
                <span className="font-medium">Export PDF</span>
              </button>
              <button
                onClick={() => exportToExcel(filteredProducts, "inventory_products")}
                disabled={productsLoading || filteredProducts.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-2xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <img src={export_excel} alt="Excel" className="w-5 h-5" />
                <span className="font-medium">Export Excel</span>
              </button>
            </div>
          </div>

          {/* Table Area */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
 <div className="xl:col-span-4  w-full overflow-x-auto">
            <table className="w-full divide-y divide-gray-200" style={{ minWidth: '680px' }}>
              <thead className="bg-gray-50">
                <tr>
                  {showBulkTransfer && activeTab === "products" && (
                    <th className="px-4 md:px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.length === productsToDisplay.length && productsToDisplay.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                    </th>
                  )}
                  <th className="px-4 md:px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Image</th>
                  <th className="px-4 md:px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Name</th>
                  <th className="px-4 md:px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Category</th>
                  {activeTab === "products" ? (
                    <>
                      <th className="px-4 md:px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Unit</th>
                      <th className="px-4 md:px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Weight</th>
                      <th className="px-4 md:px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">CP</th>
                      <th className="px-4 md:px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">SP</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 md:px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Branch Name</th>
                      <th className="px-4 md:px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Stock</th>
                      <th className="px-4 md:px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                    </>
                  )}
                  <th className="px-4 md:px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Created At</th>
                  {activeTab === "products" && (
                    <th className="px-4 md:px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {productsLoading ? (
                  <tr>
                    <td colSpan={activeTab === "products" ? (showBulkTransfer ? 10 : 9) : (showBulkTransfer ? 8 : 7)} className="py-12 text-center">
                      <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                    </td>
                  </tr>
                ) : currentProducts.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === "products" ? (showBulkTransfer ? 10 : 9) : (showBulkTransfer ? 8 : 7)} className="py-12 text-center text-gray-500 text-sm">
                      No {activeTab === "products" ? "products" : "inventory items"} found
                    </td>
                  </tr>
                ) : (
                  currentProducts.map((product: Product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      {showBulkTransfer && activeTab === "products" && (
                        <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap">
                          <input type="checkbox" checked={selectedProductIds.includes(product.id)} onChange={() => handleProductSelect(product.id)} className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                        </td>
                      )}
                      <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100">
                          <img src={getProductImageUrl({ image: product.image, primary_image: product.primary_image })} alt={product.product_name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1457089328109-e5d9bd499191?w=500&auto=format&fit=crop&q=60"; }} />
                        </div>
                      </td>
                      <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.name || product.product_name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">SKU: {product.sku || 'N/A'}</div>
                      </td>
                      <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap">
                        <span className="inline-flex px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">{product.category?.category_name || product.category_name || "Uncategorized"}</span>
                      </td>
                      {activeTab === "products" ? (
                        <>
                          <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap text-sm text-gray-600">{product.unit || "N/A"}</td>
                          <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap text-sm text-gray-600">{product.weight || "0"}</td>
                          <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap text-sm font-medium text-gray-900">{typeof product.cost_price === "string" ? parseFloat(product.cost_price).toFixed(3) : (product.cost_price as number)?.toFixed(3) || "0.000"}</td>
                          <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{typeof product.selling_price === "string" ? parseFloat(product.selling_price).toFixed(3) : (product.selling_price as number)?.toFixed(3) || "0.000"}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 md:px-5 py-3 md:py-4 text-sm text-gray-600">
                            {product.inventory?.map((inv, idx) => <div key={idx} className="mb-1 whitespace-nowrap">{inv.branch?.branch_name || `Branch #${inv.branch_id}`}</div>) || "—"}
                          </td>
                          <td className="px-4 md:px-5 py-3 md:py-4 text-sm font-medium text-gray-900">
                            {product.inventory?.map((inv, idx) => <div key={idx} className="mb-1 whitespace-nowrap">{inv.quantity || 0} units</div>) || "—"}
                          </td>
                          <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${(() => { const totalStock = product.inventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0; if (totalStock === 0) return "bg-red-100 text-red-700"; else if (totalStock <= (product.low_stock_threshold || 10)) return "bg-yellow-100 text-yellow-700"; else return "bg-green-100 text-green-700"; })()}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                              {(() => { const totalStock = product.inventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0; if (totalStock === 0) return "Out of Stock"; else if (totalStock <= (product.low_stock_threshold || 10)) return "Low Stock"; else return "In Stock"; })()}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap text-sm text-gray-600">{product.created_at ? new Date(product.created_at).toLocaleDateString() : "N/A"}</td>
                      {activeTab === "products" && (
                        <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap">
                          <button onClick={() => handleViewProduct(product)} className="text-blue-600 hover:text-blue-700 font-medium text-sm">View</button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
                {showBulkTransfer && selectedProductIds.length > 0 && activeTab === "products" && (
            <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{selectedProductIds.length} product(s) selected</span>
                <button onClick={handleBulkTransfer} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                  Transfer Selected Products
                </button>
              </div>
            </div>
          )}

          </div>
            </div>
         

      
          {/* Pagination */}
          {!productsLoading && !productsError && filteredProducts.length > 0 && activeTab === "products" && (
            <div className="px-4 sm:px-6 py-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstProduct + 1} to {Math.min(indexOfLastProduct, productsToDisplay.length)} of {productsToDisplay.length} products
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">Previous</button>
                {getPageNumbers().map((pageNumber, index) => (
                  <button key={index} onClick={() => typeof pageNumber === "number" && setCurrentPage(pageNumber)} disabled={typeof pageNumber !== "number"} className={`px-4 py-2 text-sm font-medium rounded-xl ${currentPage === pageNumber ? "bg-blue-600 text-white" : "border border-gray-300 hover:bg-gray-50"}`}>{pageNumber}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <BulkDiscountModal isOpen={showBulkDiscountModal} onClose={() => setShowBulkDiscountModal(false)} onSuccess={() => refetchProducts()} filters={{ category_id: selectedCategory ? Number(selectedCategory) : undefined, start_date: isCustomDateSelected ? customStartDate : undefined, end_date: isCustomDateSelected ? customEndDate : undefined }} />
      <ProductDetailsSidebar isOpen={showProductDetails} product={selectedProduct} onClose={() => setShowProductDetails(false)} />
      <BulkTransferModal isOpen={showBulkTransferModal} onClose={() => { setShowBulkTransferModal(false); setSelectedProductIds([]); setShowBulkTransfer(false); }} selectedProducts={selectedProductsData} />
      <EditProductModal isOpen={showAddProductModal} onClose={() => setShowAddProductModal(false)} mode="add" product={null} />
    </DashboardLayout>
  );
}