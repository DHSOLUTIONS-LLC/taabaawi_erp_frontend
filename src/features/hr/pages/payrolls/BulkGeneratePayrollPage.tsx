// src/features/hr/payrolls/BulkGeneratePayrollPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGenerateBulkPayrollMutation } from '../../../../services/hrApi';
import { useGetBranchesQuery } from '../../../../services/superAdminApi';
import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';
import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';

export default function BulkGeneratePayrollPage() {
    const { user } = useAppSelector((state: RootState) => state.auth);

    // Check user role
    const isSuperAdmin = user?.role?.role_name === 'Super Admin';
    const isHR = user?.role?.role_name === 'HR';
    const basePath = isSuperAdmin
        ? '/admin'
        : isHR
            ? ''
            : '';

    const navigate = useNavigate();
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedBranch, setSelectedBranch] = useState('');

    const { data: branchesData = [] } = useGetBranchesQuery();
    const [generateBulk, { isLoading }] = useGenerateBulkPayrollMutation();

    const branches = Array.isArray(branchesData) ? branchesData : [];

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedMonth) {
            alert('Please select a month');
            return;
        }

        try {
            const result = await generateBulk({
                payroll_month: selectedMonth,
                branch_id: selectedBranch ? parseInt(selectedBranch) : undefined
            }).unwrap();

            alert(`Bulk generation completed!\nGenerated: ${result.data.generated}\nSkipped: ${result.data.skipped}`);
            navigate(`${basePath}/hr/payrolls`);
        } catch (error: any) {
            console.error('Failed to generate bulk payroll:', error);
            alert(error?.data?.message || 'Failed to generate bulk payroll');
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-row justify-between items-center">
                    <Link to={`${basePath}/hr/payrolls`} className="flex flex-row items-center">
                        <img src={arrow_back_icon} alt="Back" className="w-6 h-6 md:w-8 md:h-8" />
                        <span className="px-2 font-semibold text-sm md:text-base">Bulk Generate Payroll</span>
                    </Link>
                </div>

                {/* Form */}
                <div className="bg-white rounded-xl p-2 md:p-6 max-w-full mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
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

                        {/* Branch Filter (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Branch (Optional)
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedBranch}
                                    onChange={(e) => setSelectedBranch(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Branches</option>
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

                        {/* Info Box */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-700">
                                <span className="font-semibold">Note:</span> This will generate payroll for:
                            </p>
                            <ul className="mt-2 text-sm text-blue-600 list-disc list-inside">
                                <li>All active employees{selectedBranch ? ' in the selected branch' : ''}</li>
                                <li>Employees without existing payroll for the selected month</li>
                                <li>Auto-calculated salaries based on attendance and bonuses</li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-4">
                            <Link
                                to={`${basePath}/hr/payrolls`}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Generating...' : 'Generate Bulk Payroll'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}