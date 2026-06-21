// src/features/auth/pages/EmployeeDashboardPage.tsx
import DashboardLayout from '../../../layouts/DashboardLayout';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useGetBranchesQuery,
} from '../../../services/superAdminApi';

import { useGetEmployeesQuery, useGetDashboardStatisticsQuery } from '../../../services/hrApi'


import dropdown_arrow_icon from '../../../assets/icons/dropdown_arrow_icon.svg';
import AttendanceChart from '../components/radialchart';
import arrow_down_dropdown from '../../../assets/icons/dropdown_arrow_icon.svg'
import filterIcon from '../../../assets/icons/filter_icon.svg'
import search_icon from '../../../assets/icons/search_icon.svg'
import export_pdf from '../../../assets/icons/export_pdf.svg'
import export_excel from '../../../assets/icons/export_excel.svg'
import back_icon from '../../../assets/icons/back_icon.svg'
import payrolls from '../../../assets/icons/payrolls.png'
import bonuses_icon from '../../../assets/icons/bonuses.png'
import user_icon from '../../../assets/icons/user_icon.svg'
import add_icon from '../../../assets/icons/add.svg'
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../../app/hooks';
import type { RootState } from '../../../app/store';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from 'jspdf';

interface Employee {
    id: number;
    employee_id: string;
    name: string;
    role: { role_name: string } | null;
    branch: { branch_name: string } | null;
    department: string | null;
    is_active: boolean;
}

// interface Category {
//     id: number;
//     category_name: string;
//     parent_id: number | null;
//     description: string | null;
//     image: string | null;
//     is_active: boolean;
//     created_at: string;
//     updated_at: string;
//     deleted_at: string | null;
//     parent: any | null;
//     children: any[];
// }

// interface CategoryResponse {
//     success: boolean;
//     data: {
//         current_page: number;
//         data: Category[];
//         first_page_url: string;
//         from: number;
//         last_page: number;
//         last_page_url: string;
//         links: Array<{ url: string | null; label: string; active: boolean }>;
//         next_page_url: string | null;
//         path: string;
//         per_page: number;
//         prev_page_url: string | null;
//         to: number;
//         total: number;
//     };
// }

