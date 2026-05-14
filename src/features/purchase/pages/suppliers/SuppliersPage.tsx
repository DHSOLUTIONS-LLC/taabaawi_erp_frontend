// src/features/purchase/pages/suppliers/SuppliersPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useGetSuppliersQuery, 
  useDeleteSupplierMutation 
} from '../../../../services/purchaseApi';
import CreateSupplierModal from './CreateSupplierPage';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';

import search_icon from '../../../../assets/icons/search_icon.svg';
import add_icon from '../../../../assets/icons/add.svg';
// import edit_icon from '../../../../assets/icons/edit_icon.svg';
import delete_icon from '../../../../assets/icons/delete-icon.png';

const RATING_COLORS: Record<string, string> = {
  Excellent: 'bg-green-100 text-green-700',
  Good: 'bg-blue-100 text-blue-700',
  Average: 'bg-yellow-100 text-yellow-700',
  Poor: 'bg-red-100 text-red-700',
};

export default function SuppliersPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const { data, isLoading, refetch } = useGetSuppliersQuery({
    search: search || undefined,
    rating: filterRating || undefined,
    country: filterCountry || undefined,
    page: currentPage,
    per_page: 15,
  });

  console.log('suppliers:', data)

  const [deleteSupplier] = useDeleteSupplierMutation();

  const suppliers = (data as any)?.data?.data || (data as any)?.data || [];
  const pagination = (data as any)?.data;

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await deleteSupplier(id).unwrap();
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to delete supplier');
    }
  };

  const countries = [...new Set(suppliers.map((s: any) => s.country))];

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header - Responsive */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div>
    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Suppliers</h1>
    <p className="text-xs md:text-sm text-gray-500 mt-1">Manage your suppliers and vendors</p>
  </div>
  <button
    onClick={() => setShowCreateModal(true)}
    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
  >
    <img src={add_icon} alt="" className="w-4 h-4" />
    Add Supplier
  </button>
</div>

{/* Filters - Grid based responsive */}
<div className="bg-white rounded-xl p-4">
  {/* Search - Full width */}
  <div className="relative mb-3">
    <img src={search_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
    <input
      type="text"
      value={search}
      onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
      placeholder="Search by name, email, or code..."
      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
    />
  </div>

  {/* Filters - 2 column grid on mobile, row on desktop */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-3">
    <select
      value={filterRating}
      onChange={(e) => { setFilterRating(e.target.value); setCurrentPage(1); }}
      className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
    >
      <option value="">All Ratings</option>
      <option value="Excellent">Excellent</option>
      <option value="Good">Good</option>
      <option value="Average">Average</option>
      <option value="Poor">Poor</option>
    </select>

    <select
      value={filterCountry}
      onChange={(e) => { setFilterCountry(e.target.value); setCurrentPage(1); }}
      className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
    >
      <option value="">All Countries</option>
      {countries.map((country: any) => (
        <option key={country} value={country}>{country}</option>
      ))}
    </select>

    {(search || filterRating || filterCountry) && (
      <button
        onClick={() => { setSearch(''); setFilterRating(''); setFilterCountry(''); setCurrentPage(1); }}
        className="px-4 py-2.5 text-sm text-gray-500 hover:text-red-500 border border-gray-300 rounded-lg transition-colors sm:col-span-2 lg:col-span-1"
      >
        Clear Filters
      </button>
    )}
  </div>
</div>


        {/* Table */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : suppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <p className="text-gray-500 font-medium">No suppliers found</p>
            </div>
          ) : (
             <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
<div className="xl:col-span-4 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Country</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Payment Terms</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Credit Limit</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Rating</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {suppliers.map((supplier: any) => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{supplier.supplier_name}</div>
                        <div className="text-xs text-gray-500">{supplier.company_name}</div>
                        <div className="text-xs text-gray-400 mt-1">{supplier.supplier_code}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{supplier.email}</div>
                        <div className="text-xs text-gray-500">{supplier.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{supplier.country}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">Net {supplier.payment_terms_days}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        KWD {parseFloat(supplier.credit_limit || 0).toFixed(3)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${RATING_COLORS[supplier.rating] || 'bg-gray-100 text-gray-700'}`}>
                          {supplier.rating}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          supplier.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {supplier.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`${basePath}/purchase/suppliers/${supplier.id}`)}
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            View
                          </button>
                           
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600"
                          >
                            <img src={delete_icon} alt="Delete" className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
             </div>
            
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.current_page} of {pagination.last_page}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))}
                disabled={currentPage === pagination.last_page}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Supplier Modal */}
      <CreateSupplierModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          refetch();
        }}
      />
    </DashboardLayout>
  );
}