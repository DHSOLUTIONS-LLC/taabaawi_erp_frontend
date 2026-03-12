// src/components/ProductDetailsSidebar.tsx
import { useState } from 'react';
import TransferStockModal from '../components/Transferstockmodal';
import ReportDamageModal from '../components/Reportdamagemodal';
import AddStockModal from '../components/AddStockModal';
import EditProductModal from '../components/Editproductmodal';
import InventoryMovementModal from '../components/ViewInventoryMovementModel';
import edit_icon from '../../../assets/icons/edit_icon.svg';
import restock_icon from '../../../assets/icons/restock_icon.svg';
import transfer_stock_icon from '../../../assets/icons/transfer_stock.svg';
import view_products from '../../../assets/icons/view_inventory.svg';
import low_inventory from '../../../assets/icons/low_stock.svg';

interface Product {
    id: number;
    name: string;
    description: string;
    sku: string;
    barcode?: string;
    barcode_image?: string;
    category: string | { category_name: string };
    branch: string;
    quantity: number;
    cost: number;
    price: number;
    status: string;
    image: string;
    weight?: number;
    dimensions?: string;
    color?: string;
    unit?: string;
    low_stock_alert?: number;
    is_active?: boolean;
    images?: Array<{
        id: number;
        image_path: string;
        is_primary: boolean;
        sort_order: number;
    }>;
    variants?: Array<{
        id: number;
        variant_name: string;
        variant_value: string;
        sku: string;
        barcode: string;
        cost_price: number;
        selling_price: number;
        additional_price: number;
        is_active: boolean;
        inventory?: Array<{
            quantity: number;
            available_quantity: number;
            reserved_quantity?: number;
            branch?: {
                id: number;
                branch_name: string;
            };
        }>;
    }>;
    inventory?: Array<{
        quantity: number;
        available_quantity: number;
        reserved_quantity?: number;
        branch?: {
            id: number;
            branch_name: string;
        };
    }>;
    created_at?: string;
    updated_at?: string;
}

interface ProductDetailsSidebarProps {
    isOpen: boolean;
    product: Product | null;
    onClose: () => void;
}

