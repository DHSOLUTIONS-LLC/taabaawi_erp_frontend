// src/features/auth/pages/InventoryReportsPage.tsx
import DashboardLayout from '../../../layouts/DashboardLayout';
import { useState, useMemo, useEffect } from 'react';

import history_icon from '../../../assets/icons/history_icon.svg'
import dropdown_arrow_icon from '../../../assets/icons/dropdown_arrow_icon.svg';
import export_excel from '../../../assets/icons/export_excel.svg';
import export_pdf from '../../../assets/icons/export_pdf.svg';
import search_icon from '../../../assets/icons/search_icon.svg';
import filterIcon from '../../../assets/icons/filter_icon.svg';

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from 'jspdf';

// Import APIs
import { useGetCategoriesQuery } from '../../../services/hrApi';
import { useGetBranchesQuery } from '../../../services/superAdminApi';
import { inventoryApi } from '../../../services/inventoryApi';

type TabType = 'stock-summary' | 'inventory-movement' | 'low-stock' | 'damage-discard' | 'transfer-history';

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

interface StockSummaryItem {
    id: number;
    product_id: number;
    product_name: string;
    sku: string;
    category: string;
    branch: string;
    branch_id: number;
    quantity: number;
    reserved_quantity: number;
    available_quantity: number;
    status: string;
    image: string;
}

interface InventoryMovementItem {
    id: number;
    date: string;
    product: string;
    product_id: number;
    type: string;
    from: string;
    to: string;
    quantity: number;
    balanceAfter: number;
    user: string;
    from_branch_id: number | null;
    to_branch_id: number | null;
}

interface LowStockItem {
    product_id: number;
    product_name: string;
    sku: string;
    variant: any;
    branch_id: number;
    branch_name: string;
    current_stock: number;
    reorder_point: number;
    quantity_needed: number;
}

interface DamageDiscardItem {
    id: number;
    product: string;
    name: string;
    branch: string;
    quantity: number;
    status: string;
    financialImpact: number;
    reference: string;
}

interface TransferHistoryItem {
    id: number;
    transfer_number: string;
    from: string;
    to: string;
    products: string;
    units: number;
    status: string;
    date: string;
    from_branch_id: number;
    to_branch_id: number;
}

type ReportDataItem = StockSummaryItem | InventoryMovementItem | LowStockItem | DamageDiscardItem | TransferHistoryItem;

