// src/features/auth/pages/AddBonusesPage.tsx
import DashboardLayout from '../../../layouts/DashboardLayout';
import { useEffect, useRef, useState, useMemo } from 'react';

import {
    useGetBranchesQuery,
    useGetRolesQuery,
} from '../../../services/superAdminApi';

import {
    useGetEmployeesQuery,
    useCreateBonusMutation,
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

export default function AddBonusesPage() {
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
    const { user } = useAppSelector((state: RootState) => state.auth);
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [_open, setOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Bonus form fields
    const [bonusType, setBonusType] = useState('');
    const [amount, setAmount] = useState('');
    const [bonusDate, setBonusDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');

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
    const handleEmployeeSelect = (employeeId: number) => {
        setSelectedEmployeeIds(prev => {
            if (prev.includes(employeeId)) {
                return prev.filter(id => id !== employeeId);
            } else {
                return [...prev, employeeId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedEmployeeIds.length === filteredEmployees.length) {
            setSelectedEmployeeIds([]);
        } else {
            setSelectedEmployeeIds(filteredEmployees.map((e: Employee) => e.id));
        }
    };

    // Reset filters
    const handleResetFilters = () => {
        setSelectedBranch('');
        setSelectedRole('');
        setSearchQuery('');
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

    const [createBonus, { isLoading: isCreating }] = useCreateBonusMutation();

    const handleCreateBonus = async () => {
        if (!selectedEmployeeIds.length) {
            alert('Please select at least one employee');
            return;
        }

        if (!bonusType) {
            alert('Please select a bonus type');
            return;
        }

        // Validate that bonus type is one of the allowed values
        const allowedBonusTypes = ['Newborn Child', 'Monthly Sales', 'Quarterly', 'Semi Annual', 'Annual'];
        if (!allowedBonusTypes.includes(bonusType)) {
            alert('Invalid bonus type selected');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (!bonusDate) {
            alert('Please select a date');
            return;
        }

        try {
            if (selectedEmployeeIds.length === 1) {
                const employee = employees.find((e: Employee) => e.id === selectedEmployeeIds[0]);

                if (!employee) {
                    alert('Employee not found');
                    return;
                }

                const bonusPayload = {
                    user_id: employee.id,
                    bonus_type: bonusType, // This will now be one of the allowed values
                    amount: parseFloat(amount).toFixed(3),
                    bonus_date: bonusDate,
                    description: description || null
                };

                console.log('Sending payload:', JSON.stringify(bonusPayload, null, 2));

                const response = await createBonus(bonusPayload).unwrap();
                console.log('Success response:', response);

                alert('Bonus added successfully');
                // Clear form
                setSelectedEmployeeIds([]);
                setBonusType('');
                setAmount('');
                setDescription('');

            } else {
                // For multiple employees
                for (const employeeId of selectedEmployeeIds) {
                    const bonusPayload = {
                        user_id: employeeId,
                        bonus_type: bonusType,
                        amount: parseFloat(amount).toFixed(3),
                        bonus_date: bonusDate,
                        description: description || null
                    };
                    await createBonus(bonusPayload).unwrap();
                }

                alert(`Bonus added for ${selectedEmployeeIds.length} employees`);
                // Clear form
                setSelectedEmployeeIds([]);
                setBonusType('');
                setAmount('');
                setDescription('');
            }
        } catch (error: any) {
            console.error('Error:', error);
            alert('Failed to add bonus. Please try again.');
        }
    };



    const bonusTypeOptions = [
        'Monthly Sales',
        'Performance Bonus',
        'Festival Bonus',
        'Annual Bonus',
        'Special Achievement',
        'Referral Bonus',
        'Overtime Bonus',
        'Project Completion',
        'Other'
    ];




    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className='flex flex-row justify-between items-center'>
                    <Link to={`${basePath}/hr`} className='flex flex-row items-center'>
                        <img src={arrow_back_icon} alt="Back" className='w-6 h-6 md:w-8 md:h-8' />
                        <span className='px-2 font-semibold text-sm md:text-base'>Add Bonus</span>
                    </Link>
                </div>

                {/* Products Table Section */}
                <div className="bg-white rounded-xl overflow-hidden">
                    {/* Filters Row */}
                    <div className="p-6">
                        <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
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
                                    Showing {filteredEmployees.length} employees
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="relative mx-6 shadow rounded-xl mb-8">
                        <div className="px-6 py-3 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Employees</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-6 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={filteredEmployees.length > 0 && selectedEmployeeIds.length === filteredEmployees.length}
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
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {employeeLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                Loading employees...
                                            </td>
                                        </tr>
                                    ) : filteredEmployees.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center">
                                                <div className="text-gray-500 text-lg">
                                                    {searchQuery || selectedBranch || selectedRole ?
                                                        'No employees found matching your filters.' :
                                                        'No employees available.'
                                                    }
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEmployees.map((employee: Employee) => (
                                            <tr key={employee.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedEmployeeIds.includes(employee.id)}
                                                        onChange={() => handleEmployeeSelect(employee.id)}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-[14px] font-medium text-gray-900">{employee.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-[14px] text-gray-900 font-mono">{employee.employee_id}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex px-3 py-1 text-xs font-medium">
                                                        {employee.role?.role_name || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-[14px] text-gray-900">{employee.branch?.branch_name || 'N/A'}</div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Bonus Creation Form */}
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
                                        value={selectedEmployeeIds.length === 1 ?
                                            employees.find((e: Employee) => e.id === selectedEmployeeIds[0])?.employee_id || '' :
                                            selectedEmployeeIds.length > 1 ? 'Multiple selected' : ''}
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
                                        value={selectedEmployeeIds.length === 1 ?
                                            employees.find((e: Employee) => e.id === selectedEmployeeIds[0])?.name || '' :
                                            selectedEmployeeIds.length > 1 ? 'Multiple selected' : ''}
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Bonus Type Field - Using exact values from backend */}
                                <div>
                                    <label className="block text-md font-medium text-gray-400 mb-2">
                                        Bonus Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={bonusType}
                                        onChange={(e) => setBonusType(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                                        required
                                    >
                                        <option value="">Select Bonus Type</option>
                                        <option value="Newborn Child">Newborn Child</option>
                                        <option value="Monthly Sales">Monthly Sales</option>
                                        <option value="Quarterly">Quarterly</option>
                                        <option value="Semi Annual">Semi Annual</option>
                                        <option value="Annual">Annual</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-md font-medium text-gray-400 mb-2">
                                        Amount (KWD) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                                        placeholder="0.000"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-md font-medium text-gray-400 mb-2">
                                        Bonus Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={bonusDate}
                                        onChange={(e) => setBonusDate(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-md font-medium text-gray-400 mb-2">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                                        placeholder="Add any details about the bonus..."
                                        rows={2}
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                                <div></div>
                                <button
                                    onClick={handleCreateBonus}
                                    disabled={selectedEmployeeIds.length === 0 || !bonusType || !amount || isCreating}
                                    className={`w-full px-6 py-3 font-medium rounded-lg transition-colors cursor-pointer ${selectedEmployeeIds.length > 0 && bonusType && amount && !isCreating
                                        ? 'text-black hover:text-white border border-[#6155F5] hover:bg-[#6155F5]'
                                        : 'text-gray-400 border border-gray-300 cursor-not-allowed'
                                        }`}
                                >
                                    {isCreating ? 'Creating...' : 'Create Bonus'}
                                </button>
                                <div></div>
                            </div>

                            {selectedEmployeeIds.length > 0 && (
                                <div className="text-sm text-gray-600 text-center">
                                    Selected {selectedEmployeeIds.length} employee(s) for bonus
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}