// src/components/EditProductModal.tsx
import { useState, useRef, useEffect } from "react";
import dropdown_arrow_icon from "../../../assets/icons/dropdown_arrow_icon.svg";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetCategoriesQuery,
  useBulkUploadProductsMutation,
} from "../../../services/inventoryApi";
import * as XLSX from "xlsx";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  product?: {
    id: number;
    name: string;
    sku: string;
    category: string;
    quantity: number;
    cost: number;
    price: number;
    status: string;
    image?: string;
    barcode?: string;
    barcode_image?: string;
    description?: string;
    unit?: string;
    weight?: number;
    dimensions?: string;
    color?: string;
    low_stock_alert?: number;
    is_active?: boolean;
  } | null;
}

interface Variant {
  variant_name: string;
  variant_value: string;
  cost_price: number;
  selling_price: number;
  additional_price: number;
  sku?: string;
  is_active?: boolean;
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

export default function EditProductModal({
  isOpen,
  onClose,
  mode,
  product,
}: EditProductModalProps) {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  // Single Product States
  const [productName, setProductName] = useState(product?.name || "");
  const [sku] = useState(product?.sku || "");
  const [category, setCategory] = useState(product?.category || "");
  const [description, setDescription] = useState(product?.description || "");
  const [unit, setUnit] = useState(product?.unit || "piece");
  const [weight, setWeight] = useState(product?.weight?.toString() || "");
  const [dimensions, setDimensions] = useState(product?.dimensions || "");
  const [color, setColor] = useState(product?.color || "");
  const [costPrice, setCostPrice] = useState(product?.cost.toString() || "");
  const [sellingPrice, setSellingPrice] = useState(
    product?.price.toString() || "",
  );
  const [lowStockAlert, setLowStockAlert] = useState(
    product?.low_stock_alert?.toString() || "10",
  );
  const [stockStatus, setStockStatus] = useState(product?.status || "In Stock");
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([
    {
      variant_name: "",
      variant_value: "",
      cost_price: 0,
      selling_price: 0,
      additional_price: 0,
      is_active: true,
    },
  ]);
  const [images, setImages] = useState<
    Array<{ file: File | null; preview: string }>
  >([]);

  // Bulk Upload States
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkPreviewData, setBulkPreviewData] = useState<any[]>([]);
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRefBulk = useRef<HTMLInputElement>(null);

  // Common States
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [bulkUploadProducts, { isLoading: isBulkUploading }] = useBulkUploadProductsMutation();
  const isLoading = isCreating || isUpdating || isBulkUploading;

  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useGetCategoriesQuery();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories: Category[] =
    (categoriesResponse as CategoryResponse)?.data?.data || [];

