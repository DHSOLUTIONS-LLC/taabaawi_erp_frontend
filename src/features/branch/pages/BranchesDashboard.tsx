import React, { useState } from 'react';
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

const BranchesDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Fetch branches
    const { data: branchesData, isLoading, refetch } = useGetBranchesQuery({
        page: currentPage,
        per_page: 10,
        search: searchTerm || undefined,
        branch_type: filterType || undefined,
        is_active: filterStatus ? filterStatus === 'active' : undefined,
        with_users_count: true,
    });

    // Add console log to see what you're getting

    // Fetch statistics
    const { data: statsData } = useGetBranchStatisticsQuery();

    // Mutations
    const [deleteBranch] = useDeleteBranchMutation();
    const [changeStatus] = useChangeBranchStatusMutation();

    const branches =
        // If response is { data: { data: [...] } } (paginated)
        (branchesData?.data?.data) ||
        // If response is { data: [...] } (non-paginated)  
        (branchesData?.data) ||
        // If response is directly the array
        branchesData ||
        [];

    const pagination = !Array.isArray(branchesData) && (branchesData as any)?.data?.current_page
        ? (branchesData as any).data
        : null;

    console.log('Branches API response:', branchesData);
    console.log('Extracted branches:', branches);

    const totalPages = pagination?.last_page || 1;
    const stats = statsData?.data;

    console.log('branches', branches)

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this branch?')) {
            try {
                await deleteBranch(id).unwrap();
                refetch();
            } catch (error) {
                console.error('Failed to delete branch', error);
            }
        }
    };

    const handleStatusToggle = async (id: number, currentStatus: boolean) => {
        try {
            await changeStatus({ id, is_active: !currentStatus }).unwrap();
            refetch();
        } catch (error) {
            console.error('Failed to change status', error);
        }
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            Warehouse: 'bg-purple-100 text-purple-800',
            Retail: 'bg-green-100 text-green-800',
            'B2B': 'bg-blue-100 text-blue-800',
            'E-Commerce': 'bg-indigo-100 text-indigo-800',
            Repair: 'bg-yellow-100 text-yellow-800',
            Discard: 'bg-red-100 text-red-800',
            Marketing: 'bg-pink-100 text-pink-800',
            Expo: 'bg-orange-100 text-orange-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    const StatCard = ({ title, value, icon, color }: any) => (
        <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <div className={`p-3 rounded-full ${color}`}>
                    <span className="text-white text-xl">{icon}</span>
                </div>
            </div>
        </div>
    );


      const { user } = useAppSelector((state: RootState) => state.auth);
    
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Branches Management</h1>
                        <p className="text-gray-600 mt-1">Manage all your branches and locations</p>
                    </div>
                    <Link
                        to={`${basePath}/branches/new`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        + New Branch
                    </Link>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <StatCard title="Total Branches" value={stats.total_branches} icon="🏢" color="bg-blue-500" />
                        <StatCard title="Active Branches" value={stats.active_branches} icon="✅" color="bg-green-500" />
                        <StatCard title="With POS" value={stats.branches_with_pos} icon="💳" color="bg-purple-500" />
                        <StatCard title="Temporary" value={stats.temporary_branches} icon="⏳" color="bg-orange-500" />
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Search branches..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md"
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
                            className="px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterType('');
                                setFilterStatus('');
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Branches Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Features</th>
                                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th> */}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (branches as any)?.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                            No branches found
                                        </td>
                                    </tr>
                                ) : (
                                    (branches as any)?.map((branch: any) => (
                                        <tr key={branch.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{branch.branch_name}</div>
                                                <div className="text-xs text-gray-500">{branch.address?.substring(0, 30)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(branch.branch_type)}`}>
                                                    {branch.branch_type}
                                                </span>
                                                {branch.is_temporary && (
                                                    <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                                        Temp
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">{branch.phone || '-'}</div>
                                                <div className="text-xs text-gray-500">{branch.email || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex space-x-1">
                                                    {branch.has_pos && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">POS</span>}
                                                    {branch.has_inventory && <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded">INV</span>}
                                                    {branch.has_cash_bank && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">CASH</span>}
                                                </div>
                                            </td>
                                            {/* <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                          {branch.users_count || 0}
                        </span>
                      </td> */}
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleStatusToggle(branch.id, branch.is_active)}
                                                    className={`px-2 py-1 text-xs font-medium rounded-full ${branch.is_active
                                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                        }`}
                                                >
                                                    {branch.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => navigate(`${basePath}/branches/edit/${branch.id}`)}
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(branch.id)}
                                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
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
                        <div className="flex items-center justify-between px-6 py-3 border-t">
                            <div className="text-sm text-gray-500">
                                Page {currentPage} of {totalPages}
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md">
                                    {currentPage}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
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