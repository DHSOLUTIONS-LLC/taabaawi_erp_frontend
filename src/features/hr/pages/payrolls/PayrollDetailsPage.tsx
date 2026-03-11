// src/features/hr/payrolls/PayrollDetailsPage.tsx
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    useGetPayrollByIdQuery,
    useApprovePayrollMutation,
    useMarkPayrollAsPaidMutation,
    useDeletePayrollMutation
} from '../../../../services/hrApi';
import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import edit_icon from '../../../../assets/icons/edit_icon.svg';
import delete_icon from '../../../../assets/icons/cross_icon.svg';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';

export default function PayrollDetailsPage() {
            const { user } = useAppSelector((state: RootState) => state.auth);
    
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [showPaidModal, setShowPaidModal] = useState(false);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { data: response, isLoading, refetch } = useGetPayrollByIdQuery(Number(id));
    const [approvePayroll, { isLoading: isApproving }] = useApprovePayrollMutation();
    const [markAsPaid, { isLoading: isMarkingPaid }] = useMarkPayrollAsPaidMutation();
    const [deletePayroll, { isLoading: isDeleting }] = useDeletePayrollMutation();

         // Check user role
    const isSuperAdmin = user?.role?.role_name === 'Super Admin';
    const isHR = user?.role?.role_name === 'HR';
    // console.log('is hr: ', isHR)

    const basePath = isSuperAdmin
        ? '/admin'
        : isHR
            ? ''
            : '';



    const payroll = response?.data;

    const formatCurrency = (value: string) => {
        return `KD ${parseFloat(value).toFixed(3)}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
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

    const handleApprove = async () => {
        try {
            await approvePayroll(Number(id)).unwrap();
            refetch();
        } catch (error) {
            console.error('Failed to approve payroll:', error);
        }
    };

    const handleMarkPaid = async () => {
        try {
            await markAsPaid({ id: Number(id), payment_date: paymentDate }).unwrap();
            setShowPaidModal(false);
            refetch();
        } catch (error) {
            console.error('Failed to mark as paid:', error);
        }
    };

    const handleDelete = async () => {
        try {
            await deletePayroll(Number(id)).unwrap();
            // navigate('/hr/payrolls');
        } catch (error) {
            console.error('Failed to delete payroll:', error);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!payroll) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-gray-500">Payroll not found</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-row justify-between items-center">
                    <Link to={`${basePath}/hr/payrolls`} className="flex flex-row items-center">
                        <img src={arrow_back_icon} alt="Back" className="w-6 h-6 md:w-8 md:h-8" />
                        <span className="px-2 font-semibold text-sm md:text-base">
                            Payroll Details - {payroll.user?.name}
                        </span>
                    </Link>
                    <div className="flex space-x-3">
                        {payroll.status === 'Draft' && (
                            <>
                                <button
                                    onClick={() => navigate(`/hr/payrolls/${id}/edit`)}
                                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    <img src={edit_icon} alt="Edit" className="w-4 h-4" />
                                    <span>Edit</span>
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                                >
                                    <img src={delete_icon} alt="Delete" className="w-4 h-4" />
                                    <span>Delete</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Status Bar */}
                <div className="bg-white rounded-xl p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Payroll Month</p>
                        <p className="text-lg font-semibold">{formatMonth(payroll.payroll_month)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500 mb-1">Status</p>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(payroll.status)}`}>
                            {payroll.status}
                        </span>
                    </div>
                </div>

                {/* Employee Info */}
                <div className="bg-white rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Employee Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Name</p>
                            <p className="font-medium">{payroll.user?.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Employee ID</p>
                            <p className="font-medium">{payroll.user?.employee_id}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Department</p>
                            <p className="font-medium">{payroll.user?.department || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Role</p>
                            <p className="font-medium">{payroll.user?.role?.role_name || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Attendance Summary */}
                <div className="bg-white rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Attendance Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Working Days</p>
                            <p className="text-2xl font-bold">{payroll.working_days}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-green-600 mb-1">Present</p>
                            <p className="text-2xl font-bold text-green-700">{payroll.present_days}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                            <p className="text-sm text-red-600 mb-1">Absent</p>
                            <p className="text-2xl font-bold text-red-700">{payroll.absent_days}</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <p className="text-sm text-yellow-600 mb-1">Leave</p>
                            <p className="text-2xl font-bold text-yellow-700">{payroll.leave_days}</p>
                        </div>
                    </div>
                </div>

                {/* Salary Breakdown */}
                <div className="bg-white rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Salary Breakdown</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Basic Salary</span>
                            <span className="font-medium">{formatCurrency(payroll.basic_salary)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Total Allowances</span>
                            <span className="font-medium text-green-600">+ {formatCurrency(payroll.total_allowances)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Total Bonuses</span>
                            <span className="font-medium text-green-600">+ {formatCurrency(payroll.total_bonuses)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Total Deductions</span>
                            <span className="font-medium text-red-600">- {formatCurrency(payroll.total_deductions)}</span>
                        </div>
                        <div className="flex justify-between py-2 text-lg font-bold">
                            <span>Net Salary</span>
                            <span className="text-green-600">{formatCurrency(payroll.net_salary)}</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons based on status */}
                <div className="flex justify-end space-x-3">
                    {payroll.status === 'Draft' && (
                        <button
                            onClick={handleApprove}
                            disabled={isApproving}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {isApproving ? 'Approving...' : 'Approve Payroll'}
                        </button>
                    )}
                    {payroll.status === 'Approved' && (
                        <button
                            onClick={() => setShowPaidModal(true)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Mark as Paid
                        </button>
                    )}
                </div>
            </div>

            {/* Mark as Paid Modal */}
            {showPaidModal && (
                <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Mark as Paid</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Date
                                </label>
                                <input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-sm text-blue-700">
                                    Amount to be paid: <span className="font-bold">{formatCurrency(payroll.net_salary)}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowPaidModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMarkPaid}
                                disabled={isMarkingPaid}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isMarkingPaid ? 'Processing...' : 'Confirm Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this payroll record? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
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