export default function EmployeeDashboardPage() {
    const { user } = useAppSelector((state: RootState) => state.auth);
    const navigate = useNavigate();



    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");




    // Check user role
    const isSuperAdmin = user?.role?.role_name === 'Super Admin';
    const isHR = user?.role?.role_name === 'HR';
    // console.log('is hr: ', isHR)

    const basePath = isSuperAdmin
        ? '/admin'
        : isHR
            ? ''
            : '';

    // Fetch categories from API
    // const { data: categoriesResponse, isLoading: categoriesLoading, error: categoriesError } = useGetCategoriesQuery();

    // Extract categories from the nested response structure
    // const categories: Category[] = (categoriesResponse as CategoryResponse)?.data?.data || [];
    // console.log('categories:', categories)
    // Fetch branches from API
    const {
        data: branchesData = [],
        isLoading: branchesLoading,
        error: branchesError,
    } = useGetBranchesQuery();

    const branches = Array.isArray(branchesData) ? branchesData : [];


    const {
        data: employeeResponse,
        isLoading: employeeLoading
    } = useGetEmployeesQuery();

    const employees = employeeResponse?.data?.data || []
    console.log('emp: ', employees)

    const handleRowClick = (requestId: number) => {
        navigate(`${basePath}/hr/leave_requests/${requestId}`);
    };


    const {
        data: statisticsResponse,
    } = useGetDashboardStatisticsQuery();


    const dashboardStatistics = statisticsResponse?.data || []
    console.log('statistics:', dashboardStatistics)


    const [attendanceData, setAttendanceData] = useState({ active: 0, onLeave: 0, absent: 0 });

    useEffect(() => {
        if (employees.length > 0) {
            const active = employees.filter((e: Employee) => e.is_active === true).length;
            const inactive = employees.filter((e: Employee) => e.is_active === false).length;
            setAttendanceData({
                active: active,
                onLeave: 0,
                absent: inactive
            })
        }
    }, [employees])



    // Search, suggestions, and pagination states
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    // Filter states
    const [_selectedDate, setSelectedDate] = useState<string>('');
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [_selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');

    // Filter employees based on all criteria
    const filteredEmployees = useMemo(() => {
        let filtered = employees;

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter((employee: Employee) =>
                employee.employee_id.toLowerCase().includes(query) ||
                employee.name.toLowerCase().includes(query) ||
                employee.role?.role_name.toLowerCase().includes(query) ||
                employee.branch?.branch_name?.toLowerCase().includes(query) ||
                employee.department?.toLowerCase().includes(query) ||
                (employee.is_active ? 'Active' : 'Inactive').toLowerCase().includes(query)
            );
        }

        // Apply branch filter
        if (selectedBranch) {
            filtered = filtered.filter((employee: Employee) => employee.branch?.branch_name === selectedBranch);
        }

        // Apply status filter
        if (selectedStatus) {
            filtered = filtered.filter((employee: Employee) =>
                selectedStatus === 'Active' ? employee.is_active === true : employee.is_active === false
            );
        }

        return filtered;
    }, [searchQuery, selectedBranch, selectedStatus, employees]);

    // Calculate pagination
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredEmployees.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useMemo(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedBranch, selectedStatus]);

    // Get search suggestions
    const searchSuggestions = useMemo(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) return [];

        const query = searchQuery.toLowerCase().trim();
        const suggestions = new Set<string>();

        employees.forEach((employee: Employee) => {
            if (employee.employee_id.toLowerCase().includes(query)) {
                suggestions.add(employee.employee_id);
            }
            if (employee.name.toLowerCase().includes(query)) {
                suggestions.add(employee.name);
            }
            if (employee.role?.role_name.toLowerCase().includes(query)) {
                suggestions.add(employee.role?.role_name);
            }
            if (employee.branch?.branch_name.toLowerCase().includes(query)) {
                suggestions.add(employee.branch?.branch_name);
            }
            if ((employee.department ?? '').toLowerCase().includes(query)) {
                suggestions.add(employee.department ?? '');
            }
        });

        return Array.from(suggestions).slice(0, 5);
    }, [searchQuery, employees]);

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
            // Export all filtered employees, not just current page
            const exportData = filteredEmployees.map((employee: Employee) => ({
                'Employee ID': employee.employee_id,
                'Name': employee.name,
                'Role': employee.role,
                'Branch': employee.branch,
                'Department': employee.department,
                'Status': employee.is_active,
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const maxWidth = exportData.reduce((w: number, r: Record<string, string>) => Math.max(w, Object.keys(r).reduce((a, k) => Math.max(a, k.length), 0)), 10);
            worksheet['!cols'] = Array(Object.keys(exportData[0] || {}).length).fill({ wch: maxWidth });

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees Report');

            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
            });

            const filename = `employees_report_${new Date().toISOString().split('T')[0]}`;
            saveAs(blob, `${filename}.xlsx`);

        } catch (error) {
            console.error('Excel export failed:', error);
            alert('Failed to export to Excel. Please try again.');
        }
    };

    // Export to PDF function
    const handleExportToPDF = () => {
        if (filteredEmployees.length === 0) {
            alert('No employees to export');
            return;
        }

        try {
            const doc = new jsPDF('landscape', 'mm', 'a4');
            const marginLeft = 10;
            const marginTop = 20;
            let yPos = marginTop;

            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('EMPLOYEES REPORT', 148.5, yPos, { align: 'center' });
            yPos += 10;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, marginLeft, yPos);
            doc.text(`Total Employees: ${filteredEmployees.length}`, 280, yPos, { align: 'right' });
            yPos += 5;

            const activeCount = filteredEmployees.filter((e: Employee) => e.is_active ? 'Active' : 'Inactive').length;
            const onLeaveCount = filteredEmployees.filter((e: Employee) => e.is_active ? 'Active' : 'Inactive').length;
            const inactiveCount = filteredEmployees.filter((e: Employee) => e.is_active ? 'Active' : 'Inactive').length;
            doc.text(`Active: ${activeCount} | On Leave: ${onLeaveCount} | Inactive: ${inactiveCount}`, marginLeft, yPos);
            yPos += 8;

            doc.setDrawColor(200, 200, 200);
            doc.line(marginLeft, yPos, 287, yPos);
            yPos += 10;

            // Define column widths for 6 columns
            const colWidths = [30, 40, 40, 40, 40, 30];
            const headers = ['Employee ID', 'Name', 'Role', 'Branch', 'Department', 'Status'];

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255);
            doc.setFillColor(59, 130, 246);

            let xPos = marginLeft;
            headers.forEach((header, index) => {
                doc.rect(xPos, yPos, colWidths[index], 8, 'F');
                const cellCenter = xPos + (colWidths[index] / 2);
                doc.text(header, cellCenter, yPos + 5.5, { align: 'center' });
                xPos += colWidths[index];
            });

            yPos += 8;
            doc.setTextColor(0);
            doc.setFont('helvetica', 'normal');

            filteredEmployees.forEach((employee: Employee, rowIndex: number) => {
                if (yPos > 190) {
                    doc.addPage('landscape');
                    yPos = marginTop;

                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(255);
                    doc.setFillColor(59, 130, 246);
                    xPos = marginLeft;
                    headers.forEach((header, index) => {
                        doc.rect(xPos, yPos, colWidths[index], 8, 'F');
                        const cellCenter = xPos + (colWidths[index] / 2);
                        doc.text(header, cellCenter, yPos + 5.5, { align: 'center' });
                        xPos += colWidths[index];
                    });
                    yPos += 8;
                    doc.setTextColor(0);
                    doc.setFont('helvetica', 'normal');
                }

                if (rowIndex % 2 === 0) {
                    doc.setFillColor(248, 248, 248);
                    xPos = marginLeft;
                    colWidths.forEach(width => {
                        doc.rect(xPos, yPos, width, 8, 'F');
                        xPos += width;
                    });
                }

                xPos = marginLeft;
                const rowData = [
                    employee.employee_id,
                    employee.name,
                    employee.role?.role_name,
                    employee.branch?.branch_name,
                    employee.department,
                    employee.is_active
                ];

                doc.setFontSize(9);
                rowData.forEach((cell, index) => {
                    let text = String(cell);
                    const maxWidth = colWidths[index] - 4;

                    while (doc.getTextWidth(text) > maxWidth && text.length > 3) {
                        text = text.substring(0, text.length - 4) + '...';
                    }

                    const align = index === 5 ? 'center' : 'left';
                    const xOffset = align === 'center' ? colWidths[index] / 2 : 2;

                    if (align === 'center') {
                        doc.text(text, xPos + xOffset, yPos + 5.5, { align: 'center' });
                    } else {
                        doc.text(text, xPos + 2, yPos + 5.5);
                    }
                    xPos += colWidths[index];
                });

                yPos += 8;
            });

            // Add page numbers
            const pageCount = doc.internal.pages.length;
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Page ${i} of ${pageCount}`, 148.5, 205, { align: 'center' });
            }

            const filename = `employees_report_${new Date().toISOString().split('T')[0]}`;
            doc.save(`${filename}.pdf`);

        } catch (error) {
            console.error('PDF export failed:', error);
            alert('Failed to export to PDF. Please try again.');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active':
                return 'text-blue-600';
            case 'On Leave':
                return 'text-green-600';
            case 'Inactive':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    // Function to handle percentage change from slider
    const handlePercentageChange = (percentage: number) => {
        const total = attendanceData.active + attendanceData.onLeave + attendanceData.absent;
        const newActive = Math.round((percentage / 100) * total);
        const remaining = total - newActive;
        const newOnLeave = Math.round(remaining * 0.3);
        const newAbsent = remaining - newOnLeave;

        setAttendanceData({
            active: newActive,
            onLeave: newOnLeave,
            absent: newAbsent
        });
    };

    return (
        <DashboardLayout>
            <div className="space-y-4 sm:space-y-6">
                {/* First Row - Stats */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-2 lg:gap-6">
                    {/* Left Column - Circular Graph Card */}
                    <div className="lg:col-span-6 bg-white rounded-lg p-2 sm:p-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-0">
                            {/* LEFT CONTENT */}
                            <div className="flex flex-col gap-3 p-4 sm:p-6 md:p-8 lg:p-12 order-2 sm:order-1">
                                <div className="flex items-center justify-between gap-4 sm:gap-6">
                                    <span className="text-sm sm:text-[16px] text-[#87AFF9] font-medium">Active</span>
                                    <span className="text-gray-900 font-semibold text-sm sm:text-[16px]"> {employees.filter((e: Employee) => e.is_active).length} </span>
                                </div>

                                <div className="flex items-center justify-between gap-4 sm:gap-6">
                                    <span className="text-sm sm:text-[16px] text-[#AEE9BD] font-medium">On Leave</span>
                                    <span className="text-gray-900 font-semibold text-sm sm:text-[16px]">{dashboardStatistics.on_leave_today || 0}</span>
                                </div>

                                <div className="flex items-center justify-between gap-4 sm:gap-6">
                                    <span className="text-sm sm:text-[16px] text-[#F6C8BA] font-medium">Absent</span>
                                    <span className="text-gray-900 font-semibold text-sm sm:text-[16px]">{employees.filter((e: Employee) => !e.is_active).length}</span>
                                </div>
                            </div>

                            {/* RIGHT CHART */}
                            <div className="flex justify-center sm:justify-end order-1 sm:order-2">
                                <AttendanceChart
                                    data={attendanceData}
                                    onValueChange={handlePercentageChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Info Cards */}
                    <div className="lg:col-span-6 space-y-4 sm:space-y-6 md:space-y-8">
                        {/* First Row - 2 Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 xl:gap-6">
                            {/* Total Employees Card */}
                            <div className="bg-white rounded-lg p-4 sm:p-5 md:p-6">
                                <p className="text-gray-500 text-base sm:text-lg font-medium mb-12 sm:mb-16 md:mb-20">Total Employees</p>
                                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">{dashboardStatistics.total_employees || 0}</p>
                            </div>

                            {/* Present Today Card */}
                            <div className="bg-white rounded-lg p-4 sm:p-5 md:p-6">
                                <p className="text-gray-500 text-base sm:text-lg font-medium mb-12 sm:mb-16 md:mb-20">Present Today</p>
                                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">{dashboardStatistics.present_today || 0}</p>
                            </div>
                        </div>

                        {/* Second Row - 3 Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 lg:gap-8">
                            {/* Pending Leave Requests Card */}
                            <div className="bg-white rounded-lg p-4 sm:p-5 md:p-6">
                                <p className="text-gray-500 text-base sm:text-lg font-medium mb-12 sm:mb-16 md:mb-20">Pending Leave Requests</p>
                                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{dashboardStatistics.pending_leave_requests || 0}</p>
                            </div>

                            {/* On Leave Today Card */}
                            <div className="bg-white rounded-lg p-4 sm:p-5 md:p-6">
                                <p className="text-gray-500 text-base sm:text-lg font-medium mb-12 sm:mb-16 md:mb-20">On Leave Today</p>
                                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{dashboardStatistics.on_leave_today || 0}</p>
                            </div>

                            {/* Absent Card */}
                            <div className="bg-white rounded-lg p-4 sm:p-5 md:p-6">
                                <p className="text-gray-500 text-base sm:text-lg font-medium mb-12 sm:mb-16 md:mb-20">Absent</p>
                                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600">{dashboardStatistics.absent_today || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Second Row - Table and Action Buttons */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-2 lg:gap-6">
                    {/* Left Column - Employee Table (10/12) */}
                    <div className="lg:col-span-10 bg-white rounded-lg p-4 sm:p-5 md:p-6 overflow-x-auto">
                        {/* Filters Section */}
                        <div className="py-3 sm:py-4 md:py-6">
                            <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 sm:gap-4">
                                {/* Date Filter */}
                                <div className="flex-1 min-w-[150px] sm:min-w-[180px] relative">
                                    <div
                                        onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold bg-white pr-8 sm:pr-10 cursor-pointer flex items-center justify-between text-sm sm:text-base"
                                    >
                                        <span className="truncate">
                                            {customStartDate && customEndDate
                                                ? `${customStartDate} - ${customEndDate}`
                                                : "Date"}
                                        </span>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                                            <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </div>
                                    </div>

                                    {showCustomDatePicker && (
                                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-3 sm:p-4 w-[280px] sm:w-[320px]">
                                            <div className="space-y-2 sm:space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">Select Date Range</h4>
                                                    <button onClick={() => {
                                                        setShowCustomDatePicker(false);
                                                        setCustomStartDate("");
                                                        setCustomEndDate("");
                                                    }} className="text-gray-500 hover:text-gray-700 text-sm">✕</button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                                                        <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="w-full px-2 sm:px-3 py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                                                        <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="w-full px-2 sm:px-3 py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm" />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end space-x-2 pt-2">
                                                    <button onClick={() => { setCustomStartDate(""); setCustomEndDate(""); }} className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-600 hover:text-gray-800">Clear</button>
                                                    <button onClick={() => { setShowCustomDatePicker(false); }} className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Apply</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Branches Filter */}
                                <div className="flex-1 min-w-[150px] sm:min-w-[180px] relative">
                                    <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="w-full px-3 sm:px-4 py-2 sm:py-2.5 shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold appearance-none bg-white pr-8 sm:pr-10 text-sm sm:text-base" disabled={branchesLoading || !!branchesError}>
                                        <option value="">All Branches</option>
                                        {branchesLoading ? <option disabled>Loading branches...</option> : branchesError ? <option disabled>Failed to load branches</option> : branches.length > 0 ? branches.map((branch) => (<option key={branch.id} value={branch.branch_name}>{branch.branch_name}</option>)) : <option disabled>No branches found</option>}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                                        <img src={arrow_down_dropdown} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </div>
                                </div>

                                {/* Status Filter */}
                                <div className="flex-1 min-w-[150px] sm:min-w-[180px] relative">
                                    <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full px-3 sm:px-4 py-2 sm:py-2.5 shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold appearance-none bg-white pr-8 sm:pr-10 text-sm sm:text-base">
                                        <option value="">All Status</option>
                                        <option value="Active">Active</option>
                                        <option value="On Leave">On Leave</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                                        <img src={arrow_down_dropdown} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </div>
                                </div>

                                {/* Filter Icon Button */}
                                <div className="shrink-0">
                                    <button className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center cursor-pointer hover:bg-gray-50 rounded-lg" onClick={() => {
                                        setSelectedDate('');
                                        setSelectedBranch('');
                                        setSelectedCategory('');
                                        setSelectedStatus('');
                                        setSearchQuery('');
                                        setCurrentPage(1);
                                    }}>
                                        <img src={filterIcon} alt="Filter" className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                                    </button>
                                </div>
                            </div>

                            {/* Search and Actions Row */}
                            <div className="pt-4 sm:pt-5 md:pt-6">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                                    <div className="relative w-full sm:flex-1">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                                <img src={search_icon} alt="Search" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                            </div>
                                            <input type="text" value={searchQuery} onChange={handleSearchChange} onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)} onBlur={handleSearchBlur} placeholder="Search by Employee ID, Name, Role, Branch..." className="pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-[#00000080] rounded-lg focus:border-blue-500 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" />
                                            {showSuggestions && searchSuggestions.length > 0 && (
                                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                                                    <ul className="py-1 max-h-60 overflow-auto">
                                                        {searchSuggestions.map((suggestion, index) => (
                                                            <li key={index} className="px-3 sm:px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-700 hover:text-gray-900 border-b border-gray-100 last:border-b-0 text-sm" onClick={() => handleSuggestionClick(suggestion)}>
                                                                <div className="flex items-center space-x-2">
                                                                    <img src={search_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                                                    <span className="text-xs sm:text-sm">{suggestion}</span>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    <div className="px-3 sm:px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-200">{searchSuggestions.length} suggestion{searchSuggestions.length !== 1 ? 's' : ''}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                        <button onClick={handleExportToPDF} className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg cursor-pointer transition-colors w-full sm:w-auto hover:bg-gray-50">
                                            <img src={export_pdf} alt="Add" className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                                            <span className="text-sm sm:text-base md:text-lg font-medium text-black">Export PDF</span>
                                        </button>
                                        <button onClick={handleExportToExcel} className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg cursor-pointer transition-colors w-full sm:w-auto hover:bg-gray-50">
                                            <img src={export_excel} alt="Export" className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                                            <span className="text-sm sm:text-base md:text-lg font-medium text-gray-700">Export Excel</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto shadow rounded-lg">
                            <div className="mb-3 sm:mb-4">
                                <h2 className="text-base sm:text-lg md:text-[18px] font-semibold text-gray-900 px-3 sm:px-4 pt-2 rounded-xl">Employees</h2>
                                {searchQuery && (<p className="text-xs sm:text-sm text-gray-600 mt-1 px-3 sm:px-4">Showing {filteredEmployees.length} of {employees.length} employees{searchQuery && ` for "${searchQuery}"`}</p>)}
                            </div>
                            <table className="min-w-[800px] sm:min-w-full">
                                <thead className="bg-[#F6F8FA]">
                                    <tr className="border-b border-gray-200">
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-sm sm:text-[16px] font-semibold text-[#37638F] uppercase tracking-wider whitespace-nowrap">EMP ID</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-sm sm:text-[16px] font-semibold text-[#37638F] uppercase tracking-wider whitespace-nowrap">NAME</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-sm sm:text-[16px] font-semibold text-[#37638F] uppercase tracking-wider whitespace-nowrap">ROLE</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-sm sm:text-[16px] font-semibold text-[#37638F] uppercase tracking-wider whitespace-nowrap">BRANCH</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-sm sm:text-[16px] font-semibold text-[#37638F] uppercase tracking-wider whitespace-nowrap">DEPARTMENT</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-sm sm:text-[16px] font-semibold text-[#37638F] uppercase tracking-wider whitespace-nowrap">STATUS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {employeeLoading ? (
                                        <tr>
                                            <td colSpan={6} className="px-3 sm:px-4 py-8 text-center">
                                                <div className="flex justify-center items-center">
                                                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-3 sm:px-4 py-8 text-center">
                                                <div className="text-gray-500 text-sm sm:text-base">No employees found.</div>
                                            </td>
                                        </tr>
                                    ) : (
                                        currentItems.map((employee: Employee, index: number) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRowClick(employee.id) }}>
                                                <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                                                    <span className="text-xs sm:text-sm font-medium text-gray-900">{employee.employee_id}</span>
                                                </td>
                                                <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                                                    <span className="text-xs sm:text-sm font-medium text-gray-900">{employee.name}</span>
                                                </td>
                                                <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                                                    <span className="text-xs sm:text-sm text-gray-700">{employee.role?.role_name ?? 'N/A'}</span>
                                                </td>
                                                <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                                                    <span className="text-xs sm:text-sm text-gray-700">{employee.branch?.branch_name ?? 'N/A'}</span>
                                                </td>
                                                <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                                                    <span className="text-xs sm:text-sm text-gray-700">{employee.department ?? 'N/A'}</span>
                                                </td>
                                                <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                                                    <span className={`text-xs sm:text-sm font-medium ${getStatusColor(employee.is_active ? 'Active' : 'Inactive')}`}>
                                                        {employee.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-2 sm:px-3 md:px-4 py-3 sm:py-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                                <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                                    Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredEmployees.length)}</span> of <span className="font-medium">{filteredEmployees.length}</span> employees
                                </div>
                                <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                                    <button onClick={handlePrevious} disabled={currentPage === 1} className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-lg transition-colors ${currentPage === 1 ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}>Previous</button>
                                    {getPageNumbers().map((pageNumber, index) => (
                                        pageNumber === '...' ? (
                                            <span key={`ellipsis-${index}`} className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-500">...</span>
                                        ) : (
                                            <button key={`page-${pageNumber}`} onClick={() => handlePageChange(pageNumber as number)} className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-lg transition-colors ${currentPage === pageNumber ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-gray-700 hover:bg-gray-100'}`}>{pageNumber}</button>
                                        )
                                    ))}
                                    <button onClick={handleNext} disabled={currentPage === totalPages} className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-lg transition-colors ${currentPage === totalPages ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}>Next</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Action Buttons */}
                    <div className="lg:col-span-2 bg-white flex flex-row lg:flex-col justify-between gap-3 sm:gap-4 p-4 sm:p-6 md:p-8 items-center">
                        <Link to={`${basePath}/hr/add_employee`} className="flex-1 lg:flex-none">
                            <button className="w-full lg:w-24 xl:w-28 h-full lg:h-36 xl:h-40 bg-white border border-gray-100 rounded-full hover:bg-gray-50 transition-colors shadow-sm hover:shadow-lg relative flex items-center justify-center group cursor-pointer overflow-hidden">
                                <img src={add_icon} alt="" className="bg-[#CFF6FF] p-3 sm:p-4 rounded-full transition-transform duration-300 group-hover:-translate-y-8 w-10 h-10 sm:w-12 sm:h-12" />
                                <span className="absolute bottom-2 sm:bottom-4 text-xs sm:text-sm text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center w-full px-1">Add New Employee</span>
                            </button>
                        </Link>

                        <Link to={`${basePath}/hr/mark_attendance`} className="flex-1 lg:flex-none">
                            <button className="w-full lg:w-24 xl:w-28 h-full lg:h-36 xl:h-40 bg-white border border-gray-100 rounded-full hover:bg-gray-50 transition-colors shadow-sm hover:shadow-lg relative flex items-center justify-center group cursor-pointer overflow-hidden">
                                <img src={user_icon} alt="" className="bg-[#CFF6FF] p-3 sm:p-4 rounded-full transition-transform duration-300 group-hover:-translate-y-8 w-10 h-10 sm:w-12 sm:h-12" />
                                <span className="absolute bottom-2 sm:bottom-4 text-xs sm:text-sm text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center w-full px-1">Mark Attendance (Manual)</span>
                            </button>
                        </Link>

                        <Link to={`${basePath}/hr/leave_requests`} className="flex-1 lg:flex-none">
                            <button className="w-full lg:w-24 xl:w-28 h-full lg:h-36 xl:h-40 bg-white border border-gray-100 rounded-full hover:bg-gray-50 transition-colors shadow-sm hover:shadow-lg relative flex items-center justify-center group cursor-pointer overflow-hidden">
                                <img src={back_icon} alt="" className="bg-[#CFF6FF] p-3 sm:p-4 rounded-full transition-transform duration-300 group-hover:-translate-y-8 w-10 h-10 sm:w-12 sm:h-12" />
                                <span className="absolute bottom-2 sm:bottom-4 text-xs sm:text-sm text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center w-full px-1">Review Leave Request</span>
                            </button>
                        </Link>

                        <Link to={`${basePath}/hr/documents`} className="flex-1 lg:flex-none">
                            <button className="w-full lg:w-24 xl:w-28 h-full lg:h-36 xl:h-40 bg-white border border-gray-100 rounded-full hover:bg-gray-50 transition-colors shadow-sm hover:shadow-lg relative flex items-center justify-center group cursor-pointer overflow-hidden">
                                <img src={back_icon} alt="" className="bg-[#CFF6FF] p-3 sm:p-4 rounded-full transition-transform duration-300 group-hover:-translate-y-8 w-10 h-10 sm:w-12 sm:h-12" />
                                <span className="absolute bottom-2 sm:bottom-4 text-xs sm:text-sm text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center w-full px-1">Documents</span>
                            </button>
                        </Link>

                        <Link to={`${basePath}/hr/add_bonuses`} className="flex-1 lg:flex-none">
                            <button className="w-full lg:w-24 xl:w-28 h-full lg:h-36 xl:h-40 bg-white border border-gray-100 rounded-full hover:bg-gray-50 transition-colors shadow-sm hover:shadow-lg relative flex items-center justify-center group cursor-pointer overflow-hidden">
                                <img src={bonuses_icon} alt="" className="w-10 h-10 sm:w-12 sm:h-12 bg-[#CFF6FF] p-3 sm:p-4 rounded-full transition-transform duration-300 group-hover:-translate-y-8" />
                                <span className="absolute bottom-6 sm:bottom-8 text-xs sm:text-sm text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center w-full px-1">Add Bonus</span>
                            </button>
                        </Link>

                        <Link to={`${basePath}/hr/leave-planner`} className="flex-1 lg:flex-none">
                            <button className="w-full lg:w-24 xl:w-28 h-full lg:h-36 xl:h-40 bg-white border border-gray-100 rounded-full hover:bg-gray-50 transition-colors shadow-sm hover:shadow-lg relative flex items-center justify-center group cursor-pointer overflow-hidden">
                                <img src={bonuses_icon} alt="" className="w-10 h-10 sm:w-12 sm:h-12 bg-[#CFF6FF] p-3 sm:p-4 rounded-full transition-transform duration-300 group-hover:-translate-y-8" />
                                <span className="absolute bottom-6 sm:bottom-8 text-xs sm:text-sm text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center w-full px-1">Vacation Planner</span>
                            </button>
                        </Link>

                        <Link to={`${basePath}/hr/payrolls`} className="flex-1 lg:flex-none">
                            <button className="w-full lg:w-24 xl:w-28 h-full lg:h-36 xl:h-40 bg-white border border-gray-100 rounded-full hover:bg-gray-50 transition-colors shadow-sm hover:shadow-lg relative flex items-center justify-center group cursor-pointer overflow-hidden">
                                <img src={payrolls} alt="" className="w-10 h-10 sm:w-12 sm:h-12 bg-[#CFF6FF] p-3 sm:p-4 rounded-full transition-transform duration-300 group-hover:-translate-y-8" />
                                <span className="absolute bottom-6 sm:bottom-8 text-xs sm:text-sm text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center w-full px-1">Payroll</span>
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}