export default function ProductDetailsSidebar({ isOpen, product, onClose }: ProductDetailsSidebarProps) {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showDamageModal, setShowDamageModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [selectedProductForDamage, setSelectedProductForDamage] = useState<{
        id: number;
        name: string;
        branch: string;
        branch_id: number;
        quantity: number;
        sku?: string;
    } | null>(null);

    if (!product) return null;

    // ============ PROCESS PRODUCT IMAGES ============
    const productImages = (() => {
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            return [...product.images]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(img => `https://puristic-filmily-bula.ngrok-free.dev/storage/${img.image_path}`);
        }
        return [product.image || 'https://images.unsplash.com/photo-1457089328109-e5d9bd499191?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGZsb3dlcnN8ZW58MHwxfDB8fHww'];
    })();

    // ============ GET CATEGORY NAME ============
    const categoryName = (() => {
        if (!product.category) return 'Not specified';
        if (typeof product.category === 'object' && product.category.category_name) {
            return product.category.category_name;
        }
        return product.category as string;
    })();

    // ============ DYNAMIC SPECIFICATIONS FROM API ============
    const specifications = [
        { label: 'Category', value: categoryName },
        { label: 'Unit', value: product.unit || 'Piece' },
        { label: 'Weight', value: product.weight ? `${product.weight} kg` : 'Not specified' },
        { label: 'Dimensions', value: product.dimensions || 'Not specified' },
        { label: 'Color', value: product.color || 'Not specified' },
        { label: 'SKU', value: product.sku || 'N/A' },
        {
            label: 'Barcode',
            value: product.barcode || 'N/A',
            image: product.barcode_image
        },
        { label: 'Low Stock Alert', value: product.low_stock_alert?.toString() || '10' },
        { label: 'Status', value: product.is_active ? 'Active' : 'Inactive' },
    ];

    // ============ VARIANT SPECIFICATIONS ============
    const variantSpecifications = !product.variants || product.variants.length === 0 ? [] :
        product.variants.map((variant: any) => ({
            id: variant.id,
            name: variant.variant_name,
            value: variant.variant_value,
            sku: variant.sku,
            barcode: variant.barcode,
            barcode_image: variant.barcode_image,
            cost_price: variant.cost_price,
            selling_price: variant.selling_price,
            additional_price: variant.additional_price,
            is_active: variant.is_active
        }));


    // ============ BRANCH STOCK DATA FROM API ============
    const branchStock = !product.inventory || product.inventory.length === 0 ? [{
        name: 'No Branch Data',
        available: 0,
        reserved: 0,
        total: 0,
        is_low_stock: false
    }] : product.inventory.map(inv => ({
        name: inv.branch?.branch_name || 'Unknown Branch',
        available: inv.available_quantity || 0,
        reserved: inv.reserved_quantity || 0,
        total: inv.quantity || 0,
        is_low_stock: inv.quantity <= (product.low_stock_alert || 10)
    }));

    // ============ VARIANT BRANCH STOCK ============
    const variantBranchStock = !product.variants ? [] :
        product.variants.map(variant => {
            const variantStock = variant.inventory?.map(inv => ({
                branch_name: inv.branch?.branch_name || 'Unknown Branch',
                quantity: inv.quantity || 0,
                available: inv.available_quantity || 0,
                reserved: inv.reserved_quantity || 0
            })) || [];

            return {
                variant_name: `${variant.variant_name}: ${variant.variant_value}`,
                sku: variant.sku,
                stock: variantStock
            };
        });

    // ============ PROFIT CALCULATIONS ============
    const profitMargin = (() => {
        if (product.price && product.cost && product.cost > 0) {
            return (((product.price - product.cost) / product.cost) * 100).toFixed(1);
        }
        return '0.0';
    })();

    const profit = (product.price || 0) - (product.cost || 0);

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

    const handleReportDamageClick = () => {
        setSelectedProductForDamage({
            id: product.id,
            name: product.name,
            branch: branchStock[0]?.name || 'Main Warehouse',
            branch_id: product.inventory?.[0]?.branch?.id || 1,
            quantity: totalStock,
            sku: product.sku
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
    // Generate barcode visualization
    const renderBarcode = (barcodeValue: string, barcodeImage?: string) => {
        if (!barcodeValue) return null;

        // If we have a barcode image from backend, show it
        if (barcodeImage) {
            return (
                <div className="flex flex-col items-center">
                    <img
                        src={`https://puristic-filmily-bula.ngrok-free.dev/storage/${barcodeImage}`}
                        alt={`Barcode ${barcodeValue}`}
                        className="h-8 w-auto object-contain"
                        onError={(e) => {
                            // Fallback to text if image fails to load
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    <span className="text-xs font-mono leading-md">{barcodeValue}</span>
                </div>
            );
        }

        // Fallback to simulated barcode if no image
        return (
            <div className="flex flex-col items-center">
                <div className="flex space-x-0.5 mb-1">
                    {[...Array(30)].map((_, i) => (
                        <div
                            key={i}
                            className="w-0.5 bg-black"
                            style={{ height: `${Math.random() * 20 + 20}px` }}
                        />
                    ))}
                </div>
                <span className="text-xs font-mono">{barcodeValue}</span>
            </div>
        );
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 transition-opacity duration-300  bg-opacity-30"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed right-0 top-0 bottom-0 w-full md:w-175 lg:w-212.5 xl:w-237.5 bg-[#F8F8F8] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="h-full overflow-y-auto">
                    {/* Sidebar Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-gray-900">Product Details</h3>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
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
                                        alt={product.name}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            e.currentTarget.src = "https://images.unsplash.com/photo-1457089328109-e5d9bd499191?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGZsb3dlcnN8ZW58MHwxfDB8fHww";
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
                                                ? 'border-blue-500 ring-2 ring-blue-200'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="w-full h-full bg-gray-50 p-2">
                                                <img
                                                    src={img}
                                                    alt={`${product.name || 'Product'} ${index + 1}`}
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
                                            {(product.name || '').toUpperCase()}
                                        </h2>
                                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                            {product.description || 'No description available'}
                                        </p>
                                    </div>

                                    {/* Specifications */}
                                    {specifications.map((spec, index) => (
                                        <div key={index} className="flex flex-col items-start">
                                            <span className="text-sm text-gray-500 min-w-30">{spec.label}</span>
                                            {spec.label === 'Barcode' && spec.image ? (
                                                <div className="flex flex-col">
                                                    <img
                                                        src={`https://puristic-filmily-bula.ngrok-free.dev/storage/${spec.image}`}
                                                        alt="Barcode"
                                                        className="h-8 w-auto object-contain mb-1"
                                                    />
                                                    <span className="text-sm text-gray-900 font-semibold">{spec.value}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-900 font-semibold">{spec.value}</span>
                                            )}
                                        </div>
                                    ))}

                                    {/* Variant Specifications - Only show if product has variants */}
                                    {variantSpecifications.length > 0 && (
                                        <div className="pt-3 border-t border-gray-200">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Variant Specifications</h4>
                                            <div className="space-y-3">
                                                {variantSpecifications.map((variant) => (
                                                    <div key={variant.id} className="bg-gray-50 p-3 rounded-lg">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-sm font-semibold text-gray-900">
                                                                {variant.name}: {variant.value}
                                                            </span>
                                                            <span className={`text-xs px-2 py-1 rounded-full ${variant.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                                {variant.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div>
                                                                <span className="text-gray-500">SKU:</span>
                                                                <span className="ml-1 font-mono">{variant.sku}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Barcode:</span>
                                                                <span className="ml-1 font-mono">{variant.barcode}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Cost:</span>
                                                                <span className="ml-1 font-semibold">KWD {variant.cost_price}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Price:</span>
                                                                <span className="ml-1 font-semibold">KWD {variant.selling_price}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Additional:</span>
                                                                <span className="ml-1">KWD {variant.additional_price}</span>
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
                                <p className="text-sm text-gray-500 font-semibold mb-2">Cost Price</p>
                                <p className="text-xl font-semibold text-gray-900 border border-[#0088FF] p-2 rounded-md text-center">
                                    KWD {product.cost?.toFixed(3) || '0.000'}
                                </p>
                            </div>
                            <div className="bg-white rounded-lg p-4">
                                <p className="text-sm text-gray-500 font-semibold mb-2">Selling Price</p>
                                <p className="text-xl font-semibold text-gray-900 border border-[#0088FF] p-2 rounded-md text-center">
                                    KWD {product.price?.toFixed(3) || '0.000'}
                                </p>
                            </div>
                            <div className="bg-white rounded-lg p-4">
                                <p className="text-sm text-gray-500 font-semibold mb-2">Profit</p>
                                <p className="text-xl font-semibold text-gray-900 border border-[#0088FF] p-2 rounded-md text-center">
                                    KWD {profit.toFixed(3)}
                                </p>
                            </div>
                            <div className="bg-white rounded-lg p-4">
                                <p className="text-sm text-gray-500 font-semibold mb-2">Margin</p>
                                <p className="text-xl font-semibold text-gray-900 border border-[#0088FF] p-2 rounded-md text-center">
                                    {profitMargin}%
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 bg-white px-4 py-8 rounded-xl">
                            <button
                                onClick={handleEditProductClick}
                                className="flex flex-col items-center justify-center px-4 py-10 cursor-pointer rounded-lg border border-[#0088FF] hover:bg-blue-50 transition-colors"
                            >
                                <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center mb-2">
                                    <img src={edit_icon} alt="Edit" />
                                </div>
                                <span className="text-md font-medium text-gray-700 text-center">Edit Product</span>
                                <span className="text-md text-gray-500">Admin Only</span>
                            </button>

                            <button
                                onClick={handleRestockClick}
                                className="flex flex-col items-center justify-center px-4 py-8 cursor-pointer rounded-lg border border-[#0088FF] hover:bg-blue-50 transition-colors"
                            >
                                <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center mb-2">
                                    <img src={restock_icon} alt="Restock" />
                                </div>
                                <span className="text-md font-medium text-gray-700 text-center">Add/Restock</span>
                            </button>


                            <button
                                onClick={handleTransferStockClick}
                                className="flex flex-col items-center justify-center px-4 py-8 cursor-pointer rounded-lg border border-[#0088FF] hover:bg-blue-50 transition-colors"
                            >
                                <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center mb-2">
                                    <img src={transfer_stock_icon} alt="Transfer" />
                                </div>
                                <span className="text-md font-medium text-gray-700 text-center">Transfer Stock</span>
                            </button>


                            <button
                                onClick={handleInventoryMovementClick}
                                className="flex flex-col items-center justify-center px-4 py-8 cursor-pointer rounded-lg border border-[#0088FF] hover:bg-blue-50 transition-colors"
                            >
                                <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center mb-2">
                                    <img src={view_products} alt="View Inventory" />
                                </div>
                                <span className="text-md font-medium text-gray-700 text-center">View Inventory</span>
                            </button>

                            <button
                                onClick={handleReportDamageClick}
                                className="flex flex-col items-center justify-center px-4 py-8 cursor-pointer rounded-lg border border-[#0088FF] hover:bg-blue-50 transition-colors"
                            >
                                <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center mb-2">
                                    <img src={low_inventory} alt="Report Damage" />
                                </div>
                                <span className="text-md font-medium text-gray-700 text-center">Report Damage</span>
                            </button>
                        </div>

                        {/* Stock By Branch Section */}
                        <div className="shadow bg-white rounded-xl">
                            <div className="px-4 py-3 border-b border-gray-200">
                                <h3 className="text-xl font-bold text-gray-900">Stock By Branch</h3>
                                {totalStock > 0 && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        Total Stock: {totalStock} units
                                    </p>
                                )}
                            </div>

                            {branchStock.length > 0 && branchStock[0].name !== 'No Branch Data' ? (
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
                                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${branch.is_low_stock
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : branch.total > 0
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                {branch.is_low_stock
                                                                    ? 'Low Stock'
                                                                    : branch.total > 0
                                                                        ? 'In Stock'
                                                                        : 'Out of Stock'}
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
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    <p className="text-gray-600">No inventory data available for this product</p>
                                    <p className="text-sm text-gray-500 mt-1">Add stock to branches to see inventory distribution</p>
                                </div>
                            )}
                        </div>

                        {/* Variant Stock By Branch - Only show if product has variants */}
                        {variantBranchStock.length > 0 && (
                            <div className="shadow bg-white rounded-xl">
                                <div className="px-4 py-3 border-b border-gray-200">
                                    <h3 className="text-xl font-bold text-gray-900">Variant Stock By Branch</h3>
                                </div>
                                <div className="p-4 space-y-4">
                                    {variantBranchStock.map((variant, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold text-gray-900">{variant.variant_name}</span>
                                                    <span className="text-sm text-gray-600 font-mono">SKU: {variant.sku}</span>
                                                </div>
                                            </div>
                                            {variant.stock.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-white">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reserved</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {variant.stock.map((stock, sIndex) => (
                                                                <tr key={sIndex}>
                                                                    <td className="px-4 py-2 text-sm text-gray-900">{stock.branch_name}</td>
                                                                    <td className="px-4 py-2 text-sm text-gray-900">{stock.available}</td>
                                                                    <td className="px-4 py-2 text-sm text-gray-900">{stock.reserved}</td>
                                                                    <td className="px-4 py-2 text-sm font-semibold text-gray-900">{stock.quantity}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 p-4">No stock data for this variant</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <TransferStockModal
                isOpen={showTransferModal}
                onClose={handleCloseTransferModal}
                product={product ? {
                    id: product.id,
                    name: product.name,
                    sku: product.sku
                } : null}
            />

            {showDamageModal && selectedProductForDamage && (
                <ReportDamageModal
                    isOpen={showDamageModal}
                    onClose={() => {
                        setShowDamageModal(false);
                        setSelectedProductForDamage(null);
                    }}
                    onSuccess={() => {
                        // Optional: refresh data
                        console.log('Damage reported successfully');
                    }}
                    product={selectedProductForDamage}
                />
            )}

            <EditProductModal
                isOpen={showEditModal}
                onClose={handleCloseEditModal}
                mode="edit"
                product={product ? {
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                    category: typeof product.category === 'object'
                        ? (product.category as any)?.category_name || 'Uncategorized'
                        : product.category || 'Uncategorized',
                    quantity: product.quantity,
                    cost: product.cost,
                    price: product.price,
                    status: product.status,
                    image: product.image,
                    description: product.description,
                    barcode: product.barcode,
                    barcode_image: product.barcode_image,
                    unit: product.unit,
                    weight: product.weight,
                    dimensions: product.dimensions,
                    color: product.color,
                    low_stock_alert: product.low_stock_alert,
                    is_active: product.is_active
                } : null}
            />

            <AddStockModal
                isOpen={showAddStockModal}
                onClose={handleCloseAddStockModal}
                product={product ? {
                    id: product.id,
                    name: product.name,
                    sku: product.sku
                } : null}
            />

            <InventoryMovementModal
                isOpen={showInventoryModal}
                onClose={handleCloseInventoryModal}
                product={product ? {
                    name: product.name,
                    sku: product.sku
                } : null}
            />
        </>
    );
}