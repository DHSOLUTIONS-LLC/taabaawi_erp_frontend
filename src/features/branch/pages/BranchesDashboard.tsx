import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout';
import { Link, useNavigate } from 'react-router-dom';
import {
    useGetBranchesQuery,
    useGetBranchStatisticsQuery,
    useDeleteBranchMutation,
    useChangeBranchStatusMutation,
} from '../../../services/branchApi';
import { useAppSelector } from '../../../app/hooks';
import type { RootState } from '../../../app/store';
import { Building2, CheckCircle, CreditCard, Clock, Search, X } from 'lucide-react';

const BranchesDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterType, filterStatus]);

    // Fetch branches with filters
    const { data: branchesData, isLoading, refetch, isFetching } = useGetBranchesQuery({
        page: currentPage,
        per_page: 10,
        search: searchTerm || undefined,
        branch_type: filterType || undefined,
        is_active: filterStatus === 'active' ? true : (filterStatus === 'inactive' ? false : undefined),
        with_users_count: true,
    });

    // Fetch statistics
    const { data: statsData, refetch: refetchStats } = useGetBranchStatisticsQuery();

    // Mutations
    const [deleteBranch] = useDeleteBranchMutation();
    const [changeStatus] = useChangeBranchStatusMutation();

    // Extract branches data from response
    const branches: any[] = Array.isArray(branchesData?.data?.data)
        ? branchesData.data.data
        : Array.isArray(branchesData?.data)
            ? branchesData.data
            : Array.isArray(branchesData)
                ? branchesData
                : [];


    const filteredBranches = branches.filter((branch: any) => {
        const matchesSearch =
            !searchTerm ||
            branch.branch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            branch.phone?.includes(searchTerm) ||
            branch.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType =
            !filterType || branch.branch_type === filterType;

        const matchesStatus =
            !filterStatus ||
            (filterStatus === 'active' && branch.is_active) ||
            (filterStatus === 'inactive' && !branch.is_active);

        return matchesSearch && matchesType && matchesStatus;
    });

    const pagination = branchesData?.data?.current_page ? branchesData.data : null;
    const totalPages = pagination?.last_page || 1;

    const stats = statsData?.data;

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this branch?')) {
            try {
                await deleteBranch(id).unwrap();
                await refetch();
                await refetchStats();
            } catch (error) {
                console.error('Failed to delete branch', error);
                alert('Failed to delete branch. Please try again.');
            }
        }
    };

    const handleStatusToggle = async (id: number, currentStatus: boolean) => {
        try {
            await changeStatus({ id, is_active: !currentStatus }).unwrap();
            await refetch();
            await refetchStats();
        } catch (error) {
            console.error('Failed to change status', error);
            alert('Failed to change branch status. Please try again.');
        }
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            Warehouse: 'bg-purple-100 text-purple-800',
            Retail: 'bg-green-100 text-green-800',
            B2B: 'bg-blue-100 text-blue-800',
            'E-Commerce': 'bg-indigo-100 text-indigo-800',
            Repair: 'bg-yellow-100 text-yellow-800',
            Discard: 'bg-red-100 text-red-800',
            Marketing: 'bg-pink-100 text-pink-800',
            Expo: 'bg-orange-100 text-orange-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <div className={`p-3 rounded-full ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );

    const { user } = useAppSelector((state: RootState) => state.auth);
    const isSuperAdmin = user?.role?.role_name === 'Super Admin';
    const basePath = isSuperAdmin ? '/admin' : '';

    const clearAllFilters = () => {
        setSearchTerm('');
        setFilterType('');
        setFilterStatus('');
    };

    const hasActiveFilters = searchTerm || filterType || filterStatus;

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Branches Management</h1>
                        <p className="text-sm text-gray-600 mt-1">Manage all your branches and locations</p>
                    </div>
                    <Link
                        to={`${basePath}/branches/new`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-center sm:text-left"
                    >
                        + New Branch
                    </Link>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                        <StatCard
                            title="Total Branches"
                            value={stats.total_branches}
                            icon={Building2}
                            color="bg-blue-500"
                        />
                        <StatCard
                            title="Active Branches"
                            value={stats.active_branches}
                            icon={CheckCircle}
                            color="bg-green-500"
                        />
                        <StatCard
                            title="With POS"
                            value={stats.branches_with_pos}
                            icon={CreditCard}
                            color="bg-purple-500"
                        />
                        <StatCard
                            title="Temporary"
                            value={stats.temporary_branches}
                            icon={Clock}
                            color="bg-orange-500"
                        />
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by name, phone, or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">All Types</option>
                            <option value="Warehouse">Warehouse</option>
                            <option value="Retail">Retail</option>
                            <option value="B2B">B2B</option>
                            <option value="E-Commerce">E-Commerce</option>
                            <option value="Repair">Repair</option>
                            <option value="Discard">Discard</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Expo">Expo</option>
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                            >
                                <X className="w-4 h-4" />
                                Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Active Filters Display */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                            <span className="text-xs text-gray-500">Active filters:</span>
                            {searchTerm && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                    Search: {searchTerm}
                                    <button onClick={() => setSearchTerm('')} className="hover:text-blue-900">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            {filterType && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                                    Type: {filterType}
                                    <button onClick={() => setFilterType('')} className="hover:text-green-900">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            {filterStatus && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">
                                    Status: {filterStatus === 'active' ? 'Active' : 'Inactive'}
                                    <button onClick={() => setFilterStatus('')} className="hover:text-purple-900">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Branches Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Features
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading || isFetching ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-500">Loading branches...</p>
                                        </td>
                                    </tr>
                                ) : filteredBranches.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center">
                                            <div className="text-gray-500">
                                                <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                                <p>No branches found</p>
                                                {hasActiveFilters && (
                                                    <button
                                                        onClick={clearAllFilters}
                                                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                                                    >
                                                        Clear all filters
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBranches?.map((branch: any) => (
                                        <tr key={branch.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{branch.branch_name}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {branch.address?.substring(0, 50)}
                                                    {branch.address?.length > 50 && '...'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(branch.branch_type)}`}>
                                                        {branch.branch_type}
                                                    </span>
                                                    {branch.is_temporary && (
                                                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                                            Temporary
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {branch.phone && (
                                                    <div className="text-sm text-gray-900">{branch.phone}</div>
                                                )}
                                                {branch.email && (
                                                    <div className="text-xs text-gray-500 mt-1">{branch.email}</div>
                                                )}
                                                {!branch.phone && !branch.email && (
                                                    <span className="text-xs text-gray-400">No contact info</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {branch.has_pos && (
                                                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                                                            POS
                                                        </span>
                                                    )}
                                                    {branch.has_inventory && (
                                                        <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded font-medium">
                                                            Inventory
                                                        </span>
                                                    )}
                                                    {branch.has_cash_bank && (
                                                        <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded font-medium">
                                                            Cash/Bank
                                                        </span>
                                                    )}
                                                    {!branch.has_pos && !branch.has_inventory && !branch.has_cash_bank && (
                                                        <span className="text-xs text-gray-400">No features</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleStatusToggle(branch.id, branch.is_active)}
                                                    className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${branch.is_active
                                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                        }`}
                                                >
                                                    {branch.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={() => navigate(`${basePath}/branches/edit/${branch.id}`)}
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(branch.id)}
                                                        className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-3">
                            <div className="text-sm text-gray-500">
                                Showing page {currentPage} of {totalPages}
                                {filteredBranches?.length > 0 && ` • ${filteredBranches.length} branches`}
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1 || isLoading}
                                    className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    Previous
                                </button>
                                <div className="flex space-x-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`px-3 py-1 text-sm rounded-md transition-colors ${currentPage === pageNum
                                                        ? 'bg-blue-600 text-white'
                                                        : 'border hover:bg-gray-50'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || isLoading}
                                    className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default BranchesDashboard;