// src/features/auth/pages/DashboardPage.tsx
import DashboardLayout from '../../../layouts/DashboardLayout';
import { useEffect, useRef, useState, useMemo } from 'react';

import {
    useGetBranchesQuery,
    useGetRolesQuery,
} from '../../../services/superAdminApi';

import {
    useGetEmployeesQuery,
    useMarkAttendanceMutation,
    useGetAttendanceByDateQuery,
    useMarkBulkAttendanceMutation
} from '../../../services/hrApi';

import dropdown_arrow_icon from '../../../assets/icons/dropdown_arrow_icon.svg';
import search_icon from '../../../assets/icons/search_icon.svg';
import filterIcon from '../../../assets/icons/filter_icon.svg';
import arrow_back_icon from '../../../assets/icons/arrow_back_icon.svg';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../../app/hooks';
import type { RootState } from '../../../app/store';

interface Employee {
    id: number;
    employee_id: string;
    name: string;
    role: { role_name: string } | null;
    branch: { branch_name: string; id: number } | null;
    department: string | null;
    is_active: boolean;
}

interface Branch {
    id: number;
    branch_name: string;
}

interface Role {
    id: number;
    role_name: string;
}

interface Attendance {
    id: number;
    user_id: number;
    branch_id: number;
    attendance_date: string;
    check_in: string | null;
    check_out: string | null;
    total_hours: number;
    status: string;
    device_id: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        employee_id: string;
        name: string;
        branch_id: number | null;
        department: string | null;
        role_id: number;
        is_active: boolean;
    };
    branch: {
        id: number;
        branch_name: string;
    } | null;
}

