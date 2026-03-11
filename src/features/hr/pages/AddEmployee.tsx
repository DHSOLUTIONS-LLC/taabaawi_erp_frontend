// src/features/hr/pages/AddEmployee.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateEmpMutation } from '../../../services/hrApi';
import { useAppSelector } from '../../../app/hooks';
import type { RootState } from '../../../app/store';
import { useGetBranchesQuery, useGetRolesQuery } from '../../../services/superAdminApi';
import dropdown_arrow_icon from '../../../assets/icons/dropdown_arrow_icon.svg';
import add_icon from '../../../assets/icons/add.svg';
import arrow_back_icon from '../../../assets/icons/arrow_back_icon.svg';
import edit_icon from '../../../assets/icons/edit_employee.svg';
import tick_icon from '../../../assets/icons/tick_icon.svg';
import tick_icon_1 from '../../../assets/icons/tick_icon_1.svg';
import cross_icon from '../../../assets/icons/cross_icon.svg';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../../layouts/DashboardLayout';

// Update interface
interface CreateEmployeeData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone: string;
    role_id: number;
    branch_id: number;
    is_active: boolean;
    // HR Fields (Optional)
    national_id?: string;
    date_of_birth?: string;
    gender?: string;
    marital_status?: string;
    joining_date?: string;
    job_title?: string;
    department?: string;
    basic_salary?: number;
    transportation_allowance?: number;
    housing_allowance?: number;
    communication_allowance?: number;
    meal_allowance?: number;
    accommodation_allowance?: number;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    address?: string;
}

interface Allowance {
    id: string;
    type: string;
    amount: number;
}