export default function InventoryReportsPage() {
    const [showBulkTransfer] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('stock-summary');
    
    // Search and pagination states
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // Filter states
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedStockStatus, setSelectedStockStatus] = useState<string>('');
    const [selectedMovementType, setSelectedMovementType] = useState<string>('');
    const [selectedDamageStatus, setSelectedDamageStatus] = useState<string>('');
    const [selectedTransferStatus, setSelectedTransferStatus] = useState<string>('');

    // Fetch categories from API
    const { data: categoriesResponse, isLoading: categoriesLoading, error: categoriesError } = useGetCategoriesQuery();
    
    // Extract categories from the nested response structure
    const categories: Category[] = (categoriesResponse as CategoryResponse)?.data?.data || [];
    
    // Fetch branches from API
    const {
        data: branchesData = [],
        isLoading: branchesLoading,
        error: branchesError,
    } = useGetBranchesQuery();

    const branches = Array.isArray(branchesData) ? branchesData : [];

    // Fetch inventory data
    const { data: inventoryResponse, isLoading: inventoryLoading } = inventoryApi.endpoints.getInventoryMovements.useQuery({
        page: 1,
    }, {
        skip: activeTab !== 'stock-summary' && activeTab !== 'inventory-movement'
    });

    // Fetch low stock data
    const { data: lowStockResponse, isLoading: lowStockLoading } = inventoryApi.endpoints.getLowStockProducts.useQuery(undefined, {
        skip: activeTab !== 'low-stock'
    });

    // Fetch transfer history
    const { data: transferHistoryResponse, isLoading: transferHistoryLoading } = inventoryApi.endpoints.getStockTransfers.useQuery({
        page: 1
    }, {
        skip: activeTab !== 'transfer-history'
    });

    // Get active categories only
    const activeCategories = useMemo(() => {
        return categories.filter((cat: Category) => cat.is_active);
    }, [categories]);

    // Process inventory data for stock summary
    const stockSummaryData: StockSummaryItem[] = useMemo(() => {
        const movements = inventoryResponse?.data?.data || [];
        const inventoryMap = new Map<string, StockSummaryItem>();

        movements.forEach((movement: any) => {
            if (movement.to_branch) {
                const key = `${movement.product_id}-${movement.to_branch.id}`;
                
                if (!inventoryMap.has(key)) {
                    inventoryMap.set(key, {
                        id: movement.id,
                        product_id: movement.product_id,
                        product_name: movement.product.product_name,
                        sku: movement.product.sku,
                        category: 'General',
                        branch: movement.to_branch.branch_name,
                        branch_id: movement.to_branch.id,
                        quantity: movement.quantity,
                        reserved_quantity: 0,
                        available_quantity: movement.quantity,
                        status: movement.quantity > 10 ? 'In Stock' : movement.quantity > 0 ? 'Low Stock' : 'Out of Stock',
                        image: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=150',
                    });
                }
            }
        });

        return Array.from(inventoryMap.values());
    }, [inventoryResponse]);

    // Process inventory movements
    const inventoryMovementData: InventoryMovementItem[] = useMemo(() => {
        const movements = inventoryResponse?.data?.data || [];
        console.log('movement data:', movements)
        return movements.map((movement: any) => ({
            id: movement.id,
            date: new Date(movement.movement_date).toLocaleDateString(),
            product: movement.product.product_name,
            product_id: movement.product_id,
            type: movement.movement_type,
            from: movement.from_branch?.branch_name || '-',
            to: movement.to_branch?.branch_name || '-',
            quantity: movement.quantity,
            balanceAfter: 0,
            user: movement.moved_by.name,
            from_branch_id: movement.from_branch_id,
            to_branch_id: movement.to_branch_id,
        }));
    }, [inventoryResponse]);

    // Process low stock data
    const lowStockData: LowStockItem[] = useMemo(() => {
        return lowStockResponse?.data || [];
    }, [lowStockResponse]);

    // Mock data for Damage & Discard Report (keeping static as requested)
    const damageDiscardData: DamageDiscardItem[] = [
        {
            id: 1,
            product: 'Desk Lamp LED',
            name: 'LAMP-789',
            branch: 'Main Warehouse',
            quantity: 3,
            status: 'Damaged',
            financialImpact: 75,
            reference: 'DMG-2026-001'
        },
        {
            id: 2,
            product: 'Wireless Keyboard',
            name: 'KB-202',
            branch: 'Downtown Store',
            quantity: 1,
            status: 'Damaged',
            financialImpact: 45,
            reference: 'DMG-2026-002'
        },
    ];

    // Process transfer history
    const transferHistoryData: TransferHistoryItem[] = useMemo(() => {
        const transfers = transferHistoryResponse?.data?.data || [];
        console.log('transfer :', transfers)
        return transfers.map((transfer: any) => ({
            id: transfer.id,
            transfer_number: transfer.transfer_number || `TRF-${transfer.id}`,
            from: transfer.from_branch?.branch_name || '-',
            to: transfer.toBranch?.branch_name || '-',
            products: transfer.items?.map((item: any) => item.product?.product_name).join(', ') || '-',
            units: transfer.items?.reduce((sum: number, item: any) => sum + (item.approved_quantity || 0), 0) || 0,
            status: transfer.status,
            date: new Date(transfer.created_at).toLocaleDateString(),
            from_branch_id: transfer.from_branch_id,
            to_branch_id: transfer.to_branch_id,
        }));
    }, [transferHistoryResponse]);

    // Get current data based on active tab
    const getCurrentData = (): ReportDataItem[] => {
        switch (activeTab) {
            case 'stock-summary': return stockSummaryData;
            case 'inventory-movement': return inventoryMovementData;
            case 'low-stock': return lowStockData;
            case 'damage-discard': return damageDiscardData;
            case 'transfer-history': return transferHistoryData;
            default: return [];
        }
    };

    // Filter data based on all criteria
    const filteredData = useMemo(() => {
        const currentData = getCurrentData();
        let filtered = [...currentData];
        
        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            
            filtered = filtered.filter(item => {
                switch (activeTab) {
                    case 'stock-summary':
                        const stockItem = item as StockSummaryItem;
                        return (
                            stockItem.product_name.toLowerCase().includes(query) ||
                            stockItem.sku.toLowerCase().includes(query) ||
                            stockItem.category.toLowerCase().includes(query) ||
                            stockItem.branch.toLowerCase().includes(query) ||
                            stockItem.status.toLowerCase().includes(query)
                        );
                    case 'inventory-movement':
                        const movementItem = item as InventoryMovementItem;
                        return (
                            movementItem.product.toLowerCase().includes(query) ||
                            movementItem.type.toLowerCase().includes(query) ||
                            movementItem.from.toLowerCase().includes(query) ||
                            movementItem.to.toLowerCase().includes(query) ||
                            movementItem.user.toLowerCase().includes(query)
                        );
                    case 'low-stock':
                        const lowStockItem = item as LowStockItem;
                        return (
                            lowStockItem.product_name.toLowerCase().includes(query) ||
                            lowStockItem.sku.toLowerCase().includes(query) ||
                            lowStockItem.branch_name.toLowerCase().includes(query)
                        );
                    case 'damage-discard':
                        const damageItem = item as DamageDiscardItem;
                        return (
                            damageItem.product.toLowerCase().includes(query) ||
                            damageItem.name.toLowerCase().includes(query) ||
                            damageItem.branch.toLowerCase().includes(query) ||
                            damageItem.status.toLowerCase().includes(query) ||
                            damageItem.reference.toLowerCase().includes(query)
                        );
                    case 'transfer-history':
                        const transferItem = item as TransferHistoryItem;
                        return (
                            transferItem.transfer_number.toLowerCase().includes(query) ||
                            transferItem.from.toLowerCase().includes(query) ||
                            transferItem.to.toLowerCase().includes(query) ||
                            transferItem.products.toLowerCase().includes(query) ||
                            transferItem.status.toLowerCase().includes(query)
                        );
                    default:
                        return true;
                }
            });
        }
        
        // Apply branch filter
        if (selectedBranch) {
            filtered = filtered.filter(item => {
                switch (activeTab) {
                    case 'stock-summary':
                        return (item as StockSummaryItem).branch === selectedBranch;
                    case 'inventory-movement':
                        const movement = item as InventoryMovementItem;
                        return movement.from === selectedBranch || movement.to === selectedBranch;
                    case 'low-stock':
                        return (item as LowStockItem).branch_name === selectedBranch;
                    case 'damage-discard':
                        return (item as DamageDiscardItem).branch === selectedBranch;
                    case 'transfer-history':
                        const transfer = item as TransferHistoryItem;
                        return transfer.from === selectedBranch || transfer.to === selectedBranch;
                    default:
                        return true;
                }
            });
        }
        
        // Apply stock status filter (for stock summary only)
        if (selectedStockStatus && activeTab === 'stock-summary') {
            filtered = filtered.filter(item => (item as StockSummaryItem).status === selectedStockStatus);
        }
        
        // Apply movement type filter (for inventory movement only)
        if (selectedMovementType && activeTab === 'inventory-movement') {
            filtered = filtered.filter(item => (item as InventoryMovementItem).type === selectedMovementType);
        }
        
        // Apply damage status filter (for damage & discard only)
        if (selectedDamageStatus && activeTab === 'damage-discard') {
            filtered = filtered.filter(item => (item as DamageDiscardItem).status === selectedDamageStatus);
        }
        
        // Apply transfer status filter (for transfer history only)
        if (selectedTransferStatus && activeTab === 'transfer-history') {
            filtered = filtered.filter(item => (item as TransferHistoryItem).status === selectedTransferStatus);
        }
        
        return filtered;
    }, [
        searchQuery, selectedBranch, selectedStockStatus, 
        selectedMovementType, selectedDamageStatus, selectedTransferStatus, 
        activeTab, stockSummaryData, inventoryMovementData, 
        lowStockData, damageDiscardData, transferHistoryData
    ]);

    // Calculate pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredData.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedBranch, selectedStockStatus, 
        selectedMovementType, selectedDamageStatus, selectedTransferStatus, activeTab]);

    // Get search suggestions
    const searchSuggestions = useMemo(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) return [];
        
        const query = searchQuery.toLowerCase().trim();
        const suggestions = new Set<string>();
        const currentData = getCurrentData();
        
        currentData.forEach(item => {
            switch (activeTab) {
                case 'stock-summary':
                    const stockItem = item as StockSummaryItem;
                    if (stockItem.product_name.toLowerCase().includes(query)) suggestions.add(stockItem.product_name);
                    if (stockItem.sku.toLowerCase().includes(query)) suggestions.add(stockItem.sku);
                    break;
                case 'inventory-movement':
                    const movementItem = item as InventoryMovementItem;
                    if (movementItem.product.toLowerCase().includes(query)) suggestions.add(movementItem.product);
                    if (movementItem.type.toLowerCase().includes(query)) suggestions.add(movementItem.type);
                    break;
                case 'low-stock':
                    const lowStockItem = item as LowStockItem;
                    if (lowStockItem.product_name.toLowerCase().includes(query)) suggestions.add(lowStockItem.product_name);
                    if (lowStockItem.sku.toLowerCase().includes(query)) suggestions.add(lowStockItem.sku);
                    break;
                case 'transfer-history':
                    const transferItem = item as TransferHistoryItem;
                    if (transferItem.transfer_number.toLowerCase().includes(query)) suggestions.add(transferItem.transfer_number);
                    if (transferItem.products.toLowerCase().includes(query)) suggestions.add(transferItem.products);
                    break;
            }
        });
        
        return Array.from(suggestions).slice(0, 5);
    }, [searchQuery, activeTab]);

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        setShowSuggestions(value.length >= 2);
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion: string) => {
        setSearchQuery(suggestion);
        setShowSuggestions(false);
    };

    // Handle search input blur
    const handleSearchBlur = () => {
        setTimeout(() => {
            setShowSuggestions(false);
        }, 200);
    };

    // Pagination handlers
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handlePrevious = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    // Generate page numbers for display
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 3;
        
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            if (currentPage <= 2) {
                pageNumbers.push(1, 2, 3);
                if (totalPages > 3) pageNumbers.push('...');
            } else if (currentPage >= totalPages - 1) {
                if (totalPages > 3) pageNumbers.push('...');
                pageNumbers.push(totalPages - 2, totalPages - 1, totalPages);
            } else {
                pageNumbers.push('...', currentPage - 1, currentPage, currentPage + 1, '...');
            }
        }
        
        return pageNumbers;
    };

    // Export to Excel function
    const handleExportToExcel = () => {
        try {
            let exportData = [];
            let filename = '';
            let sheetName = '';
            
            switch (activeTab) {
                case 'stock-summary':
                    exportData = filteredData.map((item) => {
                        const stockItem = item as StockSummaryItem;
                        return {
                            'Product Name': stockItem.product_name,
                            'SKU': stockItem.sku,
                            'Category': stockItem.category,
                            'Branch': stockItem.branch,
                            'Available': stockItem.available_quantity,
                            'Reserved': stockItem.reserved_quantity,
                            'Total': stockItem.quantity,
                            'Status': stockItem.status,
                        };
                    });
                    filename = 'stock_summary';
                    sheetName = 'Stock Summary';
                    break;
                    
                case 'inventory-movement':
                    exportData = filteredData.map((item) => {
                        const movementItem = item as InventoryMovementItem;
                        return {
                            'Date': movementItem.date,
                            'Product': movementItem.product,
                            'Type': movementItem.type,
                            'From': movementItem.from,
                            'To': movementItem.to,
                            'Quantity': movementItem.quantity,
                            'User': movementItem.user,
                        };
                    });
                    filename = 'inventory_movement';
                    sheetName = 'Inventory Movement';
                    break;
                    
                case 'low-stock':
                    exportData = filteredData.map((item) => {
                        const lowStockItem = item as LowStockItem;
                        return {
                            'Product': lowStockItem.product_name,
                            'SKU': lowStockItem.sku,
                            'Branch': lowStockItem.branch_name,
                            'Current Stock': lowStockItem.current_stock,
                            'Reorder Point': lowStockItem.reorder_point,
                            'Quantity Needed': lowStockItem.quantity_needed,
                        };
                    });
                    filename = 'low_stock_report';
                    sheetName = 'Low Stock Report';
                    break;
                    
                case 'damage-discard':
                    exportData = filteredData.map((item) => {
                        const damageItem = item as DamageDiscardItem;
                        return {
                            'Product': damageItem.product,
                            'SKU': damageItem.name,
                            'Branch': damageItem.branch,
                            'Quantity': damageItem.quantity,
                            'Status': damageItem.status,
                            'Financial Impact (KWD)': damageItem.financialImpact,
                            'Reference': damageItem.reference,
                        };
                    });
                    filename = 'damage_discard';
                    sheetName = 'Damage & Discard';
                    break;
                    
                case 'transfer-history':
                    exportData = filteredData.map((item) => {
                        const transferItem = item as TransferHistoryItem;
                        return {
                            'Transfer ID': transferItem.transfer_number,
                            'From': transferItem.from,
                            'To': transferItem.to,
                            'Products': transferItem.products,
                            'Units': transferItem.units,
                            'Status': transferItem.status,
                            'Date': transferItem.date,
                        };
                    });
                    filename = 'transfer_history';
                    sheetName = 'Transfer History';
                    break;
            }

            if (exportData.length === 0) {
                alert('No data to export');
                return;
            }

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
            });

            saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
            
        } catch (error) {
            console.error('Excel export failed:', error);
            alert('Failed to export to Excel. Please try again.');
        }
    };

    // Export to PDF function
    const handleExportToPDF = () => {
        if (filteredData.length === 0) {
            alert(`No ${activeTab.replace('-', ' ')} data to export`);
            return;
        }

        try {
            const doc = new jsPDF('landscape', 'mm', 'a4');
            const marginLeft = 10;
            const marginTop = 20;
            let yPos = marginTop;
            
            let title = '';
            switch (activeTab) {
                case 'stock-summary': title = 'STOCK SUMMARY REPORT'; break;
                case 'inventory-movement': title = 'INVENTORY MOVEMENT REPORT'; break;
                case 'low-stock': title = 'LOW STOCK REPORT'; break;
                case 'damage-discard': title = 'DAMAGE & DISCARD REPORT'; break;
                case 'transfer-history': title = 'TRANSFER HISTORY REPORT'; break;
            }
            
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(title, 148.5, yPos, { align: 'center' });
            yPos += 10;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, marginLeft, yPos);
            doc.text(`Total Records: ${filteredData.length}`, 280, yPos, { align: 'right' });
            yPos += 8;
            
            doc.setDrawColor(200, 200, 200);
            doc.line(marginLeft, yPos, 287, yPos);
            yPos += 10;
            
            const filename = `${activeTab.replace('-', '_')}_report_${new Date().toISOString().split('T')[0]}`;
            doc.save(`${filename}.pdf`);
            
        } catch (error) {
            console.error('PDF export failed:', error);
            alert('Failed to export to PDF. Please try again.');
        }
    };

    const handleProductSelect = (productId: number) => {
        setSelectedProductIds(prev => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId);
            } else {
                return [...prev, productId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedProductIds.length === stockSummaryData.length) {
            setSelectedProductIds([]);
        } else {
            setSelectedProductIds(stockSummaryData.map(p => p.product_id));
        }
    };

    const handleBulkTransfer = () => {
        if (selectedProductIds.length === 0) {
            alert('Please select at least one product to transfer');
            return;
        }
        console.log('Transfer products:', selectedProductIds);
        alert(`Transferring ${selectedProductIds.length} product(s)`);
    };

    // Reset all filters
    const resetFilters = () => {
        setSelectedDate('');
        setSelectedBranch('');
        setSelectedCategory('');
        setSelectedStockStatus('');
        setSelectedMovementType('');
        setSelectedDamageStatus('');
        setSelectedTransferStatus('');
        setSearchQuery('');
        setCurrentPage(1);
    };

    const renderTabContent = () => {
        const isLoading = inventoryLoading || lowStockLoading || transferHistoryLoading;

        if (isLoading) {
            return (
                <div className="p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading data...</p>
                </div>
            );
        }

        switch (activeTab) {
            case 'stock-summary':
                return (
                    <div className="">
                        <table className="min-w-[800px] md:min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-50">
                                    {showBulkTransfer && (
                                        <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedProductIds.length === stockSummaryData.length && stockSummaryData.length > 0}
                                                onChange={handleSelectAll}
                                                className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                            />
                                        </th>
                                    )}
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Image</th>
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Product</th>
                                    <th className="hidden sm:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">SKU</th>
                                    <th className="hidden lg:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Category</th>
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Branch</th>
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Available</th>
                                    {/* <th className="hidden md:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Reserved</th> */}
                                    <th className="hidden md:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Total</th>
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={showBulkTransfer ? 10 : 9} className="px-3 sm:px-6 py-8 text-center">
                                            <div className="text-gray-500 text-sm sm:text-lg">
                                                {searchQuery || selectedBranch || selectedStockStatus ? 
                                                    'No products found matching your filters.' : 
                                                    'No inventory data available.'
                                                }
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((item) => {
                                        const product = item as StockSummaryItem;
                                        return (
                                            <tr key={`${product.product_id}-${product.branch_id}`} className="hover:bg-gray-50">
                                                {showBulkTransfer && (
                                                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedProductIds.includes(product.product_id)}
                                                            onChange={() => handleProductSelect(product.product_id)}
                                                            className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                        />
                                                    </td>
                                                )}
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden">
                                                        <img src={product.image} alt={product.product_name} className="w-full h-full object-cover" />
                                                    </div>
                                                </td>
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] font-medium text-gray-900">{product.product_name}</div>
                                                </td>
                                                <td className="hidden sm:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] text-gray-900 font-mono">{product.sku}</div>
                                                </td>
                                                <td className="hidden lg:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <span className="inline-flex px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium">{product.category}</span>
                                                </td>
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] text-gray-900">{product.branch}</div>
                                                </td>
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] font-medium text-green-600">{product.available_quantity}</div>
                                                </td>
                                                {/* <td className="hidden md:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] font-medium text-blue-600">{product.reserved_quantity}</div>
                                                </td> */}
                                                <td className="hidden md:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] font-medium text-gray-900">{product.quantity}</div>
                                                </td>
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 sm:px-3 py-1 sm:py-2 text-xs font-medium rounded-lg ${
                                                        product.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                                                        product.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        <span className="hidden xs:inline">{product.status}</span>
                                                        <span className="xs:hidden">{product.status === 'In Stock' ? 'In' : product.status === 'Low Stock' ? 'Low' : 'Out'}</span>
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                );

            case 'inventory-movement':
                return (
                    <div className="">
                        <table className="min-w-[700px] md:min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Date</th>
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Product</th>
                                    <th className="hidden sm:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Type</th>
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">From → To</th>
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Qty</th>
                                    <th className="hidden lg:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">User</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-3 sm:px-6 py-8 text-center">
                                            <div className="text-gray-500 text-sm sm:text-lg">
                                                No inventory movements found.
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((item) => {
                                        const movement = item as InventoryMovementItem;
                                        return (
                                            <tr key={movement.id} className="hover:bg-gray-50">
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] text-gray-900">{movement.date}</div>
                                                </td>
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] font-medium text-gray-900">{movement.product}</div>
                                                </td>
                                                <td className="hidden sm:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 sm:px-3 py-1 text-xs font-medium rounded-lg ${
                                                        movement.type === 'Transfer' ? 'bg-blue-100 text-blue-800' :
                                                        movement.type === 'Sale' ? 'bg-green-100 text-green-800' :
                                                        movement.type === 'Purchase' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {movement.type}
                                                    </span>
                                                </td>
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] text-gray-900">
                                                        <span className="hidden xs:inline">{movement.from} → </span>
                                                        <span className="xs:hidden">{movement.from.substring(0, 3)}→</span>
                                                        {movement.to}
                                                    </div>
                                                </td>
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] font-semibold text-green-600">{movement.quantity}</div>
                                                </td>
                                                <td className="hidden lg:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] text-gray-900">{movement.user}</div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                );

            case 'low-stock':
                return (
                    <div className="">
                        <table className="min-w-[700px] md:min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Product</th>
                                    <th className="hidden sm:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">SKU</th>
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Branch</th>
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Current</th>
                                    <th className="hidden md:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Reorder</th>
                                    <th className="hidden lg:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Needed</th>
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-3 sm:px-6 py-8 text-center">
                                            <div className="text-gray-500 text-sm sm:text-lg">
                                                No low stock items found.
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((item, index) => {
                                        const lowStockItem = item as LowStockItem;
                                        return (
                                            <tr key={`${lowStockItem.product_id}-${lowStockItem.branch_id}-${index}`} className="hover:bg-gray-50">
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] font-medium text-gray-900">{lowStockItem.product_name}</div>
                                                </td>
                                                <td className="hidden sm:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] text-gray-900 font-mono">{lowStockItem.sku}</div>
                                                </td>
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] text-gray-900">{lowStockItem.branch_name}</div>
                                                </td>
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className={`text-xs sm:text-sm md:text-[14px] font-semibold ${
                                                        lowStockItem.current_stock === 0 ? 'text-red-600' : 
                                                        lowStockItem.current_stock < 5 ? 'text-orange-600' : 
                                                        'text-yellow-600'
                                                    }`}>
                                                        {lowStockItem.current_stock}
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] text-gray-900">{lowStockItem.reorder_point}</div>
                                                </td>
                                                <td className="hidden lg:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] font-medium text-red-600">{lowStockItem.quantity_needed}</div>
                                                </td>
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 sm:px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${
                                                        lowStockItem.current_stock === 0 ? 'bg-red-100 text-red-800' :
                                                        lowStockItem.quantity_needed > 5 ? 'bg-orange-100 text-orange-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        <span className="hidden xs:inline">
                                                            {lowStockItem.current_stock === 0 ? 'Critical - Reorder' :
                                                             lowStockItem.quantity_needed > 5 ? 'Reorder Now' : 
                                                             'Reorder Soon'}
                                                        </span>
                                                        <span className="xs:hidden">
                                                            {lowStockItem.current_stock === 0 ? 'Critical' :
                                                             lowStockItem.quantity_needed > 5 ? 'Reorder' : 
                                                             'Soon'}
                                                        </span>
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                );

            case 'damage-discard':
                return (
                    <div className="">
                        <table className="min-w-[800px] md:min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Product</th>
                                    <th className="hidden sm:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">SKU</th>
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Branch</th>
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Qty</th>
                                    <th className="hidden md:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Status</th>
                                    <th className="hidden lg:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Impact</th>
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Reference</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-3 sm:px-6 py-8 text-center">
                                            <div className="text-gray-500 text-sm sm:text-lg">
                                                No damage/discard records available.
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((item) => {
                                        const damageItem = item as DamageDiscardItem;
                                        return (
                                            <tr key={damageItem.id} className="hover:bg-gray-50">
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] font-medium text-gray-900">{damageItem.product}</div>
                                                </td>
                                                <td className="hidden sm:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] text-gray-900 font-mono">{damageItem.name}</div>
                                                </td>
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] text-gray-900">{damageItem.branch}</div>
                                                </td>
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] font-medium text-gray-900">{damageItem.quantity}</div>
                                                </td>
                                                <td className="hidden md:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 sm:px-3 py-1 text-xs font-medium rounded-lg ${
                                                        damageItem.status === 'Damaged' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {damageItem.status}
                                                    </span>
                                                </td>
                                                <td className="hidden lg:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] font-semibold text-red-600">-{damageItem.financialImpact}</div>
                                                </td>
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] text-gray-900 font-mono">{damageItem.reference}</div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                );

            case 'transfer-history':
                return (
                    <div className="">
                        <table className="min-w-[800px] md:min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Transfer ID</th>
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">From → To</th>
                                    <th className="hidden lg:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Products</th>
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Units</th>
                                    <th className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Status</th>
                                    <th className="hidden sm:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm md:text-md font-medium text-[#37638F] uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-3 sm:px-6 py-8 text-center">
                                            <div className="text-gray-500 text-sm sm:text-lg">
                                                No transfer history found.
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((item) => {
                                        const transfer = item as TransferHistoryItem;
                                        return (
                                            <tr key={transfer.id} className="hover:bg-gray-50">
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] font-mono text-blue-600">{transfer.transfer_number}</div>
                                                </td>
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] text-gray-900">
                                                        <span className="hidden xs:inline">{transfer.from} →</span>
                                                        <span className="xs:hidden">{transfer.from.substring(0, 20)}→</span>
                                                        <span className="hidden xs:inline"> {transfer.to}</span>
                                                        <span className="xs:hidden">{transfer.to.substring(0, 3)}</span>
                                                    </div>
                                                </td>
                                                <td className="hidden lg:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4">
                                                    <div className="text-xs sm:text-sm md:text-[14px] text-gray-900 max-w-[200px] truncate" title={transfer.products}>
                                                        {transfer.products}
                                                    </div>
                                                </td>
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] font-medium text-gray-900">{transfer.units}</div>
                                                </td>
                                                <td className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 sm:px-3 py-1 text-xs font-medium rounded-lg ${
                                                        transfer.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                        transfer.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                                                        transfer.status === 'Approved' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {transfer.status}
                                                    </span>
                                                </td>
                                                <td className="hidden sm:table-cell px-2 xs:px-3 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm md:text-[14px] text-gray-900">{transfer.date}</div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-4 sm:space-y-6">
                {/* Inventory Reports Header */}
                <div className="px-2 xs:px-3 sm:px-4 md:px-6">
                    <div className='flex flex-row items-center'>
                        <img src={history_icon} alt="" className="w-5 h-5 sm:w-6 sm:h-6" />
                        <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 mx-2">Inventory Reports</h1>
                    </div>
                    <p className="text-xs sm:text-sm md:text-base text-[#33333399] mt-1 sm:mt-2 font-semibold">
                        Track stock levels, inventory movement, and product performance across all branches.
                    </p>
                </div>

                {/* Products Table Section */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                    {/* Filters Row */}
                    <div className="p-3 xs:p-4 sm:p-6">
                        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                            {/* Date Filter */}
                            <div className="relative">
                                <select 
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold appearance-none bg-white pr-8 sm:pr-10"
                                >
                                    <option value="">Date</option>
                                    <option value="Today">Today</option>
                                    <option value="Last 7 Days">Last 7 Days</option>
                                    <option value="This Month">This Month</option>
                                    <option value="This Year">This Year</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                                    <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
                                </div>
                            </div>

                            {/* Branches Filter */}
                            <div className="relative">
                                <select 
                                    value={selectedBranch}
                                    onChange={(e) => setSelectedBranch(e.target.value)}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold appearance-none bg-white pr-8 sm:pr-10"
                                    disabled={branchesLoading || !!branchesError}
                                >
                                    <option value="">All Branches</option>
                                    {branchesLoading ? (
                                        <option disabled>Loading...</option>
                                    ) : branchesError ? (
                                        <option disabled>Error</option>
                                    ) : branches.length > 0 ? (
                                        branches.map((branch) => (
                                            <option key={branch.id} value={branch.branch_name}>
                                                {branch.branch_name}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>No branches</option>
                                    )}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                                    <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
                                </div>
                            </div>

                            {/* Categories Filter */}
                            <div className="relative">
                                <select 
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold appearance-none bg-white pr-8 sm:pr-10"
                                    disabled={categoriesLoading || !!categoriesError}
                                >
                                    <option value="">All Categories</option>
                                    {categoriesLoading ? (
                                        <option disabled>Loading...</option>
                                    ) : categoriesError ? (
                                        <option disabled>Error</option>
                                    ) : activeCategories.length > 0 ? (
                                        activeCategories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.category_name}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>No categories</option>
                                    )}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                                    <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
                                </div>
                            </div>

                            {/* Conditional Filters */}
                            {(activeTab === 'stock-summary' || activeTab === 'low-stock') && (
                                <div className="relative">
                                    <select 
                                        value={selectedStockStatus}
                                        onChange={(e) => setSelectedStockStatus(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold appearance-none bg-white pr-8 sm:pr-10"
                                    >
                                        <option value="">Stock Status</option>
                                        <option value="In Stock">In Stock</option>
                                        <option value="Low Stock">Low Stock</option>
                                        <option value="Out of Stock">Out of Stock</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                                        <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'inventory-movement' && (
                                <div className="relative">
                                    <select 
                                        value={selectedMovementType}
                                        onChange={(e) => setSelectedMovementType(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold appearance-none bg-white pr-8 sm:pr-10"
                                    >
                                        <option value="">Movement Type</option>
                                        <option value="Transfer">Transfer</option>
                                        <option value="Sale">Sale</option>
                                        <option value="Purchase">Purchase</option>
                                        <option value="Restock">Restock</option>
                                        <option value="Damage">Damage</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                                        <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'damage-discard' && (
                                <div className="relative">
                                    <select 
                                        value={selectedDamageStatus}
                                        onChange={(e) => setSelectedDamageStatus(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold appearance-none bg-white pr-8 sm:pr-10"
                                    >
                                        <option value="">Damage Status</option>
                                        <option value="Damaged">Damaged</option>
                                        <option value="Discarded">Discarded</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                                        <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'transfer-history' && (
                                <div className="relative">
                                    <select 
                                        value={selectedTransferStatus}
                                        onChange={(e) => setSelectedTransferStatus(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold appearance-none bg-white pr-8 sm:pr-10"
                                    >
                                        <option value="">Transfer Status</option>
                                        <option value="Completed">Completed</option>
                                        <option value="In Transit">In Transit</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Approved">Approved</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                                        <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </div>
                                </div>
                            )}

                            {/* Filter Icon Button */}
                            <div className="flex justify-end xs:justify-start">
                                <button 
                                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center cursor-pointer hover:bg-gray-50 rounded-lg border border-gray-200"
                                    onClick={resetFilters}
                                    title="Reset all filters"
                                >
                                    <img src={filterIcon} alt="Filter" className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Search and Actions Row */}
                        <div className="pt-4 sm:pt-6">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                                {/* Search Field */}
                                <div className="relative w-full sm:w-auto flex-1">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <img src={search_icon} alt="Search" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                            onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                                            onBlur={handleSearchBlur}
                                            placeholder="Search..."
                                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        
                                        {/* Search Suggestions */}
                                        {showSuggestions && searchSuggestions.length > 0 && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                                                <ul className="py-1 max-h-60 overflow-auto">
                                                    {searchSuggestions.map((suggestion, index) => (
                                                        <li
                                                            key={index}
                                                            className="px-3 sm:px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-700 text-sm"
                                                            onClick={() => handleSuggestionClick(suggestion)}
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                <img src={search_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                <span>{suggestion}</span>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                    <button 
                                        onClick={handleExportToPDF}
                                        disabled={filteredData.length === 0}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        <img src={export_pdf} alt="PDF" className="w-5 h-5 sm:w-6 sm:h-6" />
                                        <span className="hidden xs:inline text-sm font-medium text-black">PDF</span>
                                    </button>

                                    <button 
                                        onClick={handleExportToExcel}
                                        disabled={filteredData.length === 0}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        <img src={export_excel} alt="Excel" className="w-5 h-5 sm:w-6 sm:h-6" />
                                        <span className="hidden xs:inline text-sm font-medium text-gray-700">Excel</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 px-3 xs:px-4 sm:px-6">
                        <nav className="flex flex-wrap gap-1 sm:gap-2" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('stock-summary')}
                                className={`px-2 xs:px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                                    activeTab === 'stock-summary'
                                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                Stock Summary
                            </button>
                            <button
                                onClick={() => setActiveTab('inventory-movement')}
                                className={`px-2 xs:px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                                    activeTab === 'inventory-movement'
                                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                Inventory Movement
                            </button>
                            <button
                                onClick={() => setActiveTab('low-stock')}
                                className={`px-2 xs:px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                                    activeTab === 'low-stock'
                                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                Low Stock
                            </button>
                            <button
                                onClick={() => setActiveTab('damage-discard')}
                                className={`px-2 xs:px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                                    activeTab === 'damage-discard'
                                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                Damage & Discard
                            </button>
                            <button
                                onClick={() => setActiveTab('transfer-history')}
                                className={`px-2 xs:px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                                    activeTab === 'transfer-history'
                                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                Transfer History
                            </button>
                        </nav>
                    </div>

                    {/* Table Title */}
                    <div className="px-3 xs:px-4 sm:px-6 py-2 sm:py-3">
                        <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900">
                            {activeTab === 'stock-summary' && 'PRODUCT LIST (MASTER INVENTORY)'}
                            {activeTab === 'inventory-movement' && 'INVENTORY MOVEMENT LOG'}
                            {activeTab === 'low-stock' && 'LOW STOCK ALERT'}
                            {activeTab === 'damage-discard' && 'DAMAGE & DISCARD RECORDS'}
                            {activeTab === 'transfer-history' && 'TRANSFER HISTORY'}
                        </h2>
                        {searchQuery && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                Showing {filteredData.length} of {getCurrentData().length} records for "{searchQuery}"
                            </p>
                        )}
                    </div>

                    {/* Table Content */}
                    <div className="mx-3 xs:mx-4 sm:mx-6 shadow rounded-xl overflow-hidden">
                        {renderTabContent()}
                    </div>

                    {/* Bulk Transfer Button */}
                    {showBulkTransfer && selectedProductIds.length > 0 && activeTab === 'stock-summary' && (
                        <div className="px-3 xs:px-4 sm:px-6 py-3 sm:py-4 bg-blue-50 border-t border-blue-200">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                <span className="text-xs sm:text-sm font-medium text-gray-700">
                                    {selectedProductIds.length} product(s) selected
                                </span>
                                <button
                                    onClick={handleBulkTransfer}
                                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                    Transfer Selected Products
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {filteredData.length > 0 && (
                        <div className="px-3 xs:px-4 sm:px-6 py-3 sm:py-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                                <div className="text-xs sm:text-sm text-gray-500">
                                    Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">
                                        {Math.min(endIndex, filteredData.length)}
                                    </span> of <span className="font-medium">{filteredData.length}</span> records
                                </div>
                                <div className="flex items-center flex-wrap justify-center gap-1 sm:gap-2">
                                    <button 
                                        onClick={handlePrevious}
                                        disabled={currentPage === 1}
                                        className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                                            currentPage === 1 
                                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                                                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                                        }`}
                                    >
                                        Prev
                                    </button>
                                    
                                    {getPageNumbers().map((pageNumber, index) => (
                                        typeof pageNumber === 'string' ? (
                                            <span key={`ellipsis-${index}`} className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-500">
                                                {pageNumber}
                                            </span>
                                        ) : (
                                            <button
                                                key={`page-${pageNumber}`}
                                                onClick={() => handlePageChange(pageNumber)}
                                                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                                                    currentPage === pageNumber
                                                        ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                                                        : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        )
                                    ))}
                                    
                                    <button 
                                        onClick={handleNext}
                                        disabled={currentPage === totalPages}
                                        className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                                            currentPage === totalPages 
                                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                                                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
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
        </DashboardLayout>
    );
}