export default function DashboardPage() {
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
    const { user } = useAppSelector((state: RootState) => state.auth);
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [_open, setOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    const [customStartDate, setCustomStartDate] = useState("");
    const [_customEndDate, setCustomEndDate] = useState("");

    const [checkInTime, setCheckInTime] = useState('');
    const [checkOutTime, setCheckOutTime] = useState('');
    const [attendanceStatus, setAttendanceStatus] = useState('');
    const [notes, setNotes] = useState('');

    const [attendanceDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const {
        data: employeeResponse,
        isLoading: employeeLoading
    } = useGetEmployeesQuery();

    const employees = employeeResponse?.data?.data || [];
    console.log('emp: ', employees);

    const {
        data: branchesData = [],
        isLoading: branchesLoading,
        error: branchesError,
    } = useGetBranchesQuery();

    const branches = Array.isArray(branchesData) ? branchesData : [];

    const {
        data: rolesData = [],
        isLoading: rolesLoading,
        error: rolesError,
    } = useGetRolesQuery();

    const roles = Array.isArray(rolesData) ? rolesData : [];

    // Fetch attendance data
    const {
        data: attendanceResponse,
        isLoading: attendanceLoading,
        refetch: refetchAttendance
    } = useGetAttendanceByDateQuery({
        date: customStartDate || attendanceDate,
        branch_id: branches.find(b => b.branch_name === selectedBranch)?.id,
        page: currentPage,
        per_page: itemsPerPage
    }, {
        skip: !customStartDate && !attendanceDate
    });

    const attendanceRecords = attendanceResponse?.data?.data || [];
    const paginationInfo = attendanceResponse?.data;
    console.log('asdhjshdjsjd...', attendanceRecords)

    // Get employee attendance status
    const getEmployeeAttendance = (employeeId: number) => {
        return attendanceRecords.find((a: Attendance) => a.user_id === employeeId) || null;
    };

    // Filter employees based on all criteria
    const filteredEmployees = useMemo(() => {
        let filtered = employees;

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter((employee: Employee) =>
                employee.employee_id.toLowerCase().includes(query) ||
                employee.name.toLowerCase().includes(query)
            );
        }

        // Apply branch filter
        if (selectedBranch) {
            filtered = filtered.filter((employee: Employee) =>
                employee.branch?.branch_name === selectedBranch
            );
        }

        // Apply role filter
        if (selectedRole) {
            filtered = filtered.filter((employee: Employee) =>
                employee.role?.role_name === selectedRole
            );
        }

        return filtered;
    }, [searchQuery, selectedBranch, selectedRole, employees]);

    // Handle checkbox selection
    const handleProductSelect = (employeeId: number) => {
        setSelectedProductIds(prev => {
            if (prev.includes(employeeId)) {
                return prev.filter(id => id !== employeeId);
            } else {
                return [...prev, employeeId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedProductIds.length === filteredEmployees.length) {
            setSelectedProductIds([]);
        } else {
            setSelectedProductIds(filteredEmployees.map((e: Employee) => e.id));
        }
    };

    // Reset filters
    const handleResetFilters = () => {
        setSelectedBranch('');
        setSelectedRole('');
        setSearchQuery('');
        setCustomStartDate('');
        setCustomEndDate('');
        setCurrentPage(1);
    };

    // Check user role
    const isSuperAdmin = user?.role?.role_name === 'Super Admin';
    const isHR = user?.role?.role_name === 'HR';
    console.log('isHr', isHR);

    const basePath = isSuperAdmin
        ? '/admin'
        : isHR
            ? '/hr'
            : '';

    const [markAttendance, { isLoading: isMarking }] = useMarkAttendanceMutation();
    const [markBulkAttendance, { isLoading: isBulkMarking }] = useMarkBulkAttendanceMutation();

    const handleMarkAttendance = async () => {
        if (!selectedProductIds.length) {
            alert('Please select at least one employee');
            return;
        }

        if (!attendanceStatus) {
            alert('Please select attendance status');
            return;
        }

        if (!customStartDate && !attendanceDate) {
            alert('Please select a date');
            return;
        }

        try {
            if (selectedProductIds.length === 1) {
                const employee = employees.find((e: Employee) => e.id === selectedProductIds[0]);

                if (!employee) {
                    alert('Employee not found');
                    return;
                }

                const selectedBranchObj = branches.find((b: Branch) => b.branch_name === selectedBranch);
                const branchId = selectedBranchObj?.id || employee.branch?.id;

                if (!branchId) {
                    alert('Branch ID is required');
                    return;
                }

                const attendanceDateStr = customStartDate || attendanceDate;
                const formattedCheckIn = checkInTime ? checkInTime : null;
                const formattedCheckOut = checkOutTime ? checkOutTime : null;

                const attendancePayload = {
                    user_id: employee.id,
                    branch_id: branchId,
                    attendance_date: attendanceDateStr,
                    check_in: formattedCheckIn,
                    check_out: formattedCheckOut,
                    status: attendanceStatus,
                    notes: notes || null
                };

                console.log('Sending payload:', JSON.stringify(attendancePayload, null, 2));

                const response = await markAttendance(attendancePayload).unwrap();
                console.log('Success response:', response);

                alert('Attendance marked successfully');

                // Refresh and clear
                refetchAttendance();
                setSelectedProductIds([]);
                setCheckInTime('');
                setCheckOutTime('');
                setAttendanceStatus('');
                setNotes('');

            } else {
                const bulkPayload = selectedProductIds.map(id => {
                    const employee = employees.find((e: Employee) => e.id === id);
                    const selectedBranchObj = branches.find((b: Branch) => b.branch_name === selectedBranch);
                    const branchId = selectedBranchObj?.id || employee?.branch?.id;

                    return {
                        user_id: id,
                        branch_id: branchId,
                        attendance_date: customStartDate || attendanceDate,
                        check_in: checkInTime || null,
                        check_out: checkOutTime || null,
                        status: attendanceStatus,
                        notes: notes || null
                    };
                }).filter(payload => payload.branch_id);

                console.log('Sending bulk payload:', JSON.stringify(bulkPayload, null, 2));

                const response = await markBulkAttendance(bulkPayload).unwrap();
                console.log('Bulk success:', response);

                alert(`Attendance marked for ${bulkPayload.length} employees`);

                // Refresh and clear
                refetchAttendance();
                setSelectedProductIds([]);
                setCheckInTime('');
                setCheckOutTime('');
                setAttendanceStatus('');
                setNotes('');
            }
        } catch (error: any) {
            console.error('Full error object:', error);

            if (error.data) {
                console.error('Error data:', error.data);

                if (error.data.errors) {
                    const errorMessages = Object.entries(error.data.errors)
                        .map(([field, messages]) => `${field}: ${messages}`)
                        .join('\n');
                    alert(`Validation failed:\n${errorMessages}`);
                } else {
                    alert(`Error: ${JSON.stringify(error.data)}`);
                }
            } else if (error.error) {
                alert(`Error: ${error.error}`);
            } else {
                alert('Failed to mark attendance. Please try again.');
            }
        }
    };

    const isLoading = isMarking || isBulkMarking || attendanceLoading;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className='flex flex-row justify-between items-center'>
                    <Link to={`${basePath}/hr`} className='flex flex-row items-center'>
                        <img src={arrow_back_icon} alt="Back" className='w-6 h-6 md:w-8 md:h-8' />
                        <span className='px-2 font-semibold text-sm md:text-base'>Mark Attendance</span>
                    </Link>
                </div>

                {/* Products Table Section */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                    {/* Filters Row */}
                    <div className="md:p-6 p-2">
                        <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
                            {/* Date Filter */}
                            <div className="flex-1 min-w-50 relative">
                                <div
                                    onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
                                    className="w-full px-4 py-2.5 shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold bg-white pr-10 cursor-pointer flex items-center justify-between"
                                >
                                    <span>
                                        {customStartDate
                                            ? new Date(customStartDate).toLocaleDateString('en-GB')
                                            : "Select Date"}
                                    </span>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <img src={dropdown_arrow_icon} alt="" />
                                    </div>
                                </div>

                                {showCustomDatePicker && (
                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-4 w-[320px]">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-medium text-gray-900">
                                                    Select Date
                                                </h4>
                                                <button
                                                    onClick={() => {
                                                        setShowCustomDatePicker(false);
                                                        setCustomStartDate("");
                                                    }}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Attendance Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={customStartDate}
                                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    max={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>

                                            <div className="flex justify-end space-x-2 pt-2">
                                                <button
                                                    onClick={() => {
                                                        setCustomStartDate("");
                                                    }}
                                                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                                >
                                                    Clear
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowCustomDatePicker(false);
                                                    }}
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
                                        branches.map((branch: Branch) => (
                                            <option key={branch.id} value={branch.branch_name}>
                                                {branch.branch_name}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>No branches found</option>
                                    )}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <img src={dropdown_arrow_icon} alt="" />
                                </div>
                            </div>

                            {/* Role Filter */}
                            <div className="flex-1 min-w-50 relative">
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="w-full px-4 py-2.5 shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold appearance-none bg-white pr-10"
                                    disabled={!!rolesError}
                                >
                                    <option value="">All Roles</option>
                                    {rolesLoading ? (
                                        <option disabled>Loading roles...</option>
                                    ) : rolesError ? (
                                        <option disabled>Failed to load roles</option>
                                    ) : roles.length > 0 ? (
                                        roles.map((role: Role) => (
                                            <option key={role.id} value={role.role_name}>
                                                {role.role_name}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>No roles found</option>
                                    )}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <img src={dropdown_arrow_icon} alt="" />
                                </div>
                            </div>

                            {/* Filter Icon Button */}
                            <div className="shrink-0">
                                <button
                                    onClick={handleResetFilters}
                                    className="w-14 h-14 flex items-center justify-center cursor-pointer hover:bg-gray-50 rounded-lg"
                                >
                                    <img src={filterIcon} alt="Filter" className="w-7 h-7" />
                                </button>
                            </div>
                        </div>

                        {/* Search and Actions Row */}
                        <div className="pt-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="relative w-full sm:w-auto rounded-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <img src={search_icon} alt="Search" className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by Employee ID or Name"
                                        className="pl-10 pr-4 py-2.5 border border-[#00000080] rounded-full focus:border-blue-500 w-full sm:w-[360px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="text-sm text-gray-600">
                                    {customStartDate && (
                                        <span className="mr-4">
                                            Date: {new Date(customStartDate).toLocaleDateString('en-GB')}
                                        </span>
                                    )}
                                    Showing {filteredEmployees.length} employees
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="relative mx-2 md:mx-6 shadow rounded-xl mb-8">
                        <div className="px-6 py-3 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Attendance Records</h2>
                            {attendanceLoading && (
                                <span className="text-sm text-gray-500">Loading attendance...</span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
                            <div className="xl:col-span-4 overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-6 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={filteredEmployees.length > 0 && selectedProductIds.length === filteredEmployees.length}
                                                    onChange={handleSelectAll}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                />
                                            </th>
                                            <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                                EMP Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                                EMP ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                                ROLE
                                            </th>
                                            <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                                Branch
                                            </th>
                                            <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                                STATUS
                                            </th>
                                            <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                                CHECK-IN
                                            </th>
                                            <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                                CHECK-OUT
                                            </th>
                                            <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                                TOTAL HOURS
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {employeeLoading ? (
                                            <tr>
                                                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                                                    Loading employees...
                                                </td>
                                            </tr>
                                        ) : filteredEmployees.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="px-6 py-8 text-center">
                                                    <div className="text-gray-500 text-lg">
                                                        {searchQuery || selectedBranch || selectedRole ?
                                                            'No employees found matching your filters.' :
                                                            'No employees available.'
                                                        }
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredEmployees.map((employee: Employee) => {
                                                const attendance = getEmployeeAttendance(employee.id);
                                                const status = attendance?.status || 'Not Marked';

                                                return (
                                                    <tr key={employee.id} className="hover:bg-gray-50">
                                                        <td className="px-2 md:px-6 py-4 md:py-2 whitespace-nowrap">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedProductIds.includes(employee.id)}
                                                                onChange={() => handleProductSelect(employee.id)}
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="px-2 md:px-6 py-4 md:py-2 whitespace-nowrap">
                                                            <div className="text-[14px] font-medium text-gray-900">{employee.name}</div>
                                                        </td>
                                                        <td className="px-2 md:px-6 py-4 md:py-2 whitespace-nowrap">
                                                            <div className="text-[14px] text-gray-900 font-mono">{employee.employee_id}</div>
                                                        </td>
                                                        <td className="px-2 md:px-6 py-4 md:py-2 whitespace-nowrap">
                                                            <span className="inline-flex px-3 py-1 text-xs font-medium">
                                                                {employee.role?.role_name || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="px-2 md:px-6 py-4 md:py-2 whitespace-nowrap">
                                                            <div className="text-[14px] text-gray-900">{employee.branch?.branch_name || 'N/A'}</div>
                                                        </td>
                                                        <td className="px-2 md:px-6 py-4 md:py-2 whitespace-nowrap">
                                                            <div className={`text-[14px] font-medium ${status === 'Present' ? 'text-green-600' :
                                                                status === 'Absent' ? 'text-red-600' :
                                                                    status === 'Late' ? 'text-yellow-600' :
                                                                        status === 'Half Day' ? 'text-orange-600' :
                                                                            'text-gray-400'
                                                                }`}>
                                                                {status}
                                                            </div>
                                                        </td>
                                                        <td className="px-2 md:px-6 py-4 md:py-2 whitespace-nowrap">
                                                            <div className="text-[14px] text-gray-600">
                                                                {attendance?.check_in || '--:--'}
                                                            </div>
                                                        </td>
                                                        <td className="px-2 md:px-6 py-4 md:py-2 whitespace-nowrap">
                                                            <div className="text-[14px] text-gray-600">
                                                                {attendance?.check_out || '--:--'}
                                                            </div>
                                                        </td>
                                                        <td className="px-2 md:px-6 py-4 md:py-2 whitespace-nowrap">
                                                            <div className="text-[14px] text-gray-600">
                                                                {attendance?.total_hours ? `${attendance.total_hours} min` : '--'}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>


                        {/* Pagination */}
                        {paginationInfo && paginationInfo.last_page > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{paginationInfo.from}</span> to{' '}
                                        <span className="font-medium">{paginationInfo.to}</span> of{' '}
                                        <span className="font-medium">{paginationInfo.total}</span> results
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className={`px-3 py-1 rounded ${currentPage === 1
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
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginationInfo.last_page))}
                                            disabled={currentPage === paginationInfo.last_page}
                                            className={`px-3 py-1 rounded ${currentPage === paginationInfo.last_page
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

                    {/* Attendance Marking Form */}
                    <div className="bg-white rounded-xl p-4 md:p-6 my-4">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-md font-medium text-gray-400 mb-2">
                                        Employee ID
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                                        placeholder="Enter employee ID"
                                        value={selectedProductIds.length === 1 ?
                                            employees.find((e: Employee) => e.id === selectedProductIds[0])?.employee_id || '' :
                                            selectedProductIds.length > 1 ? 'Multiple selected' : ''}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-md font-medium text-gray-400 mb-2">
                                        Employee Name
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                                        placeholder="Employee name"
                                        value={selectedProductIds.length === 1 ?
                                            employees.find((e: Employee) => e.id === selectedProductIds[0])?.name || '' :
                                            selectedProductIds.length > 1 ? 'Multiple selected' : ''}
                                        readOnly
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-md font-medium text-gray-400 mb-2">
                                        Check-in Time
                                    </label>
                                    <input
                                        type="time"
                                        value={checkInTime}
                                        onChange={(e) => setCheckInTime(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-md font-medium text-gray-400 mb-2">
                                        Check-out Time
                                    </label>
                                    <input
                                        type="time"
                                        value={checkOutTime}
                                        onChange={(e) => setCheckOutTime(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-md font-medium text-gray-400 mb-2">
                                        Attendance Status
                                    </label>
                                    <select
                                        value={attendanceStatus}
                                        onChange={(e) => setAttendanceStatus(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">Select Status</option>
                                        <option value="Present">Present</option>
                                        <option value="Absent">Absent</option>
                                        <option value="Late">Late</option>
                                        <option value="Half Day">Half Day</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-md font-medium text-gray-400 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                                        placeholder="Add any notes..."
                                        rows={2}
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                                <div></div>
                                <button
                                    onClick={handleMarkAttendance}
                                    disabled={selectedProductIds.length === 0 || !attendanceStatus || isLoading}
                                    className={`w-full px-6 py-3 font-medium rounded-lg transition-colors cursor-pointer ${selectedProductIds.length > 0 && attendanceStatus && !isLoading
                                        ? 'text-black hover:text-white border border-[#6155F5] hover:bg-[#6155F5]'
                                        : 'text-gray-400 border border-gray-300 cursor-not-allowed'
                                        }`}
                                >
                                    {isLoading ? 'Saving...' : 'Save Attendance'}
                                </button>
                                <div></div>
                            </div>

                            {selectedProductIds.length > 0 && (
                                <div className="text-sm text-gray-600 text-center">
                                    Selected {selectedProductIds.length} employee(s) for attendance marking
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}