export default function AddEmployee() {
    const navigate = useNavigate();
    const { user } = useAppSelector((state: RootState) => state.auth);
    const [createUser, { isLoading }] = useCreateEmpMutation();
    const [isEditingAllowances, setIsEditingAllowances] = useState(false);
    
    // State with backend-compatible fields
    const [formData, setFormData] = useState({
        // Required fields
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        role_id: '',
        branch_id: '',
        is_active: true,
        
        // Optional HR fields
        national_id: '',
        gender: '',
        date_of_birth: '',
        marital_status: '',
        joining_date: '',
        job_title: '',
        department: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        
        // Allowances
        basic_salary: '',
        transportation_allowance: '',
        housing_allowance: '',
        communication_allowance: '',
        meal_allowance: '',
        accommodation_allowance: '',
    });

    // Allowances table state (keeping original UI)
    const [allowances, setAllowances] = useState<Allowance[]>([
        { id: '1', type: 'Housing Allowance', amount: 150 },
        { id: '2', type: 'Transport Allowance', amount: 75 }
    ]);

    // Fetch roles and branches for dropdowns
    const { data: roles = [] } = useGetRolesQuery();
    const { data: branches = [] } = useGetBranchesQuery();

    // Check user role for navigation
    const isSuperAdmin = user?.role?.role_name === 'Super Admin';
    const isHR = user?.role?.role_name === 'HR';
    const basePath = isSuperAdmin ? '/admin' : isHR ? '/hr' : '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            // Combine first and last name
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();
            
            // Prepare data for API
            const employeeData: CreateEmployeeData = {
                name: fullName,
                email: formData.email,
                password: formData.password,
                password_confirmation: formData.password_confirmation,
                phone: formData.phone,
                role_id: Number(formData.role_id),
                branch_id: Number(formData.branch_id),
                is_active: formData.is_active,
                
                // Optional fields (only send if not empty)
                ...(formData.national_id && { national_id: formData.national_id }),
                ...(formData.date_of_birth && { date_of_birth: formData.date_of_birth }),
                ...(formData.gender && { gender: formData.gender }),
                ...(formData.marital_status && { marital_status: formData.marital_status }),
                ...(formData.joining_date && { joining_date: formData.joining_date }),
                ...(formData.job_title && { job_title: formData.job_title }),
                ...(formData.department && { department: formData.department }),
                ...(formData.address && { address: formData.address }),
                ...(formData.emergency_contact_name && { emergency_contact_name: formData.emergency_contact_name }),
                ...(formData.emergency_contact_phone && { emergency_contact_phone: formData.emergency_contact_phone }),
                
                // Allowances (convert to numbers)
                ...(formData.basic_salary && { basic_salary: parseFloat(formData.basic_salary) }),
                ...(formData.transportation_allowance && { transportation_allowance: parseFloat(formData.transportation_allowance) }),
                ...(formData.housing_allowance && { housing_allowance: parseFloat(formData.housing_allowance) }),
                ...(formData.communication_allowance && { communication_allowance: parseFloat(formData.communication_allowance) }),
                ...(formData.meal_allowance && { meal_allowance: parseFloat(formData.meal_allowance) }),
                ...(formData.accommodation_allowance && { accommodation_allowance: parseFloat(formData.accommodation_allowance) }),
            };

            await createUser(employeeData).unwrap();
            console.log('emp created:', employeeData)
            alert('Employee created successfully!');
            
        } catch (error) {
            console.error('Failed to create employee:', error);
            alert('Failed to create employee. Please check all fields.');
        }
    };

    const handleAddAllowance = () => {
        const newAllowance: Allowance = {
            id: Date.now().toString(),
            type: '',
            amount: 0
        };
        setAllowances([...allowances, newAllowance]);
    };

    const handleUpdateAllowance = (id: string, field: keyof Allowance, value: string | number) => {
        const updatedAllowances = allowances.map(allowance =>
            allowance.id === id ? { ...allowance, [field]: value } : allowance
        );
        setAllowances(updatedAllowances);
    };

    const handleRemoveAllowance = (id: string) => {
        const updatedAllowances = allowances.filter(allowance => allowance.id !== id);
        setAllowances(updatedAllowances);
    };

    const handleCancel = () => {
        navigate(-1);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className='flex flex-row justify-between items-center'>
                    <Link to={`${basePath}/employees`} className='flex flex-row items-center'>
                        <img src={arrow_back_icon} alt="Back" className='w-6 h-6 md:w-8 md:h-8' />
                        <span className='px-2 font-semibold text-sm md:text-base'>Add New Employee</span>
                    </Link>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information Section */}
                    <div className="bg-white rounded-xl p-4 md:p-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">Personal Information</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    placeholder="Enter first name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    placeholder="Enter last name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    National ID
                                </label>
                                <input
                                    type="text"
                                    value={formData.national_id}
                                    onChange={(e) => setFormData({...formData, national_id: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    placeholder="Enter national ID"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Gender
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    value={formData.date_of_birth}
                                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Marital Status
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.marital_status}
                                        onChange={(e) => setFormData({...formData, marital_status: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    >
                                        <option value="">Select Status</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Divorced">Divorced</option>
                                        <option value="Widowed">Widowed</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white rounded-xl p-4 md:p-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">Contact Information</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Phone <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    placeholder="+965 XXXXXXXX"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    placeholder="employee@company.com"
                                />
                            </div>

                            <div className="sm:col-span-2 lg:col-span-1">
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    placeholder="Enter full address"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Emergency Contact Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.emergency_contact_name}
                                    onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    placeholder="Emergency contact name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Emergency Contact Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.emergency_contact_phone}
                                    onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    placeholder="Emergency contact phone"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Employment Details */}
                    <div className="bg-white rounded-xl p-4 md:p-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">Employment Details</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Branch <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        required
                                        value={formData.branch_id}
                                        onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map((branch: any) => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.branch_name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Department
                                </label>
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    placeholder="Department"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        required
                                        value={formData.role_id}
                                        onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    >
                                        <option value="">Select Role</option>
                                        {roles.map((role: any) => (
                                            <option key={role.id} value={role.id}>
                                                {role.role_name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Job Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.job_title}
                                    onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    placeholder="Job title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Joining Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.joining_date}
                                    onChange={(e) => setFormData({...formData, joining_date: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Status
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.is_active ? 'active' : 'inactive'}
                                        onChange={(e) => setFormData({...formData, is_active: e.target.value === 'active'})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Salary & Allowances Section - Keeping Original UI */}
                    <div className="bg-white rounded-xl p-4 md:p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Basic Salary Column */}
                            <div>
                                <label className="block text-md font-medium text-gray-400 mb-2">
                                    Basic Salary
                                </label>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={formData.basic_salary}
                                    onChange={(e) => setFormData({...formData, basic_salary: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    placeholder="Enter basic salary"
                                />
                            </div>

                            {/* Allowances Column - Original Table UI */}
                            <div className='shadow-lg rounded-xl overflow-hidden'>
                                <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
                                    <span className="text-md font-bold text-gray-700">Monthly Allowances</span>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingAllowances(!isEditingAllowances)}
                                        className="cursor-pointer rounded-lg transition-colors px-6"
                                    >
                                        {isEditingAllowances ? (
                                            <img src={tick_icon} alt="Save" className="w-5 h-5" />
                                        ) : (
                                            <img src={edit_icon} alt="Edit" className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="py-3 text-left text-xs font-semibold text-gray-600 uppercase px-4">Allowance Type</th>
                                                <th className="py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                                {isEditingAllowances && (
                                                    <th className="py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allowances.map((allowance) => (
                                                <tr key={allowance.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-4">
                                                        {isEditingAllowances ? (
                                                            <input
                                                                type="text"
                                                                value={allowance.type}
                                                                onChange={(e) => handleUpdateAllowance(allowance.id, 'type', e.target.value)}
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                                            />
                                                        ) : (
                                                            <span className="text-sm text-gray-800">{allowance.type}</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3">
                                                        {isEditingAllowances ? (
                                                            <input
                                                                type="number"
                                                                value={allowance.amount}
                                                                onChange={(e) => handleUpdateAllowance(allowance.id, 'amount', parseFloat(e.target.value) || 0)}
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                                            />
                                                        ) : (
                                                            <span className="text-sm text-gray-800">KWD {allowance.amount.toFixed(2)}</span>
                                                        )}
                                                    </td>
                                                    {isEditingAllowances && (
                                                        <td className="py-3">
                                                            <div className="flex items-center space-x-2">
                                                                <button
                                                                    type="button"
                                                                    className="p-1 hover:bg-green-50 rounded transition-colors"
                                                                >
                                                                    <img src={tick_icon_1} alt="Save" className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveAllowance(allowance.id)}
                                                                    className="p-1 hover:bg-red-50 rounded transition-colors"
                                                                >
                                                                    <img src={cross_icon} alt="Remove" className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {isEditingAllowances && (
                                    <div className='px-4 pb-4 pt-2'>
                                        <button
                                            type="button"
                                            onClick={handleAddAllowance}
                                            className="mt-4 flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                                        >
                                            <img src={add_icon} alt="Add" className="w-4 h-4" />
                                            <span className="text-sm font-medium">Add Allowance</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Additional Allowance Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Transportation Allowance
                                </label>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={formData.transportation_allowance}
                                    onChange={(e) => setFormData({...formData, transportation_allowance: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    placeholder="0.000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Housing Allowance
                                </label>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={formData.housing_allowance}
                                    onChange={(e) => setFormData({...formData, housing_allowance: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    placeholder="0.000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Communication Allowance
                                </label>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={formData.communication_allowance}
                                    onChange={(e) => setFormData({...formData, communication_allowance: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    placeholder="0.000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Meal Allowance
                                </label>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={formData.meal_allowance}
                                    onChange={(e) => setFormData({...formData, meal_allowance: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    placeholder="0.000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Accommodation Allowance
                                </label>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={formData.accommodation_allowance}
                                    onChange={(e) => setFormData({...formData, accommodation_allowance: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    placeholder="0.000"
                                />
                            </div>
                        </div>
                    </div>

                    {/* System Access */}
                    <div className="bg-white rounded-xl p-4 md:p-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">System Access</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    placeholder="Enter password"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Confirm Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={formData.password_confirmation}
                                    onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    placeholder="Confirm password"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons - Responsive Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="w-full px-6 py-3 text-black hover:text-white border border-[#6155F5] font-medium rounded-lg hover:bg-[#6155F5] transition-colors cursor-pointer text-sm md:text-base"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-6 py-3 bg-[#6155F5] text-white font-medium rounded-lg hover:bg-[#4F46E5] transition-colors disabled:opacity-50 cursor-pointer text-sm md:text-base"
                        >
                            {isLoading ? 'Creating...' : 'Save Employee'}
                        </button>
                        
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}