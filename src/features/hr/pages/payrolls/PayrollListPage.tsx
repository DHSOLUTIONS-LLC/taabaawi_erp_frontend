// src/features/hr/payrolls/PayrollListPage.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    useGetPayrollsQuery,
    useGetPayrollStatisticsQuery,
    useDeletePayrollMutation
} from '../../../../services/hrApi';
import { useGetBranchesQuery } from '../../../../services/superAdminApi';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';
import search_icon from '../../../../assets/icons/search_icon.svg';
import filterIcon from '../../../../assets/icons/filter_icon.svg';
import edit_icon from '../../../../assets/icons/edit_icon.svg';
import view_icon from '../../../../assets/icons/view-icon.png';
import delete_icon from '../../../../assets/icons/delete-icon.png';
import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';

interface Payroll {
    id: number;
    user_id: number;
    payroll_month: string;
    basic_salary: string;
    total_allowances: string;
    total_bonuses: string;
    total_deductions: string;
    net_salary: string;
    working_days: number;
    present_days: number;
    absent_days: number;
    leave_days: number;
    status: 'Draft' | 'Approved' | 'Paid';
    payment_date: string | null;
    user: {
        id: number;
        name: string;
        employee_id: string;
        department: string | null;
        role?: {
            role_name: string;
        };
    };
}

