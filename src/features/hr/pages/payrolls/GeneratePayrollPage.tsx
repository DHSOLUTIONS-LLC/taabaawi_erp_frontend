// src/features/hr/payrolls/GeneratePayrollPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGeneratePayrollMutation } from '../../../../services/hrApi';
import { useGetEmployeesQuery } from '../../../../services/hrApi';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';
import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import type { RootState } from '../../../../app/store';
import { useAppSelector } from '../../../../app/hooks';

export default function GeneratePayrollPage() {
    const { user } = useAppSelector((state: RootState) => state.auth);
    // Check user role
    const isSuperAdmin = user?.role?.role_name === 'Super Admin';
    const isHR = user?.role?.role_name === 'HR';
    const basePath = isSuperAdmin ? '/admin' : isHR ? '' : '';

    const navigate = useNavigate();
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    const { data: employeesResponse } = useGetEmployeesQuery();
    const [generatePayroll, { isLoading }] = useGeneratePayrollMutation();

    const employees = employeesResponse?.data?.data || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedEmployee || !selectedMonth) {
            alert('Please select employee and month');
            return;
        }

        try {
            await generatePayroll({
                user_id: parseInt(selectedEmployee),
                payroll_month: selectedMonth
            }).unwrap();

            alert('Payroll generated successfully');
            navigate(`${basePath}/hr/payrolls`);
        } catch (error: any) {
            console.error('Failed to generate payroll:', error);
            alert(error?.data?.message || 'Failed to generate payroll');
        }
    };

    // Generate month options (last 12 months)
    const monthOptions = [];
    for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        monthOptions.push({
            value: date.toISOString().slice(0, 7),
            label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        });
    }



    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-row justify-between items-center">
                    <Link to={`${basePath}/hr/payrolls`} className="flex flex-row items-center">
                        <img src={arrow_back_icon} alt="Back" className="w-6 h-6 md:w-8 md:h-8" />
                        <span className="px-2 font-semibold text-sm md:text-base">Generate Payroll</span>
                    </Link>
                </div>

                {/* Form */}
                <div className="bg-white rounded-xl p-2 md:p-6 max-w-full mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Employee Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Employee <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedEmployee}
                                    onChange={(e) => setSelectedEmployee(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">Choose an employee</option>
                                    {employees.map((emp: any) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name} ({emp.employee_id})
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        {/* Month Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payroll Month <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    {monthOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-700">
                                <span className="font-semibold">Note:</span> The system will automatically calculate:
                            </p>
                            <ul className="mt-2 text-sm text-blue-600 list-disc list-inside">
                                <li>Basic salary from employee record</li>
                                <li>All allowances (transport, housing, etc.)</li>
                                <li>Bonuses for the selected month</li>
                                <li>Deductions based on absent days</li>
                                <li>Working days, present days, and leave days</li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-4">
                            <Link
                                to="/hr/payrolls"
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Generating...' : 'Generate Payroll'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}