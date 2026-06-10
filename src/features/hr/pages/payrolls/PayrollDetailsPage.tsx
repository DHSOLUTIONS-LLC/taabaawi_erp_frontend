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
import delete_icon from '../../../../assets/icons/cross_icon.svg';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import jsPDF from 'jspdf';

export default function PayrollDetailsPage() {
    const { user } = useAppSelector((state: RootState) => state.auth);
    // Check user role
    const isSuperAdmin = user?.role?.role_name === 'Super Admin';
    const isHR = user?.role?.role_name === 'HR';

    const basePath = isSuperAdmin
        ? '/admin'
        : isHR
            ? ''
            : '';

    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [showPaidModal, setShowPaidModal] = useState(false);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { data: response, isLoading, refetch } = useGetPayrollByIdQuery(Number(id));
    const [approvePayroll, { isLoading: isApproving }] = useApprovePayrollMutation();
    const [markAsPaid, { isLoading: isMarkingPaid }] = useMarkPayrollAsPaidMutation();
    const [deletePayroll, { isLoading: isDeleting }] = useDeletePayrollMutation();

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
            navigate(`${basePath}/hr/payrolls`);
        } catch (error) {
            console.error('Failed to delete payroll:', error);
        }
    };

    // Build the jsPDF doc and return it (no save here so Download + Share can reuse it)
    const buildPDF = () => {
        if (!payroll) return null;

        const doc = new jsPDF('p', 'mm', 'a4');
        const marginLeft = 15;
        let yPos = 20;

        // Header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('PAYROLL RECEIPT', 105, yPos, { align: 'center' });
        yPos += 10;

        // Company info
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text('ERP System - Payroll Management', 105, yPos, { align: 'center' });
        yPos += 8;
        doc.text(`Generated: ${new Date().toLocaleString()}`, 105, yPos, { align: 'center' });
        yPos += 15;

        // Separator line
        doc.setDrawColor(200, 200, 200);
        doc.line(marginLeft, yPos, 195, yPos);
        yPos += 10;

        // Employee Information
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text('EMPLOYEE INFORMATION', marginLeft, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Name: ${payroll.user?.name || 'N/A'}`, marginLeft, yPos);
        yPos += 6;
        doc.text(`Employee ID: ${payroll.user?.employee_id || 'N/A'}`, marginLeft, yPos);
        yPos += 6;
        doc.text(`Department: ${payroll.user?.department || 'N/A'}`, marginLeft, yPos);
        yPos += 6;
        doc.text(`Role: ${payroll.user?.role_id?.role_name || 'N/A'}`, marginLeft, yPos);
        yPos += 15;

        // Payroll Period
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('PAYROLL PERIOD', marginLeft, yPos);
        yPos += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Month: ${formatMonth(payroll.payroll_month)}`, marginLeft, yPos);
        yPos += 15;

        // Attendance Summary
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('ATTENDANCE SUMMARY', marginLeft, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Working Days: ${payroll.working_days || 0}`, marginLeft, yPos);
        yPos += 6;
        doc.text(`Present Days: ${payroll.present_days || 0}`, marginLeft, yPos);
        yPos += 6;
        doc.text(`Absent Days: ${payroll.absent_days || 0}`, marginLeft, yPos);
        yPos += 6;
        doc.text(`Leave Days: ${payroll.leave_days || 0}`, marginLeft, yPos);
        yPos += 15;

        // Salary Breakdown
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('SALARY BREAKDOWN', marginLeft, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Basic Salary: ${formatCurrency(payroll.basic_salary)}`, marginLeft, yPos);
        yPos += 6;
        doc.text(`Total Allowances: + ${formatCurrency(payroll.total_allowances)}`, marginLeft, yPos);
        yPos += 6;
        doc.text(`Total Bonuses: + ${formatCurrency(payroll.total_bonuses)}`, marginLeft, yPos);
        yPos += 6;
        doc.text(`Total Deductions: - ${formatCurrency(payroll.total_deductions)}`, marginLeft, yPos);
        yPos += 10;

        // Net Salary
        doc.setDrawColor(200, 200, 200);
        doc.line(marginLeft, yPos, 195, yPos);
        yPos += 8;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 150, 0);
        doc.text(`NET SALARY: ${formatCurrency(payroll.net_salary)}`, marginLeft, yPos);
        yPos += 15;

        // Payment Status
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text(`Status: ${payroll.status}`, marginLeft, yPos);
        yPos += 6;
        if (payroll.payment_date) {
            doc.text(`Payment Date: ${formatDate(payroll.payment_date)}`, marginLeft, yPos);
        }

        // Footer
        const pageCount = doc.internal.pages.length;
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('This is a system generated receipt.', 105, 280, { align: 'center' });
            doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        }

        return doc;
    };

    const getFileName = () =>
        `payroll_receipt_${payroll?.user?.employee_id}_${payroll?.payroll_month}.pdf`;

    const handleDownloadPDF = () => {
        try {
            const doc = buildPDF();
            if (!doc) return;
            doc.save(getFileName());
        } catch (error) {
            console.error('PDF download failed:', error);
            alert('Failed to download PDF');
        }
    };

    const handleShare = async () => {
        if (!payroll) return;

        const fileName = getFileName();

        // 1) Best case: share the actual PDF file via the native system share sheet
        try {
            const doc = buildPDF();
            if (doc) {
                const blob = doc.output('blob');
                const file = new File([blob], fileName, { type: 'application/pdf' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Payroll Receipt - ${payroll.user?.name}`,
                        text: `Payroll receipt for ${payroll.user?.name} (${formatMonth(payroll.payroll_month)})`,
                    });
                    return;
                }
            }
        } catch (err: any) {
            if (err?.name === 'AbortError') return; // user closed the sheet — that's fine
            console.error('File share failed, falling back to text:', err);
        }

        // 2) Fallback: share text via the native system share sheet
        const receiptDetails = `
🏢 PAYROLL RECEIPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 EMPLOYEE INFORMATION
Name: ${payroll.user?.name || 'N/A'}
Employee ID: ${payroll.user?.employee_id || 'N/A'}
Department: ${payroll.user?.department || 'N/A'}
Role: ${payroll.user?.role?.role_name || payroll.user?.role_id?.role_name || 'N/A'}

📅 PAYROLL PERIOD
Month: ${formatMonth(payroll.payroll_month)}

📊 ATTENDANCE SUMMARY
Working Days: ${payroll.working_days || 0}
Present Days: ${payroll.present_days || 0}
Absent Days: ${payroll.absent_days || 0}
Leave Days: ${payroll.leave_days || 0}

💰 SALARY BREAKDOWN
Basic Salary: ${formatCurrency(payroll.basic_salary)}
Total Allowances: + ${formatCurrency(payroll.total_allowances)}
Total Bonuses: + ${formatCurrency(payroll.total_bonuses)}
Total Deductions: - ${formatCurrency(payroll.total_deductions)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NET SALARY: ${formatCurrency(payroll.net_salary)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: ${payroll.status}
${payroll.payment_date ? `Payment Date: ${formatDate(payroll.payment_date)}` : ''}

Generated by ERP System
        `.trim();

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Payroll Receipt - ${payroll.user?.name}`,
                    text: receiptDetails,
                });
                return;
            } catch (shareError: any) {
                if (shareError?.name === 'AbortError') return;
                console.error('Text share failed:', shareError);
            }
        }

        // 3) Last resort: clipboard (desktop Firefox, insecure http, unsupported browsers)
        try {
            await navigator.clipboard.writeText(receiptDetails);
            alert('Sharing not supported here — receipt details copied to clipboard instead.');
        } catch (clipboardError) {
            console.error('Clipboard error:', clipboardError);
            alert('Unable to share on this device/browser. Please copy the details manually.');
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
            <div className="min-h-screen bg-gray-50">
                <div className="space-y-4 sm:space-y-6 ">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <Link to={`${basePath}/hr/payrolls`} className="flex flex-row items-center">
                            <img src={arrow_back_icon} alt="Back" className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                            <span className="px-2 font-semibold text-sm sm:text-base break-words">
                                Payroll Details - {payroll.user?.name}
                            </span>
                        </Link>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                            {payroll.status === 'Draft' && (
                                <>
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 w-full"
                                    >
                                        <img src={delete_icon} alt="Delete" className="w-4 h-4" />
                                        <span>Delete</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Status Bar */}
                    <div className="bg-white rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-500 mb-1">Payroll Month</p>
                            <p className="text-base sm:text-lg font-semibold">{formatMonth(payroll.payroll_month)}</p>
                        </div>
                        <div className="text-left sm:text-right">
                            <p className="text-xs sm:text-sm text-gray-500 mb-1">Status</p>
                            <span className={`inline-block px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${getStatusColor(payroll.status)}`}>
                                {payroll.status}
                            </span>
                        </div>
                    </div>

                    {/* Employee Info */}
                    <div className="bg-white rounded-xl p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Employee Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 mb-1">Name</p>
                                <p className="text-sm sm:text-base font-medium break-words">{payroll.user?.name}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 mb-1">Employee ID</p>
                                <p className="text-sm sm:text-base font-medium">{payroll.user?.employee_id}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 mb-1">Department</p>
                                <p className="text-sm sm:text-base font-medium">{payroll.user?.department || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 mb-1">Role</p>
                                <p className="text-sm sm:text-base font-medium">{payroll.user?.role_id?.role_name || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Attendance Summary */}
                    <div className="bg-white rounded-xl p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Attendance Summary</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                                <p className="text-xs sm:text-sm text-gray-500 mb-1">Working Days</p>
                                <p className="text-xl sm:text-2xl font-bold">{payroll.working_days}</p>
                            </div>
                            <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                                <p className="text-xs sm:text-sm text-green-600 mb-1">Present</p>
                                <p className="text-xl sm:text-2xl font-bold text-green-700">{payroll.present_days}</p>
                            </div>
                            <div className="bg-red-50 p-3 sm:p-4 rounded-lg">
                                <p className="text-xs sm:text-sm text-red-600 mb-1">Absent</p>
                                <p className="text-xl sm:text-2xl font-bold text-red-700">{payroll.absent_days}</p>
                            </div>
                            <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
                                <p className="text-xs sm:text-sm text-yellow-600 mb-1">Leave</p>
                                <p className="text-xl sm:text-2xl font-bold text-yellow-700">{payroll.leave_days}</p>
                            </div>
                        </div>
                    </div>

                    {/* Salary Breakdown */}
                    <div className="bg-white rounded-xl p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Salary Breakdown</h3>
                        <div className="space-y-2 sm:space-y-3">
                            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-300 gap-1">
                                <span className="text-xs sm:text-sm text-gray-600">Basic Salary</span>
                                <span className="text-sm sm:text-base font-medium">{formatCurrency(payroll.basic_salary)}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-300 gap-1">
                                <span className="text-xs sm:text-sm text-gray-600">Total Allowances</span>
                                <span className="text-sm sm:text-base font-medium text-green-600">+ {formatCurrency(payroll.total_allowances)}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-300 gap-1">
                                <span className="text-xs sm:text-sm text-gray-600">Total Bonuses</span>
                                <span className="text-sm sm:text-base font-medium text-green-600">+ {formatCurrency(payroll.total_bonuses)}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-300 gap-1">
                                <span className="text-xs sm:text-sm text-gray-600">Total Deductions</span>
                                <span className="text-sm sm:text-base font-medium text-red-600">- {formatCurrency(payroll.total_deductions)}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between py-2 text-base sm:text-lg font-bold pt-2">
                                <span>Net Salary</span>
                                <span className="text-green-600">{formatCurrency(payroll.net_salary)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons based on status */}
                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                        {payroll.status === 'Draft' && (
                            <button
                                onClick={handleApprove}
                                disabled={isApproving}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm sm:text-base"
                            >
                                {isApproving ? 'Approving...' : 'Approve Payroll'}
                            </button>
                        )}
                        {payroll.status === 'Approved' && (
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <button
                                    onClick={handleShare}
                                    className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm sm:text-base flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    Share
                                </button>
                                <button
                                    onClick={handleDownloadPDF}
                                    className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download PDF
                                </button>
                                <button
                                    onClick={() => setShowPaidModal(true)}
                                    className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base"
                                >
                                    Mark as Paid
                                </button>
                            </div>
                        )}
                        {payroll.status === 'Paid' && (
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <button
                                    onClick={handleShare}
                                    className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm sm:text-base flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    Share
                                </button>
                                <button
                                    onClick={handleDownloadPDF}
                                    className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download PDF
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mark as Paid Modal */}
                {showPaidModal && (
                    <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full">
                            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Mark as Paid</h3>
                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                        Payment Date
                                    </label>
                                    <input
                                        type="date"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
                                    <p className="text-xs sm:text-sm text-blue-700 break-words">
                                        Amount to be paid: <span className="font-bold">{formatCurrency(payroll.net_salary)}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
                                <button
                                    onClick={() => setShowPaidModal(false)}
                                    className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleMarkPaid}
                                    disabled={isMarkingPaid}
                                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                                >
                                    {isMarkingPaid ? 'Processing...' : 'Confirm Payment'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full">
                            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Confirm Delete</h3>
                            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 break-words">
                                Are you sure you want to delete this payroll record? This action cannot be undone.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}