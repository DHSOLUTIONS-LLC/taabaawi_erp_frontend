// src/features/purchase/pages/purchase-orders/PendingApprovalsPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { 
  useGetPendingApprovalsQuery,
  useApprovePurchaseOrderMutation,
  useRejectPurchaseOrderMutation
} from '../../../../services/purchaseApi';
import POStatusBadge from '../../components/POStatusBadge';

import search_icon from '../../../../assets/icons/search_icon.svg';
import check_icon from '../../../../assets/icons/check_icon.png';
import close_icon from '../../../../assets/icons/cross_icon.svg';

export default function PendingApprovalsPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rejectModal, setRejectModal] = useState<{ id: number; show: boolean; reason: string }>({
    id: 0,
    show: false,
    reason: ''
  });

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const { data, isLoading, refetch } = useGetPendingApprovalsQuery({
    page: currentPage,
    per_page: 15,
  });

  const [approvePO] = useApprovePurchaseOrderMutation();
  const [rejectPO] = useRejectPurchaseOrderMutation();

  const pendingPOs = (data as any)?.data?.data || data?.data || [];
  const pagination = data?.data;

  const handleApprove = async (id: number) => {
    try {
      await approvePO(id).unwrap();
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to approve PO');
    }
  };

  const handleReject = async () => {
    if (!rejectModal.reason.trim()) {
      alert('Please enter rejection reason');
      return;
    }
    try {
      await rejectPO({ id: rejectModal.id, reason: rejectModal.reason }).unwrap();
      setRejectModal({ id: 0, show: false, reason: '' });
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to reject PO');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
            <p className="text-sm text-gray-500 mt-1">Purchase orders waiting for your approval</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl p-4">
          <div className="relative max-w-md">
            <img src={search_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by PO number..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : pendingPOs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <p className="text-gray-500 font-medium">No pending approvals found</p>
            </div>
          ) : (
               <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
 <div className="xl:col-span-4 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">PO Number</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Order Date</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingPOs.map((po: any) => (
                    <tr key={po.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`${basePath}/purchase/orders/${po.id}`)}
                          className="text-sm font-semibold text-blue-600 hover:underline"
                        >
                          {po.po_number}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{po.supplier?.supplier_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(po.order_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold">
                        {po.currency} {parseFloat(po.total_amount).toFixed(3)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <POStatusBadge status={po.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleApprove(po.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <img src={check_icon} alt="" className="w-3 h-3 " />
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectModal({ id: po.id, show: true, reason: '' })}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            <img src={close_icon} alt="" className="w-3 h-3 " />
                            Reject
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
        {pagination && (pagination as any).last_page  > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {(pagination as any).current_page || currentPage} of {(pagination as any).last_page || 1}
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
               onClick={() => setCurrentPage(p => Math.min((pagination as any).last_page || 1, p + 1))}
        disabled={currentPage === ((pagination as any).last_page || 1)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Reject Purchase Order</h3>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectModal({ id: 0, show: false, reason: '' })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}