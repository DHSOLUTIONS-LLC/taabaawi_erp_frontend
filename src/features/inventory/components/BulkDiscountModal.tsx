// src/features/inventory/components/BulkDiscountModal.tsx
import { useState, useRef, useEffect, useMemo } from "react";
import { useImportBulkDiscountMutation } from "../../../services/inventoryApi";
import { useGetCategoriesQuery } from "../../../services/inventoryApi";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { getProductImageUrl } from "../../../utils/imageHelpers";

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

interface ValidatedItem {
  row: number;
  product_id: number;
  product_name: string;
  sku: string;
  original_price: number;
  discount_percentage: number;
  discount_amount: number;
  final_price: number;
  variant_id: number | null;
}

interface ValidationError {
  row: number;
  product_id?: number;
  product_name?: string;
  message: string;
}

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

  // Frontend validation states
  const [validatedItems, setValidatedItems] = useState<ValidatedItem[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);

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

  const [importBulkDiscount, { isLoading: isImporting }] =
    useImportBulkDiscountMutation();

  // Filtered Products for Export Tab
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.product_name || p.name || "").toLowerCase().includes(query) ||
          (p.sku || "").toLowerCase().includes(query),
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (p) =>
          p.category_id?.toString() === selectedCategory ||
          p.category?.id?.toString() === selectedCategory ||
          p.category_name === selectedCategory,
      );
    }

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
      setDescription("");
      setValidatedItems([]);
      setValidationErrors([]);
      setExcelColumns([]);
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
      "Discount Percentage": "",
      "Discount Amount": "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products_For_Discount");

    XLSX.writeFile(
      wb,
      `bulk_discount_template_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );

    toast.dismiss("export");
    toast.success(`Template downloaded with ${filteredProducts.length} products`);
  };

  // Parse and validate Excel file in frontend
  const parseAndValidateExcel = async (file: File): Promise<{ valid: ValidatedItem[]; errors: ValidationError[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          if (jsonData.length === 0) {
            reject(new Error("Excel file is empty"));
            return;
          }

          // Get column headers
          const columns = Object.keys(jsonData[0]);
          setExcelColumns(columns);

          const valid: ValidatedItem[] = [];
          const errors: ValidationError[] = [];

          // Create a map of products by ID for quick lookup
          const productsMap = new Map();
          products.forEach((p: any) => {
            productsMap.set(p.id, p);
            productsMap.set(Number(p.id), p);
          });

          for (let index = 0; index < jsonData.length; index++) {
            const row: any = jsonData[index];
            const rowNumber = index + 2; // +2 for header row + 1-based index

            // Try different column name variations
            let productId = row.product_id || row["Product ID"] || row.productId;
            let discountPercentage = row.discount_percentage || row["Discount Percentage"] || row.discountPercentage;
            let discountAmount = row.discount_amount || row["Discount Amount"] || row.discountAmount;

            // Skip empty rows
            if (!productId && !discountPercentage && !discountAmount) {
              continue;
            }

            // Validate product ID
            if (!productId) {
              errors.push({
                row: rowNumber,
                message: "Missing product ID"
              });
              continue;
            }

            const product = productsMap.get(Number(productId));

            if (!product) {
              errors.push({
                row: rowNumber,
                product_id: Number(productId),
                message: `Product ID ${productId} not found in database`
              });
              continue;
            }

            // Get original price
            const originalPrice = parseFloat(product.selling_price || product.price || 0);

            // Calculate discount
            let finalDiscountPercentage = 0;
            let finalDiscountAmount = 0;
            let finalPrice = originalPrice;

            if (discountPercentage && !isNaN(parseFloat(discountPercentage))) {
              finalDiscountPercentage = parseFloat(discountPercentage);

              // Validate discount percentage
              if (finalDiscountPercentage < 0 || finalDiscountPercentage > 100) {
                errors.push({
                  row: rowNumber,
                  product_id: product.id,
                  product_name: product.product_name,
                  message: `Discount percentage must be between 0 and 100 (got: ${finalDiscountPercentage})`
                });
                continue;
              }

              finalDiscountAmount = originalPrice * (finalDiscountPercentage / 100);
              finalPrice = originalPrice - finalDiscountAmount;
            }
            else if (discountAmount && !isNaN(parseFloat(discountAmount))) {
              finalDiscountAmount = parseFloat(discountAmount);

              // Validate discount amount
              if (finalDiscountAmount < 0 || finalDiscountAmount > originalPrice) {
                errors.push({
                  row: rowNumber,
                  product_id: product.id,
                  product_name: product.product_name,
                  message: `Discount amount cannot exceed original price (${originalPrice})`
                });
                continue;
              }

              finalDiscountPercentage = (finalDiscountAmount / originalPrice) * 100;
              finalPrice = originalPrice - finalDiscountAmount;
            }
            else {
              errors.push({
                row: rowNumber,
                product_id: product.id,
                product_name: product.product_name,
                message: "Missing discount_percentage or discount_amount"
              });
              continue;
            }

            // Validate final price
            if (finalPrice < 0) {
              errors.push({
                row: rowNumber,
                product_id: product.id,
                product_name: product.product_name,
                message: `Final price cannot be negative (would be: ${finalPrice})`
              });
              continue;
            }

            // Add to valid items
            valid.push({
              row: rowNumber,
              product_id: product.id,
              product_name: product.product_name || product.name,
              sku: product.sku,
              original_price: originalPrice,
              discount_percentage: finalDiscountPercentage,
              discount_amount: finalDiscountAmount,
              final_price: finalPrice,
              variant_id: row.variant_id || null
            });
          }

          resolve({ valid, errors });

        } catch (err: any) {
          reject(new Error(`Failed to parse Excel: ${err.message}`));
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    setError(null);
    setValidatedItems([]);
    setValidationErrors([]);
    setImportResult(null);

    // Validate file type
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
    setIsParsing(true);

    try {
      toast.loading("Reading and validating file...", { id: "parsing" });

      const result = await parseAndValidateExcel(file);

      setValidatedItems(result.valid);
      setValidationErrors(result.errors);

      toast.dismiss("parsing");

      if (result.valid.length > 0) {
        toast.success(`✅ ${result.valid.length} valid items found`);
      }

      if (result.errors.length > 0) {
        toast.error(`⚠️ ${result.errors.length} errors found - please review`);
      }

      if (result.valid.length === 0 && result.errors.length === 0) {
        setError("No data found in Excel file");
      }

    } catch (err: any) {
      toast.dismiss("parsing");
      setError(err.message || "Failed to parse file");
      console.error("Parse error:", err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (validatedItems.length === 0) {
      setError("No valid items to import");
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

    try {
      setUploadProgress(30);
      toast.loading("Creating discounts...", { id: "import" });

      // Create FormData
      const formData = new FormData();
      formData.append("discount_name", discountName);
      formData.append("start_date", startDate);
      formData.append("end_date", endDate);
      if (description) formData.append("description", description);

      // Create a simple array with just product_id and discount
      const simpleData = validatedItems.map(item => ({
        product_id: item.product_id,
        discount: item.discount_percentage
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(simpleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Discounts");

      // Generate file
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      const buf = new ArrayBuffer(wbout.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < wbout.length; i++) {
        view[i] = wbout.charCodeAt(i) & 0xFF;
      }
      const blob = new Blob([buf], { type: 'application/octet-stream' });
      formData.append("file", blob, "discounts.xlsx");

      // Call API
      const response = await importBulkDiscount(formData).unwrap();

      setUploadProgress(100);
      toast.dismiss("import");
      setImportResult(response.data);
      toast.success(`✅ Successfully created ${validatedItems.length} discounts!`);

      if (onSuccess) onSuccess();
      setTimeout(() => onClose(), 2000);

    } catch (err: any) {
      toast.dismiss("import");
      console.error("Import error:", err);

      let errorMessage = "Failed to import discounts";
      if (err?.data?.message) {
        errorMessage = err.data.message;
      } else if (err?.data?.errors) {
        const errors = err.data.errors;
        if (typeof errors === 'object') {
          errorMessage = Object.values(errors).flat().join(', ');
        } else {
          errorMessage = String(errors);
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
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

  const totalDiscountAmount = validatedItems.reduce(
    (sum, item) => sum + item.discount_amount,
    0
  );

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 transition-opacity" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <div
            ref={modalRef}
            className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-6xl"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Bulk Discount Management
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Export products, fill discount percentages, and import to apply discounts
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 px-6">
              <nav className="flex gap-6">
                <button
                  onClick={() => setActiveTab("export")}
                  className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "export"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                  Export Products
                </button>
                <button
                  onClick={() => setActiveTab("import")}
                  className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "import"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                  Import Discounts
                </button>
              </nav>
            </div>

            {/* Export Tab Content */}
            {activeTab === "export" && (
              <div className="p-6">
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">📋 Instructions:</h4>
                  <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Use filters below to select products for discount</li>
                    <li>Click "Download Template" to get Excel file with selected products</li>
                    <li>Open Excel and fill in <strong>Discount Percentage</strong> column</li>
                    <li>Save file and go to "Step 2: Import Discounts" tab</li>
                  </ol>
                </div>

                {/* Filters */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <img src={search_icon} alt="" className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by product name or SKU..."
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm "
                      />
                    </div>

                    <div className="relative w-full md:w-48">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white pr-10 text-sm"
                      >
                        <option value="">All Categories</option>
                        {categories.filter((c: any) => c.is_active).map((cat: any) => (
                          <option key={cat.id} value={cat.id.toString()}>
                            {cat.category_name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
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
                        <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                      </div>
                    </div>

                    {(searchQuery || selectedCategory || selectedStockStatus) && (
                      <button onClick={clearExportFilters} className="px-4 py-2.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50">
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Image</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SKU</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Price</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {currentProducts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12 text-gray-500">
                              No products found
                            </td>
                          </tr>
                        ) : (
                          currentProducts.map((product: any) => {
                            const totalStock = product.inventory?.reduce(
                              (sum: number, inv: any) => sum + (inv.quantity || 0),
                              0,
                            ) || product.stock_quantity || product.quantity || 0;

                            return (
                              <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                      src={getProductImageUrl(product)}
                                      alt={product.product_name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=500&auto=format&fit=crop&q=60";
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
                                  {product.category?.category_name || product.category_name || "—"}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-semibold">
                                  KWD {parseFloat(product.selling_price || product.price || 0).toFixed(3)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`text-sm font-medium ${totalStock === 0 ? "text-red-600" :
                                    totalStock <= (product.low_stock_alert || 10) ? "text-yellow-600" : "text-green-600"
                                    }`}>
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
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-md disabled:opacity-50">
                        Previous
                      </button>
                      {getPageNumbers().map((page, idx) => (
                        <button
                          key={idx}
                          onClick={() => typeof page === "number" && setCurrentPage(page)}
                          className={`px-3 py-1 border rounded-md ${currentPage === page ? "bg-blue-600 text-white" : "hover:bg-gray-50"}`}
                        >
                          {page}
                        </button>
                      ))}
                      <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md disabled:opacity-50">
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* Export Button */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button onClick={handleExportToExcel} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Download Template ({filteredProducts.length} products)
                  </button>
                </div>
              </div>
            )}

            {/* Import Tab Content */}
            {activeTab === "import" && (
              <div className="p-6">
                {/* Discount Details Form */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Name * <span className="text-xs text-gray-400">(e.g., Summer Sale 2024)</span>
                    </label>
                    <input
                      type="text"
                      value={discountName}
                      onChange={(e) => setDiscountName(e.target.value)}
                      placeholder="Summer Sale 2024"
                      className="w-full px-3 py-2 border border-gray-400 rounded-lg "
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-xs text-gray-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="20% off on all products"
                      className="w-full px-3 py-2 border border-gray-400 rounded-lg "
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
                      className="w-full px-3 py-2 border border-gray-400 rounded-lg "
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
                      className="w-full px-3 py-2 border border-gray-400 rounded-lg "
                    />
                  </div>
                </div>

                {/* File Upload Area */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Excel File with Discounts
                  </label>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                      }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                    />

                    <div className="text-center">
                      <svg className={`mx-auto h-10 w-10 ${isDragging ? "text-blue-500" : "text-gray-400"}`} stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="mt-1 text-xs text-gray-500">.XLSX, .XLS, or .CSV (max 5MB)</p>
                    </div>
                  </div>

                  {selectedFile && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Validation Summary */}
                {(validatedItems.length > 0 || validationErrors.length > 0) && (
                  <div className="mb-6">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-600">{validatedItems.length}</div>
                        <div className="text-xs text-gray-600">Valid Items</div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <div className="text-2xl font-bold text-red-600">{validationErrors.length}</div>
                        <div className="text-xs text-gray-600">Errors</div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="text-xl font-bold text-blue-600">KWD {totalDiscountAmount.toFixed(3)}</div>
                        <div className="text-xs text-gray-600">Total Discount</div>
                      </div>
                    </div>

                    {/* Valid Items Preview */}
                    {validatedItems.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-green-700 mb-2">
                          ✅ Valid Items ({validatedItems.length}) - Will be discounted
                        </h5>
                        <div className="bg-white rounded-lg border border-green-200 overflow-x-auto max-h-64 overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-green-50 sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left">Product</th>
                                <th className="px-3 py-2 text-left">SKU</th>
                                <th className="px-3 py-2 text-right">Original</th>
                                <th className="px-3 py-2 text-right">Discount %</th>
                                <th className="px-3 py-2 text-right">Discount Amt</th>
                                <th className="px-3 py-2 text-right">Final Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {validatedItems.slice(0, 10).map((item, idx) => (
                                <tr key={idx} className="border-t border-gray-200">
                                  <td className="px-3 py-2 font-medium">{item.product_name}</td>
                                  <td className="px-3 py-2 text-gray-500">{item.sku}</td>
                                  <td className="px-3 py-2 text-right">KWD {item.original_price.toFixed(3)}</td>
                                  <td className="px-3 py-2 text-right text-blue-600">{item.discount_percentage.toFixed(2)}%</td>
                                  <td className="px-3 py-2 text-right text-green-600">KWD {item.discount_amount.toFixed(3)}</td>
                                  <td className="px-3 py-2 text-right font-semibold">KWD {item.final_price.toFixed(3)}</td>
                                </tr>
                              ))}
                              {validatedItems.length > 10 && (
                                <tr>
                                  <td colSpan={6} className="px-3 py-2 text-center text-gray-500">
                                    ... and {validatedItems.length - 10} more items
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Errors Preview */}
                    {validationErrors.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-red-700 mb-2">
                          ❌ Errors ({validationErrors.length}) - Will be skipped
                        </h5>
                        <div className="bg-white rounded-lg border border-red-200 overflow-x-auto max-h-48 overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-red-50 sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left">Row</th>
                                <th className="px-3 py-2 text-left">Product ID</th>
                                <th className="px-3 py-2 text-left">Product</th>
                                <th className="px-3 py-2 text-left">Error</th>
                              </tr>
                            </thead>
                            <tbody>
                              {validationErrors.map((err, idx) => (
                                <tr key={idx} className="border-t">
                                  <td className="px-3 py-2">{err.row}</td>
                                  <td className="px-3 py-2">{err.product_id || "-"}</td>
                                  <td className="px-3 py-2">{err.product_name || "-"}</td>
                                  <td className="px-3 py-2 text-red-600">{err.message}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isParsing && (
                  <div className="mb-6 text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-sm text-gray-600">Reading and validating file...</p>
                  </div>
                )}

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mb-6">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Importing...</span>
                      <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
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
                    <h4 className="text-sm font-medium text-green-800 mb-2">✅ Import Successful!</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xl font-bold text-green-600">{validatedItems.length}</div>
                        <div className="text-xs text-gray-600">Items Processed</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700">Discount Name:</div>
                        <div className="text-xs font-semibold text-blue-600">{discountName}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={validatedItems.length === 0 || isImporting || isParsing || !discountName.trim()}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isImporting ? "Creating Discounts..." : `Create ${validatedItems.length} Discount${validatedItems.length !== 1 ? 's' : ''}`}
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