  useEffect(() => {
    if (isOpen) {
      setShowSuccess(false);
      setShowError(false);
      setSuccessMessage("");
      setErrorMessage("");
      setActiveTab("single");
      setBulkFile(null);
      setBulkPreviewData([]);
      setBulkUploadProgress(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          let width = img.width;
          let height = img.height;
          const maxSize = 3000;

          if (width > height && width > maxSize) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width / height) * maxSize;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error("Compression failed"));
              }
            },
            "image/jpeg",
            0.95,
          );
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Single Product Image Handlers
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: Array<{ file: File; preview: string }> = [];
    const remainingSlots = 10 - images.length;
    const filesToProcess = Math.min(files.length, remainingSlots);
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    for (let i = 0; i < filesToProcess; i++) {
      try {
        let file = files[i];

        if (!file.type.startsWith("image/")) {
          setErrorMessage(`File "${file.name}" is not an image`);
          setShowError(true);
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          try {
            file = await compressImage(file);
          } catch (compressionError) {
            setErrorMessage(`Failed to compress ${file.name}`);
            setShowError(true);
            continue;
          }
        }

        const preview = URL.createObjectURL(file);
        newImages.push({ file, preview });
      } catch (error) {
        console.error("Error processing image:", error);
      }
    }

    if (newImages.length > 0) {
      setImages([...images, ...newImages]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const imageToRemove = images[indexToRemove];
    if (imageToRemove.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  // Variant Handlers
  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        variant_name: "",
        variant_value: "",
        cost_price: 0,
        selling_price: 0,
        additional_price: 0,
        is_active: true,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const handleVariantChange = (
    index: number,
    field: keyof Variant,
    value: string | number,
  ) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: value,
    };

    if (field === "selling_price") {
      const costPriceNum = parseFloat(costPrice) || 0;
      const sellingPriceNum =
        typeof value === "number" ? value : parseFloat(value as string) || 0;
      updatedVariants[index].additional_price = sellingPriceNum - costPriceNum;
    }

    if (field === "additional_price") {
      const costPriceNum = parseFloat(costPrice) || 0;
      const additionalPriceNum =
        typeof value === "number" ? value : parseFloat(value as string) || 0;
      updatedVariants[index].selling_price = costPriceNum + additionalPriceNum;
    }

    setVariants(updatedVariants);
  };

  // Bulk Upload Handlers
  const downloadTemplate = () => {
    const template = [
      {
        "Product Name": "Example Product",
        "Category ID": "1",
        "Description": "Product description here",
        "Unit": "piece",
        "Cost Price (KWD)": "10.000",
        "Selling Price (KWD)": "15.000",
        "SKU": "PRD-001",
        "Weight (kg)": "1.5",
        "Dimensions": "10x5x2 cm",
        "Color": "Black",
        "Low Stock Alert": "10",
        "Is Active": "Yes",
        "Stock Status": "In Stock",
        "Has Variants": "No",
        "Variant Name": "",
        "Variant Value": "",
        "Variant Cost Price (KWD)": "",
        "Variant Selling Price (KWD)": "",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Product Name
      { wch: 12 }, // Category ID
      { wch: 30 }, // Description
      { wch: 10 }, // Unit
      { wch: 15 }, // Cost Price
      { wch: 15 }, // Selling Price
      { wch: 15 }, // SKU
      { wch: 12 }, // Weight
      { wch: 15 }, // Dimensions
      { wch: 12 }, // Color
      { wch: 15 }, // Low Stock Alert
      { wch: 12 }, // Is Active
      { wch: 15 }, // Stock Status
      { wch: 12 }, // Has Variants
      { wch: 15 }, // Variant Name
      { wch: 15 }, // Variant Value
      { wch: 18 }, // Variant Cost Price
      { wch: 18 }, // Variant Selling Price
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products_Template");

    // Add instructions sheet
    const instructions = [
      { Field: "Product Name", Required: "Yes", Type: "Text", Description: "Name of the product" },
      { Field: "Category ID", Required: "Yes", Type: "Number", Description: "ID from categories list (e.g., 1, 2, 3)" },
      { Field: "Description", Required: "No", Type: "Text", Description: "Product description" },
      { Field: "Unit", Required: "Yes", Type: "Text", Description: "piece, kg, g, meter, cm, liter, ml, box, pack, dozen, set" },
      { Field: "Cost Price (KWD)", Required: "Yes", Type: "Number", Description: "Cost price in KWD (e.g., 10.000)" },
      { Field: "Selling Price (KWD)", Required: "Yes", Type: "Number", Description: "Selling price in KWD (e.g., 15.000)" },
      { Field: "SKU", Required: "No", Type: "Text", Description: "Unique SKU (auto-generated if empty)" },
      { Field: "Weight (kg)", Required: "No", Type: "Number", Description: "Weight in kilograms" },
      { Field: "Dimensions", Required: "No", Type: "Text", Description: "L x W x H (e.g., 10x5x2 cm)" },
      { Field: "Color", Required: "No", Type: "Text", Description: "Product color" },
      { Field: "Low Stock Alert", Required: "No", Type: "Number", Description: "Minimum stock alert threshold (default: 10)" },
      { Field: "Is Active", Required: "No", Type: "Text", Description: "Yes or No (default: Yes)" },
      { Field: "Stock Status", Required: "No", Type: "Text", Description: "In Stock, Low Stock, Out of Stock, Pre Order, Discontinued" },
      { Field: "Has Variants", Required: "No", Type: "Text", Description: "Yes or No (enable variants for this product)" },
      { Field: "Variant Name", Required: "No", Type: "Text", Description: "Storage, Color, Size, RAM, Processor, Material" },
      { Field: "Variant Value", Required: "No", Type: "Text", Description: "e.g., 128GB, Red, Large" },
      { Field: "Variant Cost Price (KWD)", Required: "No", Type: "Number", Description: "Variant cost price (if Has Variants = Yes)" },
      { Field: "Variant Selling Price (KWD)", Required: "No", Type: "Number", Description: "Variant selling price (if Has Variants = Yes)" },
    ];

    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    wsInstructions['!cols'] = [
      { wch: 25 }, // Field
      { wch: 10 }, // Required
      { wch: 12 }, // Type
      { wch: 40 }, // Description
    ];

    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

    // Add a third sheet with category IDs reference
    const categoriesRef = [
      { "Category Name": "Electronics", "Category ID": "1" },
      { "Category Name": "Clothing", "Category ID": "2" },
      { "Category Name": "Food & Beverage", "Category ID": "3" },
      { "Category Name": "Furniture", "Category ID": "4" },
      { "Category Name": "Beauty & Personal Care", "Category ID": "5" },
      { "Category Name": "Sports & Outdoors", "Category ID": "6" },
      { "Category Name": "Books & Stationery", "Category ID": "7" },
      { "Category Name": "Toys & Games", "Category ID": "8" },
      { "Category Name": "Health & Wellness", "Category ID": "9" },
      { "Category Name": "Automotive", "Category ID": "10" },
    ];

    const wsCategories = XLSX.utils.json_to_sheet(categoriesRef);
    wsCategories['!cols'] = [
      { wch: 25 }, // Category Name
      { wch: 12 }, // Category ID
    ];

    XLSX.utils.book_append_sheet(wb, wsCategories, "Category Reference");

    XLSX.writeFile(wb, `product_template_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleBulkFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFile(file);
    setErrorMessage("");
    setShowError(false);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length === 0) {
          setErrorMessage("Excel file is empty");
          setShowError(true);
          return;
        }

        setBulkPreviewData(jsonData.slice(0, 10)); // Show first 10 rows for preview
        setSuccessMessage(`Loaded ${jsonData.length} products from file`);
        setShowSuccess(true);
      } catch (error) {
        console.error("Error parsing Excel:", error);
        setErrorMessage("Failed to parse Excel file. Please check the format.");
        setShowError(true);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      setErrorMessage("Please select a file first");
      setShowError(true);
      return;
    }

    setIsUploading(true);
    setBulkUploadProgress(0);

    try {
      // Step 1: Parse the Excel file
      const parseExcelToJson = (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (evt) => {
            try {
              const data = new Uint8Array(evt.target?.result as ArrayBuffer);
              const workbook = XLSX.read(data, { type: "array" });
              const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
              const jsonData = XLSX.utils.sheet_to_json(firstSheet);
              resolve(jsonData);
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = (error) => reject(error);
          reader.readAsArrayBuffer(file);
        });
      };

      const productsData = await parseExcelToJson(bulkFile);

      if (productsData.length === 0) {
        setErrorMessage("No products found in the Excel file");
        setShowError(true);
        setIsUploading(false);
        return;
      }

      // Step 2: Transform Excel data to match backend expected format
      const transformedProducts = productsData.map((row: any) => {
  // Handle variants if present
  let variants = [];
  if (row["Has Variants"] === "Yes" && row["Variant Name"]) {
    variants = [{
      variant_name: row["Variant Name"],
      variant_value: row["Variant Value"],
      cost_price: parseFloat(row["Variant Cost Price (KWD)"]) || parseFloat(row["Cost Price (KWD)"]),
      selling_price: parseFloat(row["Variant Selling Price (KWD)"]) || parseFloat(row["Selling Price (KWD)"]),
      additional_price: (parseFloat(row["Variant Selling Price (KWD)"]) || parseFloat(row["Selling Price (KWD)"])) -
        (parseFloat(row["Variant Cost Price (KWD)"]) || parseFloat(row["Cost Price (KWD)"])),
    }];
  }

  const product: any = {
    product_name: row["Product Name"],
    category_id: row["Category ID"] ? parseInt(row["Category ID"]) : null,
    description: row["Description"] || "",
    unit: row["Unit"] || "piece",
    weight: row["Weight (kg)"] ? parseFloat(row["Weight (kg)"]) : null,
    dimensions: row["Dimensions"] || null,
    color: row["Color"] || null,
    cost_price: parseFloat(row["Cost Price (KWD)"]),
    selling_price: parseFloat(row["Selling Price (KWD)"]),
    has_variants: row["Has Variants"] === "Yes",
    low_stock_alert: row["Low Stock Alert"] ? parseInt(row["Low Stock Alert"]) : 10,
    is_active: row["Is Active"]?.toLowerCase() !== "no",
    variants: variants,
  };

  // IMPORTANT: Only add SKU if it has a value, and always send as string
  if (row["SKU"] && row["SKU"].toString().trim() !== "") {
    product.sku = row["SKU"].toString().trim();
  }
  // If no SKU, don't send the field at all (backend will auto-generate)

  return product;
});

      // Step 3: Validate transformed data
      const invalidProducts = transformedProducts.filter(p => !p.product_name || !p.cost_price || !p.selling_price);
      if (invalidProducts.length > 0) {
        setErrorMessage(`Found ${invalidProducts.length} products missing required fields (Name, Cost Price, Selling Price)`);
        setShowError(true);
        setIsUploading(false);
        return;
      }

      // Step 4: Send as JSON (not FormData with file)
      const progressInterval = setInterval(() => {
        setBulkUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const result = await bulkUploadProducts({
        products: transformedProducts
      }).unwrap();

      clearInterval(progressInterval);
      setBulkUploadProgress(100);

      setSuccessMessage(`Successfully uploaded ${result.data?.length || transformedProducts.length} products!`);
      setShowSuccess(true);

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error("Bulk upload failed:", error);

      let errorMsg = "Failed to upload products";
      if (error?.data?.errors) {
        const errors = error.data.errors;
        if (typeof errors === "object") {
          const errorMessages = Object.values(errors).flat().join(", ");
          errorMsg = `Upload failed: ${errorMessages}`;
        } else {
          errorMsg = `Upload failed: ${JSON.stringify(errors)}`;
        }
      } else if (error?.data?.message) {
        errorMsg = error.data.message;
      } else if (error?.error) {
        errorMsg = error.error;
      }

      setErrorMessage(errorMsg);
      setShowError(true);
    } finally {
      setIsUploading(false);
      setTimeout(() => setBulkUploadProgress(0), 3000);
    }
  };

  // Single Product Validation
  const validateForm = () => {
    if (!productName.trim()) {
      setErrorMessage("Product name is required");
      setShowError(true);
      return false;
    }

    if (!category) {
      setErrorMessage("Category is required");
      setShowError(true);
      return false;
    }

    if (!unit) {
      setErrorMessage("Unit is required");
      setShowError(true);
      return false;
    }

    if (!costPrice || parseFloat(costPrice) <= 0) {
      setErrorMessage("Valid cost price is required");
      setShowError(true);
      return false;
    }

    if (!sellingPrice || parseFloat(sellingPrice) <= 0) {
      setErrorMessage("Valid selling price is required");
      setShowError(true);
      return false;
    }

    if (hasVariants) {
      for (const variant of variants) {
        if (!variant.variant_name || !variant.variant_value) {
          setErrorMessage("All variants must have a name and value");
          setShowError(true);
          return false;
        }
        if (!variant.cost_price || variant.cost_price <= 0) {
          setErrorMessage("All variants must have a valid cost price");
          setShowError(true);
          return false;
        }
        if (!variant.selling_price || variant.selling_price <= 0) {
          setErrorMessage("All variants must have a valid selling price");
          setShowError(true);
          return false;
        }
      }
    }

    return true;
  };

  // Single Product Submit
  const handleSaveProduct = async () => {
    setShowSuccess(false);
    setShowError(false);
    setSuccessMessage("");
    setErrorMessage("");

    if (!validateForm()) {
      return;
    }

    try {
      const formData = new FormData();

      formData.append("product_name", productName.trim());
      formData.append("category_id", category);
      formData.append("description", description || "");
      formData.append("unit", unit);
      formData.append("cost_price", costPrice);
      formData.append("selling_price", sellingPrice);
      formData.append("has_variants", hasVariants ? "1" : "0");
      formData.append("low_stock_alert", lowStockAlert || "10");
      formData.append("is_active", isActive ? "1" : "0");

      if (mode === "edit") {
        formData.append("_method", "PUT");
      }

      if (sku.trim()) {
        formData.append("sku", sku.trim());
      }

      if (weight && parseFloat(weight) > 0) {
        formData.append("weight", weight);
      }

      if (dimensions.trim()) {
        formData.append("dimensions", dimensions.trim());
      }

      if (color.trim()) {
        formData.append("color", color.trim());
      }

      images.forEach((image) => {
        if (image.file) {
          formData.append("images[]", image.file);
        }
      });

      if (hasVariants && variants.length > 0) {
        variants.forEach((variant, index) => {
          if (variant.variant_name && variant.variant_value) {
            formData.append(
              `variants[${index}][variant_name]`,
              variant.variant_name,
            );
            formData.append(
              `variants[${index}][variant_value]`,
              variant.variant_value,
            );
            formData.append(
              `variants[${index}][cost_price]`,
              variant.cost_price.toString(),
            );
            formData.append(
              `variants[${index}][selling_price]`,
              variant.selling_price.toString(),
            );
            formData.append(
              `variants[${index}][additional_price]`,
              variant.additional_price.toString(),
            );
            formData.append(`variants[${index}][is_active]`, "1");
          }
        });
      }

      let result;

      if (mode === "edit" && product?.id) {
        result = await updateProduct({ id: product.id, formData }).unwrap();
        setSuccessMessage("Product updated successfully!");
      } else {
        result = await createProduct(formData as any).unwrap();
        setSuccessMessage("Product created successfully!");
      }

      setShowSuccess(true);

      images.forEach((img) => {
        if (img.preview) URL.revokeObjectURL(img.preview);
      });
      setImages([]);

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error(`Product ${mode === "edit" ? "update" : "creation"} failed:`, error);

      let errorMsg = `Failed to ${mode === "edit" ? "update" : "create"} product`;

      if (error?.data?.errors) {
        const errors = error.data.errors;
        if (typeof errors === "object") {
          const errorMessages = Object.values(errors).flat().join(", ");
          errorMsg = `Validation failed: ${errorMessages}`;
        } else {
          errorMsg = `Validation failed: ${JSON.stringify(errors)}`;
        }
      } else if (error?.data?.message) {
        errorMsg = error.data.message;
      } else if (error?.error) {
        errorMsg = error.error;
      }

      setErrorMessage(errorMsg);
      setShowError(true);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 bg-opacity-50 z-60 transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-200 bg-white rounded-2xl shadow-2xl z-70 flex flex-col h-[90vh]">
        {/* Header with Tabs */}
        <div className="px-8 pt-6 shrink-0">
          <h2 className="text-lg font-bold text-gray-900 text-center mb-4">
            {mode === "add" ? "ADD PRODUCT" : "EDIT PRODUCT"}
          </h2>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("single")}
              className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === "single"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Single Product
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === "bulk"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Bulk Upload
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="px-8 py-6 space-y-6 overflow-y-auto flex-1">
          {/* Success Message */}
          {showSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
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
                <p className="text-green-700 font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {showError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
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
                <p className="text-red-700 font-medium">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Single Product Tab Content */}
          {activeTab === "single" && (
            <>
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-3">
                  Product Images (Max 10)
                </label>

                <div className="mb-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all ${isLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                  >
                    <svg
                      className="w-10 h-10 text-gray-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <span className="text-sm text-gray-600">
                      Click to upload images
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      or drag and drop
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      PNG, JPG, JPEG (Max 10MB per image, up to 10 images)
                    </span>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-5 gap-3">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all"
                      >
                        <img
                          src={image.preview}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          disabled={isLoading}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
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
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium min-h-25"
                  placeholder="Enter product description"
                  disabled={isLoading}
                  rows={4}
                />
              </div>

              {/* Product Name */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                    placeholder="Enter product name"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900 font-medium cursor-pointer"
                    disabled={isLoading || categoriesLoading}
                    required
                  >
                    <option value="">Select Category</option>
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
                  <div className="absolute inset-y-0 right-0 top-8 flex items-center pr-3 pointer-events-none">
                    <img src={dropdown_arrow_icon} alt="" />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Unit *
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900 font-medium cursor-pointer"
                    disabled={isLoading}
                    required
                  >
                    <option value="piece">Piece</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="meter">Meter</option>
                    <option value="cm">Centimeter (cm)</option>
                    <option value="liter">Liter (L)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                    <option value="dozen">Dozen</option>
                    <option value="set">Set</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 top-8 flex items-center pr-3 pointer-events-none">
                    <img src={dropdown_arrow_icon} alt="" />
                  </div>
                </div>
              </div>

              {/* Weight, Dimensions & Color */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Dimensions
                  </label>
                  <input
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                    placeholder="L x W x H (e.g., 10x5x2 cm)"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                    placeholder="Enter color"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Cost Price (KWD) *
                  </label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                    min="0"
                    step="0.001"
                    placeholder="0.000"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Selling Price (KWD) *
                  </label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                    min="0"
                    step="0.001"
                    placeholder="0.000"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Stock & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Low Stock Alert
                  </label>
                  <input
                    type="number"
                    value={lowStockAlert}
                    onChange={(e) => setLowStockAlert(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                    min="0"
                    placeholder="Alert when stock is below"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum quantity before low stock warning
                  </p>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Stock Status
                  </label>
                  <select
                    value={stockStatus}
                    onChange={(e) => setStockStatus(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900 font-medium cursor-pointer"
                    disabled={isLoading}
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Pre Order">Pre Order</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 top-8 flex items-center pr-3 pointer-events-none">
                    <img src={dropdown_arrow_icon} alt="" />
                  </div>
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm font-medium text-gray-600">
                    Product Active
                  </span>
                </label>
                <span className="ml-2 text-xs text-gray-500">
                  (Inactive products won't appear in POS)
                </span>
              </div>

              {/* Variants Section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Product Has Variants
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Enable if this product has multiple variations (size,
                      color, storage, etc.)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasVariants(!hasVariants)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasVariants ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    disabled={isLoading}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasVariants ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>
                </div>

                {hasVariants && (
                  <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-700">
                        Product Variants
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                        disabled={isLoading}
                      >
                        + Add Variant
                      </button>
                    </div>

                    {variants.map((variant, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg bg-white"
                      >
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Variant Name *
                          </label>
                          <select
                            value={variant.variant_name}
                            onChange={(e) =>
                              handleVariantChange(
                                index,
                                "variant_name",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
                            disabled={isLoading}
                          >
                            <option value="">Select Name</option>
                            <option value="Storage">Storage</option>
                            <option value="Color">Color</option>
                            <option value="Size">Size</option>
                            <option value="RAM">RAM</option>
                            <option value="Processor">Processor</option>
                            <option value="Material">Material</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Variant Value *
                          </label>
                          <input
                            type="text"
                            value={variant.variant_value}
                            onChange={(e) =>
                              handleVariantChange(
                                index,
                                "variant_value",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
                            placeholder="e.g., 128GB, Red, Large"
                            disabled={isLoading}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Cost Price *
                          </label>
                          <input
                            type="number"
                            value={variant.cost_price}
                            onChange={(e) =>
                              handleVariantChange(
                                index,
                                "cost_price",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
                            min="0"
                            step="0.001"
                            placeholder="0.000"
                            disabled={isLoading}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Selling Price *
                          </label>
                          <input
                            type="number"
                            value={variant.selling_price}
                            onChange={(e) =>
                              handleVariantChange(
                                index,
                                "selling_price",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
                            min="0"
                            step="0.001"
                            placeholder="0.000"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    ))}

                    <p className="text-xs text-gray-500 mt-2">
                      Note: SKU and barcode for variants will be auto-generated
                      by the system
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Bulk Upload Tab Content */}
          {activeTab === "bulk" && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">Bulk Upload Instructions</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Download the template Excel file using the button below</li>
                  <li>• Fill in your product data following the format in the template</li>
                  <li>• Required fields: Product Name, Category ID, Unit, Cost Price, Selling Price</li>
                  <li>• Category IDs can be found in the Categories section</li>
                  <li>• Upload the completed file back to add multiple products at once</li>
                </ul>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Template
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  ref={fileInputRefBulk}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleBulkFileSelect}
                  className="hidden"
                  id="bulk-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="bulk-upload"
                  className={`flex flex-col items-center justify-center cursor-pointer ${isUploading ? "opacity-50" : ""
                    }`}
                >
                  <svg
                    className="w-12 h-12 text-gray-400 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="text-gray-600">
                    {bulkFile ? bulkFile.name : "Click to upload Excel file"}
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    Supports .xlsx, .xls files
                  </span>
                </label>
              </div>

              {bulkPreviewData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-700">
                      Preview (First {Math.min(10, bulkPreviewData.length)} rows)
                    </h3>
                    <span className="text-sm text-gray-500">
                      Total: {bulkPreviewData.length} products
                    </span>
                  </div>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(bulkPreviewData[0] || {}).map((key) => (
                            <th
                              key={key}
                              className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {bulkPreviewData.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((value: any, colIdx) => (
                              <td
                                key={colIdx}
                                className="px-4 py-2 text-sm text-gray-600"
                              >
                                {String(value).substring(0, 30)}
                                {String(value).length > 30 ? "..." : ""}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {isUploading && bulkUploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Uploading...</span>
                    <span>{bulkUploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${bulkUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleBulkUpload}
                disabled={!bulkFile || isUploading}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${!bulkFile || isUploading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
              >
                {isUploading ? "Uploading..." : "Upload Products"}
              </button>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-8 py-6 border-t border-gray-200 shrink-0 bg-white rounded-b-2xl">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={`px-6 py-3 bg-[#1773CF33] text-gray-700 font-semibold rounded-lg transition-colors ${isLoading
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:bg-gray-200"
                }`}
            >
              Cancel
            </button>
            <button
              onClick={activeTab === "single" ? handleSaveProduct : handleBulkUpload}
              disabled={isLoading || (activeTab === "bulk" && !bulkFile)}
              className={`px-6 py-3 bg-[#1773CF] text-white font-semibold rounded-lg transition-colors flex items-center justify-center ${isLoading || (activeTab === "bulk" && !bulkFile)
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:bg-blue-700"
                }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {activeTab === "single"
                    ? (mode === "edit" ? "Updating..." : "Creating...")
                    : "Uploading..."}
                </>
              ) : activeTab === "single" ? (
                mode === "add" ? "Add Product" : "Save Changes"
              ) : (
                "Upload Products"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}