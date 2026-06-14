import { useDispatch, useSelector } from 'react-redux';
import { Search, X, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { setCustomerFilters, resetCustomerFilters } from '../../../../features/crm/crmSlice';
import type { RootState } from '../../../../app/store';

export const CustomerFilters = () => {
  const dispatch = useDispatch();
  const filters = useSelector((s: RootState) => s.crm.customerFilters);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sync URL params with Redux on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const search = urlParams.get("search") || "";
    const tier = urlParams.get("tier") || "";
    const status = urlParams.get("status") || "";
    const start_date = urlParams.get("start_date") || null;
    const end_date = urlParams.get("end_date") || null;
    
    // Only update if there are URL params
    if (search || tier || status || start_date || end_date) {
      dispatch(setCustomerFilters({ 
        search, 
        tier, 
        status, 
        start_date, 
        end_date,
        page: 1 
      }));
    }
  }, [dispatch]);

  const updateUrlParams = (patch: any) => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Update URL params based on patch
    Object.keys(patch).forEach(key => {
      const value = patch[key];
      if (value && value !== "" && value !== null) {
        urlParams.set(key, value);
      } else {
        urlParams.delete(key);
      }
    });
    
    // Always reset to page 1 when filtering
    urlParams.set("page", "1");
    
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.pushState({}, "", newUrl);
    
    // Dispatch popstate event to notify main component
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const set = (patch: any) => {
    // Update Redux
    dispatch(setCustomerFilters(patch));
    // Update URL
    updateUrlParams(patch);
  };

  const handleReset = () => {
    // Reset Redux
    dispatch(resetCustomerFilters());
    
    // Clear URL params
    const urlParams = new URLSearchParams(window.location.search);
    const filterKeys = ["search", "status", "tier", "start_date", "end_date", "min_spent", "max_spent"];
    filterKeys.forEach(key => urlParams.delete(key));
    urlParams.set("page", "1");
    
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.pushState({}, "", newUrl);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const hasActiveFilters = filters.search || filters.status || filters.tier || filters.start_date || filters.end_date;

  return (
    <div className="space-y-3">
      {/* Mobile Filter Toggle */}
      <div className="sm:hidden">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
            {hasActiveFilters && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">
                Active
              </span>
            )}
          </div>
          <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showMobileFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Filters Content */}
      <div className={`${showMobileFilters ? 'block' : 'hidden'} sm:block`}>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search name, email, phone..."
              value={filters.search}
              onChange={e => set({ search: e.target.value, page: 1 })}
            />
          </div>

          {/* Status */}
          <select
            className="w-full sm:w-auto border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
            className="w-full sm:w-auto border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="date"
              className="w-full sm:w-auto border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.start_date ?? ''}
              onChange={e => set({ start_date: e.target.value || null, page: 1 })}
              placeholder="Start Date"
            />
            <span className="hidden sm:inline text-gray-400 self-center">-</span>
            <input
              type="date"
              className="w-full sm:w-auto border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.end_date ?? ''}
              onChange={e => set({ end_date: e.target.value || null, page: 1 })}
              placeholder="End Date"
            />
          </div>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
          >
            <X className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Active Filters Display for Mobile */}
      {hasActiveFilters && (
        <div className="sm:hidden flex flex-wrap gap-2 mt-2">
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
              Search: {filters.search}
              <button onClick={() => set({ search: '', page: 1 })} className="hover:text-blue-900">×</button>
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
              Status: {filters.status}
              <button onClick={() => set({ status: '', page: 1 })} className="hover:text-blue-900">×</button>
            </span>
          )}
          {filters.tier && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
              Tier: {filters.tier}
              <button onClick={() => set({ tier: '', page: 1 })} className="hover:text-blue-900">×</button>
            </span>
          )}
          {(filters.start_date || filters.end_date) && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
              Date: {filters.start_date || 'any'} - {filters.end_date || 'any'}
              <button onClick={() => set({ start_date: null, end_date: null, page: 1 })} className="hover:text-blue-900">×</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};