// src/components/TransferStockModal.tsx
import { useState, useEffect } from 'react';
import { inventoryApi } from '../../../services/inventoryApi';
import { useGetBranchesQuery } from '../../../services/superAdminApi';

import exclaimation_icon from '../../../assets/icons/exclaimation_icon.svg';
import dashed_arrow from '../../../assets/icons/dashed_arrow.svg';
import dropdown_arrow_icon from '../../../assets/icons/dropdown_arrow_icon.svg';

interface TransferStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        id?: number;
        name: string;
        sku: string;
    } | null;
}

export default function TransferStockModal({ isOpen, onClose, product }: TransferStockModalProps) {
    const [fromLocation, setFromLocation] = useState('');
    const [toLocation, setToLocation] = useState('');
    const [movementType, setMovementType] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Get all branches
    const { data: branchesData = [] } = useGetBranchesQuery();
    const branches = Array.isArray(branchesData) ? branchesData : [];



    // Build query params - make product_id optional
    const queryParams: any = {
        page: currentPage,
    };

    if (fromLocation) queryParams.from_branch_id = fromLocation;
    if (toLocation) queryParams.to_branch_id = toLocation;
    if (movementType) queryParams.movement_type = movementType;
    if (product?.id) queryParams.product_id = product.id;

    // Use RTK Query to fetch movements
    const { data: movementsData, isLoading: movementsLoading } = inventoryApi.endpoints.getInventoryMovements.useQuery(
        queryParams,
        {
            skip: !isOpen, // Only skip if modal is closed, not if product.id is missing
        }
    );

    // Debug logs
    // console.log('🔍 Product:', product);
    // console.log('🔍 Query Params:', queryParams);
    // console.log('🔍 Movements Data:', movementsData);
    // console.log('🔍 Is Loading:', movementsLoading);
    // console.log('🔍 Error:', error);

    const movements = movementsData?.data?.data || [];
    const totalPages = movementsData?.data?.last_page || 1;
    const total = movementsData?.data?.total || 0;

    // Extract unique movement types from the data
    const uniqueMovementTypes = [...new Set(movements.map((m: any) => m.movement_type))];

    // Reset filters when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFromLocation('');
            setToLocation('');
            setMovementType('');
            setCurrentPage(1);
        }
    }, [isOpen]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [fromLocation, toLocation, movementType]);

    if (!isOpen || !product) return null;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-opacity-50 z-[60] transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[1200px] bg-white rounded-2xl shadow-2xl z-[70] flex flex-col h-[90vh]">
                {/* Header */}
                <div className="px-8 pt-6 shrink-0">
                    <h2 className="text-lg font-bold text-gray-900 text-center">VIEW INVENTORY</h2>
                    {product && (
                        <p className="text-sm text-gray-500 text-center mt-1">
                            {product.name} - SKU: {product.sku}
                            {product.id && ` (ID: ${product.id})`}
                        </p>
                    )}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Top Content - Filters */}
                    <div className="px-2 lg:px-8 py-4 lg:py-6 space-y-6 shrink-0">
                        <div className="px-2 lg:px-8 py-4 lg:py-6 space-y-6 shrink-0 bg-white">
                            {/* Transfer Section with Arrow */}
                            <div className="relative">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* From Location */}
                                    <div className="relative bg-white">
                                        <label className="block text-sm font-medium text-gray-600 mb-2">
                                            From Location
                                        </label>
                                        <select
                                            value={fromLocation}
                                            onChange={(e) => setFromLocation(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900 font-medium cursor-pointer"
                                        >
                                            <option value="">All Locations</option>
                                            {branches.map((branch: any) => (
                                                <option key={branch.id} value={branch.id}>
                                                    {branch.branch_name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 top-8 flex items-center pr-3 pointer-events-none">
                                            <img src={dropdown_arrow_icon} alt="" />
                                        </div>
                                    </div>

                                    {/* Arrow Column */}
                                    <div className="relative justify-center items-center hidden md:flex">
                                        <div className="absolute inset-y-0  top-6 flex items-center pr-3 pointer-events-none">
                                            <img src={dashed_arrow} alt="" />
                                        </div>
                                    </div>

                                    {/* To Location */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-600 mb-2">
                                            To Location
                                        </label>
                                        <select
                                            value={toLocation}
                                            onChange={(e) => setToLocation(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900 font-medium cursor-pointer"
                                        >
                                            <option value="">All Branches</option>
                                            {branches.map((branch: any) => (
                                                <option key={branch.id} value={branch.id}>
                                                    {branch.branch_name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 top-8 flex items-center pr-3 pointer-events-none">
                                            <img src={dropdown_arrow_icon} alt="" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Movement Type Filter */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div></div>

                                {/* Movement Type */}
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-600 mb-2">
                                        Movement Type
                                    </label>
                                    <select
                                        value={movementType}
                                        onChange={(e) => setMovementType(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900 font-medium cursor-pointer"
                                    >
                                        <option value="">All Types</option>
                                        {uniqueMovementTypes.length > 0 ? (
                                            uniqueMovementTypes.map((type: any) => (
                                                <option key={type} value={type}>
                                                    {type}
                                                </option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="Transfer">Transfer</option>
                                                <option value="Add Stock">Add Stock</option>
                                                <option value="Adjustment">Adjustment</option>
                                            </>
                                        )}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 top-8 flex items-center pr-3 pointer-events-none">
                                        <img src={dropdown_arrow_icon} alt="" />
                                    </div>
                                </div>

                                <div className="relative"></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start space-x-3 bg-[#F7F9FA] rounded-lg p-4 mx-12">
                        <div className="shrink-0 mt-0.5">
                            <img src={exclaimation_icon} alt="" />
                        </div>
                        <p className="text-sm text-gray-700">
                            {movementsLoading ? 'Loading movements...' : `✔ Found ${total} movement${total !== 1 ? 's' : ''}`}
                        </p>
                    </div>

                    {/* Movements Table */}
                    <div className="px-2 lg:px-8 py-4 lg:py-6">
                        {movementsLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : movements.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Movements Found</h3>
                                <p className="text-gray-500">No inventory movements found. Try adjusting your filters.</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">From</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">To</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Quantity</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Moved By</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
  {movements.map((movement: any) => (
    <tr key={movement.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDate(movement.movement_date)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {movement.product ? (
            movement.product.product_name || movement.product.name || 'Deleted Product'
          ) : (
            <span className="text-gray-400 italic">Product Deleted</span>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {movement.product?.sku || 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {movement.from_branch?.branch_name || movement.from_branch_name || 'Central Warehouse'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {movement.to_branch?.branch_name || movement.to_branch_name || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {movement.movement_type || 'Unknown'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
        {movement.quantity || 0}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {movement.moved_by?.name || movement.user?.name || '-'}
      </td>
    </tr>
  ))}
</tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-6">
                                        <div className="text-sm text-gray-700">
                                            Page {currentPage} of {totalPages}
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

            </div>
        </>
    );
}