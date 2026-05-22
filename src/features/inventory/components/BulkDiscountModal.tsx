// src/features/inventory/components/BulkDiscountModal.tsx
import { useState, useRef, useEffect, useMemo } from "react";
import {
  usePreviewBulkDiscountImportMutation,
  useImportBulkDiscountMutation,
} from "../../../services/inventoryApi";
import { useGetCategoriesQuery } from "../../../services/inventoryApi";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

import search_icon from "../../../assets/icons/search_icon.svg";
import dropdown_arrow_icon from "../../../assets/icons/dropdown_arrow_icon.svg";

interface BulkDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  filters?: any;
  products: any[];
  categories?: any[];
}

type TabType = "export" | "import";

export default function BulkDiscountModal({
  isOpen,
  onClose,
  onSuccess,
  filters,
  products = [],
  categories: propCategories = [],
}: BulkDiscountModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("export");

  // Export Tab State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Import Tab State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [discountName, setDiscountName] = useState("");
  const [startDate, setStartDate] = useState(
    filters?.start_date || new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    filters?.end_date ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
  );
  const [description, setDescription] = useState("");
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewSummary, setPreviewSummary] = useState<{
    valid_items: number;
    error_count: number;
    total_discount_amount: string;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const { data: categoriesResponse } = useGetCategoriesQuery();
  const categories =
    propCategories.length > 0
      ? propCategories
      : (categoriesResponse as any)?.data?.data || [];

  const [previewImport, { isLoading: isPreviewing }] =
    usePreviewBulkDiscountImportMutation();
  const [importBulkDiscount, { isLoading: isImporting }] =
    useImportBulkDiscountMutation();

  // Filtered Products for Export Tab
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.product_name || p.name || "").toLowerCase().includes(query) ||
          (p.sku || "").toLowerCase().includes(query),
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(
        (p) =>
          p.category_id?.toString() === selectedCategory ||
          p.category?.id?.toString() === selectedCategory ||
          p.category_name === selectedCategory,
      );
    }

    // Apply stock status filter
    if (selectedStockStatus) {
      filtered = filtered.filter((p) => {
        const stock =
          p.inventory?.reduce(
            (sum: number, inv: any) => sum + (inv.quantity || 0),
            0,
          ) ||
          p.stock_quantity ||
          p.quantity ||
          0;
        if (selectedStockStatus === "In Stock") return stock > 0;
        if (selectedStockStatus === "Low Stock")
          return stock > 0 && stock <= (p.low_stock_alert || 10);
        if (selectedStockStatus === "Out of Stock") return stock === 0;
        return true;
      });
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, selectedStockStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStockStatus]);

  useEffect(() => {
    if (!isOpen) {
      // Reset Export Tab
      setSearchQuery("");
      setSelectedCategory("");
      setSelectedStockStatus("");
      setCurrentPage(1);
      // Reset Import Tab
      setSelectedFile(null);
      setDiscountName("");
      setPreviewData([]);
      setPreviewSummary(null);
      setUploadProgress(0);
      setError(null);
      setImportResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const clearExportFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedStockStatus("");
    setCurrentPage(1);
  };

  const handleExportToExcel = () => {
    if (filteredProducts.length === 0) {
      toast.error("No products to export");
      return;
    }

    toast.loading("Exporting...", { id: "export" });

    const exportData = filteredProducts.map((p) => ({
      "Product ID": p.id,
      "Product Name": p.product_name || p.name,
      SKU: p.sku,
      Category: p.category?.category_name || p.category_name,
      "Current Selling Price": p.selling_price || p.price || 0,
      "Stock Quantity":
        p.inventory?.reduce(
          (sum: number, inv: any) => sum + (inv.quantity || 0),
          0,
        ) ||
        p.stock_quantity ||
        p.quantity ||
        0,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products_For_Discount");

    XLSX.writeFile(
      wb,
      `products_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );

    toast.dismiss("export");
    toast.success(`Exported ${filteredProducts.length} products`);
  };

  const downloadTemplateFile = () => {
    if (filteredProducts.length === 0) {
      toast.error("No products available for template");
      return;
    }

    toast.loading("Generating template...", { id: "template" });

    const data: any[] = [];

    filteredProducts.forEach((product: any) => {
      data.push({
        product_id: product.id,
        product_name: product.product_name || product.name,
        variant_id: null,
        variant_name: null,
        original_price: product.selling_price || product.price || 0,
        discount_percentage: "",
        discount_amount: "",
        new_price: "",
      });
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bulk_Discount_Template");

    XLSX.writeFile(
      wb,
      `bulk_discount_template_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );

    toast.dismiss("template");
    toast.success(`Template downloaded with ${data.length} products`);
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    setImportResult(null);
    setPreviewData([]);
    setPreviewSummary(null);

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(fileExtension || "")) {
      setError("Please upload .xlsx, .xls or .csv file");
      setSelectedFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size should be less than 5MB");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handlePreview = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    // Log file details
    console.log("📁 File being sent:", {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
    });

    const formData = new FormData();
    formData.append("file", selectedFile);

    // Log FormData contents (for debugging)
    for (let pair of formData.entries()) {
      if (pair[0] === "file") {
        console.log("📎 File in FormData:", pair[1]);
      }
    }

    try {
      toast.loading("Previewing file...", { id: "preview" });
      const response = await previewImport(formData).unwrap();

      console.log("🔍 Backend full response:", response);

      // Log more details from response
      if (response.data) {
        console.log("Valid items:", response.data.valid_items);
        console.log("Error count:", response.data.error_count);
        console.log("Total discount:", response.data.total_discount_amount);
        if (response.data.preview && response.data.preview.length > 0) {
          console.log("Preview sample:", response.data.preview[0]);
        }
        if (response.data.errors) {
          console.log("Detailed errors:", response.data.errors);
        }
      }

      setPreviewSummary({
        valid_items: response.data.valid_items,
        error_count: response.data.error_count,
        total_discount_amount: response.data.total_discount_amount,
      });
      setPreviewData(response.data.preview || []);

      toast.dismiss("preview");
      if (response.data.valid_items === 0) {
        toast.error("No valid items found. Check browser console for details.");
      } else {
        toast.success(
          `Preview ready: ${response.data.valid_items} valid items`,
        );
      }
    } catch (err: any) {
      toast.dismiss("preview");
      console.error("Preview error - Full error object:", err);
      const errorMsg =
        err?.data?.message || err?.message || "Failed to preview file";
      setError(errorMsg);

      // Log the actual response from server
      if (err?.data) {
        console.error("Server error response:", err.data);
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }
    if (!discountName.trim()) {
      setError("Please enter a discount name");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select start and end dates");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("discount_name", discountName);
    formData.append("start_date", startDate);
    formData.append("end_date", endDate);
    if (description) formData.append("description", description);

    try {
      setUploadProgress(30);
      toast.loading("Importing discounts...", { id: "import" });

      const response = await importBulkDiscount(formData).unwrap();
      setUploadProgress(100);

      toast.dismiss("import");
      setImportResult(response.data);
      toast.success(
        `✅ Import successful! ${response.data.items_count} items processed`,
      );

      if (onSuccess) onSuccess();
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      toast.dismiss("import");
      setError(err?.data?.message || "Failed to import discounts");
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 transition-opacity" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <div
            ref={modalRef}
            className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-5xl"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Bulk Discount Management
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Export products, apply filters, and import discounted prices
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
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

            {/* Tabs */}
            <div className="border-b border-gray-200 px-6">
              <nav className="flex gap-6">
                <button
                  onClick={() => setActiveTab("export")}
                  className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "export"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  📤 Export Products
                </button>
                <button
                  onClick={() => setActiveTab("import")}
                  className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "import"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  📥 Import Discounts
                </button>
              </nav>
            </div>

            {/* Export Tab Content */}
            {activeTab === "export" && (
              <div className="p-6">
                {/* Filters */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <img
                          src={search_icon}
                          alt=""
                          className="w-4 h-4 text-gray-400"
                        />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by product name or SKU..."
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="relative w-full md:w-48">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white pr-10 text-sm"
                      >
                        <option value="">All Categories</option>
                        {categories
                          .filter((c: any) => c.is_active)
                          .map((cat: any) => (
                            <option key={cat.id} value={cat.id.toString()}>
                              {cat.category_name}
                            </option>
                          ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <img
                          src={dropdown_arrow_icon}
                          alt=""
                          className="w-4 h-4"
                        />
                      </div>
                    </div>

                    <div className="relative w-full md:w-40">
                      <select
                        value={selectedStockStatus}
                        onChange={(e) => setSelectedStockStatus(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white pr-10 text-sm"
                      >
                        <option value="">All Stock</option>
                        <option value="In Stock">In Stock</option>
                        <option value="Low Stock">Low Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <img
                          src={dropdown_arrow_icon}
                          alt=""
                          className="w-4 h-4"
                        />
                      </div>
                    </div>

                    {(searchQuery ||
                      selectedCategory ||
                      selectedStockStatus) && (
                      <button
                        onClick={clearExportFilters}
                        className="px-4 py-2.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Image
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Product Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            SKU
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Category
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                            Price
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                            Stock
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {currentProducts.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="text-center py-12 text-gray-500"
                            >
                              No products found
                            </td>
                          </tr>
                        ) : (
                          currentProducts.map((product: any) => {
                            const totalStock =
                              product.inventory?.reduce(
                                (sum: number, inv: any) =>
                                  sum + (inv.quantity || 0),
                                0,
                              ) ||
                              product.stock_quantity ||
                              product.quantity ||
                              0;
                            const stockStatusLabel =
                              totalStock === 0
                                ? "Out of Stock"
                                : totalStock <= (product.low_stock_alert || 10)
                                  ? "Low Stock"
                                  : "In Stock";
                            const stockColor =
                              totalStock === 0
                                ? "text-red-600"
                                : totalStock <= (product.low_stock_alert || 10)
                                  ? "text-yellow-600"
                                  : "text-green-600";

                            return (
                              <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                      src={
                                        product.image_url ||
                                        product.image ||
                                        "https://via.placeholder.com/40"
                                      }
                                      alt={product.product_name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          "https://via.placeholder.com/40";
                                      }}
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-gray-900">
                                    {product.product_name || product.name}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {product.sku || "—"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {product.category?.category_name ||
                                    product.category_name ||
                                    "—"}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-semibold">
                                  KWD{" "}
                                  {parseFloat(
                                    product.selling_price || product.price || 0,
                                  ).toFixed(3)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span
                                    className={`text-sm font-medium ${stockColor}`}
                                  >
                                    {totalStock}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-500">
                      Showing {startIndex + 1} to{" "}
                      {Math.min(
                        startIndex + itemsPerPage,
                        filteredProducts.length,
                      )}{" "}
                      of {filteredProducts.length} products
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded-md disabled:opacity-50"
                      >
                        Previous
                      </button>
                      {getPageNumbers().map((page, idx) => (
                        <button
                          key={idx}
                          onClick={() =>
                            typeof page === "number" && setCurrentPage(page)
                          }
                          className={`px-3 py-1 border rounded-md ${currentPage === page ? "bg-blue-600 text-white" : "hover:bg-gray-50"}`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border rounded-md disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* Export Buttons */}
                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={downloadTemplateFile}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    📥 Download Template (with these products)
                  </button>
                  <button
                    onClick={handleExportToExcel}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    📊 Export to Excel (Filtered List)
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-3">
                  {filteredProducts.length} products match your filters
                </p>
              </div>
            )}

            {/* Import Tab Content */}
            {activeTab === "import" && (
              <div className="p-6">
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    📋 Instructions
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                    <li>
                      Go to <strong>Export Tab</strong> → Download Template with
                      your filtered products
                    </li>
                    <li>
                      Open the Excel file and fill in the{" "}
                      <strong>discount_percentage</strong> column
                    </li>
                    <li>Save the file and come back to this Import tab</li>
                    <li>Upload the file, preview, then import</li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Name *
                    </label>
                    <input
                      type="text"
                      value={discountName}
                      onChange={(e) => setDiscountName(e.target.value)}
                      placeholder="e.g., Summer Sale 2024"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* File Upload Area */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Excel/CSV File
                  </label>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleFileSelect(e.target.files[0])
                      }
                      className="hidden"
                    />

                    <div className="text-center">
                      <svg
                        className={`mx-auto h-10 w-10 ${isDragging ? "text-blue-500" : "text-gray-400"}`}
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-semibold text-blue-600">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        .XLSX, .XLS, or .CSV (max 5MB)
                      </p>
                    </div>
                  </div>

                  {selectedFile && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 text-green-500 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {selectedFile && !importResult && (
                  <button
                    onClick={handlePreview}
                    disabled={isPreviewing}
                    className="w-full mb-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                  >
                    {isPreviewing ? "Previewing..." : "Preview Import"}
                  </button>
                )}

                {previewSummary && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                      📋 Preview Summary
                    </h4>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-xl font-bold text-green-600">
                          {previewSummary.valid_items}
                        </div>
                        <div className="text-xs text-gray-600">Valid Items</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-red-600">
                          {previewSummary.error_count}
                        </div>
                        <div className="text-xs text-gray-600">Errors</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-blue-600">
                          KWD {previewSummary.total_discount_amount}
                        </div>
                        <div className="text-xs text-gray-600">
                          Total Discount
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {previewData.length > 0 && !importResult && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Preview (First 5 rows)
                    </h4>
                    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-x-auto max-h-48 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-100 sticky top-0">
                          <tr>
                            {Object.keys(previewData[0]).map((key) => (
                              <th
                                key={key}
                                className="px-3 py-2 text-left font-medium text-gray-600"
                              >
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {previewData.slice(0, 5).map((row, idx) => (
                            <tr key={idx}>
                              {Object.values(row).map((val: any, i) => (
                                <td key={i} className="px-3 py-2 text-gray-600">
                                  {val || "-"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mb-6">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        Importing...
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {importResult && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800 mb-2">
                      ✅ Import Successful!
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xl font-bold text-green-600">
                          {importResult.items_count}
                        </div>
                        <div className="text-xs text-gray-600">
                          Items Processed
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700">
                          Discount Code:
                        </div>
                        <div className="text-xs font-mono text-blue-600">
                          {importResult.bulk_discount?.discount_code}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={
                      !selectedFile ||
                      !discountName.trim() ||
                      isImporting ||
                      !!importResult
                    }
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isImporting ? "Importing..." : "Import Bulk Discount"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
