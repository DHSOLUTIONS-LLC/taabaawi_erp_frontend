import { useDispatch, useSelector } from 'react-redux';
import { Search, X } from 'lucide-react';
import { setCustomerFilters, resetCustomerFilters } from '../../../../features/crm/crmSlice';
import type { RootState } from '../../../../app/store';

export const CustomerFilters = () => {
  const dispatch = useDispatch();
  const filters = useSelector((s: RootState) => s.crm.customerFilters);

  const set = (patch: any) => dispatch(setCustomerFilters(patch));

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        <input
          className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-56 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Search name, email, phone..."
          value={filters.search}
          onChange={e => set({ search: e.target.value, page: 1 })}
        />
      </div>

      {/* Status */}
      <select
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={filters.status}
        onChange={e => set({ status: e.target.value, page: 1 })}
      >
        <option value="">All Status</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
        <option value="Blocked">Blocked</option>
        <option value="Lead">Lead</option>
      </select>

      {/* Tier */}
      <select
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={filters.tier}
        onChange={e => set({ tier: e.target.value, page: 1 })}
      >
        <option value="">All Tiers</option>
        <option value="Bronze">Bronze</option>
        <option value="Silver">Silver</option>
        <option value="Gold">Gold</option>
        <option value="Platinum">Platinum</option>
      </select>

      {/* Date range */}
      <input
        type="date"
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={filters.start_date ?? ''}
        onChange={e => set({ start_date: e.target.value || null, page: 1 })}
      />
      <input
        type="date"
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={filters.end_date ?? ''}
        onChange={e => set({ end_date: e.target.value || null, page: 1 })}
      />

      {/* Reset */}
      <button
        onClick={() => dispatch(resetCustomerFilters())}
        className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
      >
        <X className="h-3.5 w-3.5" /> Reset
      </button>
    </div>
  );
};