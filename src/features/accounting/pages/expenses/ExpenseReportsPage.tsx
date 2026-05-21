// src/features/accounting/pages/ExpenseReportsPage.tsx
import { useState } from 'react';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useGetExpenseStatisticsQuery, useGetExpenseSummaryQuery } from '../../../../services/accountingApi';
import { useGetBranchesQuery } from '../../../../services/superAdminApi';
import { useGetExpenseCategoriesQuery } from '../../../../services/accountingApi';
// import dropdown_arrow_icon from '../../../assets/icons/dropdown_arrow_icon.svg';

export default function ExpenseReportsPage() {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [groupBy, setGroupBy] = useState<'category' | 'branch' | 'month' | 'payment_method'>('category');

  const { data: statsData, isLoading: statsLoading } = useGetExpenseStatisticsQuery({ start_date: startDate, end_date: endDate, branch_id: selectedBranch ? parseInt(selectedBranch) : undefined });
  const { data: summaryData, isLoading: summaryLoading } = useGetExpenseSummaryQuery({ start_date: startDate, end_date: endDate, branch_id: selectedBranch ? parseInt(selectedBranch) : undefined, expense_category_id: selectedCategory ? parseInt(selectedCategory) : undefined, group_by: groupBy });
  const { data: branchesData } = useGetBranchesQuery();
  const { data: categoriesData } = useGetExpenseCategoriesQuery({ is_active: true });

  const stats = statsData?.data;
  const summary = summaryData?.data;
  const branches = Array.isArray(branchesData) ? branchesData : [];
  const categories = categoriesData?.data || [];

  const groupByOptions = [{ value: 'category', label: 'By Category' }, { value: 'branch', label: 'By Branch' }, { value: 'month', label: 'By Month' }, { value: 'payment_method', label: 'By Payment Method' }];

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        <div><h1 className="text-xl md:text-2xl font-bold text-gray-900">Expense Reports</h1><p className="text-xs md:text-sm text-gray-500 mt-1">Analyze company expenses by category, branch, and period</p></div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-3">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-4 py-2.5 border rounded-lg text-sm" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-4 py-2.5 border rounded-lg text-sm" />
            <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="px-4 py-2.5 border rounded-lg appearance-none bg-white pr-8"><option value="">All Branches</option>{branches.map((b: any) => (<option key={b.id} value={b.id}>{b.branch_name}</option>))}</select>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-4 py-2.5 border rounded-lg appearance-none bg-white pr-8"><option value="">All Categories</option>{categories.map((c: any) => (<option key={c.id} value={c.id}>{c.category_name}</option>))}</select>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)} className="px-4 py-2.5 border rounded-lg appearance-none bg-white pr-8">{groupByOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border"><p className="text-sm text-gray-500">Total Expenses</p><p className="text-2xl font-bold text-gray-900">{stats?.total_count || 0}</p></div>
          <div className="bg-white rounded-xl p-5 border"><p className="text-sm text-gray-500">Total Amount</p><p className="text-2xl font-bold text-blue-600">KWD {stats?.total_amount || '0.000'}</p></div>
          <div className="bg-white rounded-xl p-5 border"><p className="text-sm text-gray-500">Pending Approval</p><p className="text-2xl font-bold text-yellow-600">KWD {stats?.pending_amount || '0.000'}</p></div>
          <div className="bg-white rounded-xl p-5 border"><p className="text-sm text-gray-500">Paid Expenses</p><p className="text-2xl font-bold text-green-600">KWD {stats?.paid_amount || '0.000'}</p></div>
        </div>

        {/* Summary Table */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border">
          <div className="px-6 py-4 border-b"><h3 className="text-base font-semibold">Expense Summary ({groupByOptions.find(o => o.value === groupBy)?.label})</h3><p className="text-xs text-gray-500 mt-1">{new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p></div>
          {summaryLoading ? (<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>) : (
            <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr>{summary?.summary?.[0] && Object.keys(summary.summary[0]).map(key => (<th key={key} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{key.replace(/_/g, ' ')}</th>))}</tr></thead><tbody className="divide-y">{summary?.summary?.map((item: any, idx: number) => (<tr key={idx} className="hover:bg-gray-50">{Object.values(item).map((val: any, i: number) => (<td key={i} className="px-6 py-3 text-sm">{typeof val === 'number' ? `KWD ${val.toFixed(3)}` : val}</td>))}</tr>))}</tbody></table></div>
          )}
          <div className="px-6 py-4 bg-gray-50 border-t"><div className="flex justify-between"><span className="font-semibold">Total</span><span className="font-bold text-blue-600">KWD {summary?.total_amount || '0.000'}</span></div></div>
        </div>
      </div>
    </DashboardLayout>
  );
}