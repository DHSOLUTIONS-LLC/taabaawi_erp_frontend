// src/features/inventory/components/Reportdamagemodal.tsx

import { useState, useEffect } from 'react';
import exclaimation_icon from '../../../assets/icons/exclaimation_icon.svg';
import dropdown_arrow_icon from '../../../assets/icons/dropdown_arrow_icon.svg';
import { useCreateStockTransferMutation, useGetProductStockQuery } from '../../../services/inventoryApi';
import { useGetBranchesQuery } from '../../../services/superAdminApi';


interface ReportDamageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    product: {
        id: number;
        name: string;
        branch: string;
        branch_id: number;
        quantity: number;
        sku?: string;
    } | null;
}

interface BranchStock {
    branch_id: number;
    branch_name: string;
    branch_type: string;
    quantity: number;
    reserved: number;
    available: number;
    reorder_point?: number;
    last_updated?: string;
}

// Destination branch types that are valid targets for damage transfers
// const DESTINATION_BRANCH_TYPES = ['Repair', 'Discard', 'Waste', 'Scrap', 'Damaged'];


export default function ReportDamageModal({ isOpen, onClose, onSuccess, product }: ReportDamageModalProps) {
    const [damagedQuantity, setDamagedQuantity] = useState('1');
    const [damageReason, setDamageReason] = useState('Physical Damage');
    const [sourceBranchId, setSourceBranchId] = useState<number | ''>('');
    const [destinationBranchId, setDestinationBranchId] = useState<number | ''>('');
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    const [branchStock, setBranchStock] = useState<BranchStock[]>([]);
    const [destinationBranches, setDestinationBranches] = useState<BranchStock[]>([]);
    const [selectedBranchMaxQty, setSelectedBranchMaxQty] = useState<number>(0);

    // Fetch product stock data — returns ALL branches including discard/repair
    const { data: stockData, isLoading: stockLoading } = useGetProductStockQuery(
        product?.id || 0,
        { skip: !product?.id || !isOpen }
    );


    // Stock transfer mutation
    const [createStockTransfer, { isLoading: isTransferring }] = useCreateStockTransferMutation();

    // Process stock data when received
    useEffect(() => {
        if (stockData?.data && product) {
            console.log('Product stock data:', stockData.data);

            const stockByBranch = stockData.data.stock_by_branch || [];
            console.log('stock by branch', stockByBranch)

            // Source branches: exclude Repair and Discard branches
            const sourceBranches: BranchStock[] = stockByBranch
                .filter((item: any) => {
                    const branchType = item.branch_type || '';
                    return item.quantity > 0 &&
                        branchType !== 'Repair' &&
                        branchType !== 'Discard';
                })
                .map((item: any) => ({
                    branch_id: item.branch_id,
                    branch_name: item.branch_name,
                    branch_type: item.branch_type,
                    quantity: item.quantity || 0,
                    reserved: item.reserved || 0,
                    available: item.available ?? item.quantity ?? 0,
                }));

            // Destination branches: ONLY Repair and Discard branches
            const destBranches: BranchStock[] = stockByBranch
                .filter((item: any) => {
                    const branchType = item.branch_type || '';
                    return branchType === 'Repair' || branchType === 'Discard';
                })
                .map((item: any) => ({
                    branch_id: item.branch_id,
                    branch_name: item.branch_name,
                    branch_type: item.branch_type,
                    quantity: item.quantity || 0,
                    reserved: item.reserved || 0,
                    available: item.available ?? item.quantity ?? 0,
                }));

            console.log('Source branches:', sourceBranches);
            console.log('Destination branches:', destBranches);

            setBranchStock(sourceBranches);
            setDestinationBranches(destBranches);

            // Auto-select the source branch matching the product context
            if (sourceBranches.length > 0) {
                const matchingBranch = sourceBranches.find(
                    (b) => b.branch_id === product.branch_id
                );
                if (matchingBranch) {
                    setSourceBranchId(matchingBranch.branch_id);
                    setSelectedBranchMaxQty(matchingBranch.available);
                } else {
                    setSourceBranchId(sourceBranches[0].branch_id);
                    setSelectedBranchMaxQty(sourceBranches[0].available);
                }
            }

            // Auto-select destination if only one option exists
            if (destBranches.length === 1) {
                setDestinationBranchId(destBranches[0].branch_id);
            } else if (destBranches.length > 1) {
                // If both Repair and Discard exist, maybe default to Repair
                const repairBranch = destBranches.find(b => b.branch_type === 'Repair');
                if (repairBranch) {
                    setDestinationBranchId(repairBranch.branch_id);
                }
            }
        }
    }, [stockData, product]);


    const { data: branchesData } = useGetBranchesQuery();
    const allBranches = branchesData || [];

    useEffect(() => {
        if (stockData?.data && product) {
            console.log('Product stock data:', stockData.data);

            const stockByBranch = stockData.data.stock_by_branch || [];

            // Source branches: branches that have this product in stock
            const sourceBranches: BranchStock[] = stockByBranch
                .filter((item: any) => {
                    const branchType = item.branch_type || '';
                    return item.quantity > 0 &&
                        branchType !== 'Repair' &&
                        branchType !== 'Discard';
                })
                .map((item: any) => ({
                    branch_id: item.branch_id,
                    branch_name: item.branch_name,
                    branch_type: item.branch_type,
                    quantity: item.quantity || 0,
                    reserved: item.reserved || 0,
                    available: item.available ?? item.quantity ?? 0,
                }));

            // Destination branches: Get ALL Repair and Discard branches from the branches list
            const destBranches: BranchStock[] = allBranches
                .filter((branch: any) =>
                    branch.branch_type === 'Repair' || branch.branch_type === 'Discard'
                )
                .map((branch: any) => ({
                    branch_id: branch.id,
                    branch_name: branch.branch_name,
                    branch_type: branch.branch_type,
                    quantity: 0,  // These branches typically have zero stock
                    reserved: 0,
                    available: 0,
                }));

            console.log('Source branches:', sourceBranches);
            console.log('Destination branches:', destBranches);

            setBranchStock(sourceBranches);
            setDestinationBranches(destBranches);

            // Auto-select the source branch matching the product context
            if (sourceBranches.length > 0) {
                const matchingBranch = sourceBranches.find(
                    (b) => b.branch_id === product.branch_id
                );
                if (matchingBranch) {
                    setSourceBranchId(matchingBranch.branch_id);
                    setSelectedBranchMaxQty(matchingBranch.available);
                } else {
                    setSourceBranchId(sourceBranches[0].branch_id);
                    setSelectedBranchMaxQty(sourceBranches[0].available);
                }
            }

            // Auto-select destination if only one option exists
            if (destBranches.length === 1) {
                setDestinationBranchId(destBranches[0].branch_id);
            } else if (destBranches.length > 1) {
                // If both Repair and Discard exist, maybe default to Repair
                const repairBranch = destBranches.find(b => b.branch_type === 'Repair');
                if (repairBranch) {
                    setDestinationBranchId(repairBranch.branch_id);
                }
            }
        }
    }, [stockData, product, allBranches]);


    // Update max quantity when source branch changes
    useEffect(() => {
        if (sourceBranchId) {
            const selectedBranch = branchStock.find(b => b.branch_id === sourceBranchId);
            const maxQty = selectedBranch?.available || 0;
            setSelectedBranchMaxQty(maxQty);

            const currentQty = parseInt(damagedQuantity);
            if (selectedBranch && currentQty > maxQty) {
                setDamagedQuantity(maxQty.toString());
            }
        }
    }, [sourceBranchId, branchStock]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setDamagedQuantity('1');
            setDamageReason('Physical Damage');
            setSourceBranchId('');
            setDestinationBranchId('');
            setError(null);
            setValidationErrors({});
            setBranchStock([]);
            setDestinationBranches([]);
            setSelectedBranchMaxQty(0);
        }
    }, [isOpen]);

    if (!isOpen || !product) return null;

    const handleReportDamage = async () => {
        setError(null);
        setValidationErrors({});

        if (!sourceBranchId) {
            setError('Please select the branch where the damaged items are located.');
            return;
        }

        if (!destinationBranchId) {
            setError('Please select the destination branch (Discard or Repair).');
            return;
        }

        if (sourceBranchId === destinationBranchId) {
            setError('Source and destination branches cannot be the same.');
            return;
        }

        const quantity = parseInt(damagedQuantity);
        if (isNaN(quantity) || quantity <= 0) {
            setError('Please enter a valid quantity.');
            return;
        }

        if (quantity > selectedBranchMaxQty) {
            setError(
                `Cannot report more than available quantity (${selectedBranchMaxQty} units) in the selected branch.`
            );
            return;
        }

        try {
            const requestBody = {
                from_branch_id: sourceBranchId as number,
                to_branch_id: destinationBranchId as number,
                transfer_type: 'Warehouse-to-Branch',
                notes: damageReason,
                items: [
                    {
                        product_id: product.id,
                        variant_id: null,
                        quantity: quantity,  // ← correct field name per API spec
                        notes: damageReason,
                    },
                ],
            };

            console.log('Stock transfer payload:', JSON.stringify(requestBody, null, 2));

            const response = await createStockTransfer(requestBody).unwrap();

            console.log('Stock transfer response:', response);

            alert(`Successfully transferred ${quantity} unit(s) of ${product.name} as damaged.`);

            if (onSuccess) onSuccess();
            onClose();

        } catch (err: any) {
            console.error('Stock transfer error — status:', err?.status);
            console.error('Stock transfer error — data:', JSON.stringify(err?.data, null, 2));

            if (err?.data) {
                const { message, errors, error: singleError } = err.data;

                // Laravel-style validation errors: { errors: { field: ['msg', ...] } }
                if (errors && typeof errors === 'object') {
                    setValidationErrors(errors);
                    const errorMessages = Object.entries(errors)
                        .map(([field, messages]) =>
                            `${field}: ${(messages as string[]).join(', ')}`
                        )
                        .join('\n');
                    setError(errorMessages);
                } else if (message) {
                    setError(message);
                } else if (typeof singleError === 'string') {
                    setError(singleError);
                } else {
                    // Fallback: dump raw response so nothing is silently swallowed
                    setError(`Server responded with: ${JSON.stringify(err.data)}`);
                }
            } else {
                setError('Failed to report damaged item. Please try again.');
            }
        }
    };

    const selectedSourceBranch = branchStock.find(b => b.branch_id === sourceBranchId);
    const selectedDestBranch = destinationBranches.find(b => b.branch_id === destinationBranchId);

    const getDestLabel = (type: string) => {
        const lower = type?.toLowerCase();
        if (lower === 'discard') return 'Discard';
        if (lower === 'repair') return 'Repair';
        return type;
    };

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-opacity-50 z-60 transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95%] sm:w-[90%] md:w-[85%] lg:w-[80%] max-w-200 bg-white rounded-2xl shadow-2xl z-[70] flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-4 sm:px-6 md:px-8 pt-4 sm:pt-5 md:pt-6 shrink-0">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 text-center uppercase">
                        Report Damaged Item
                    </h2>
                </div>

                {/* Content — Scrollable */}
                <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 space-y-4 sm:space-y-5 md:space-y-6 overflow-y-auto flex-1">

                    {/* Info Alert */}
                    <div className="flex items-start space-x-2 sm:space-x-3 bg-[#F7F9FA] rounded-lg p-3 sm:p-4">
                        <div className="shrink-0 mt-0.5">
                            <img src={exclaimation_icon} alt="!" className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <p className="text-xs sm:text-sm text-gray-700">
                            Select the source branch where damaged items are located, then choose
                            whether to transfer them to <strong>Discard</strong> or{' '}
                            <strong>Repair</strong>. Stock will be deducted automatically.
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                            <p className="text-xs sm:text-sm text-red-600 whitespace-pre-line">{error}</p>
                        </div>
                    )}

                    <div className="space-y-3 sm:space-y-4">

                        {/* Product + Total Stock */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="bg-white shadow p-3 rounded-lg">
                                <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                                    Product
                                </label>
                                <input
                                    type="text"
                                    value={product.name}
                                    readOnly
                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium text-sm sm:text-base"
                                />
                                {product.sku && (
                                    <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>
                                )}
                            </div>

                            <div className="bg-white shadow p-3 rounded-lg">
                                <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                                    Total Stock Available
                                </label>
                                <input
                                    type="text"
                                    value={stockData?.data?.total_available ?? product.quantity}
                                    readOnly
                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        {/* From Branch + To Branch */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {/* FROM — branches carrying this product */}
                            <div className="relative bg-white p-3 rounded-lg shadow">
                                <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                                    From Branch <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={sourceBranchId}
                                    onChange={(e) =>
                                        setSourceBranchId(e.target.value ? Number(e.target.value) : '')
                                    }
                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white text-gray-900 font-medium cursor-pointer text-sm sm:text-base"
                                    disabled={stockLoading || branchStock.length === 0}
                                    required
                                >
                                    <option value="">
                                        {stockLoading
                                            ? 'Loading branches...'
                                            : branchStock.length === 0
                                                ? 'No branches with stock'
                                                : 'Select source branch'}
                                    </option>
                                    {branchStock.map((branch) => (
                                        <option key={branch.branch_id} value={branch.branch_id}>
                                            {branch.branch_name} — {branch.branch_type} ({branch.available} Items)
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 top-6 sm:top-8 flex items-center pr-3 pointer-events-none">
                                    <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
                                </div>
                            </div>

                            {/* TO — only Discard / Repair branches */}
                            <div className="relative bg-white p-3 rounded-lg shadow">
                                <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                                    To Branch <span className="text-red-500">*</span>
                                    <span className="ml-1 text-xs text-gray-400">(Discard / Repair)</span>
                                </label>
                                <select
                                    value={destinationBranchId}
                                    onChange={(e) =>
                                        setDestinationBranchId(
                                            e.target.value ? Number(e.target.value) : ''
                                        )
                                    }
                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white text-gray-900 font-medium cursor-pointer text-sm sm:text-base"
                                    disabled={stockLoading || destinationBranches.length === 0}
                                    required
                                >
                                    <option value="">
                                        {stockLoading
                                            ? 'Loading...'
                                            : destinationBranches.length === 0
                                                ? 'No discard / repair branches'
                                                : 'Select destination'}
                                    </option>
                                    {destinationBranches.map((branch) => (
                                        <option key={branch.branch_id} value={branch.branch_id}>
                                            {branch.branch_name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 top-6 sm:top-8 flex items-center pr-3 pointer-events-none">
                                    <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
                                </div>
                            </div>
                        </div>

                        {/* Source Branch Stock Details */}
                        {selectedSourceBranch && (
                            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                                <h4 className="text-xs sm:text-sm font-medium text-blue-800 mb-1 sm:mb-2">
                                    Source Branch Stock Details
                                </h4>
                                <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
                                    <div>
                                        <span className="text-blue-600">Total:</span>
                                        <span className="ml-2 font-semibold">{selectedSourceBranch.quantity}</span>
                                    </div>
                                    <div>
                                        <span className="text-blue-600">Available:</span>
                                        <span className="ml-2 font-semibold">{selectedSourceBranch.available}</span>
                                    </div>
                                    <div>
                                        <span className="text-blue-600">Reserved:</span>
                                        <span className="ml-2 font-semibold">{selectedSourceBranch.reserved}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quantity + Damage Reason */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="bg-white shadow p-3 rounded-lg">
                                <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                                    Damaged Quantity <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={damagedQuantity}
                                    onChange={(e) => setDamagedQuantity(e.target.value)}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 font-medium text-sm sm:text-base"
                                    min="1"
                                    max={selectedBranchMaxQty}
                                    disabled={!sourceBranchId}
                                />
                                {sourceBranchId && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Max available in this branch: {selectedBranchMaxQty} units
                                    </p>
                                )}
                                {validationErrors['items.0.requested_quantity'] && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {validationErrors['items.0.requested_quantity'][0]}
                                    </p>
                                )}
                            </div>

                            <div className="relative bg-white p-3 rounded-lg shadow">
                                <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                                    Damage Reason <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={damageReason}
                                    onChange={(e) => setDamageReason(e.target.value)}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white text-gray-900 font-medium cursor-pointer text-sm sm:text-base"
                                >
                                    <option>Physical Damage</option>
                                    <option>Water Damage</option>
                                    <option>Manufacturing Defect</option>
                                    <option>Expired Product</option>
                                    <option>Customer Return</option>
                                    <option>Other</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 top-6 sm:top-8 flex items-center pr-3 pointer-events-none">
                                    <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
                                </div>
                                {validationErrors.damage_type && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {validationErrors.damage_type[0]}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Transfer Summary */}
                        {selectedSourceBranch && selectedDestBranch && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
                                <h4 className="text-xs sm:text-sm font-medium text-orange-800 mb-1 sm:mb-2">Transfer Summary</h4>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700">
                                    <span className="font-semibold">{selectedSourceBranch.branch_name}</span>
                                    <span className="text-orange-500 font-bold">→</span>
                                    <span className="font-semibold">
                                        {getDestLabel(selectedDestBranch.branch_type)} — {selectedDestBranch.branch_name}
                                    </span>
                                    {damagedQuantity && parseInt(damagedQuantity) > 0 && (
                                        <>
                                            <span className="text-orange-400">·</span>
                                            <span><strong>{damagedQuantity}</strong> unit(s)</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Reported Date */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs sm:text-sm text-gray-600">
                                <span className="font-medium">Reported Date:</span>{' '}
                                {new Date().toLocaleDateString()}
                            </p>
                        </div>

                        {/* All Source Branches Summary */}
                        {branchStock.length > 0 && (
                            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                                <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Stock by Branch:</h4>
                                <div className="space-y-1 sm:space-y-2 max-h-32 overflow-y-auto">
                                    {branchStock.map((branch) => (
                                        <div key={branch.branch_id} className="flex justify-between text-xs sm:text-sm">
                                            <span className="text-gray-600">{branch.branch_name}:</span>
                                            <span className="font-medium">
                                                {branch.available} available / {branch.quantity} total
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 border-t border-gray-200 shrink-0 bg-white rounded-b-2xl">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <button
                            onClick={onClose}
                            disabled={isTransferring}
                            className="px-4 sm:px-6 py-2 sm:py-3 bg-[#1773CF33] cursor-pointer text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReportDamage}
                            disabled={isTransferring || !sourceBranchId || !destinationBranchId}
                            className="px-4 sm:px-6 py-2 sm:py-3 bg-[#F5AC68] cursor-pointer text-black font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
                        >
                            {isTransferring ? (
                                <>
                                    <svg
                                        className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-black"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12" cy="12" r="10"
                                            stroke="currentColor" strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Transferring...
                                </>
                            ) : (
                                'Report Damage'
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </>
    );
}