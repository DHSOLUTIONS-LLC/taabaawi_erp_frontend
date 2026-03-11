// src/features/hr/pages/LeaveRequestDetails.tsx
import DashboardLayout from '../../../layouts/DashboardLayout';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import dropdown_icon from '../../../assets/icons/dropdown_arrow_icon.svg';
import edit_icon from '../../../assets/icons/edit_icon.svg';
import active_icon from '../../../assets/icons/active_rounded_icon.svg';
import view_icon from '../../../assets/icons/view-icon.png';
import delete_icon from '../../../assets/icons/delete-icon.png';
import close_icon from '../../../assets/icons/cross_icon.svg';
import { 
    useGetEmployeeByIdQuery, 
    useGetLeaveBalanceQuery, 
    useGetLeaveRequestByIdQuery, 
    useGetLeaveRequestsQuery, 
    useGetBonusesQuery,
    useDeleteBonusMutation,
    useUpdateBonusMutation,
    useGetUserBonusSummaryQuery
} from '../../../services/hrApi';

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
    branch: {
        id: number;
        branch_name: string;
    } | null;
}

interface Bonus {
    id: number;
    user_id: number;
    bonus_type: string;
    amount: string;
    bonus_date: string;
    description: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    approved_by?: any;
    user?: any;
}

interface BonusSummary {
    total_bonuses: number;
    total_amount: number;
    average_amount: number;
    last_bonus_date: string | null;
    bonuses_by_type: {
        [key: string]: {
            count: number;
            total: number;
        }
    };
}

