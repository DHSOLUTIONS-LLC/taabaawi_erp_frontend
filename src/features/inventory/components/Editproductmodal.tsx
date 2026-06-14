// src/components/EditProductModal.tsx
import { useState, useRef, useEffect } from "react";
import dropdown_arrow_icon from "../../../assets/icons/dropdown_arrow_icon.svg";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetCategoriesQuery,
} from "../../../services/inventoryApi";

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
  // barcode?: string;
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
  const [productName, setProductName] = useState(product?.name || "");
  const [sku] = useState(product?.sku || "");
  // const [barcode, setBarcode] = useState(product?.barcode || '');
  // const [autoGenerateBarcode] = useState(true);
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

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const isLoading = isCreating || isUpdating;

  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useGetCategoriesQuery();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract categories from response
  const categories: Category[] =
    (categoriesResponse as CategoryResponse)?.data?.data || [];

  // useEffect(() => {
  //     if (autoGenerateBarcode && !barcode) {
  //         // Generate EAN-13 compatible format (20 + 11 digits)
  //         const generateBarcode = () => {
  //             const prefix = '20';
  //             const randomPart = Math.floor(Math.random() * 99999999999).toString().padStart(11, '0');
  //             return prefix + randomPart;
  //         };
  //         setBarcode(generateBarcode());
  //     }
  // }, [autoGenerateBarcode, barcode]);

  // Reset messages when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowSuccess(false);
      setShowError(false);
      setSuccessMessage("");
      setErrorMessage("");
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

          // Convert to blob
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
          ); // 95% quality
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // ============ IMAGE HANDLERS ============
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: Array<{ file: File; preview: string }> = [];
    const remainingSlots = 10 - images.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 2MB

    for (let i = 0; i < filesToProcess; i++) {
      try {
        let file = files[i];

        // Check file type
        if (!file.type.startsWith("image/")) {
          setErrorMessage(`File "${file.name}" is not an image`);
          setShowError(true);
          continue;
        }

        // Compress if file is too large
        if (file.size > MAX_FILE_SIZE) {
          setErrorMessage(`Compressing ${file.name}...`);
          setShowError(true);

          try {
            file = await compressImage(file);
            setErrorMessage(""); // Clear error after compression
            setShowError(false);
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

    // Reset file input
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

  // ============ VARIANT HANDLERS ============
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

    // Auto-calculate additional_price when selling_price changes
    if (field === "selling_price") {
      const costPriceNum = parseFloat(costPrice) || 0;
      const sellingPriceNum =
        typeof value === "number" ? value : parseFloat(value as string) || 0;
      updatedVariants[index].additional_price = sellingPriceNum - costPriceNum;
    }

    // Auto-calculate selling_price when additional_price changes
    if (field === "additional_price") {
      const costPriceNum = parseFloat(costPrice) || 0;
      const additionalPriceNum =
        typeof value === "number" ? value : parseFloat(value as string) || 0;
      updatedVariants[index].selling_price = costPriceNum + additionalPriceNum;
    }

    setVariants(updatedVariants);
  };

  // ============ FORM VALIDATION ============
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

  // ============ SUBMIT HANDLER ============
  const handleSaveProduct = async () => {
    // Reset messages
    setShowSuccess(false);
    setShowError(false);
    setSuccessMessage("");
    setErrorMessage("");

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      const formData = new FormData();

      // ============ BASIC FIELDS ============
      formData.append("product_name", productName.trim());
      formData.append("category_id", category); // Send as string, backend will handle conversion
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

      // ============ OPTIONAL FIELDS ============
      if (sku.trim()) {
        formData.append("sku", sku.trim());
      }

      // if (barcode.trim() && !autoGenerateBarcode) {
      //     formData.append('barcode', barcode.trim());
      // } else if (autoGenerateBarcode && barcode.trim()) {
      //     formData.append('barcode', barcode.trim()); // Auto-generated barcode
      // }

      if (weight && parseFloat(weight) > 0) {
        formData.append("weight", weight);
      }

      if (dimensions.trim()) {
        formData.append("dimensions", dimensions.trim());
      }

      if (color.trim()) {
        formData.append("color", color.trim());
      }

      // ============ IMAGES ============
      images.forEach((image) => {
        if (image.file) {
          formData.append("images[]", image.file);
        }
      });

      // ============ VARIANTS ============
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
            // SKU and barcode will be auto-generated by backend
          }
        });
      }

      // 🔍 DEBUG: Log FormData contents
      console.log(
        `📤 ${mode === "edit" ? "Updating" : "Creating"} product:`,
        product?.id,
      );
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(
            `  ${key}:`,
            `[File] ${value.name} (${value.size} bytes)`,
          );
        } else {
          console.log(`  ${key}:`, value);
        }
      }

      let result;

      if (mode === "edit" && product?.id) {
        result = await updateProduct({ id: product.id, formData }).unwrap();
        setSuccessMessage("Product updated successfully!");
      } else {
        result = await createProduct(formData as any).unwrap();
        setSuccessMessage("Product created successfully!");
      }

      console.log("API Response:", result);

      setSuccessMessage("Product created successfully!");
      setShowSuccess(true);

      // Cleanup
      images.forEach((img) => {
        if (img.preview) URL.revokeObjectURL(img.preview);
      });
      setImages([]);

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error(
        `Product ${mode === "edit" ? "update" : "creation"} failed:`,
        error,
      );

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
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-opacity-50 z-60 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-200 bg-white rounded-2xl shadow-2xl z-70 flex flex-col h-[90vh]">
        {/* Header */}
        <div className="px-8 pt-6 shrink-0">
          <h2 className="text-lg font-bold text-gray-900 text-center">
            {mode === "add" ? "ADD PRODUCT" : "EDIT PRODUCT"}
          </h2>
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
              <p className="text-sm text-green-600 mt-1">
                Closing modal in a moment...
              </p>
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

          {/* ============ IMAGE UPLOAD SECTION ============ */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-3">
              Product Images (Max 10)
            </label>

            {/* Upload Area */}
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
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
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
                  PNG, JPG, JPEG (Max 10 per image, up to 10 images)
                </span>
              </label>
            </div>

            {/* Image Preview Grid */}
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
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
                {images.length < 10 && (
                  <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-xs text-gray-400">
                      {10 - images.length} more
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ============ DESCRIPTION ============ */}
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

          {/* ============ PRODUCT NAME & SKU ============ */}
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

          {/* ============ BARCODE SECTION ============ */}
          {/* <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-medium text-gray-600">
                                Barcode
                            </label>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Auto-generate</span>
                                <button
                                    type="button"
                                    onClick={() => setAutoGenerateBarcode(!autoGenerateBarcode)}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoGenerateBarcode ? 'bg-blue-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${autoGenerateBarcode ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                                placeholder={autoGenerateBarcode ? "Auto-generated barcode" : "Enter barcode"}
                                disabled={isLoading || autoGenerateBarcode}
                                readOnly={autoGenerateBarcode}
                            />
                            {autoGenerateBarcode && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const prefix = '20';
                                        const randomPart = Math.floor(Math.random() * 99999999999).toString().padStart(11, '0');
                                        setBarcode(prefix + randomPart);
                                    }}
                                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Generate New
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {autoGenerateBarcode 
                                ? "Barcode will be auto-generated in EAN-13 format (20xxxxxxxxxxx)" 
                                : "Manually enter barcode (must be unique)"}
                        </p>
                    </div> */}

          {/* ============ CATEGORY & UNIT ============ */}
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

          {/* ============ WEIGHT, DIMENSIONS & COLOR ============ */}
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

          {/* ============ PRICING ============ */}
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

          {/* ============ STOCK & STATUS ============ */}
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

            <div className="relative items-center">
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
          <div className="flex items-center mt-8">
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
          {/* ============ VARIANTS SECTION ============ */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Product Has Variants
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Enable if this product has multiple variations (size, color,
                  storage, etc.)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHasVariants(!hasVariants)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasVariants ? "bg-blue-600" : "bg-gray-300"}`}
                disabled={isLoading}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasVariants ? "translate-x-6" : "translate-x-1"}`}
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

                    {/* <div className="flex items-end space-x-2">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Additional Price
                        </label>
                        <input
                          type="number"
                          value={variant.additional_price}
                          onChange={(e) =>
                            handleVariantChange(
                              index,
                              "additional_price",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
                          step="0.001"
                          placeholder="0.000"
                          disabled={isLoading}
                        />
                      </div>

                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(index)}
                          className="p-2 text-red-600 hover:text-red-800"
                          disabled={isLoading}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div> */}
                  </div>
                ))}

                <p className="text-xs text-gray-500 mt-2">
                  Note: SKU and barcode for variants will be auto-generated by
                  the system
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ============ FOOTER BUTTONS ============ */}
        <div className="px-8 py-6 border-t border-gray-200 shrink-0 bg-white rounded-b-2xl">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={`px-6 py-3 bg-[#1773CF33] text-gray-700 font-semibold rounded-lg transition-colors ${
                isLoading
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:bg-gray-200"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProduct}
              disabled={isLoading}
              className={`px-6 py-3 bg-[#1773CF] text-white font-semibold rounded-lg transition-colors flex items-center justify-center ${
                isLoading
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
                  {mode === "edit" ? "Updating..." : "Creating..."}
                </>
              ) : mode === "add" ? (
                "Add Product"
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
