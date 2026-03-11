// src/features/employee/pages/LeaveRequestFormPage.tsx
import DashboardLayout from '../../layouts/DashboardLayout';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import arrow_back_icon from '../../assets/icons/arrow_back_icon.svg';
import { useAppSelector } from '../../app/hooks';
import type { RootState } from '../../app/store';
// Add this to hrApi.ts if not already present:
// getLeaveTypes: builder.query<any, void>({ query: () => '/leave-types' })
// createLeaveRequest: builder.mutation<any, any>({ query: (data) => ({ url: '/leave-requests', method: 'POST', body: data }) })
import { useGetLeaveTypesQuery, useCreateLeaveRequestMutation } from '../../services/hrApi';

interface LeaveType {
    id: number;
    name: string;
    max_days: number | null;
    description: string | null;
}

export default function LeaveRequestFormPage() {
    const { user } = useAppSelector((state: RootState) => state.auth);

    const navigate = useNavigate();
    const [form, setForm] = useState({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [successMsg, setSuccessMsg] = useState('');

    const { data: leaveTypesResponse, isLoading: typesLoading } = useGetLeaveTypesQuery();
    const leaveTypes: LeaveType[] = leaveTypesResponse?.data ?? leaveTypesResponse?.data?.data ?? [];

    // console.log('leave types:', leaveTypes)
    const [createLeaveRequest, { isLoading: isSubmitting }] = useCreateLeaveRequestMutation();

    const getDaysDiff = () => {
        if (!form.start_date || !form.end_date) return 0;
        const diff = new Date(form.end_date).getTime() - new Date(form.start_date).getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!form.leave_type_id) newErrors.leave_type_id = 'Please select a leave type';
        if (!form.start_date) newErrors.start_date = 'Start date is required';
        if (!form.end_date) newErrors.end_date = 'End date is required';
        if (form.start_date && form.end_date && form.end_date < form.start_date) {
            newErrors.end_date = 'End date cannot be before start date';
        }
        if (!form.reason.trim()) newErrors.reason = 'Please provide a reason';
        if (form.reason.trim().length < 10) newErrors.reason = 'Reason must be at least 10 characters';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            await createLeaveRequest({
                user_id: user?.id,
                leave_type_id: Number(form.leave_type_id),
                start_date: form.start_date,
                end_date: form.end_date,
                reason: form.reason,
            }).unwrap();

            setSuccessMsg('Leave request submitted successfully!');
            setTimeout(() => navigate('/my-leaves'), 2000);
        } catch (error: any) {
            if (error?.data?.errors) {
                const apiErrors: Record<string, string> = {};
                Object.entries(error.data.errors).forEach(([key, val]) => {
                    apiErrors[key] = Array.isArray(val) ? val[0] as string : val as string;
                });
                setErrors(apiErrors);
            } else {
                setErrors({ general: error?.data?.message ?? 'Failed to submit. Please try again.' });
            }
        }
    };

    const days = getDaysDiff();
    const today = new Date().toISOString().split('T')[0];

    const selectedType = leaveTypes.find(t => t.id === Number(form.leave_type_id));

    return (
        <DashboardLayout>
            <div className="max-w-8xl mx-auto pb-10 space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link to="/my-leaves" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
                        <img src={arrow_back_icon} alt="Back" className="w-5 h-5" />
                        <span className="text-sm font-medium">Back to My Leaves</span>
                    </Link>
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Request Leave</h1>
                    <p className="text-sm text-gray-500 mt-1">Fill in the details below to submit your leave request</p>
                </div>

                {/* Success Message */}
                {successMsg && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-sm font-medium">{successMsg}</p>
                    </div>
                )}

                {/* General Error */}
                {errors.general && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                        {errors.general}
                    </div>
                )}

                {/* Form Card */}
                <div className="rounded-2xl shadow-sm p-6 space-y-6">

                    {/* Leave Type */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Leave Type <span className="text-red-500">*</span>
                        </label>
                        {typesLoading ? (
                            <div className="h-11 bg-gray-100 animate-pulse rounded-xl" />
                        ) : (
                            <select
                                value={form.leave_type_id}
                                onChange={e => handleChange('leave_type_id', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${errors.leave_type_id ? 'border-red-300' : 'border-gray-200'
                                    }`}
                            >
                                <option value="" className="text-gray-500 bg-white">Select leave type...</option>
                                {leaveTypes.map(type => (
                                    <option key={type.id} value={type.id} className="text-gray-500 bg-white hover:text-black hover:bg-green-500">
                                        {type.name}{type.max_days ? ` (max ${type.max_days} days)` : ''}
                                    </option>
                                ))}
                            </select>

                        )}
                        {errors.leave_type_id && (
                            <p className="mt-1.5 text-xs text-red-500">{errors.leave_type_id}</p>
                        )}
                        {selectedType?.description && (
                            <p className="mt-1.5 text-xs text-gray-400">{selectedType.description}</p>
                        )}
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Start Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={form.start_date}
                                min={today}
                                onChange={e => handleChange('start_date', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${errors.start_date ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                            />
                            {errors.start_date && (
                                <p className="mt-1.5 text-xs text-red-500">{errors.start_date}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                End Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={form.end_date}
                                min={form.start_date || today}
                                onChange={e => handleChange('end_date', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${errors.end_date ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                            />
                            {errors.end_date && (
                                <p className="mt-1.5 text-xs text-red-500">{errors.end_date}</p>
                            )}
                        </div>
                    </div>

                    {/* Days Summary */}
                    {days > 0 && (
                        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-blue-700 font-medium">
                                You are requesting <strong>{days} day{days !== 1 ? 's' : ''}</strong> of leave
                                {selectedType?.max_days && days > selectedType.max_days && (
                                    <span className="text-red-500 ml-2">
                                        (exceeds maximum of {selectedType.max_days} days)
                                    </span>
                                )}
                            </p>
                        </div>
                    )}

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={form.reason}
                            onChange={e => handleChange('reason', e.target.value)}
                            placeholder="Please describe the reason for your leave request..."
                            rows={4}
                            className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none ${errors.reason ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                        />
                        <div className="flex justify-between mt-1.5">
                            {errors.reason ? (
                                <p className="text-xs text-red-500">{errors.reason}</p>
                            ) : (
                                <span />
                            )}
                            <p className="text-xs text-gray-400">{form.reason.length} chars</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Link to="/my-leaves" className="flex-1">
                        <button className="w-full px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !!successMsg}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Submitting...
                            </span>
                        ) : 'Submit Request'}
                    </button>
                </div>

                {/* Info Note */}
                <p className="text-xs text-gray-400 text-center">
                    Your leave request will be reviewed by HR. You'll be notified once a decision is made.
                </p>
            </div>
        </DashboardLayout>
    );
}