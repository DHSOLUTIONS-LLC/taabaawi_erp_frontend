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
    name_ar?: string;
    title_en?: string;
    title_ar?: string;
    brand_en?: string;
    brand_ar?: string;
    category: string;
    category_ar?: string;
    sub_category_en?: string;
    sub_category_ar?: string;
    description?: string;
    description_ar?: string;
    slug?: string;
    sku: string;
    barcode?: string;
    barcode_image?: string;
    quantity: number;
    cost: number;
    price: number;
    status: string;
    image?: string;
    unit?: string;
    weight?: number;
    dimensions?: string;
    color?: string;
    size?: string;
    average_cost_price?: number;
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

  // Single Product States - Updated to match API
  const [nameEn, setNameEn] = useState(product?.name || "");
  const [nameAr, setNameAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [brandEn, setBrandEn] = useState("");
  const [brandAr, setBrandAr] = useState("");
  const [categoryEn, setCategoryEn] = useState(product?.category || "");
  const [categoryAr, setCategoryAr] = useState("");
  const [subCategoryEn, setSubCategoryEn] = useState("");
  const [subCategoryAr, setSubCategoryAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState(product?.description || "");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [slug, setSlug] = useState("");
  const [sku] = useState(product?.sku || "");
  const [barcode] = useState(product?.barcode || "");
  const [unit, setUnit] = useState(product?.unit || "piece");
  const [weight, setWeight] = useState(product?.weight?.toString() || "");
  const [dimensions, setDimensions] = useState(product?.dimensions || "");
  const [color, setColor] = useState(product?.color || "");
  const [size, setSize] = useState("");
  const [costPrice, setCostPrice] = useState(product?.cost.toString() || "");
  const [averageCostPrice, setAverageCostPrice] = useState("");
  const [bulkImageFiles, setBulkImageFiles] = useState<File[]>([]);
  const [isBulkImageUploading, setIsBulkImageUploading] = useState(false);
  const fileInputRefBulkImages = useRef<HTMLInputElement>(null);
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
        "ID": "",
        "SKU": " ",
        "Barcode": " ",
        "Image(s)": "https://plus.unsplash.com/premium_photo-1717529138199-4560ef38fb32?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyfHx8ZW58MHx8fHx8",
        "English Title": "Premium Black Coffee",
        "Arabic Title": "قهوة سوداء فاخرة",
        "English Name": "Black Coffee",
        "Arabic Name": "قهوة سوداء",
        "English Brand": "Mountain Brew",
        "Arabic Brand": "ماونتن برو",
        "English Category": "Food & Beverage",
        "Arabic Category": "طعام و مشروبات",
        "English Sub Category": "Hot Beverages",
        "Arabic Sub Category": "مشروبات ساخنة",
        "English Description": "Premium roasted black coffee beans with rich flavor and aroma. Perfect for morning brew.",
        "Arabic Description": "حبوب القهوة السوداء المحمصة الفاخرة بنكهة غنية ورائحة عطرة. مثالية لتحضير القهوة الصباحية.",
        "Slug": "premium-black-coffee",
        "Unit": "kg",
        "Weight (KG)": "1.00",
        "Dimensions": "20x15x10 cm",
        "Color": "Black",
        "Size": "",
        "Cost Price": "47.000",
        "Average Cost Price": "45.500",
        "Selling Price": "67.000",
      },
      {
        "ID": "",
        "SKU": " ",
        "Barcode": " ",
        "Image(s)": "https://images.unsplash.com/photo-1763307411452-43cfd9f516ce?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwzfHx8ZW58MHx8fHx8",
        "English Title": "Red Coffee Special Blend",
        "Arabic Title": "قهوة حمراء ممزوجة خاصة",
        "English Name": "Red Coffee",
        "Arabic Name": "قهوة حمراء",
        "English Brand": "Red Roast",
        "Arabic Brand": "ريد روست",
        "English Category": "Food & Beverage",
        "Arabic Category": "طعام و مشروبات",
        "English Sub Category": "Specialty Coffee",
        "Arabic Sub Category": "قهوة متخصصة",
        "English Description": "Special blend of red coffee beans with a smooth, balanced flavor. Notes of chocolate and caramel.",
        "Arabic Description": "مزيج خاص من حبوب القهوة الحمراء بنكهة متوازنة وناعمة. نكهات الشوكولاتة والكراميل.",
        "Slug": "red-coffee-special-blend",
        "Unit": "kg",
        "Weight (KG)": "1.00",
        "Dimensions": "18x14x8 cm",
        "Color": "Red",
        "Size": "",
        "Cost Price": "55.000",
        "Average Cost Price": "52.750",
        "Selling Price": "78.000",
      },
      {
        "ID": "",
        "SKU": " ",
        "Barcode": " ",
        "Image(s)": "https://images.unsplash.com/photo-1773332585749-5146862ba746?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxNXx8fGVufDB8fHx8fA%3D%3D",
        "English Title": "Ceramic Coffee Mug - Premium Edition",
        "Arabic Title": "كوب قهوة سيراميك - إصدار فاخر",
        "English Name": "Coffee Mug Ceramic",
        "Arabic Name": "كوب قهوة سيراميك",
        "English Brand": "Brew & Sip",
        "Arabic Brand": "برو آند سيب",
        "English Category": "Home & Kitchen",
        "Arabic Category": "المنزل والمطبخ",
        "English Sub Category": "Drinkware",
        "Arabic Sub Category": "أواني الشرب",
        "English Description": "High-quality ceramic coffee mug with heat-resistant design. Capacity: 350ml. Microwave and dishwasher safe.",
        "Arabic Description": "كوب قهوة سيراميك عالي الجودة بتصميم مقاوم للحرارة. السعة: 350 مل. آمن للاستخدام في الميكروويف وغسالة الأطباق.",
        "Slug": "ceramic-coffee-mug-premium",
        "Unit": "piece",
        "Weight (KG)": "0.35",
        "Dimensions": "12x9x10 cm",
        "Color": "White",
        "Size": "350ml",
        "Cost Price": "8.500",
        "Average Cost Price": "8.000",
        "Selling Price": "14.000",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);

    // Set column widths
    ws['!cols'] = [
      { wch: 10 }, // ID
      { wch: 15 }, // SKU
      { wch: 18 }, // Barcode
      { wch: 35 }, // Image(s)
      { wch: 25 }, // English Title
      { wch: 25 }, // Arabic Title
      { wch: 25 }, // English Name
      { wch: 25 }, // Arabic Name
      { wch: 20 }, // English Brand
      { wch: 20 }, // Arabic Brand
      { wch: 22 }, // English Category
      { wch: 22 }, // Arabic Category
      { wch: 25 }, // English Sub Category
      { wch: 25 }, // Arabic Sub Category
      { wch: 45 }, // English Description
      { wch: 45 }, // Arabic Description
      { wch: 25 }, // Slug
      { wch: 12 }, // Unit
      { wch: 15 }, // Weight (KG)
      { wch: 18 }, // Dimensions
      { wch: 12 }, // Color
      { wch: 12 }, // Size
      { wch: 15 }, // Cost Price
      { wch: 18 }, // Average Cost Price
      { wch: 15 }, // Selling Price
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products_Template");

    // Add instructions sheet
    const instructions = [
      { Field: "ID", Required: "No", Type: "Number", Description: "Product ID (auto-generated if empty)" },
      { Field: "SKU", Required: "No", Type: "Text", Description: "Unique SKU (auto-generated if empty)" },
      { Field: "Barcode", Required: "No", Type: "Text", Description: "Product barcode (auto-generated if empty)" },
      { Field: "Image(s)", Required: "No", Type: "Text", Description: "Image URLs (comma separated for multiple)" },
      { Field: "English Title", Required: "Yes", Type: "Text", Description: "Product title in English" },
      { Field: "Arabic Title", Required: "Yes", Type: "Text", Description: "Product title in Arabic" },
      { Field: "English Name", Required: "Yes", Type: "Text", Description: "Product name in English" },
      { Field: "Arabic Name", Required: "Yes", Type: "Text", Description: "Product name in Arabic" },
      { Field: "English Brand", Required: "No", Type: "Text", Description: "Brand name in English" },
      { Field: "Arabic Brand", Required: "No", Type: "Text", Description: "Brand name in Arabic" },
      { Field: "English Category", Required: "Yes", Type: "Text", Description: "Category name in English (must match existing)" },
      { Field: "Arabic Category", Required: "Yes", Type: "Text", Description: "Category name in Arabic (must match existing)" },
      { Field: "English Sub Category", Required: "No", Type: "Text", Description: "Sub category name in English" },
      { Field: "Arabic Sub Category", Required: "No", Type: "Text", Description: "Sub category name in Arabic" },
      { Field: "English Description", Required: "No", Type: "Text", Description: "Product description in English" },
      { Field: "Arabic Description", Required: "No", Type: "Text", Description: "Product description in Arabic" },
      { Field: "Slug", Required: "No", Type: "Text", Description: "URL-friendly slug (auto-generated if empty)" },
      { Field: "Unit", Required: "Yes", Type: "Text", Description: "piece, kg, g, meter, cm, liter, ml, box, pack, dozen, set" },
      { Field: "Weight (KG)", Required: "No", Type: "Number", Description: "Weight in kilograms" },
      { Field: "Dimensions", Required: "No", Type: "Text", Description: "L x W x H (e.g., 10x5x2 cm)" },
      { Field: "Color", Required: "No", Type: "Text", Description: "Product color" },
      { Field: "Size", Required: "No", Type: "Text", Description: "Product size (e.g., S, M, L, XL)" },
      { Field: "Cost Price", Required: "Yes", Type: "Number", Description: "Cost price in KWD (e.g., 10.000)" },
      { Field: "Average Cost Price", Required: "No", Type: "Number", Description: "Average cost price in KWD" },
      { Field: "Selling Price", Required: "Yes", Type: "Number", Description: "Selling price in KWD (e.g., 15.000)" },
    ];

    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    wsInstructions['!cols'] = [
      { wch: 25 }, // Field
      { wch: 10 }, // Required
      { wch: 12 }, // Type
      { wch: 45 }, // Description
    ];

    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

    // Add a third sheet with units reference
    const unitsRef = [
      { "Unit": "piece", "Description": "Individual item" },
      { "Unit": "kg", "Description": "Kilogram" },
      { "Unit": "g", "Description": "Gram" },
      { "Unit": "meter", "Description": "Meter" },
      { "Unit": "cm", "Description": "Centimeter" },
      { "Unit": "liter", "Description": "Liter" },
      { "Unit": "ml", "Description": "Milliliter" },
      { "Unit": "box", "Description": "Box" },
      { "Unit": "pack", "Description": "Pack" },
      { "Unit": "dozen", "Description": "Dozen (12 units)" },
      { "Unit": "set", "Description": "Set" },
    ];

    const wsUnits = XLSX.utils.json_to_sheet(unitsRef);
    wsUnits['!cols'] = [
      { wch: 15 }, // Unit
      { wch: 30 }, // Description
    ];

    XLSX.utils.book_append_sheet(wb, wsUnits, "Units Reference");

    // Add fourth sheet with color reference
    const colorsRef = [
      { "Color": "Red", "Hex": "#FF0000" },
      { "Color": "Blue", "Hex": "#0000FF" },
      { "Color": "Green", "Hex": "#00FF00" },
      { "Color": "Black", "Hex": "#000000" },
      { "Color": "White", "Hex": "#FFFFFF" },
      { "Color": "Yellow", "Hex": "#FFFF00" },
      { "Color": "Orange", "Hex": "#FFA500" },
      { "Color": "Purple", "Hex": "#800080" },
      { "Color": "Pink", "Hex": "#FFC0CB" },
      { "Color": "Brown", "Hex": "#A52A2A" },
      { "Color": "Gray", "Hex": "#808080" },
      { "Color": "Gold", "Hex": "#FFD700" },
      { "Color": "Silver", "Hex": "#C0C0C0" },
      { "Color": "Navy Blue", "Hex": "#000080" },
      { "Color": "Sky Blue", "Hex": "#87CEEB" },
      { "Color": "Lime Green", "Hex": "#32CD32" },
      { "Color": "Olive", "Hex": "#808000" },
      { "Color": "Maroon", "Hex": "#800000" },
      { "Color": "Teal", "Hex": "#008080" },
      { "Color": "Coral", "Hex": "#FF7F50" },
    ];

    const wsColors = XLSX.utils.json_to_sheet(colorsRef);
    wsColors['!cols'] = [
      { wch: 15 }, // Color
      { wch: 15 }, // Hex
    ];

    XLSX.utils.book_append_sheet(wb, wsColors, "Color Reference");

    // Add fifth sheet with size reference
    const sizesRef = [
      { "Size": "XS", "Description": "Extra Small" },
      { "Size": "S", "Description": "Small" },
      { "Size": "M", "Description": "Medium" },
      { "Size": "L", "Description": "Large" },
      { "Size": "XL", "Description": "Extra Large" },
      { "Size": "XXL", "Description": "Double Extra Large" },
      { "Size": "XXXL", "Description": "Triple Extra Large" },
      { "Size": "28", "Description": "Waist size 28" },
      { "Size": "30", "Description": "Waist size 30" },
      { "Size": "32", "Description": "Waist size 32" },
      { "Size": "34", "Description": "Waist size 34" },
      { "Size": "36", "Description": "Waist size 36" },
      { "Size": "38", "Description": "Waist size 38" },
      { "Size": "40", "Description": "Waist size 40" },
      { "Size": "42", "Description": "Waist size 42" },
      { "Size": "44", "Description": "Waist size 44" },
    ];

    const wsSizes = XLSX.utils.json_to_sheet(sizesRef);
    wsSizes['!cols'] = [
      { wch: 12 }, // Size
      { wch: 30 }, // Description
    ];

    XLSX.utils.book_append_sheet(wb, wsSizes, "Size Reference");

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

        setBulkPreviewData(jsonData.slice(0, 10));
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

      // Prepare products array matching backend expectations
      const productsPayload = productsData.map((row) => {
        const product: any = {
          name_en: String(row["English Name"] || "").trim(),
          unit: String(row["Unit"] || "piece").trim(),
          cost_price: parseFloat(row["Cost Price"]) || 0,
          selling_price: parseFloat(row["Selling Price"]) || 0,
        };

        // Optional fields
        if (row["Arabic Name"]) product.name_ar = String(row["Arabic Name"]).trim();
        if (row["English Title"]) product.title_en = String(row["English Title"]).trim();
        if (row["Arabic Title"]) product.title_ar = String(row["Arabic Title"]).trim();
        if (row["English Brand"]) product.brand_en = String(row["English Brand"]).trim();
        if (row["Arabic Brand"]) product.brand_ar = String(row["Arabic Brand"]).trim();
        if (row["English Category"]) product.category_en = String(row["English Category"]).trim();
        if (row["Arabic Category"]) product.category_ar = String(row["Arabic Category"]).trim();
        if (row["English Sub Category"]) product.sub_category_en = String(row["English Sub Category"]).trim();
        if (row["Arabic Sub Category"]) product.sub_category_ar = String(row["Arabic Sub Category"]).trim();
        if (row["English Description"]) product.description_en = String(row["English Description"]).trim();
        if (row["Arabic Description"]) product.description_ar = String(row["Arabic Description"]).trim();
        if (row["Slug"]) product.slug = String(row["Slug"]).trim();
        if (row["SKU"]) product.sku = String(row["SKU"]).trim();
        if (row["Barcode"]) product.barcode = String(row["Barcode"]).trim();
        if (row["Weight (KG)"]) product.weight = parseFloat(row["Weight (KG)"]);
        if (row["Dimensions"]) product.dimensions = String(row["Dimensions"]).trim();
        if (row["Color"]) product.color = String(row["Color"]).trim();
        if (row["Size"]) product.size = String(row["Size"]).trim();
        if (row["Average Cost Price"]) product.average_cost_price = parseFloat(row["Average Cost Price"]);
        if (row["Low Stock Alert"]) product.low_stock_alert = parseInt(row["Low Stock Alert"]) || 10;
        if (row["Is Active"]?.toLowerCase() === "no") product.is_active = false;

        // Send image URLs as string
        if (row["Image(s)"]) {
          const imageUrls = String(row["Image(s)"])
            .split(',')
            .map((url: string) => url.trim())
            .filter((url: string) => url.length > 0);
          if (imageUrls.length > 0) {
            product.image_url = imageUrls.join(',');
          }
        }

        // Handle variants
        if (row["Variant Name"] && row["Variant Value"]) {
          product.has_variants = true;
          product.variants = [{
            variant_name: String(row["Variant Name"]).trim(),
            variant_value: String(row["Variant Value"]).trim(),
            cost_price: parseFloat(row["Variant Cost Price"]) || parseFloat(row["Cost Price"]) || 0,
            selling_price: parseFloat(row["Variant Selling Price"]) || parseFloat(row["Selling Price"]) || 0,
            additional_price: (parseFloat(row["Variant Selling Price"]) || parseFloat(row["Selling Price"]) || 0) -
              (parseFloat(row["Variant Cost Price"]) || parseFloat(row["Cost Price"]) || 0),
            is_active: true,
          }];
        }

        return product;
      });

      // Log the payload for debugging
      console.log('Sending payload:', JSON.stringify({ products: productsPayload }, null, 2));

      // Use the mutation
      const result = await bulkUploadProducts({
        products: productsPayload
      }).unwrap();

      console.log('Upload result:', result);

      if (result.success) {
        setSuccessMessage(`Successfully uploaded ${result.data?.length || productsPayload.length} products!`);
        setShowSuccess(true);
        setTimeout(() => onClose(), 2000);
      } else {
        setErrorMessage(result.message || "Failed to upload products");
        setShowError(true);
      }

    } catch (error: any) {
      console.error("Bulk upload failed - Full error:", error);

      // Better error handling
      let errorMsg = "Failed to upload products";

      if (error?.data) {
        // Handle API error response
        if (error.data.errors) {
          const errors = error.data.errors;
          if (typeof errors === "object") {
            const errorMessages = Object.values(errors).flat().join(", ");
            errorMsg = `Validation failed: ${errorMessages}`;
          } else {
            errorMsg = `Error: ${JSON.stringify(errors)}`;
          }
        } else if (error.data.message) {
          errorMsg = error.data.message;
        } else if (typeof error.data === 'string') {
          errorMsg = error.data;
        }
      } else if (error?.error) {
        errorMsg = error.error;
      } else if (error?.message) {
        errorMsg = error.message;
      }

      setErrorMessage(errorMsg);
      setShowError(true);
    } finally {
      setIsUploading(false);
      setBulkUploadProgress(0);
    }
  };

  // Single Product Validation
  const validateForm = () => {
    if (!nameEn.trim()) {
      setErrorMessage("Product name (English) is required");
      setShowError(true);
      return false;
    }

    if (!categoryEn) {
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

      // Required fields
      formData.append("name_en", nameEn.trim());
      formData.append("unit", unit);
      formData.append("cost_price", costPrice);
      formData.append("selling_price", sellingPrice);

      // Optional fields - only append if they have values
      if (nameAr.trim()) formData.append("name_ar", nameAr.trim());
      if (titleEn.trim()) formData.append("title_en", titleEn.trim());
      if (titleAr.trim()) formData.append("title_ar", titleAr.trim());
      if (brandEn.trim()) formData.append("brand_en", brandEn.trim());
      if (brandAr.trim()) formData.append("brand_ar", brandAr.trim());
      if (categoryEn.trim()) formData.append("category_en", categoryEn.trim());
      if (categoryAr.trim()) formData.append("category_ar", categoryAr.trim());
      if (subCategoryEn.trim()) formData.append("sub_category_en", subCategoryEn.trim());
      if (subCategoryAr.trim()) formData.append("sub_category_ar", subCategoryAr.trim());
      if (descriptionEn.trim()) formData.append("description_en", descriptionEn.trim());
      if (descriptionAr.trim()) formData.append("description_ar", descriptionAr.trim());
      if (slug.trim()) formData.append("slug", slug.trim());
      if (sku.trim()) formData.append("sku", sku.trim());
      if (barcode.trim()) formData.append("barcode", barcode.trim());
      if (weight && parseFloat(weight) > 0) formData.append("weight", weight);
      if (dimensions.trim()) formData.append("dimensions", dimensions.trim());
      if (color.trim()) formData.append("color", color.trim());
      if (size.trim()) formData.append("size", size.trim());
      if (averageCostPrice && parseFloat(averageCostPrice) > 0) {
        formData.append("average_cost_price", averageCostPrice);
      }
      if (lowStockAlert) formData.append("low_stock_alert", lowStockAlert);
      if (hasVariants) formData.append("has_variants", "1");
      if (!isActive) formData.append("is_active", "0");

      if (mode === "edit") {
        formData.append("_method", "PUT");
      }

      // Images
      images.forEach((image) => {
        if (image.file) {
          formData.append("images[]", image.file);
        }
      });

      // Variants
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
            if (variant.cost_price > 0) {
              formData.append(
                `variants[${index}][cost_price]`,
                variant.cost_price.toString(),
              );
            }
            if (variant.selling_price > 0) {
              formData.append(
                `variants[${index}][selling_price]`,
                variant.selling_price.toString(),
              );
            }
            if (variant.additional_price > 0) {
              formData.append(
                `variants[${index}][additional_price]`,
                variant.additional_price.toString(),
              );
            }
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

              {/* Product Name - English (Required) */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Product Name (English) *
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                  placeholder="Enter product name in English"
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Product Name - Arabic */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Product Name (Arabic)
                </label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                  placeholder="Enter product name in Arabic"
                  disabled={isLoading}
                  dir="rtl"
                />
              </div>

              {/* Title - English */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Title (English)
                </label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                  placeholder="Enter product title in English"
                  disabled={isLoading}
                />
              </div>

              {/* Title - Arabic */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Title (Arabic)
                </label>
                <input
                  type="text"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                  placeholder="Enter product title in Arabic"
                  disabled={isLoading}
                  dir="rtl"
                />
              </div>

              {/* Brand - English */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Brand (English)
                </label>
                <input
                  type="text"
                  value={brandEn}
                  onChange={(e) => setBrandEn(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                  placeholder="Enter brand name in English"
                  disabled={isLoading}
                />
              </div>

              {/* Brand - Arabic */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Brand (Arabic)
                </label>
                <input
                  type="text"
                  value={brandAr}
                  onChange={(e) => setBrandAr(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                  placeholder="Enter brand name in Arabic"
                  disabled={isLoading}
                  dir="rtl"
                />
              </div>

              {/* Category - English */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Category (English) *
                </label>
                <input
                  type="text"
                  value={categoryEn}
                  onChange={(e) => setCategoryEn(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                  placeholder="Enter category in English"
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Category - Arabic */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Category (Arabic)
                </label>
                <input
                  type="text"
                  value={categoryAr}
                  onChange={(e) => setCategoryAr(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                  placeholder="Enter category in Arabic"
                  disabled={isLoading}
                  dir="rtl"
                />
              </div>

              {/* Sub Category - English */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Sub Category (English)
                </label>
                <input
                  type="text"
                  value={subCategoryEn}
                  onChange={(e) => setSubCategoryEn(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                  placeholder="Enter sub category in English"
                  disabled={isLoading}
                />
              </div>

              {/* Sub Category - Arabic */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Sub Category (Arabic)
                </label>
                <input
                  type="text"
                  value={subCategoryAr}
                  onChange={(e) => setSubCategoryAr(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                  placeholder="Enter sub category in Arabic"
                  disabled={isLoading}
                  dir="rtl"
                />
              </div>

              {/* Description - English */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Description (English)
                </label>
                <textarea
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium min-h-25"
                  placeholder="Enter description in English"
                  disabled={isLoading}
                  rows={4}
                />
              </div>

              {/* Description - Arabic */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Description (Arabic)
                </label>
                <textarea
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium min-h-25"
                  placeholder="Enter description in Arabic"
                  disabled={isLoading}
                  rows={4}
                  dir="rtl"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                  placeholder="URL-friendly slug (auto-generated if empty)"
                  disabled={isLoading}
                />
              </div>

              {/* Unit */}
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

              {/* Weight, Dimensions, Color, Size */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Weight (KG)
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

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Size
                  </label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                    placeholder="e.g., S, M, L, XL, 500g, 350ml"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    Average Cost Price (KWD)
                  </label>
                  <input
                    type="number"
                    value={averageCostPrice}
                    onChange={(e) => setAverageCostPrice(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                    min="0"
                    step="0.001"
                    placeholder="0.000"
                    disabled={isLoading}
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
                  <li>• Required fields: English Name, Unit, Cost Price, Selling Price</li>
                  <li>• Category names should match existing categories in the system</li>
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
                              className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
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
                                className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate"
                              >
                                {value !== undefined && value !== null ? String(value) : "—"}
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