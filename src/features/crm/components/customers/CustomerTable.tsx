import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { CustomerStatusBadge, TierBadge } from './CustomerStatusBadge';
import { openCustomerModal, setCustomerFilters } from '../../../../features/crm/crmSlice';
import { useDeleteCustomerMutation, useGetCustomersQuery } from '../../../../services/crmApi';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';

export const CustomerTable = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [deleteCustomer] = useDeleteCustomerMutation();
  const { user } = useAppSelector((s: RootState) => s.auth);
  const filters = useSelector((s: RootState) => s.crm.customerFilters);

  const { data: customersData, isLoading } = useGetCustomersQuery({
    ...filters,
    is_active: filters.is_active ?? undefined,
    start_date: filters.start_date ?? undefined,
    end_date: filters.end_date ?? undefined,
  });

  const customers = Array.isArray(customersData?.data) ? customersData.data : [];
  const meta = customersData?.meta;
  const page = filters.page;
  const perPage = filters.per_page;
  const sortBy = filters.sort_by;
  const sortOrder = filters.sort_order;
  const totalPages = meta ? Math.ceil(meta.total / perPage) : 1;
  const basePath = user?.role?.role_name === 'Super Admin' ? '/admin' : '';

  const setSort = (col: string) =>
    dispatch(setCustomerFilters({
      sort_by: col,
      sort_order: sortBy === col && sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));

  const SortIcon = ({ col }: { col: string }) =>
    sortBy === col
      ? sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
      : <ChevronUp className="h-3.5 w-3.5 text-gray-300" />;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
        <div className="xl:col-span-4 overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  { label: 'Customer', col: 'first_name' },
                  { label: 'Email', col: 'email' },
                  { label: 'Phone', col: 'phone' },
                  { label: 'Status', col: 'customer_status' },
                  { label: 'Tier', col: 'loyalty_tier' },
                  { label: 'Orders', col: 'total_orders' },
                  { label: 'Total Spent', col: 'total_spent' },
                  { label: 'Joined', col: 'created_at' },
                ].map(({ label, col }) => (
                  <th
                    key={col}
                    onClick={() => setSort(col)}
                    className="px-3 sm:px-4 py-3 text-left font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700 whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">{label}<SortIcon col={col} /></div>
                  </th>
                ))}
                <th className="px-3 sm:px-4 py-3 text-right font-medium text-gray-500 whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: perPage }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-3 sm:px-4 py-3"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>
                    ))}
                  </tr>
                ))
                : customers.length === 0
                  ? (
                    <tr>
                      <td colSpan={9} className="px-3 sm:px-4 py-10 text-center text-gray-400">
                        No customers found
                      </td>
                    </tr>
                  )
                  : customers.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-4 py-3">
                        <div className="font-medium text-gray-900 text-sm">{c.first_name} {c.last_name}</div>
                        {c.company_name && <div className="text-xs text-gray-400">{c.company_name}</div>}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-gray-600 text-xs sm:text-sm">{c.email ?? '-'}</td>
                      <td className="px-3 sm:px-4 py-3 text-gray-600 text-xs sm:text-sm">{c.phone ?? c.mobile ?? '-'}</td>
                      <td className="px-3 sm:px-4 py-3"><CustomerStatusBadge status={c.customer_status ?? c.status} /></td>
                      <td className="px-3 sm:px-4 py-3"><TierBadge tier={c.loyalty_tier} /></td>
                      <td className="px-3 sm:px-4 py-3 text-gray-600 text-xs sm:text-sm">{c.total_orders || 0}</td>
                      <td className="px-3 sm:px-4 py-3 text-gray-600 text-xs sm:text-sm">${Number(c.total_spent || 0).toLocaleString()}</td>
                      <td className="px-3 sm:px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td className="px-3 sm:px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => navigate(`${basePath}/crm/customers/${c.id}`)} className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded" title="View">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => dispatch(openCustomerModal({ mode: 'edit', customer: c }))} className="p-1.5 hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 rounded" title="Edit">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={async () => { if (!confirm(`Delete ${c.first_name} ${c.last_name}?`)) return; await deleteCustomer(c.id); }} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>


      {meta && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span className="text-xs sm:text-sm">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, meta.total)} of {meta.total}</span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => dispatch(setCustomerFilters({ page: page - 1 }))}
              className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 text-sm"
            >
              Prev
            </button>
            <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-sm">{page} / {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => dispatch(setCustomerFilters({ page: page + 1 }))}
              className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};