export default function PayrollListPage() {
    const { user } = useAppSelector((state: RootState) => state.auth);

    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    // Fix: Set default to empty string to show all months
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
    const [activeMenu, setActiveMenu] = useState<number | null>(null);
    // Fetch branches
    const { data: branchesData = [] } = useGetBranchesQuery();
    const branches = Array.isArray(branchesData) ? branchesData : [];

    useEffect(() => {
        const handleClickOutside = () => {
            setActiveMenu(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);
    // Fetch payrolls - only send month if selected
    const { data: payrollsResponse, isLoading, refetch } = useGetPayrollsQuery({
        ...(selectedMonth && { payroll_month: selectedMonth }),
        ...(selectedStatus && { status: selectedStatus }),
        page: currentPage,
        per_page: 15
    });

    // Fetch statistics - pass selected month or undefined for all
    const { data: statisticsResponse } = useGetPayrollStatisticsQuery({
        ...(selectedMonth && { payroll_month: selectedMonth })
    });

    // Debug logs
    useEffect(() => {
        console.log('Payrolls API Response:', payrollsResponse);
        console.log('Payrolls data:', payrollsResponse?.data);
        console.log('Payrolls array:', payrollsResponse?.data?.data);
    }, [payrollsResponse]);

    // Delete mutation
    const [deletePayroll, { isLoading: isDeleting }] = useDeletePayrollMutation();

    // Extract data with proper fallbacks
    const payrolls = payrollsResponse?.data?.data || [];
    const pagination = payrollsResponse?.data;
    const statistics = statisticsResponse?.data;

    console.log('stattistics: ,', statistics)
    // Filter payrolls based on search query
    const filteredPayrolls = searchQuery
        ? payrolls.filter((payroll: Payroll) =>
            payroll.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payroll.user?.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : payrolls;

    const formatCurrency = (value: string) => {
        return `KWD ${parseFloat(value).toFixed(3)}`;
    };

    const formatMonth = (month: string) => {
        const [year, monthNum] = month.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Draft': return 'bg-gray-100 text-gray-800';
            case 'Approved': return 'bg-green-100 text-green-800';
            case 'Paid': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deletePayroll(id).unwrap();
            setShowDeleteConfirm(null);
            refetch();
        } catch (error) {
            console.error('Failed to delete payroll:', error);
        }
    };

    const handleRowClick = (id: number) => {
        navigate(`${basePath}/hr/payrolls/${id}`);
    };

    // Generate month options with "All Months" option
    const monthOptions = [
        { value: '', label: 'All Months' },
        ...Array.from({ length: 12 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const value = date.toISOString().slice(0, 7);
            return {
                value,
                label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            };
        })
    ];

    // Check user role
    const isSuperAdmin = user?.role?.role_name === 'Super Admin';
    const isHR = user?.role?.role_name === 'HR';
    const basePath = isSuperAdmin ? '/admin' : isHR ? '' : '';

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <Link to={`${basePath}/hr`} className="flex flex-row items-center">
                        <img src={arrow_back_icon} alt="Back" className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                        <span className="px-2 font-semibold text-sm sm:text-base">Payroll Management</span>
                    </Link>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                        <Link to={`${basePath}/hr/payrolls/generate`} className="w-full sm:w-auto">
                            <button className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base">
                                Generate Payroll
                            </button>
                        </Link>
                        <Link to={`${basePath}/hr/payrolls/generate-bulk`} className="w-full sm:w-auto">
                            <button className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base">
                                Bulk Generate
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                {statistics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                        <div className="bg-white rounded-xl p-4 sm:p-6 ">
                            <p className="text-xs sm:text-sm text-gray-500 mb-2">Total Payrolls</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">{statistics.total_payrolls || 0}</p>
                            <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                <span className="text-gray-500">Draft: {statistics.draft || 0}</span>
                                <span className="text-green-500">Approved: {statistics.approved || 0}</span>
                                <span className="text-blue-500">Paid: {statistics.paid || 0}</span>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 sm:p-6 ">
                            <p className="text-xs sm:text-sm text-gray-500 mb-2">Total Basic Salary</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(statistics.total_basic_salary || '0')}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 sm:p-6 ">
                            <p className="text-xs sm:text-sm text-gray-500 mb-2">Total Allowances & Bonuses</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {formatCurrency((parseFloat(statistics.total_allowances || '0') + parseFloat(statistics.total_bonuses || '0')).toString())}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-4 sm:p-6 ">
                            <p className="text-xs sm:text-sm text-gray-500 mb-2">Total Net Salary</p>
                            <p className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(statistics.total_net_salary || '0')}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl p-4 sm:p-6  mb-6">
                    <div className="flex flex-col lg:flex-row flex-wrap gap-3 sm:gap-4">
                        {/* Month Filter */}
                        <div className="flex-1 min-w-[150px] relative">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg appearance-none bg-white pr-8 sm:pr-10 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                            >
                                {monthOptions.map(option => (
                                    <option key={option.value || 'all'} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                                <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="flex-1 min-w-[150px] relative">
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg appearance-none bg-white pr-8 sm:pr-10 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                            >
                                <option value="">All Status</option>
                                <option value="Draft">Draft</option>
                                <option value="Approved">Approved</option>
                                <option value="Paid">Paid</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                                <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                        </div>

                        {/* Branch Filter */}
                        <div className="flex-1 min-w-[150px] relative">
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg appearance-none bg-white pr-8 sm:pr-10 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                            >
                                <option value="">All Branches</option>
                                {branches.map((branch: any) => (
                                    <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                                <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                        </div>

                        {/* Filter Reset */}
                        <div className="shrink-0">
                            <button
                                onClick={() => {
                                    setSelectedMonth('');
                                    setSelectedStatus('');
                                    setSelectedBranch('');
                                    setSearchQuery('');
                                }}
                                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                                title="Reset Filters"
                            >
                                <img src={filterIcon} alt="Reset" className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="pt-3 sm:pt-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <img src={search_icon} alt="Search" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by employee name or ID..."
                                className="pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                            />
                        </div>
                    </div>
                </div>

                {/* Payroll Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Payroll Records {selectedMonth ? `- ${formatMonth(selectedMonth)}` : '(All Months)'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Total: {filteredPayrolls.length} payrolls
                        </p>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
                        <div className="xl:col-span-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Basic Salary</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allowances</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bonuses</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={12} className="px-6 py-8 text-center text-gray-500">
                                                <div className="flex justify-center items-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                                    <span className="ml-3">Loading payrolls...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredPayrolls.length === 0 ? (
                                        <tr>
                                            <td colSpan={12} className="px-6 py-8 text-center text-gray-500">
                                                No payroll records found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPayrolls.map((payroll: Payroll) => (
                                            <tr
                                                key={payroll.id}
                                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                                onClick={() => handleRowClick(payroll.id)}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {payroll.user?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {payroll.user?.employee_id || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {payroll.user?.department || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatMonth(payroll.payroll_month)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatCurrency(payroll.basic_salary)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                                    +{formatCurrency(payroll.total_allowances)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                                    +{formatCurrency(payroll.total_bonuses)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                                    -{formatCurrency(payroll.total_deductions)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                    {formatCurrency(payroll.net_salary)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {payroll.present_days}/{payroll.working_days}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payroll.status)}`}>
                                                        {payroll.status}
                                                    </span>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500" onClick={(e) => e.stopPropagation()}>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500" onClick={(e) => e.stopPropagation()}>
    <div className="relative">
        {/* Three Dots Button */}
        <button
            id={`menu-btn-${payroll.id}`}
            onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(activeMenu === payroll.id ? null : payroll.id);
            }}
            className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Actions"
        >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
        </button>

        {/* Dropdown Menu */}
        {activeMenu === payroll.id && (
            <>
                {/* Backdrop */}
                <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setActiveMenu(null)}
                />
                {/* Menu positioned relative to button with boundary detection */}
                <div 
                    className="fixed z-50 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
                    style={{
                        top: (() => {
                            const rect = document.getElementById(`menu-btn-${payroll.id}`)?.getBoundingClientRect();
                            const menuHeight = 150;
                            const spaceBelow = window.innerHeight - (rect?.bottom || 0);
                            // If not enough space below, show above
                            if (spaceBelow < menuHeight && (rect?.top || 0) > menuHeight) {
                                return (rect?.top || 0) - menuHeight + 'px';
                            }
                            return (rect?.bottom || 0) + 5 + 'px';
                        })(),
                        left: (() => {
                            const rect = document.getElementById(`menu-btn-${payroll.id}`)?.getBoundingClientRect();
                            const menuWidth = 192; // w-48 = 192px
                            const rightSpace = window.innerWidth - (rect?.right || 0);
                            // If not enough space on the right, align to the right edge
                            if (rightSpace < menuWidth) {
                                return (rect?.right || 0) - menuWidth + 'px';
                            }
                            return (rect?.right || 0) - menuWidth + 10 + 'px';
                        })(),
                    }}
                >
                    <div className="py-1">
                        <button
                            onClick={() => {
                                navigate(`${basePath}/hr/payrolls/${payroll.id}`);
                                setActiveMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                            <img src={view_icon} alt="View" className="w-4 h-4" />
                            View Details
                        </button>
                        
                        {payroll.status === 'Draft' && (
                            <>
                                <button
                                    onClick={() => {
                                        navigate(`${basePath}/hr/payrolls/${payroll.id}/edit`);
                                        setActiveMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                    <img src={edit_icon} alt="Edit" className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(payroll.id);
                                        setActiveMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <img src={delete_icon} alt="Delete" className="w-4 h-4" />
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </>
        )}
    </div>
</td>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>


                    {/* Pagination */}
                    {pagination && pagination.last_page > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing {pagination.from} to {pagination.to} of {pagination.total} results
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1 rounded transition-colors ${currentPage === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        Previous
                                    </button>
                                    <span className="px-3 py-1 bg-blue-500 text-white rounded">
                                        {currentPage}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.last_page))}
                                        disabled={currentPage === pagination.last_page}
                                        className={`px-3 py-1 rounded transition-colors ${currentPage === pagination.last_page
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this payroll record? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(showDeleteConfirm)}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}