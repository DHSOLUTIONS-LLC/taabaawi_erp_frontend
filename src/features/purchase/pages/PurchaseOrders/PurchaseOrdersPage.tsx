// src/features/purchase/pages/purchase-orders/PurchaseOrdersPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { 
  useGetPurchaseOrdersQuery, 
  useDeletePurchaseOrderMutation 
} from '../../../../services/purchaseApi';
import POStatusBadge from '../../components/POStatusBadge';

import search_icon from '../../../../assets/icons/search_icon.svg';
import add_icon from '../../../../assets/icons/add.svg';
import edit_icon from '../../../../assets/icons/edit_icon.svg';
import delete_icon from '../../../../assets/icons/delete-icon.png';
// import dropdown_arrow_icon from '../../../../assets/icons/dropdown_arrow_icon.svg';
import date_icon from '../../../../assets/icons/date_icon.svg';

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, _setSupplierFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const { data, isLoading, refetch } = useGetPurchaseOrdersQuery({
    search: search || undefined,
    status: statusFilter || undefined,
    supplier_id: supplierFilter ? parseInt(supplierFilter) : undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    page: currentPage,
    per_page: 15,
  });

  const [deletePO] = useDeletePurchaseOrderMutation();

  const purchaseOrders = (data as any)?.data?.data || data?.data || [];
  const pagination = (data as any)?.data;

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;
    try {
      await deletePO(id).unwrap();
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to delete purchase order');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and track purchase orders</p>
          </div>
          <button
            onClick={() => navigate(`${basePath}/purchase/orders/create`)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <img src={add_icon} alt="" className="w-4 h-4 " />
            Create PO
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <img src={search_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search PO number..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white min-w-[150px]"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Ordered">Ordered</option>
            <option value="Partially Received">Partially Received</option>
            <option value="Received">Received</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Date Range */}
          <div className="relative">
            <img src={date_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              placeholder="Start Date"
            />
          </div>
          <div className="relative">
            <img src={date_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              placeholder="End Date"
              min={startDate}
            />
          </div>

          {/* Clear Filters */}
          {(search || statusFilter || startDate || endDate) && (
            <button
              onClick={() => { 
                setSearch(''); 
                setStatusFilter(''); 
                setStartDate(''); 
                setEndDate(''); 
                setCurrentPage(1); 
              }}
              className="px-4 py-2.5 text-sm text-gray-500 hover:text-red-500 border border-gray-300 rounded-lg"
            >
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <p className="text-gray-500 font-medium">No purchase orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">PO Number</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Order Date</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Payment</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Expected Delivery</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchaseOrders.map((po: any) => (
                    <tr key={po.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-blue-600">{po.po_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{po.supplier?.supplier_name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(po.order_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        {po.currency} {parseFloat(po.total_amount).toFixed(3)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <POStatusBadge status={po.status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          po.payment_status === 'Paid' ? 'bg-green-100 text-green-700' :
                          po.payment_status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {po.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => navigate(`${basePath}/purchase/orders/${po.id}`)}
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            View
                          </button>
                          {po.status === 'Draft' && (
                            <>
                              <button
                                onClick={() => navigate(`${basePath}/purchase/orders/edit/${po.id}`)}
                                className="p-1.5 text-gray-500 hover:text-blue-600"
                              >
                                <img src={edit_icon} alt="Edit" className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(po.id)}
                                className="p-1.5 text-gray-500 hover:text-red-600"
                              >
                                <img src={delete_icon} alt="Delete" className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination?.last_page > 1 && (
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
    </DashboardLayout>
  );
}