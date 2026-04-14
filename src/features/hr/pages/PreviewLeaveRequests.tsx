// src/features/auth/pages/DashboardPage.tsx
import DashboardLayout from '../../../layouts/DashboardLayout';
import { useState } from 'react';

import dropdown_arrow_icon from '../../../assets/icons/dropdown_arrow_icon.svg';
import arrow_down_dropdown from '../../../assets/icons/dropdown_arrow_icon.svg';
import search_icon from '../../../assets/icons/search_icon.svg';
import filterIcon from '../../../assets/icons/filter_icon.svg';
import export_pdf from '../../../assets/icons/export_pdf.svg';
import export_excel from '../../../assets/icons/export_excel.svg';
import tick_icon from '../../../assets/icons/tick_icon_1.svg';
import cross_icon from '../../../assets/icons/cross_icon.svg';
import {
    useGetLeaveRequestsQuery,
    useApproveLeaveRequestMutation,
    useRejectLeaveRequestMutation,
    useGetLeaveTypesQuery
} from '../../../services/hrApi';
import { useGetBranchesQuery } from '../../../services/superAdminApi';
import { toast } from 'react-toastify';

export default function DashboardPage() {
    // const [selectedRequestIds, setSelectedRequestIds] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
    const [branchFilter, _setBranchFilter] = useState('');


    const [selectedBranch, setSelectedBranch] = useState<string>('');

    // Custom date picker states
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // API Hooks
    const { data: leaveRequestsData, isLoading, refetch } = useGetLeaveRequestsQuery();
    const {
        data: branchesData = [],
        isLoading: branchesLoading,
        error: branchesError,
    } = useGetBranchesQuery();


    const { data: leaveTypesData } = useGetLeaveTypesQuery();
    const [approveLeaveRequest, { isLoading: isApproving }] = useApproveLeaveRequestMutation();
    const [rejectLeaveRequest, { isLoading: isRejecting }] = useRejectLeaveRequestMutation();

    // Extract data from API responses
    const leaveRequests = leaveRequestsData?.data?.data || [];
    const branches = Array.isArray(branchesData) ? branchesData : [];
    const leaveTypes = leaveTypesData?.data || [];

    // Filter leave requests based on filters
    const filteredRequests = leaveRequests.filter((request: any) => {
        const matchesSearch = searchTerm === '' ||
            request.user?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === '' ||
            statusFilter === 'Status' ||
            request.status === statusFilter;

        const matchesLeaveType = leaveTypeFilter === '' ||
            leaveTypeFilter === 'Leave Type' ||
            request.leave_type?.id?.toString() === leaveTypeFilter;

        const matchesBranch = branchFilter === '' ||
            branchFilter === 'All Branches' ||
            request.user?.branch?.id?.toString() === branchFilter;

        // Date filter logic
        let matchesDate = true;
        if (customStartDate && customEndDate) {
            const requestStartDate = new Date(request.start_date);
            const filterStartDate = new Date(customStartDate);
            const filterEndDate = new Date(customEndDate);
            matchesDate = requestStartDate >= filterStartDate && requestStartDate <= filterEndDate;
        }

        return matchesSearch && matchesStatus && matchesLeaveType && matchesBranch && matchesDate;
    });

    // const handleRequestSelect = (requestId: number) => {
    //     setSelectedRequestIds(prev => {
    //         if (prev.includes(requestId)) {
    //             return prev.filter(id => id !== requestId);
    //         } else {
    //             return [...prev, requestId];
    //         }
    //     });
    // };

    // const handleSelectAll = () => {
    //     if (selectedRequestIds.length === filteredRequests.length) {
    //         setSelectedRequestIds([]);
    //     } else {
    //         setSelectedRequestIds(filteredRequests.map((r: any) => r.id));
    //     }
    // };

    const handleApprove = async (requestId: number) => {
        try {
            const result = await approveLeaveRequest(requestId).unwrap();

            if (result.success) {
                toast.success(result.message || 'Leave request approved successfully!');
                refetch();
            }
        } catch (error: any) {
            const errorMessage = error?.data?.message || 'Failed to approve leave request';
            toast.error(errorMessage);
            console.error('Error approving leave request:', error);
        }
    };

    const handleReject = async (requestId: number) => {
        const rejection_reason = prompt('Please enter rejection reason:');

        if (!rejection_reason) {
            toast.warning('Rejection reason is required');
            return;
        }

        try {
            //  Fixed: changed to rejection_reason
            const result = await rejectLeaveRequest({
                id: requestId,
                rejection_reason: rejection_reason  // Backend expects 'reason' field
            }).unwrap();

            if (result.success) {
                toast.success(result.message || 'Leave request rejected successfully!');
                refetch();
            }
        } catch (error: any) {
            const errorMessage = error?.data?.message || 'Failed to reject leave request';
            toast.error(errorMessage);
            console.error('Error rejecting leave request:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDisplayDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-50 text-yellow-700';
            case 'Approved':
                return 'bg-green-50 text-green-700';
            case 'Rejected':
                return 'bg-red-50 text-red-700';
            case 'Cancelled':
                return 'bg-gray-50 text-gray-700';
            default:
                return 'bg-blue-50 text-blue-700';
        }
    };

    const handleApplyDateFilter = () => {
        if (customStartDate && customEndDate) {
            setShowCustomDatePicker(false);
        } else {
            toast.warning('Please select both start and end dates');
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Filters Row */}
                <div className="p-2 md:p-6">
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
                        {/* Custom Date Picker */}
                        <div className="flex-1 min-w-50 relative">
                            {/* Trigger Field */}
                            <div
                                onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
                                className="w-full px-4 py-2.5 shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold bg-white pr-10 cursor-pointer flex items-center justify-between"
                            >
                                <span>
                                    {customStartDate && customEndDate
                                        ? `${formatDisplayDate(customStartDate)} - ${formatDisplayDate(customEndDate)}`
                                        : "Date"}
                                </span>

                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <img src={dropdown_arrow_icon} alt="" />
                                </div>
                            </div>

                            {/* Custom Date Picker Dropdown */}
                            {showCustomDatePicker && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-4 w-[320px]">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-medium text-gray-900">
                                                Select Date Range
                                            </h4>
                                            <button
                                                onClick={() => {
                                                    setShowCustomDatePicker(false);
                                                }}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        {/* Dates in One Row */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Start Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={customStartDate}
                                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    End Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={customEndDate}
                                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                                    min={customStartDate}
                                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Buttons */}
                                        <div className="flex justify-end space-x-2 pt-2">
                                            <button
                                                onClick={() => {
                                                    setCustomStartDate("");
                                                    setCustomEndDate("");
                                                }}
                                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                            >
                                                Clear
                                            </button>

                                            <button
                                                onClick={handleApplyDateFilter}
                                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Branch Filter */}
                        <div className="flex-1 min-w-50 relative">
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="w-full px-4 py-2.5 shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold appearance-none bg-white pr-10"
                                disabled={branchesLoading || !!branchesError}
                            >
                                <option value="">All Branches</option>
                                {branchesLoading ? (
                                    <option disabled>Loading branches...</option>
                                ) : branchesError ? (
                                    <option disabled>Failed to load branches</option>
                                ) : branches.length > 0 ? (
                                    branches.map((branch: any) => (
                                        <option key={branch.id} value={branch.branch_name}>
                                            {branch.branch_name}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>No branches found</option>
                                )}
                            </select>

                            {/* Custom dropdown arrow */}
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <img src={arrow_down_dropdown} alt="" />
                            </div>
                        </div>

                        {/* Leave Type Filter */}
                        <div className="flex-1 min-w-50 relative">
                            <select
                                className="w-full px-4 py-2.5 shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold appearance-none bg-white pr-10"
                                value={leaveTypeFilter}
                                onChange={(e) => setLeaveTypeFilter(e.target.value)}
                            >
                                <option value="">Leave Type</option>
                                {leaveTypes.map((type: any) => (
                                    <option key={type.id} value={type.id}>
                                        {type.leave_type_name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <img src={dropdown_arrow_icon} alt="" />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="flex-1 min-w-50 relative">
                            <select
                                className="w-full px-4 py-2.5 shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold appearance-none bg-white pr-10"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <img src={dropdown_arrow_icon} alt="" />
                            </div>
                        </div>

                        {/* Filter Icon Button */}
                        <div className="shrink-0">
                            <button className="w-14 h-14 flex items-center justify-center cursor-pointer">
                                <img src={filterIcon} alt="Filter" className="w-7 h-7" />
                            </button>
                        </div>
                    </div>

                    {/* Search and Actions Row */}
                    <div className="pt-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            {/* Search Field */}
                            <div className="relative w-full sm:w-auto rounded-full ">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <img src={search_icon} alt="Search" className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Employee ID or Name"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 border border-[#00000080] rounded-full focus:border-blue-500 w-full sm:w-[360px]"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex md:flex-row flex-col items-center md:space-x-3 w-full sm:w-auto">
                                <button className="flex items-center justify-center space-x-2 md:px-4 py-2.5 my-2 border border-gray-300 rounded-lg cursor-pointer transition-colors w-full sm:w-auto">
                                    <img src={export_pdf} alt="Add" className="w-7 h-7" />
                                    <span className="text-lg font-medium text-black">Export PDF</span>
                                </button>

                                <button className="flex items-center justify-center space-x-2 px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer transition-colors w-full sm:w-auto">
                                    <img src={export_excel} alt="Export" className="w-7 h-7" />
                                    <span className="text-lg font-medium text-gray-700">Export Excel</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="relative mx-2 md:mx-6 shadow rounded-xl overflow-hidden">
                    <div className="px-6 py-3">
                        <h2 className="text-xl font-bold text-gray-900">Leave Requests</h2>
                    </div>
                    {/* Table */}
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
                        <div className="xl:col-span-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr className="bg-gray-50">
                                        {/* <th className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedRequestIds.length === filteredRequests.length && filteredRequests.length > 0}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                        />
                                    </th> */}
                                        <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                            Request ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                            Emp Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                            Emp ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                            Leave Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                            From
                                        </th>
                                        <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                            To
                                        </th>
                                        <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                            Days
                                        </th>
                                        <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {/*  Show spinner inside table */}
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={11} className="px-6 py-16 text-center">
                                                <div className="flex justify-center items-center">
                                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                                                No leave requests found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRequests.map((request: any) => (
                                            <tr key={request.id} className="hover:bg-gray-50">
                                                {/* <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRequestIds.includes(request.id)}
                                                    onChange={() => handleRequestSelect(request.id)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td> */}

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-[14px] font-semibold text-gray-900">
                                                        REQ-{String(request.id).padStart(3, '0')}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                                            <span className="text-sm font-semibold text-gray-600">
                                                                {request.user?.name?.charAt(0).toUpperCase() || 'U'}
                                                            </span>
                                                        </div>
                                                        <div className="text-[14px] font-medium text-gray-900">
                                                            {request.user?.name || 'N/A'}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-[14px] text-gray-900 font-mono">
                                                        {request.user?.employee_id || 'N/A'}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-[14px] text-gray-900">
                                                        {request.user?.role?.role_name || 'N/A'}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg">
                                                        {request.leave_type?.leave_type_name || 'N/A'}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-[14px] font-medium text-gray-900">
                                                        {formatDate(request.start_date)}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-[14px] font-medium text-gray-900">
                                                        {formatDate(request.end_date)}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-[14px] font-bold text-gray-900">
                                                        {request.total_days} days
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-lg ${getStatusColor(request.status)}`}>
                                                        {request.status}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {request.status === 'Pending' ? (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleApprove(request.id)}
                                                                disabled={isApproving}
                                                                className="w-8 h-8 flex items-center justify-center text-green-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                                                title="Approve"
                                                            >
                                                                <img src={tick_icon} alt="Approve" />
                                                            </button>

                                                            <button
                                                                onClick={() => handleReject(request.id)}
                                                                disabled={isRejecting}
                                                                className="w-8 h-8 flex items-center justify-center text-red-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                                                title="Reject"
                                                            >
                                                                <img src={cross_icon} alt="Reject" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-gray-400">
                                                            {request.status}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}