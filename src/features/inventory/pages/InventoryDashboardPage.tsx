// src/features/auth/pages/DashboardPage.tsx
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import ProductDetailsSidebar from "../components/ProductDetailSidebar";
import EditProductModal from "../components/Editproductmodal";
import BulkTransferModal from '../components/BulkTransferModal';
import BulkDiscountModal from '../components/BulkDiscountModal';

// Import the API hook - adjust path as needed
import {
  useGetProductsQuery,
  useGetCategoriesQuery,
  useGetAllInventoryQuery,
  useGetLowStockProductsQuery,
  // useGetPendingTransfersQuery
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
import filterIcon from "../../../assets/icons/filter_icon.svg";
import sort_asc from "../../../assets/icons/sort_icon.png";
import sort_desc from "../../../assets/icons/sort_icon.png";
import { useAppSelector } from "../../../app/hooks";
import type { RootState } from "../../../app/store";

// Add this Product interface at the top of your file (after imports)
// Update the Product interface
interface Product {
  id: number;
  product_name: string;
  description: string;
  sku: string;
  barcode?: string;
  barcode_image?: string;
  barcode_image_url?: string;
  category?: {
    id: number; // Add this
    category_name: string;
  };
  category_name?: string;
  category_id?: number; // Add this
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
  created_at?: string; // Add this
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

type SortField = 'product_name' | 'sku' | 'category' | 'cost_price' | 'selling_price' | 'created_at' | 'status' | 'dimensions' | 'unit' | 'weight' | 'branch_name' | 'stock' | 'branches';
type SortOrder = 'asc' | 'desc';

export default function DashboardPage() {
  const { user } = useAppSelector((state: RootState) => state.auth);

  // Add state for active tab
  const [activeTab, setActiveTab] = useState<"products" | "inventory">("products");

  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SidebarProduct | null>(
    null,
  );

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

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const datePickerRef = useRef<HTMLDivElement>(null);

  //for paginations
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);

  // Fixed: Get categories properly
  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useGetCategoriesQuery();

  // Extract categories from the nested response structure
  const categories: Category[] =
    (categoriesResponse as CategoryResponse)?.data?.data || [];

  // Check user role
  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const isEmp = user?.role?.role_name;

  const basePath = isSuperAdmin ? "/admin" : isEmp ? "" : "";

  const {
    data: branchesData = [],
    isLoading: branchesLoading,
    error: branchesError,
  } = useGetBranchesQuery();

  const branches = Array.isArray(branchesData) ? branchesData : [];

  // Fetch products from API
  const {
    data: productsResponse,
    isLoading: productsLoading,
    isError: productsError,
    error: productsErrorDetail,
    refetch: refetchProducts,
  } = useGetProductsQuery();

  // Fetch all inventory for statistics
  const { data: allInventoryResponse, isLoading: allInventoryLoading } = useGetAllInventoryQuery();

  // Fetch low stock data for statistics
  const { data: lowStockResponse } = useGetLowStockProductsQuery();

  // Fetch pending transfers
  // const { data: pendingTransfersResponse } = useGetPendingTransfersQuery();

  // Extract products from the nested structure
  const products = productsResponse?.data?.data || [];
  const totalProductCount = productsResponse?.data?.total || 0;

  // Calculate statistics from real APIs
  const statistics = useMemo(() => {
    // Get all inventory items from the API
    const allInventoryItems = allInventoryResponse?.data?.data || [];

    // Total unique products across all branches
    const uniqueProductIds = new Set(allInventoryItems.map((item: any) => item.product_id));
    const totalProducts = uniqueProductIds.size;

    // Total stock units - sum of ALL quantities from inventory API
    const totalStockUnits = allInventoryItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

    // Low stock count from low stock API
    const lowStockData = lowStockResponse?.data || [];
    const lowStockCount = lowStockData.length;

    // Pending transfers count
    // const pendingTransfers = pendingTransfersResponse?.data?.length || 0;

    return {
      totalProducts,
      totalStockUnits,
      lowStockCount,
      // pendingTransfers
    };
  }, [allInventoryResponse, lowStockResponse]);

  // Update filteredProducts with proper property access
  const filteredProducts = products.filter((p: Product) => {
    // 1. Auto-search filter (highest priority for UX)
    const matchesSearch =
      searchQuery === "" ||
      p.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Branch filter - Only apply in inventory tab
    let matchesBranch = true;
    if (activeTab === "inventory" && branchId) {
      matchesBranch = p.inventory?.some(inv => inv.branch_id === branchId) || false;
    } else if (activeTab === "products" && branchId) {
      // For products tab, we don't filter by branch
      matchesBranch = true;
    }

    if (!matchesBranch) return false;

    // 3. Category filter
    const matchesCategory =
      !selectedCategory ||
      (p.category && p.category.id?.toString() === selectedCategory) ||
      p.category_id?.toString() === selectedCategory ||
      (p.category_name &&
        p.category_name.toLowerCase() ===
        categories.find((c) => c.id.toString() === selectedCategory)
          ?.category_name.toLowerCase());

    if (!matchesCategory) return false;

    // 4. Stock status filter
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
        case "Pre Order":
          matchesStockStatus = false; // Implement pre-order logic if needed
          break;
      }
    }

    if (!matchesStockStatus) return false;

    // 5. Date range filter - Only apply if product has created_at
    let matchesDateRange = true;
    if (dateRange !== "Date" && p.created_at) {
      const productDate = new Date(p.created_at);
      const today = new Date();

      switch (dateRange) {
        case "Today":
          matchesDateRange =
            productDate.toDateString() === today.toDateString();
          break;
        case "Last 7 Days":
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(today.getDate() - 7);
          matchesDateRange = productDate >= sevenDaysAgo;
          break;
        case "This Month":
          matchesDateRange =
            productDate.getMonth() === today.getMonth() &&
            productDate.getFullYear() === today.getFullYear();
          break;
        case "This Year":
          matchesDateRange = productDate.getFullYear() === today.getFullYear();
          break;
        case "Custom Range":
          if (customStartDate && customEndDate && isCustomDateSelected) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            matchesDateRange = productDate >= start && productDate <= end;
          } else {
            matchesDateRange = true;
          }
          break;
      }
    } else if (dateRange !== "Date" && !p.created_at) {
      matchesDateRange = true;
    }

    return matchesDateRange;
  });

  // Sorting function
  const sortProducts = (products: Product[]) => {
    return [...products].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'product_name':
          aValue = a.product_name || a.name || '';
          bValue = b.product_name || b.name || '';
          break;
        case 'sku':
          aValue = a.sku || '';
          bValue = b.sku || '';
          break;
        case 'category':
          aValue = a.category?.category_name || a.category_name || '';
          bValue = b.category?.category_name || b.category_name || '';
          break;
        case 'cost_price':
          aValue = typeof a.cost_price === 'string' ? parseFloat(a.cost_price) : (a.cost_price || 0);
          bValue = typeof b.cost_price === 'string' ? parseFloat(b.cost_price) : (b.cost_price || 0);
          break;
        case 'selling_price':
          aValue = typeof a.selling_price === 'string' ? parseFloat(a.selling_price) : (a.selling_price || 0);
          bValue = typeof b.selling_price === 'string' ? parseFloat(b.selling_price) : (b.selling_price || 0);
          break;
        case 'created_at':
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
          break;
        case 'dimensions':
          aValue = a.dimensions || '';
          bValue = b.dimensions || '';
          break;
        case 'unit':
          aValue = a.unit || '';
          bValue = b.unit || '';
          break;
        case 'weight':
          aValue = a.weight ? Number(a.weight) : 0;
          bValue = b.weight ? Number(b.weight) : 0;
          break;
        case 'branches':
          aValue = a.inventory?.length || 0;
          bValue = b.inventory?.length || 0;
          break;
        case 'branch_name':
          // For inventory tab, sort by first branch name
          aValue = a.inventory?.[0]?.branch?.branch_name || '';
          bValue = b.inventory?.[0]?.branch?.branch_name || '';
          break;
        case 'stock':
          aValue = a.inventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0;
          bValue = b.inventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc'
          ? (aValue > bValue ? 1 : -1)
          : (aValue < bValue ? 1 : -1);
      }
    });
  };

  const productsWithInventory = filteredProducts.filter(
    (product: Product) => {
      const hasInventory = product.inventory &&
        Array.isArray(product.inventory) &&
        product.inventory.length > 0;

      return hasInventory;
    }
  );

  const handleViewProduct = (product: Product) => {
    // Transform API product to match sidebar's expected structure
    const sidebarProduct: SidebarProduct = {
      id: product.id,
      name: product.product_name || '',
      description: product.description || '',
      sku: product.sku || "N/A",
      barcode: product.barcode,
      barcode_image: product?.barcode_image,
      barcode_image_url: product?.barcode_image_url,
      category: product.category?.category_name || product.category_name || "Uncategorized",
      branch: product.branch || product.branch_name || "Main Warehouse",
      quantity: product.stock_quantity || product.quantity || 0,
      cost: typeof product.cost_price === "string"
        ? parseFloat(product.cost_price)
        : (product.cost_price as number) || 0,
      price: typeof product.selling_price === "string"
        ? parseFloat(product.selling_price)
        : (product.selling_price as number) || 0,
      status: product.status || (product.is_active ? "In Stock" : "Out of Stock"),
      image: getProductImageUrl({
        image: product.image,
        primary_image: product.primary_image
      }),
      images: product.images || [],
      variants: product.variants || [],
      inventory: product.inventory || [],
      weight: product.weight ? Number(product.weight) : undefined,
      dimensions: product.dimensions || undefined,
      color: product.color || undefined,
      unit: product.unit || 'piece',
      low_stock_alert: product.low_stock_alert || undefined,
      is_active: product.is_active,
      created_at: product.created_at,
      updated_at: product.updated_at
    };

    console.log("sidebar product details: ", sidebarProduct);
    setSelectedProduct(sidebarProduct);
    setShowProductDetails(true);
  };

  // Calculate pagination indexes
  const productsToDisplay = activeTab === "products"
    ? sortProducts(filteredProducts)
    : sortProducts(productsWithInventory);

  const shouldPaginate = activeTab === "products";

  const indexOfLastProduct = shouldPaginate ? currentPage * productsPerPage : productsWithInventory.length;
  const indexOfFirstProduct = shouldPaginate ? indexOfLastProduct - productsPerPage : 0;

  const currentProducts = shouldPaginate
    ? productsToDisplay.slice(indexOfFirstProduct, indexOfLastProduct)
    : productsWithInventory; // Show ALL inventory products without pagination

  // Calculate total pages
  const totalPages = Math.ceil(productsToDisplay.length / productsPerPage);

  // Generate page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
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

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageClick = (pageNumber: number | string) => {
    if (typeof pageNumber === "number") {
      setCurrentPage(pageNumber);
    }
  };

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle sort click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <img src={sort_asc} alt="sort" className="w-4 h-4 opacity-30" />;
    }
    return sortOrder === 'asc'
      ? <img src={sort_asc} alt="asc" className="w-4 h-4" />
      : <img src={sort_desc} alt="desc" className="w-4 h-4" />;
  };

  const handleCloseSidebar = () => {
    setShowProductDetails(false);
  };

  const handleAddProductClick = () => {
    setShowAddProductModal(true);
  };

  const handleCloseAddProductModal = () => {
    setShowAddProductModal(false);
  };

  const handleTransferStockClick = () => {
    setShowBulkTransfer(!showBulkTransfer);
    setSelectedProductIds([]);
  };

  const handleProductSelect = (productId: number) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleBulkDiscountClick = () => {
    setShowBulkDiscountModal(true);
  };

  const handleBulkDiscountSuccess = () => {
    refetchProducts();
  };

  const handleSelectAll = () => {
    if (filteredProducts.length === 0) return;

    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(
        filteredProducts.map((product: Product) => product.id),
      );
    }
  };

  const handleBulkTransfer = () => {
    if (selectedProductIds.length === 0) {
      alert('Please select at least one product to transfer');
      return;
    }
    setShowBulkTransferModal(true);
  };

  const selectedProductsData = filteredProducts.filter((p: Product) =>
    selectedProductIds.includes(p.id)
  ).map((p: Product) => ({
    id: p.id,
    name: p.product_name || p.name || '',
    sku: p.sku || 'N/A'
  }));

  const handleRetryProducts = () => {
    refetchProducts();
  };

  // Add this useEffect for closing date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setShowCustomDatePicker(false);
      }
    };

    if (showCustomDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCustomDatePicker]);

  const handleExportToExcel = () => {
    if (filteredProducts.length === 0) {
      alert("No products to export");
      return;
    }

    try {
      exportToExcel(filteredProducts, "inventory_products");
      console.log("Excel export started...");
    } catch (error) {
      console.error("Excel export failed:", error);
      alert("Failed to export to Excel");
    }
  };

  const handleExportToPDF = () => {
    if (filteredProducts.length === 0) {
      alert("No products to export");
      return;
    }

    try {
      exportToPDF(filteredProducts, "inventory_products");
      console.log("PDF export started...");
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export to PDF");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* First Row: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: 4 Cards (2x2 grid) */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Total Products */}
              <div className="bg-white rounded-lg p-6">
                <div className="flex justify-between">
                  <div>
                    <p className="text-lg font-medium text-gray-600">
                      Total Products
                    </p>
                    <p className="text-[24px] font-semibold text-gray-900 mt-6">
                      {totalProductCount}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-[#F7F9FB] flex items-center justify-center">
                    <img src={icon_3} alt="Revenue" />
                  </div>
                </div>
              </div>

              {/* Card 2: Total Stock Units */}
              <div className="bg-white rounded-lg p-6">
                <div className="flex justify-between">
                  <div>
                    <p className="text-lg font-medium text-gray-600">
                      Total Stock Units
                    </p>
                    <p className="text-[24px] font-semibold text-gray-900 mt-6">
                      {allInventoryLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        statistics.totalStockUnits.toLocaleString()
                      )}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-[#F7F9FB] flex items-center justify-center">
                    <img src={icon_4} alt="Pending Orders" />
                  </div>
                </div>
              </div>

              {/* Card 3: Low Stock Products */}
              <div className="bg-white rounded-lg p-6">
                <div className="flex justify-between">
                  <div>
                    <p className="text-lg font-medium text-gray-600">
                      Low Stock Products
                    </p>
                    <p className="text-[24px] font-semibold text-gray-900 mt-6">
                      {allInventoryLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        statistics.lowStockCount
                      )}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-[#F7F9FB] flex items-center justify-center">
                    <img src={icon_1} alt="Low Stock" />
                  </div>
                </div>
              </div>

              {/* Card 4: Pending Transfers */}
              <div className="bg-white rounded-lg p-6">
                <div className="flex justify-between">
                  <div>
                    <p className="text-lg font-medium text-gray-600">
                      Pending Transfers
                    </p>
                    <p className="text-[24px] font-semibold text-gray-900 mt-6">
                      {/* {statistics.pendingTransfers} Request{statistics.pendingTransfers !== 1 ? 's' : ''} */} 0
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-[#F7F9FB] flex items-center justify-center">
                    <img src={icon_2} alt="Pending Approvals" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: 4 Buttons in gray background section */}
          <div className="bg-white rounded-lg p-6 items-center">
            <div className="space-y-4">
              {/* Row 1: Two buttons */}
              <div className="text-center">
                <p className="text-xl align-center font-semibold">
                  Quick Actions
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleAddProductClick}
                  className="flex items-center space-x-4 bg-white rounded-lg p-6 border-2 border-[#0088FF] hover:border-blue-700 hover:shadow-sm transition-all w-full cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#ECF0F4] flex items-center justify-center shrink-0">
                    <img src={addIcon} alt="Add Product" className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-medium text-gray-900">
                      Add Product
                    </span>
                  </div>
                </button>

                <button
                  onClick={handleTransferStockClick}
                  className={`flex items-center space-x-4 bg-white rounded-lg p-6 border-2 hover:border-blue-700 hover:shadow-sm transition-all w-full cursor-pointer ${showBulkTransfer
                    ? "border-blue-700 bg-blue-50"
                    : "border-[#0088FF]"
                    }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-[#ECF0F4] flex items-center justify-center shrink-0">
                    <img
                      src={transfer_stock}
                      alt="Export Data"
                      className="w-6 h-6"
                    />
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-medium text-gray-900">
                      Bulk Transfer Stock
                    </span>
                  </div>
                </button>
              </div>

              {/* Row 2: Two buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleBulkDiscountClick}
                  className="flex items-center space-x-4 bg-white rounded-lg p-6 border-2 border-[#0088FF] hover:border-blue-700 hover:shadow-sm transition-all w-full cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#ECF0F4] flex items-center justify-center shrink-0">
                    <img
                      src={bulk_discount}
                      alt="Quick Reports"
                      className="w-6 h-6"
                    />
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-medium text-gray-900">
                      Bulk Discount (Import Excel)
                    </span>
                  </div>
                </button>

                <Link
                  to={`${basePath}/inventory/reports`}
                  className="flex items-center space-x-4 bg-white rounded-lg p-6 border-2 border-[#0088FF] hover:border-blue-700 hover:shadow-sm transition-all w-full cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#ECF0F4] flex items-center justify-center shrink-0">
                    <img
                      src={inventory_report}
                      alt="Stock Check"
                      className="w-6 h-6"
                    />
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-medium text-gray-900">
                      Inventory Reports
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table Section */}
        <div className="bg-white rounded-xl overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200 px-6 pt-4">
            <div className="flex">
              <button
                onClick={() => {
                  setActiveTab("products");
                  setShowBulkTransfer(false);
                  setCurrentPage(1);
                  setBranchId(null); // Clear branch filter when switching to products tab
                }}
                className={`px-6 py-3 text-lg font-medium transition-colors relative ${activeTab === "products"
                  ? "text-blue-600 border-b-2 border-blue-600"
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
                className={`px-6 py-3 text-lg font-medium transition-colors relative ${activeTab === "inventory"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Inventory Details
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="p-6">
            <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
              {/* Date Filter */}
              <div className="flex-1 min-w-[180px] relative" ref={datePickerRef}>
                <button
                  onClick={() => {
                    setShowCustomDatePicker(true);
                    setIsCustomDateSelected(true);
                  }}
                  className="w-full px-4 py-2.5 shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold bg-white flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <span>Custom Range</span>
                  <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                </button>

                {/* Custom Date Range Picker */}
                {showCustomDatePicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-4 w-[320px]">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900">
                          Select Date Range
                        </h4>
                        <button
                          onClick={() => {
                            setShowCustomDatePicker(false);
                            setDateRange("Date");
                            setIsCustomDateSelected(false);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <svg
                            className="w-4 h-4"
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
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          onClick={() => {
                            setCustomStartDate("");
                            setCustomEndDate("");
                          }}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => setShowCustomDatePicker(false)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Branch Selection - Only show in inventory tab */}
              {activeTab === "inventory" && (
                <div className="flex-1 min-w-[180px] relative">
                  <select
                    value={branchId ?? ""}
                    onChange={(e) =>
                      setBranchId(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    className="w-full px-4 py-2.5 shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold appearance-none bg-white pr-10 cursor-pointer"
                    disabled={!!branchesError || branchesLoading}
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                  </div>
                  {branchesLoading && (
                    <p className="text-gray-500 text-sm mt-1">
                      Loading branches...
                    </p>
                  )}
                  {branchesError && (
                    <p className="text-red-500 text-sm mt-1">
                      Failed to load branches
                    </p>
                  )}
                </div>
              )}

              {/* Category Filter */}
              <div className="flex-1 min-w-[180px] relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedCategory(
                      selectedCategory === value ? "" : value,
                    );
                  }}
                  className="w-full px-4 py-2.5 shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold appearance-none bg-white pr-10 cursor-pointer"
                >
                  <option value="">Category</option>
                  {categoriesLoading ? (
                    <option disabled>Loading categories...</option>
                  ) : categoriesError ? (
                    <option disabled>Failed to load categories</option>
                  ) : categories.length > 0 ? (
                    categories
                      .filter((cat: Category) => cat.is_active)
                      .map((category: Category) => (
                        <option key={category.id} value={category.id}>
                          {category.category_name}
                        </option>
                      ))
                  ) : (
                    <option disabled>No categories found</option>
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <img src={dropdown_arrow_icon} alt="" />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex-1 min-w-[180px] relative">
                <select
                  value={selectedStockStatus}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedStockStatus(
                      selectedStockStatus === value ? "" : value,
                    );
                  }}
                  className="w-full px-4 py-2.5 shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold appearance-none bg-white pr-10 cursor-pointer"
                >
                  <option value="">Stock Status</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Pre Order">Pre Order</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <img src={dropdown_arrow_icon} alt="" />
                </div>
              </div>

              {/* Filter Icon Button - Fixed small width */}
              <div className="shrink-0">
                <button className="w-14 h-14 flex items-center justify-center cursor-pointer">
                  <img src={filterIcon} alt="Filter" className="w-7 h-7" />
                </button>
              </div>
            </div>

            {/* Active filters */}
            {(branchId ||
              selectedCategory ||
              selectedStockStatus ||
              dateRange !== "Date" ||
              isCustomDateSelected) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <p className="text-sm text-gray-600 mr-2">Active filters:</p>

                  {dateRange !== "Date" && dateRange !== "Custom Range" && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Date: {dateRange}
                      <button
                        onClick={() => setDateRange("Date")}
                        className="ml-1.5 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {isCustomDateSelected && customStartDate && customEndDate && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Date: {new Date(customStartDate).toLocaleDateString()} -{" "}
                      {new Date(customEndDate).toLocaleDateString()}
                      <button
                        onClick={() => {
                          setDateRange("Date");
                          setIsCustomDateSelected(false);
                          setCustomStartDate("");
                          setCustomEndDate("");
                        }}
                        className="ml-1.5 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {branchId && activeTab === "inventory" && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Branch:{" "}
                      {branches.find((b) => b.id === branchId)?.branch_name}
                      <button
                        onClick={() => setBranchId(null)}
                        className="ml-1.5 text-green-600 hover:text-green-800 text-sm"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {selectedCategory && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Category:{" "}
                      {
                        categories.find(
                          (c) => c.id.toString() === selectedCategory,
                        )?.category_name
                      }
                      <button
                        onClick={() => setSelectedCategory("")}
                        className="ml-1.5 text-purple-600 hover:text-purple-800 text-sm"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {selectedStockStatus && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Status: {selectedStockStatus}
                      <button
                        onClick={() => setSelectedStockStatus("")}
                        className="ml-1.5 text-yellow-600 hover:text-yellow-800 text-sm"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {(branchId ||
                    selectedCategory ||
                    selectedStockStatus ||
                    dateRange !== "Date" ||
                    isCustomDateSelected) && (
                      <button
                        onClick={() => {
                          setBranchId(null);
                          setSelectedCategory("");
                          setSelectedStockStatus("");
                          setDateRange("Date");
                          setIsCustomDateSelected(false);
                          setCustomStartDate("");
                          setCustomEndDate("");
                        }}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                      >
                        Clear All Filters
                      </button>
                    )}
                </div>
              )}

            {/* Search and Actions Row */}
            <div className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Search Field */}
                <div className="relative w-full sm:w-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <img
                      src={search_icon}
                      alt="Search"
                      className="w-5 h-5 text-gray-400"
                    />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Product Name, SKU..."
                    className="pl-10 pr-4 py-2.5 border border-[#00000080] rounded-lg focus:border-blue-500 w-full sm:w-90"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={handleExportToPDF}
                    disabled={productsLoading || filteredProducts.length === 0}
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer transition-colors w-full sm:w-auto"
                  >
                    <img src={export_pdf} alt="Add" className="w-7 h-7" />
                    <span className="text-lg font-medium text-black">
                      Export PDF
                    </span>
                  </button>

                  <button
                    onClick={handleExportToExcel}
                    disabled={productsLoading || filteredProducts.length === 0}
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer transition-colors w-full sm:w-auto"
                  >
                    <img src={export_excel} alt="Export" className="w-7 h-7" />
                    <span className="text-lg font-medium text-gray-700">
                      Export Excel
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="relative mx-6 shadow rounded-xl">
            <div className="px-6 py-3">
              <h2 className="text-xl font-bold text-gray-900">
                {activeTab === "products"
                  ? "PRODUCTS LIST"
                  : "INVENTORY DETAILS BY BRANCH"}
              </h2>
              {activeTab === "inventory" && (
                <p className="text-sm text-gray-500 mt-1">
                  Showing only products with inventory data
                </p>
              )}
            </div>

            {/* Loading State */}
            {productsLoading && (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading products...</p>
              </div>
            )}

            {/* Error State - shows only in the table area */}
            {productsError && (
              <div className="p-6 bg-red-50 border border-red-200 rounded-lg m-4">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-500 mr-2"
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
                  <p className="text-red-700 font-medium">
                    Failed to load products
                  </p>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  Error: {JSON.stringify(productsErrorDetail)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  API Response: {JSON.stringify(productsResponse)}
                </p>
                <button
                  onClick={handleRetryProducts}
                  className="mt-3 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm"
                >
                  Retry Loading Products
                </button>
              </div>
            )}

            {/* Empty State */}
            {!productsLoading &&
              !productsError &&
              filteredProducts.length === 0 && (
                <div className="p-8 text-center">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto"
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
                  <p className="mt-2 text-gray-600">No products found</p>
                  {searchQuery && (
                    <p className="text-sm text-gray-500">
                      Try adjusting your search query
                    </p>
                  )}
                </div>
              )}

            {/* Table (only show when not loading and no error) */}
            {!productsLoading && !productsError && filteredProducts.length > 0 && (
              <>
                {/* Show empty state for inventory tab when no products with inventory */}
                {activeTab === "inventory" && productsWithInventory.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg
                        className="w-16 h-16 text-gray-300 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Inventory Data Available</h3>
                      <p className="text-gray-500 max-w-md">
                        None of the products currently have inventory records. Products will appear here once stock is added to branches.
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Total products: {products.length} | Products with inventory: 0
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            {/* Checkbox Column - Shows when bulk transfer is active AND in products tab */}
                            {showBulkTransfer && activeTab === "products" && (
                              <th className="px-6 py-3 text-left">
                                <input
                                  type="checkbox"
                                  checked={
                                    selectedProductIds.length === productsToDisplay.length &&
                                    productsToDisplay.length > 0
                                  }
                                  onChange={handleSelectAll}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                              </th>
                            )}
                            <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                              Image
                            </th>
                            <th
                              className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('product_name')}
                            >
                              <div className="flex items-center gap-2">
                                Product Name
                                {renderSortIcon('product_name')}
                              </div>
                            </th>
                            <th
                              className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('sku')}
                            >
                              <div className="flex items-center gap-2">
                                SKU
                                {renderSortIcon('sku')}
                              </div>
                            </th>
                            <th
                              className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('category')}
                            >
                              <div className="flex items-center gap-2">
                                Category
                                {renderSortIcon('category')}
                              </div>
                            </th>

                            {activeTab === "products" ? (
                              <>
                                <th
                                  className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                  onClick={() => handleSort('dimensions')}
                                >
                                  <div className="flex items-center gap-2">
                                    Dimensions
                                    {renderSortIcon('dimensions')}
                                  </div>
                                </th>
                                <th
                                  className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                  onClick={() => handleSort('unit')}
                                >
                                  <div className="flex items-center gap-2">
                                    Unit
                                    {renderSortIcon('unit')}
                                  </div>
                                </th>
                                <th
                                  className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                  onClick={() => handleSort('weight')}
                                >
                                  <div className="flex items-center gap-2">
                                    Weight
                                    {renderSortIcon('weight')}
                                  </div>
                                </th>
                                <th
                                  className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                  onClick={() => handleSort('cost_price')}
                                >
                                  <div className="flex items-center gap-2">
                                    Cost Price
                                    {renderSortIcon('cost_price')}
                                  </div>
                                </th>
                                <th
                                  className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                  onClick={() => handleSort('selling_price')}
                                >
                                  <div className="flex items-center gap-2">
                                    Sell Price
                                    {renderSortIcon('selling_price')}
                                  </div>
                                </th>
                              </>
                            ) : (
                              <>
                                <th
                                  className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                  onClick={() => handleSort('branches')}
                                >
                                  <div className="flex items-center gap-2">
                                    Branches
                                    {renderSortIcon('branches')}
                                  </div>
                                </th>
                                <th
                                  className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                  onClick={() => handleSort('branch_name')}
                                >
                                  <div className="flex items-center gap-2">
                                    Branch Name
                                    {renderSortIcon('branch_name')}
                                  </div>
                                </th>
                                <th
                                  className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                  onClick={() => handleSort('stock')}
                                >
                                  <div className="flex items-center gap-2">
                                    Stock
                                    {renderSortIcon('stock')}
                                  </div>
                                </th>
                                <th
                                  className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                  onClick={() => handleSort('status')}
                                >
                                  <div className="flex items-center gap-2">
                                    Status
                                    {renderSortIcon('status')}
                                  </div>
                                </th>
                              </>
                            )}
                            <th
                              className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('created_at')}
                            >
                              <div className="flex items-center gap-2">
                                Created At
                                {renderSortIcon('created_at')}
                              </div>
                            </th>

                            {activeTab === "products" && (
                              <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                Action
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {currentProducts.map((product: Product) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                              {/* Checkbox Column - Only show in products tab when bulk transfer is active */}
                              {showBulkTransfer && activeTab === "products" && (
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={selectedProductIds.includes(product.id)}
                                    onChange={() => handleProductSelect(product.id)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                  />
                                </td>
                              )}

                              {/* Image Column */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="w-8 h-8 rounded-full overflow-hidden">
                                  <img
                                    src={product.primary_image?.image_path
                                      ? `https://erp-backend.ttexpresskw.com/storage/${product.primary_image.image_path}`
                                      : "https://images.unsplash.com/photo-1457089328109-e5d9bd499191?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGZsb3dlcnN8ZW58MHwxfDB8fHww"
                                    }
                                    alt={product.product_name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = "https://images.unsplash.com/photo-1457089328109-e5d9bd499191?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGZsb3dlcnN8ZW58MHwxfDB8fHww";
                                    }}
                                  />
                                </div>
                              </td>

                              {/* Product Name */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-[14px] font-medium text-gray-900">
                                  {product.name || product.product_name}
                                </div>
                              </td>

                              {/* SKU */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-[14px] text-gray-900 font-mono">
                                  {product.sku || "N/A"}
                                </div>
                              </td>

                              {/* Category */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex px-3 py-1 text-xs font-medium">
                                  {product.category?.category_name ||
                                    product.category_name ||
                                    "Uncategorized"}
                                </span>
                              </td>

                              {/* Conditional Columns based on tab */}
                              {activeTab === "products" ? (
                                <>
                                  {/* Dimensions */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex px-3 py-1 text-xs font-medium">
                                      {product.dimensions || "N/A"}
                                    </span>
                                  </td>

                                  {/* Unit */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex px-3 py-1 text-xs font-medium">
                                      {product.unit || "N/A"}
                                    </span>
                                  </td>

                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex px-3 py-1 text-xs font-medium">
                                      {product.weight || "0"}
                                    </span>
                                  </td>

                                  {/* Cost Price */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-[14px] font-medium text-gray-900">
                                      {typeof product.cost_price === "string"
                                        ? parseFloat(product.cost_price).toFixed(3)
                                        : (product.cost_price as number)?.toFixed(3) || "0.000"}
                                    </div>
                                  </td>

                                  {/* Selling Price */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-[14px] font-semibold text-gray-900">
                                      {typeof product.selling_price === "string"
                                        ? parseFloat(product.selling_price).toFixed(3)
                                        : (product.selling_price as number)?.toFixed(3) || "0.000"}
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  {/* Branches Count - Inventory Tab */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-[14px] text-gray-900">
                                      {product.inventory && Array.isArray(product.inventory) && product.inventory.length > 0 ? (
                                        <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                          {product.inventory.length} {product.inventory.length === 1 ? 'Branch' : 'Branches'}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400">No inventory</span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Branch-wise Stock Details - Inventory Tab */}
                                  <td className="px-6 py-4">
                                    {product.inventory && Array.isArray(product.inventory) && product.inventory.length > 0 ? (
                                      <div className="space-y-2">
                                        {product.inventory.map((inv, idx) => (
                                          <div key={idx} className="flex flex-col rounded-lg border-blue-400">
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-[13px] font-semibold text-gray-800">
                                                {inv.branch?.branch_name || `Branch #${inv.branch_id}`}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px]">
                                              {inv.reserved_quantity !== undefined && inv.reserved_quantity > 0 && (
                                                <span className="text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                                                  Reserved: {inv.reserved_quantity}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 text-[13px]">No branch inventory</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    {product.inventory && Array.isArray(product.inventory) && product.inventory.length > 0 ? (
                                      <div className="space-y-2">
                                        {product.inventory.map((inv, idx) => (
                                          <div key={idx} className="flex flex-col rounded-lg border-blue-400">
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-[13px] font-bold text-gray-900">
                                                {inv.quantity || 0} units
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 text-[13px]">No branch inventory</span>
                                    )}
                                  </td>
                                  {/* Status */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`inline-flex px-3 py-2 text-xs font-medium rounded-lg ${(() => {
                                          const totalStock = product.inventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0;
                                          if (totalStock === 0) {
                                            return "bg-red-100 text-red-800";
                                          } else if (totalStock <= (product.low_stock_threshold || 10)) {
                                            return "bg-yellow-100 text-yellow-800";
                                          } else {
                                            return "bg-green-100 text-green-800";
                                          }
                                        })()
                                        }`}
                                    >
                                      {(() => {
                                        const totalStock = product.inventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0;
                                        if (totalStock === 0) {
                                          return "Out of Stock";
                                        } else if (totalStock <= (product.low_stock_threshold || 10)) {
                                          return "Low Stock";
                                        } else {
                                          return "In Stock";
                                        }
                                      })()}
                                    </span>
                                  </td>
                                </>
                              )}

                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex px-3 py-1 text-xs font-medium">
                                  {product.created_at
                                    ? new Date(product.created_at).toLocaleString()
                                    : "N/A"}
                                </span>
                              </td>


                              {/* Action Column - Only in Products Tab */}
                              {activeTab === "products" && (
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleViewProduct(product)}
                                      className="flex items-center space-x-1 px-3 py-1.5 text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                      <span className="text-[14px] font-medium cursor-pointer">
                                        View
                                      </span>
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Bulk Transfer Button - Shows when products are selected (only in products tab) */}
                    {showBulkTransfer && selectedProductIds.length > 0 && activeTab === "products" && (
                      <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            {selectedProductIds.length} product(s) selected
                          </span>
                          <button
                            onClick={handleBulkTransfer}
                            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Transfer Selected Products
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Pagination - Only show when there are products */}
          {!productsLoading &&
            !productsError &&
            filteredProducts.length > 0 && (
              <div className="px-6 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-500">
                    Showing{" "}
                    <span className="font-medium">
                      {indexOfFirstProduct + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastProduct, productsToDisplay.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {productsToDisplay.length}
                    </span>{" "}
                    {activeTab === "products" ? "products" : "products with inventory"}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${currentPage === 1
                        ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                        : "text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                        }`}
                    >
                      Previous
                    </button>

                    {getPageNumbers().map((pageNumber, index) => (
                      <button
                        key={index}
                        onClick={() => handlePageClick(pageNumber)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${currentPage === pageNumber
                          ? "text-white bg-blue-600 hover:bg-blue-700"
                          : typeof pageNumber === "number"
                            ? "text-gray-700 hover:bg-gray-100"
                            : "text-gray-500 cursor-default"
                          }`}
                        disabled={typeof pageNumber !== "number"}
                      >
                        {pageNumber}
                      </button>
                    ))}

                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${currentPage === totalPages
                        ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                        : "text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                        }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      <BulkDiscountModal
        isOpen={showBulkDiscountModal}
        onClose={() => setShowBulkDiscountModal(false)}
        onSuccess={handleBulkDiscountSuccess}
        filters={{
          category_id: selectedCategory ? Number(selectedCategory) : undefined,
          start_date: isCustomDateSelected ? customStartDate : undefined,
          end_date: isCustomDateSelected ? customEndDate : undefined
        }}
      />

      {/* Product Details Sidebar */}
      <ProductDetailsSidebar
        isOpen={showProductDetails}
        product={selectedProduct}
        onClose={handleCloseSidebar}
      />

      <BulkTransferModal
        isOpen={showBulkTransferModal}
        onClose={() => {
          setShowBulkTransferModal(false);
          setSelectedProductIds([]);
          setShowBulkTransfer(false);
        }}
        selectedProducts={selectedProductsData}
      />

      {/* Add Product Modal */}
      <EditProductModal
        isOpen={showAddProductModal}
        onClose={handleCloseAddProductModal}
        mode="add"
        product={null}
      />
    </DashboardLayout>
  );
}