export default function LeaveRequestDetails() {
    const [personalDetailsOpen, setPersonalDetailsOpen] = useState(false);
    const [employmentDetailsOpen, setEmploymentDetailsOpen] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);
    
    // Modal states
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedBonus, setSelectedBonus] = useState<Bonus | null>(null);
    
    // Edit form state
    const [editFormData, setEditFormData] = useState({
        bonus_type: '',
        amount: '',
        bonus_date: '',
        description: ''
    });

    const params = useParams<{ id: string }>();
    const id = params.id;
    
    // Queries
    const { data: employeeResponse, isLoading, refetch: refetchEmployee } = useGetEmployeeByIdQuery(Number(id));
    const { data: leaveBalancesResponse } = useGetLeaveBalanceQuery(Number(id));
    const { data: leaveRequestsResponse } = useGetLeaveRequestByIdQuery(Number(id));
    const { data: leavesRequestsResponse } = useGetLeaveRequestsQuery();
    const { data: getBonusesResponse, refetch: refetchBonuses } = useGetBonusesQuery();
    const { data: bonusSummaryResponse, refetch: refetchSummary } = useGetUserBonusSummaryQuery(Number(id), {
        skip: !showSummaryModal // Only fetch when modal is open
    });
    
    // Mutations
    const [deleteBonus, { isLoading: isDeleting }] = useDeleteBonusMutation();
    const [updateBonus, { isLoading: isUpdating }] = useUpdateBonusMutation();

    const emp = employeeResponse?.data;
    const leaveBalance = leaveBalancesResponse?.data?.balance || [];
    const allLeaveRequests = leavesRequestsResponse?.data?.data || [];
    const allBonuses = getBonusesResponse?.data?.data || [];
    const bonusSummary = bonusSummaryResponse?.data;

    // Filter data for this user
    const userLeaveRequests = allLeaveRequests.filter((request: any) => request.user_id === Number(id));
    const userBonuses = allBonuses.filter((bonus: Bonus) => bonus.user_id === Number(id));

    console.log('Filtered bonuses for user:', userBonuses);

    // Format date function
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateDays = (startDate: string, endDate: string) => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            case 'Cancelled': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getBonusStatusColor = (status: string) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Format time function
    const formatTime = (timeString: string | null) => {
        if (!timeString) return '--:--';
        return timeString;
    };

    // Get source from device_id or notes
    const getAttendanceSource = (attendance: Attendance) => {
        if (attendance.device_id) return 'Device';
        if (attendance.notes) return 'Manual';
        return 'System';
    };

    // Handle view bonus
    const handleViewBonus = (bonus: Bonus) => {
        setSelectedBonus(bonus);
        setShowSummaryModal(true);
    };

    // Handle edit bonus
    const handleEditBonus = (bonus: Bonus) => {
        setSelectedBonus(bonus);
        setEditFormData({
            bonus_type: bonus.bonus_type,
            amount: bonus.amount,
            bonus_date: bonus.bonus_date.split('T')[0],
            description: bonus.description || ''
        });
        setShowEditModal(true);
    };

    // Handle delete bonus
    const handleDeleteClick = (bonus: Bonus) => {
        setSelectedBonus(bonus);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedBonus) return;
        
        try {
            await deleteBonus(selectedBonus.id).unwrap();
            alert('Bonus deleted successfully');
            refetchBonuses();
        } catch (error) {
            console.error('Failed to delete bonus:', error);
            alert('Failed to delete bonus');
        } finally {
            setShowDeleteConfirm(false);
            setSelectedBonus(null);
        }
    };

    // Handle update bonus
    const handleUpdateBonus = async () => {
        if (!selectedBonus) return;
        
        try {
            await updateBonus({
                id: selectedBonus.id,
                data: {
                    ...editFormData,
                    amount: parseFloat(editFormData.amount).toFixed(3)
                }
            }).unwrap();
            
            alert('Bonus updated successfully');
            refetchBonuses();
            setShowEditModal(false);
            setSelectedBonus(null);
        } catch (error) {
            console.error('Failed to update bonus:', error);
            alert('Failed to update bonus');
        }
    };

    const employeeData = {
        name: emp?.name ?? 'Loading...',
        status: emp?.is_active ? 'Active' : 'Inactive',
        personalDetails: {
            employeeId: emp?.employee_id ?? 'N/A',
            employeeName: emp?.name ?? 'N/A',
            gender: emp?.gender ?? 'N/A',
            dob: emp?.date_of_birth ? formatDate(emp.date_of_birth) : 'N/A',
            phone: emp?.phone ?? 'N/A',
            email: emp?.email ?? 'N/A',
            address: emp?.address ?? 'N/A',
        },
        employmentDetails: {
            role: emp?.role?.role_name ?? 'N/A',
            department: emp?.department ?? 'N/A',
            branch: emp?.branch?.branch_name ?? 'N/A',
            joiningDate: emp?.joining_date ? formatDate(emp.joining_date) : 'N/A',
            employmentType: emp?.employment_type || 'Full-time',
        },
        stats: {
            totalWorkingDays: emp?.attendances?.length ?? 0,
            absent: emp?.attendances?.filter((a: Attendance) => a.status === 'Absent').length ?? 0,
            lateArrivals: emp?.attendances?.filter((a: Attendance) => a.status === 'Late').length ?? 0,
            present: emp?.attendances?.filter((a: Attendance) => a.status === 'Present').length ?? 0,
        },
        lastSync: emp?.last_login
            ? new Date(emp.last_login).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            })
            : 'N/A',
        attendance: emp?.attendances ?? [],
    };

    const personalFields = [
        { key: 'employeeId', label: 'Employee ID' },
        { key: 'employeeName', label: 'Employee Name' },
        { key: 'gender', label: 'Gender' },
        { key: 'dob', label: 'Date of Birth' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'address', label: 'Address' }
    ];

    const employmentFields = [
        { key: 'role', label: 'Role' },
        { key: 'department', label: 'Department' },
        { key: 'branch', label: 'Branch' },
        { key: 'joiningDate', label: 'Joining Date' },
        { key: 'employmentType', label: 'Employment Type' }
    ];

    const handleFieldClick = (fieldKey: string) => {
        setEditingField(fieldKey === editingField ? null : fieldKey);
    };

    if (isLoading) return <DashboardLayout><div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div></DashboardLayout>;

    // Get status color class
    const getStatusColorClass = (status: string) => {
        switch (status) {
            case 'Present':
                return 'bg-green-100 text-green-800';
            case 'Late':
                return 'bg-yellow-100 text-yellow-800';
            case 'Absent':
                return 'bg-red-100 text-red-800';
            case 'Half Day':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Bonus type options for edit form
    const bonusTypeOptions = [
        'Newborn Child',
        'Monthly Sales',
        'Quarterly',
        'Semi Annual',
        'Annual'
    ];

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50">
                <div className="px-4 md:px-6 py-6">
                    {/* First Row: Employee Name and Active Button */}
                    <div className="px-3 py-6 mb-3">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-gray-900">{employeeData.name}</h1>
                            <button className="inline-flex items-center px-4 py-2 border border-[#0088FF] rounded-full text-green-800 cursor-pointer">
                                <span className="text-md font-medium px-4 text-[#0088FF]">
                                    {employeeData.status}
                                </span>
                                <img src={active_icon} alt="Active" className="w-7 h-7 mr-2" />
                            </button>
                        </div>
                    </div>

                    {/* Personal Details Dropdown */}
                    <div className="bg-white rounded-[20px] shadow-sm mb-6 overflow-hidden">
                        <button
                            onClick={() => setPersonalDetailsOpen(!personalDetailsOpen)}
                            className="w-full p-6 flex items-center justify-between"
                        >
                            <span className="text-lg font-medium text-gray-900">Personal Details</span>
                            <div className="flex items-center cursor-pointer">
                                {personalDetailsOpen && (
                                    <img src={edit_icon} alt="Edit" className="w-5 h-5 mr-3" />
                                )}
                                <img
                                    src={dropdown_icon}
                                    alt="Dropdown"
                                    className={`w-5 h-5 transform transition-transform ${personalDetailsOpen ? 'rotate-180' : ''}`}
                                />
                            </div>
                        </button>

                        {personalDetailsOpen && (
                            <div className="px-6 pb-4">
                                {personalFields.map((field) => (
                                    <div
                                        key={field.key}
                                        onClick={() => handleFieldClick(field.key)}
                                        className={`py-4 cursor-pointer bg-gray-100 rounded-md px-8 ${editingField === field.key ? 'bg-blue-50 mt-12' : 'mt-4'}`}
                                    >
                                        {editingField === field.key ? (
                                            <div className="relative">
                                                <label className="absolute -top-12 bg-white text-md font-medium text-gray-600">
                                                    {field.label}
                                                </label>
                                                <input
                                                    type="text"
                                                    defaultValue={employeeData.personalDetails[field.key as keyof typeof employeeData.personalDetails]}
                                                    className="w-full pt-2 border-none focus:ring-0 bg-transparent"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-600">
                                                    {field.label}
                                                </span>
                                                <span>
                                                    {employeeData.personalDetails[field.key as keyof typeof employeeData.personalDetails]}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Employment Details Dropdown */}
                    <div className="bg-white rounded-[20px] shadow-sm mb-6 overflow-hidden">
                        <button
                            onClick={() => setEmploymentDetailsOpen(!employmentDetailsOpen)}
                            className="w-full p-6 flex items-center justify-between"
                        >
                            <span className="text-lg font-medium text-gray-900">Employment Details</span>
                            <div className="flex items-center">
                                {employmentDetailsOpen && (
                                    <img src={edit_icon} alt="Edit" className="w-5 h-5 mr-3" />
                                )}
                                <img
                                    src={dropdown_icon}
                                    alt="Dropdown"
                                    className={`w-5 h-5 transform transition-transform ${employmentDetailsOpen ? 'rotate-180' : ''}`}
                                />
                            </div>
                        </button>

                        {employmentDetailsOpen && (
                            <div className="px-6 pb-6">
                                {employmentFields.map((field) => (
                                    <div
                                        key={field.key}
                                        onClick={() => handleFieldClick(`emp_${field.key}`)}
                                        className={`py-4 cursor-pointer bg-gray-100 rounded-md px-8 ${editingField === `emp_${field.key}` ? 'bg-blue-50 mt-12' : 'mt-4'}`}
                                    >
                                        {editingField === `emp_${field.key}` ? (
                                            <div className="relative">
                                                <label className="absolute -top-12 left-0 bg-white text-md font-medium text-gray-600">
                                                    {field.label}
                                                </label>
                                                <input
                                                    type="text"
                                                    defaultValue={employeeData.employmentDetails[field.key as keyof typeof employeeData.employmentDetails]}
                                                    className="w-full pt-2 border-none focus:ring-0 bg-transparent"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-600">
                                                    {field.label}
                                                </span>
                                                <span className="text-gray-900">
                                                    {employeeData.employmentDetails[field.key as keyof typeof employeeData.employmentDetails]}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="text-lg font-semibold text-gray-600 mb-6">Total Working Days</div>
                            <div className="text-3xl font-semibold text-gray-900 mb-2">
                                {employeeData.stats.totalWorkingDays}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="text-lg font-semibold text-gray-600 mb-6">Present</div>
                            <div className="text-3xl font-semibold text-green-600 mb-2">
                                {employeeData.stats.present}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="text-lg font-semibold text-gray-600 mb-6">Late Arrivals</div>
                            <div className="text-3xl font-semibold text-yellow-600 mb-2">
                                {employeeData.stats.lateArrivals}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="text-lg font-semibold text-gray-600 mb-6">Absent</div>
                            <div className="text-3xl font-semibold text-red-600 mb-2">
                                {employeeData.stats.absent}
                            </div>
                        </div>
                    </div>

                    {/* Last Sync Row */}
                    <div className="bg-white rounded-full shadow-sm p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <span className="text-md text-[#0088FF] font-semibold px-4">Last sync</span>
                            <span className="text-md font-medium text-[#0088FF] border rounded-full border-[#0088FF] py-2 px-4">
                                {employeeData.lastSync}
                            </span>
                        </div>
                    </div>

                    {/* Attendance Table */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900">Attendance History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-out</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {employeeData.attendance.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                                No attendance records found
                                            </td>
                                        </tr>
                                    ) : (
                                        employeeData.attendance.map((record: Attendance, index: number) => (
                                            <tr key={record.id || index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDate(record.attendance_date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                                    {formatTime(record.check_in)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                                    {formatTime(record.check_out)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {record.total_hours ? `${record.total_hours} min` : '--'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {getAttendanceSource(record)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(record.status)}`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {record.notes || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Leave Balance Table */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900">Leave Balance</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Days</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used Days</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Days</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Days</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {leaveBalance.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                No leave balance records found
                                            </td>
                                        </tr>
                                    ) : (
                                        leaveBalance.map((balance: any, index: number) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {balance.leave_type}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {balance.max_days}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {balance.used_days}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {balance.pending_days}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                                        {balance.available_days}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Leave History Table */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900">Leave History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {userLeaveRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                                No leave requests found
                                            </td>
                                        </tr>
                                    ) : (
                                        userLeaveRequests.map((request: any, index: number) => (
                                            <tr key={request.id || index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {request.leave_type?.leave_type_name || request.leave_type?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDate(request.start_date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDate(request.end_date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {request.total_days || calculateDays(request.start_date, request.end_date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                                                        {request.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {request.reason || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Bonuses Table with Actions */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
                        <div className="p-6 flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">Bonuses</h3>
                            <button
                                onClick={() => setShowSummaryModal(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                View Summary
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bonus Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {userBonuses.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                                No bonus records found for this employee
                                            </td>
                                        </tr>
                                    ) : (
                                        userBonuses.map((bonus: Bonus, index: number) => (
                                            <tr key={bonus.id || index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {bonus.bonus_type}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    KD {bonus.amount}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDate(bonus.bonus_date)}
                                                </td>
                                                 
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {bonus.description || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center space-x-3">
                                                        <button
                                                            onClick={() => handleViewBonus(bonus)}
                                                            className="text-blue-600 hover:text-blue-800 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <img src={view_icon} alt="View" className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditBonus(bonus)}
                                                            className="text-green-600 hover:text-green-800 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <img src={edit_icon} alt="Edit" className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(bonus)}
                                                            className="text-red-600 hover:text-red-800 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <img src={delete_icon} alt="Delete" className="w-5 h-5" />
                                                        </button>
                                                    </div>
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

            {/* View Bonus Summary Modal */}
            {showSummaryModal && bonusSummary && (
                <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Bonus Summary</h2>
                            <button
                                onClick={() => setShowSummaryModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <img src={close_icon} alt="Close" className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-blue-600 font-medium mb-1">Total Bonuses</p>
                                    <p className="text-2xl font-bold text-blue-800">{bonusSummary.total_bonuses || 0}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <p className="text-sm text-green-600 font-medium mb-1">Total Amount</p>
                                    <p className="text-2xl font-bold text-green-800">KD {bonusSummary.total_amount || 0}</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <p className="text-sm text-purple-600 font-medium mb-1">Average Amount</p>
                                    <p className="text-2xl font-bold text-purple-800">KD {bonusSummary.average_amount || 0}</p>
                                </div>
                            </div>

                            {/* Last Bonus Date */}
                            {bonusSummary.last_bonus_date && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600 font-medium mb-1">Last Bonus Date</p>
                                    <p className="text-lg font-semibold text-gray-900">{formatDate(bonusSummary.last_bonus_date)}</p>
                                </div>
                            )}

                            {/* Bonuses by Type */}
                            {bonusSummary.bonuses_by_type && Object.keys(bonusSummary.bonuses_by_type).length > 0 && (
                                <div>
                                    <h3 className="text-md font-semibold text-gray-900 mb-3">Breakdown by Type</h3>
                                    <div className="space-y-2">
                                        {Object.entries(bonusSummary.bonuses_by_type).map(([type, data]: [string, any]) => (
                                            <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="font-medium text-gray-700">{type}</span>
                                                <div className="flex space-x-4">
                                                    <span className="text-sm text-gray-600">Count: <span className="font-semibold">{data.count}</span></span>
                                                    <span className="text-sm text-gray-600">Total: <span className="font-semibold">KD {data.total}</span></span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Bonuses */}
                            <div>
                                <h3 className="text-md font-semibold text-gray-900 mb-3">Recent Bonuses</h3>
                                <div className="space-y-2">
                                    {userBonuses.slice(0, 5).map((bonus: Bonus) => (
                                        <div key={bonus.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900">{bonus.bonus_type}</p>
                                                <p className="text-xs text-gray-500">{formatDate(bonus.bonus_date)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-green-600">KD {bonus.amount}</p>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getBonusStatusColor(bonus.status || 'Pending')}`}>
                                                    {bonus.status || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setShowSummaryModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Bonus Modal */}
            {showEditModal && selectedBonus && (
                <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Edit Bonus</h2>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedBonus(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <img src={close_icon} alt="Close" className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bonus Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={editFormData.bonus_type}
                                    onChange={(e) => setEditFormData({...editFormData, bonus_type: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select Bonus Type</option>
                                    {bonusTypeOptions.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Amount (KD) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    value={editFormData.amount}
                                    onChange={(e) => setEditFormData({...editFormData, amount: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bonus Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={editFormData.bonus_date}
                                    onChange={(e) => setEditFormData({...editFormData, bonus_date: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter bonus description..."
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedBonus(null);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateBonus}
                                disabled={isUpdating || !editFormData.bonus_type || !editFormData.amount || !editFormData.bonus_date}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    isUpdating || !editFormData.bonus_type || !editFormData.amount || !editFormData.bonus_date
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                {isUpdating ? 'Updating...' : 'Update Bonus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && selectedBonus && (
                <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Confirm Delete</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700">
                                Are you sure you want to delete this bonus of <span className="font-semibold">KD {selectedBonus.amount}</span> for <span className="font-semibold">{selectedBonus.bonus_type}</span>?
                            </p>
                            <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setSelectedBonus(null);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    isDeleting
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                }`}
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