// src/features/purchase/pages/purchase-orders/PendingApprovalsPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../../layouts/DashboardLayout";
import { useAppSelector } from "../../../../app/hooks";
import type { RootState } from "../../../../app/store";
import {
  useGetPendingApprovalsQuery,
  useApprovePurchaseOrderMutation,
  useRejectPurchaseOrderMutation,
} from "../../../../services/purchaseApi";
import POStatusBadge from "../../components/POStatusBadge";

import search_icon from "../../../../assets/icons/search_icon.svg";
import check_icon from "../../../../assets/icons/check_icon.png";
import close_icon from "../../../../assets/icons/cross_icon.svg";

export default function PendingApprovalsPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rejectModal, setRejectModal] = useState<{
    id: number;
    show: boolean;
    reason: string;
  }>({
    id: 0,
    show: false,
    reason: "",
  });

  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const basePath = isSuperAdmin ? "/admin" : "";

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
      alert(err?.data?.message || "Failed to approve PO");
    }
  };

  const handleReject = async () => {
    if (!rejectModal.reason.trim()) {
      alert("Please enter rejection reason");
      return;
    }
    try {
      await rejectPO({
        id: rejectModal.id,
        reason: rejectModal.reason,
      }).unwrap();
      setRejectModal({ id: 0, show: false, reason: "" });
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to reject PO");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Pending Approvals
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Purchase orders waiting for your approval
            </p>
          </div>
          {/* Optional: Add filter or refresh button here */}
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl p-3 sm:p-4">
          <div className="relative max-w-full sm:max-w-md">
            <img
              src={search_icon}
              alt=""
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by PO number..."
              className="w-full pl-9 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : pendingPOs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 font-medium">No pending approvals found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                      PO Number
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                      Supplier
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                      Order Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                      Total
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingPOs.map((po: any) => (
                    <tr key={po.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() =>
                            navigate(`${basePath}/purchase/orders/${po.id}`)
                          }
                          className="text-sm font-semibold text-blue-600 hover:underline"
                        >
                          {po.po_number}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {po.supplier?.supplier_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {new Date(po.order_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">
                        {po.currency} {parseFloat(po.total_amount).toFixed(3)}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <POStatusBadge status={po.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleApprove(po.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <img src={check_icon} alt="" className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              setRejectModal({
                                id: po.id,
                                show: true,
                                reason: "",
                              })
                            }
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            <img src={close_icon} alt="" className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : pendingPOs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 font-medium">No pending approvals found</p>
            </div>
          ) : (
            pendingPOs.map((po: any) => (
              <div key={po.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                {/* Header with PO Number and Status */}
                <div className="flex items-start justify-between mb-3">
                  <button
                    onClick={() => navigate(`${basePath}/purchase/orders/${po.id}`)}
                    className="text-sm font-semibold text-blue-600 hover:underline"
                  >
                    {po.po_number}
                  </button>
                  <POStatusBadge status={po.status} />
                </div>

                {/* Supplier Info */}
                <div className="mb-3">
                  <p className="text-xs text-gray-500">Supplier</p>
                  <p className="text-sm font-medium text-gray-900">
                    {po.supplier?.supplier_name}
                  </p>
                </div>

                {/* Order Date and Total */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Order Date</p>
                    <p className="text-sm text-gray-700">
                      {new Date(po.order_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Amount</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {po.currency} {parseFloat(po.total_amount).toFixed(3)}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleApprove(po.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <img src={check_icon} alt="" className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      setRejectModal({
                        id: po.id,
                        show: true,
                        reason: "",
                      })
                    }
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <img src={close_icon} alt="" className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && (pagination as any).last_page > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            <p className="text-sm text-gray-500 text-center sm:text-left">
              Page {(pagination as any).current_page || currentPage} of{" "}
              {(pagination as any).last_page || 1}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min((pagination as any).last_page || 1, p + 1),
                  )
                }
                disabled={currentPage === ((pagination as any).last_page || 1)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal - Responsive */}
      {rejectModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 sm:mx-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Reject Purchase Order
                </h3>
                <button
                  onClick={() =>
                    setRejectModal({ id: 0, show: false, reason: "" })
                  }
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <textarea
                value={rejectModal.reason}
                onChange={(e) =>
                  setRejectModal((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="Enter rejection reason..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4 text-sm"
                autoFocus
              />
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  onClick={() =>
                    setRejectModal({ id: 0, show: false, reason: "" })
                  }
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}