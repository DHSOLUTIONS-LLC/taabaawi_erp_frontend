// src/features/employee/pages/ProfilePage.tsx
import DashboardLayout from '../../layouts/DashboardLayout';
import { useState, useEffect } from 'react';
import { useAppSelector } from '../../app/hooks';
import type { RootState } from '../../app/store';
import { useGetUserByIdQuery, useUpdateEmployeeMutation } from '../../services/hrApi';

interface Attendance {
    id: number;
    attendance_date: string;
    check_in: string | null;
    check_out: string | null;
    total_hours: number;
    status: string;
    notes: string | null;
}

interface EditableFields {
    phone: string;
    address: string;
    gender: string;
    date_of_birth: string;
    marital_status: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
}

export default function ProfilePage() {
    const { user: authUser } = useAppSelector((state: RootState) => state.auth);
    const [activeTab, setActiveTab] = useState<'personal' | 'employment' | 'attendance'>('personal');
    const [isEditing, setIsEditing] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const { data: userResponse, isLoading, refetch } = useGetUserByIdQuery(Number(authUser?.id), {
        skip: !authUser?.id,
    });
    
    // Get the actual user data from the API response
    const user = userResponse?.data || authUser;
    console.log('user data', user);

    const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();

    // Update editFields when user data loads
    const [editFields, setEditFields] = useState<EditableFields>({
        phone: '',
        address: '',
        gender: '',
        date_of_birth: '',
        marital_status: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
    });

    // Populate editFields when user data is available
    useEffect(() => {
        if (user) {
            setEditFields({
                phone: user?.phone ?? '',
                address: user?.address ?? '',
                gender: user?.gender ?? '',
                date_of_birth: user?.date_of_birth ?? '',
                marital_status: user?.marital_status ?? '',
                emergency_contact_name: user?.emergency_contact_name ?? '',
                emergency_contact_phone: user?.emergency_contact_phone ?? '',
            });
        }
    }, [user]);

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const formatTime = (timeString: string | null) => {
        if (!timeString) return '--:--';
        return timeString;
    };

    const formatAllowance = (value: string | number | null | undefined) => {
        if (!value || value === '0.000' || value === '0' || value === 0) return 'N/A';
        return `KD ${value}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Present': return 'bg-green-100 text-green-700';
            case 'Absent': return 'bg-red-100 text-red-700';
            case 'Late': return 'bg-yellow-100 text-yellow-700';
            case 'Half Day': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const attendances: Attendance[] = user?.attendances ?? [];
    const presentCount = attendances.filter(a => a.status === 'Present').length;
    const absentCount = attendances.filter(a => a.status === 'Absent').length;
    const lateCount = attendances.filter(a => a.status === 'Late').length;
    const halfDayCount = attendances.filter(a => a.status === 'Half Day').length;

    const handleEditToggle = () => {
        if (!isEditing) {
            // Reset to current user data when opening edit mode
            setEditFields({
                phone: user?.phone ?? '',
                address: user?.address ?? '',
                gender: user?.gender ?? '',
                date_of_birth: user?.date_of_birth ?? '',
                marital_status: user?.marital_status ?? '',
                emergency_contact_name: user?.emergency_contact_name ?? '',
                emergency_contact_phone: user?.emergency_contact_phone ?? '',
            });
        }
        setIsEditing(!isEditing);
        setSaveSuccess(false);
        setSaveError(null);
    };

    const handleSave = async () => {
        setSaveError(null);
        try {
            // Include ALL required fields from the user object
            await updateEmployee({
                id: Number(user?.id),
                name: user?.name,                    // Required
                email: user?.email,                   // Required
                role_id: user?.role_id,                // Required (fixed: was user?.id)
                branch_id: user?.branch_id,             // Required
                is_active: user?.is_active,             // Optional but good to include
                ...editFields,                           // Your editable fields
            }).unwrap();
            
            // Refetch user data to get updated values
            await refetch();
            
            setIsEditing(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            console.error('Update error:', err);
            setSaveError(err?.data?.message ?? 'Failed to update profile. Please try again.');
        }
    };

    const handleFieldChange = (field: keyof EditableFields, value: string) => {
        setEditFields(prev => ({ ...prev, [field]: value }));
    };

    const renderField = (
        label: string,
        value: React.ReactNode,
        fieldKey?: keyof EditableFields,
        inputType: string = 'text',
        selectOptions?: string[]
    ) => {
        const isEditableField = !!fieldKey && isEditing;

        return (
            <div key={label} className="bg-gray-50 rounded-xl px-5 py-4">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
                    {label}
                    {fieldKey && isEditing && (
                        <span className="ml-2 text-blue-400 normal-case font-normal text-xs">
                            (editable)
                        </span>
                    )}
                </p>
                {isEditableField ? (
                    selectOptions ? (
                        <select
                            value={editFields[fieldKey] || ''}
                            onChange={e => handleFieldChange(fieldKey, e.target.value)}
                            className="w-full text-sm font-medium text-gray-800 bg-white border border-blue-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            <option value="">Select...</option>
                            {selectOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type={inputType}
                            value={editFields[fieldKey] || ''}
                            onChange={e => handleFieldChange(fieldKey, e.target.value)}
                            className="w-full text-sm font-medium text-gray-800 bg-white border border-blue-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    )
                ) : (
                    <p className="text-sm font-medium text-gray-800">
                        {value ?? 'N/A'}
                    </p>
                )}
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-10">
                {/* Profile Header Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
                            <span className="text-white text-3xl font-bold">
                                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                            </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {user?.name ?? 'N/A'}
                            </h1>
                            <p className="text-gray-500 mt-1">
                                {user?.job_title ?? user?.role?.role_name ?? 'N/A'}
                            </p>
                            <p className="text-sm text-gray-400">{user?.email ?? 'N/A'}</p>

                            <div className="flex flex-wrap gap-3 mt-3 justify-center sm:justify-start">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                    🪪 {user?.employee_id ?? 'N/A'}
                                </span>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                    user?.is_active
                                        ? 'bg-green-50 text-green-700 border border-green-100'
                                        : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                    {user?.is_active ? '● Active' : '● Inactive'}
                                </span>
                                {user?.branch?.branch_name && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
                                        📍 {user.branch.branch_name}
                                    </span>
                                )}
                                {user?.department && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-600 border border-purple-100">
                                        🏢 {user.department}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Edit Button */}
                        <div className="flex flex-col items-end gap-2">
                            {activeTab === 'personal' && (
                                <>
                                    {!isEditing ? (
                                        <button
                                            onClick={handleEditToggle}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                                        >
                                            ✏️ Edit Profile
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSave}
                                                disabled={isUpdating}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors shadow-sm disabled:opacity-60"
                                            >
                                                {isUpdating ? (
                                                    <span className="flex items-center gap-1">
                                                        <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
                                                        Saving...
                                                    </span>
                                                ) : '💾 Save'}
                                            </button>
                                            <button
                                                onClick={handleEditToggle}
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 transition-colors"
                                            >
                                                ✕ Cancel
                                            </button>
                                        </div>
                                    )}
                                    {saveSuccess && (
                                        <span className="text-xs text-green-600 font-medium">✓ Profile updated successfully</span>
                                    )}
                                    {saveError && (
                                        <span className="text-xs text-red-600 font-medium">{saveError}</span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div className="bg-white rounded-xl p-5 shadow-sm text-center">
                        <p className="text-3xl font-bold text-gray-900">
                            {isLoading ? '...' : attendances.length}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Total Days</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm text-center">
                        <p className="text-3xl font-bold text-green-600">
                            {isLoading ? '...' : presentCount}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Present</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm text-center">
                        <p className="text-3xl font-bold text-yellow-500">
                            {isLoading ? '...' : lateCount}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Late</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm text-center">
                        <p className="text-3xl font-bold text-orange-500">
                            {isLoading ? '...' : halfDayCount}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Half Days</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm text-center">
                        <p className="text-3xl font-bold text-red-500">
                            {isLoading ? '...' : absentCount}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Absent</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex border-b border-gray-100">
                        {(['personal', 'employment', 'attendance'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    if (tab !== 'personal') {
                                        setIsEditing(false);
                                        setSaveSuccess(false);
                                        setSaveError(null);
                                    }
                                }}
                                className={`flex-1 py-4 text-sm font-medium capitalize transition-colors ${
                                    activeTab === tab
                                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {tab === 'attendance' ? 'Attendance History' : `${tab} Details`}
                            </button>
                        ))}
                    </div>

                    {/* Personal Details */}
                    {activeTab === 'personal' && (
                        <div className="p-6">
                            {isEditing && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                                    ℹ️ You can edit the fields marked as <span className="font-semibold">(editable)</span>. Other fields are managed by HR.
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Read-only fields */}
                                {renderField('Full Name', user?.name)}
                                {renderField('Employee ID', user?.employee_id)}
                                {renderField('Email', user?.email)}
                                {renderField('Phone', isEditing ? editFields.phone : (user?.phone ?? 'N/A'), 'phone', 'tel')}
                                {renderField(
                                    'Gender',
                                    user?.gender ?? 'N/A',
                                    'gender',
                                    'text',
                                    ['Male', 'Female']
                                )}
                                {renderField(
                                    'Date of Birth',
                                    formatDate(user?.date_of_birth),
                                    'date_of_birth',
                                    'date'
                                )}
                                {renderField(
                                    'Marital Status',
                                    user?.marital_status ?? 'N/A',
                                    'marital_status',
                                    'text',
                                    ['Single', 'Married', 'Divorced', 'Widowed']
                                )}
                                {renderField('Address', user?.address ?? 'N/A', 'address')}
                                {renderField('Emergency Contact Name', user?.emergency_contact_name ?? 'N/A', 'emergency_contact_name')}
                                {renderField('Emergency Contact Phone', user?.emergency_contact_phone ?? 'N/A', 'emergency_contact_phone', 'tel')}
                                {renderField('National ID', user?.national_id ?? 'N/A')}
                            </div>
                        </div>
                    )}

                    {/* Employment Details */}
                    {activeTab === 'employment' && (
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { label: 'Role', value: user?.role?.role_name },
                                { label: 'Department', value: user?.department },
                                { label: 'Branch', value: user?.branch?.branch_name },
                                { label: 'Job Title', value: user?.job_title },
                                { label: 'Joining Date', value: formatDate(user?.joining_date) },
                                { label: 'Status', value: user?.is_active ? 'Active' : 'Inactive' },
                                { label: 'Basic Salary', value: formatAllowance(user?.basic_salary) },
                                { label: 'Transportation Allowance', value: formatAllowance(user?.transportation_allowance) },
                                { label: 'Housing Allowance', value: formatAllowance(user?.housing_allowance) },
                                { label: 'Meal Allowance', value: formatAllowance(user?.meal_allowance) },
                                { label: 'Communication Allowance', value: formatAllowance(user?.communication_allowance) },
                                { label: 'Accommodation Allowance', value: formatAllowance(user?.accommodation_allowance) },
                            ].map(field => (
                                <div key={field.label} className="bg-gray-50 rounded-xl px-5 py-4">
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
                                        {field.label}
                                    </p>
                                    <p className={`text-sm font-medium ${
                                        field.label === 'Status'
                                            ? (user?.is_active ? 'text-green-600' : 'text-red-600')
                                            : 'text-gray-800'
                                    }`}>
                                        {field.value ?? 'N/A'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Attendance History */}
                    {activeTab === 'attendance' && (
                        <div>
                            {isLoading ? (
                                <div className="flex justify-center py-16">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                </div>
                            ) : (
                                <>
                                    {/* Summary bar */}
                                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 text-sm">
                                        <span className="text-gray-600">
                                            Total Records: <strong className="text-gray-900">{attendances.length}</strong>
                                        </span>
                                        <span className="text-green-600">
                                            Present: <strong>{presentCount}</strong>
                                        </span>
                                        <span className="text-yellow-600">
                                            Late: <strong>{lateCount}</strong>
                                        </span>
                                        <span className="text-orange-600">
                                            Half Day: <strong>{halfDayCount}</strong>
                                        </span>
                                        <span className="text-red-600">
                                            Absent: <strong>{absentCount}</strong>
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-100">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {['#', 'Date', 'Check In', 'Check Out', 'Total Hours', 'Status', 'Notes'].map(h => (
                                                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                {attendances.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                                                            No attendance records found
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    attendances.map((record, index) => (
                                                        <tr key={record.id ?? index} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4 text-sm text-gray-400">
                                                                {index + 1}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                                                                {formatDate(record.attendance_date)}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-mono text-gray-700">
                                                                {formatTime(record.check_in)}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-mono text-gray-700">
                                                                {formatTime(record.check_out)}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                                {record.total_hours ? `${record.total_hours} min` : '--'}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                                                                    {record.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                                {record.notes ?? '-'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}