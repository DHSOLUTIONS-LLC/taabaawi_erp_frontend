// src/features/accounting/components/ExpenseFilters.tsx
import { useState } from 'react';
import search_icon from '../../../assets/icons/search_icon.svg';
import dropdown_arrow_icon from '../../../assets/icons/dropdown_arrow_icon.svg';
import calendar_icon from '../../../assets/icons/calender_icon.png';

interface ExpenseFiltersProps {
  onFilterChange: (filters: any) => void;
  categories: any[];
  branches: any[];
  initialFilters?: any;
}

export default function ExpenseFilters({ onFilterChange, categories, branches, initialFilters = {} }: ExpenseFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(initialFilters.status || '');
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || '');
  const [selectedBranch, setSelectedBranch] = useState(initialFilters.branch || '');
  const [startDate, setStartDate] = useState(initialFilters.startDate || '');
  const [endDate, setEndDate] = useState(initialFilters.endDate || '');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Paid', label: 'Paid' },
  ];

  const applyFilters = () => {
    onFilterChange({
      search: searchQuery,
      status: selectedStatus,
      category: selectedCategory,
      branch: selectedBranch,
      startDate,
      endDate,
    });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setSelectedCategory('');
    setSelectedBranch('');
    setStartDate('');
    setEndDate('');
    onFilterChange({
      search: '',
      status: '',
      category: '',
      branch: '',
      startDate: '',
      endDate: '',
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <img src={search_icon} alt="" className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search by vendor, invoice #, or description..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="relative w-full md:w-36">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white pr-10 text-sm focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
          </div>
        </div>

        {/* Category Filter */}
        <div className="relative w-full md:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white pr-10 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.category_name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
          </div>
        </div>

        {/* Branch Filter */}
        <div className="relative w-full md:w-48">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white pr-10 text-sm focus:ring-2 focus:ring-blue-500"
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

        {/* Date Range */}
        <div className="relative flex items-center gap-2">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <img src={calendar_icon} alt="" className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full md:w-36 pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Start Date"
            />
          </div>
          <span className="text-gray-400">to</span>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <img src={calendar_icon} alt="" className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full md:w-36 pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="End Date"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={applyFilters}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
          <button
            onClick={resetFilters}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(searchQuery || selectedStatus || selectedCategory || selectedBranch || startDate || endDate) && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">Active filters:</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
              Search: {searchQuery}
              <button onClick={() => { setSearchQuery(''); applyFilters(); }} className="hover:text-blue-900">×</button>
            </span>
          )}
          {selectedStatus && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
              Status: {selectedStatus}
              <button onClick={() => { setSelectedStatus(''); applyFilters(); }} className="hover:text-blue-900">×</button>
            </span>
          )}
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
              Category: {categories.find((c: any) => c.id === parseInt(selectedCategory))?.category_name}
              <button onClick={() => { setSelectedCategory(''); applyFilters(); }} className="hover:text-blue-900">×</button>
            </span>
          )}
          {selectedBranch && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
              Branch: {branches.find((b: any) => b.id === parseInt(selectedBranch))?.branch_name}
              <button onClick={() => { setSelectedBranch(''); applyFilters(); }} className="hover:text-blue-900">×</button>
            </span>
          )}
          {(startDate || endDate) && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
              Date: {startDate || 'any'} to {endDate || 'any'}
              <button onClick={() => { setStartDate(''); setEndDate(''); applyFilters(); }} className="hover:text-blue-900">×</button>
            </span>
          )}
          <button onClick={resetFilters} className="text-xs text-red-500 hover:text-red-700">Clear all</button>
        </div>
      )}
    </div>
  );
}