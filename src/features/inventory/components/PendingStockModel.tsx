// src/components/StockRequestsModal.tsx
import { useState, useEffect } from "react";
import {
  useGetStockRequestsQuery,
  useApproveStockRequestMutation,
  useRejectStockRequestMutation,
  useCreateStockTransferMutation,
} from "../../../services/inventoryApi";
import { useAppSelector } from "../../../app/hooks";
import type { RootState } from "../../../app/store";
import TransferStockModal from "./Transferstockmodal";

interface StockRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StockRequestsModal({
  isOpen,
  onClose,
}: StockRequestsModalProps) {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === "Super Admin";

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [requestForTransfer, setRequestForTransfer] = useState<any>(null);
  // Track which request has had transfer clicked
  const [transferClickedRequests, setTransferClickedRequests] = useState<
    Set<number>
  >(new Set());

  // Get current branch from localStorage (for non-admin users)
  const getCurrentBranch = () => {
    const posSession = localStorage.getItem("pos_session");
    if (posSession) {
      const session = JSON.parse(posSession);
      return session.branchId;
    }
    return null;
  };
  const currentBranchId = getCurrentBranch();

  // Fetch requests - Admin sees all, user sees only their branch requests
  const { data, isLoading, refetch, error } = useGetStockRequestsQuery(
    isSuperAdmin
      ? { status: "Pending" }
      : { requesting_branch_id: currentBranchId },
  );

  const [approveRequest] = useApproveStockRequestMutation();
  const [rejectRequest] = useRejectStockRequestMutation();
  const [createStockTransfer] = useCreateStockTransferMutation();

  // Extract requests from response
  const requests = data?.data?.data || data?.data || [];

  // Get pending count for stat card
  useEffect(() => {
    if (data?.data?.data || data?.data) {
      const allRequests = data?.data?.data || data?.data || [];
      const pending = allRequests.filter(
        (r: any) => r.status === "Pending",
      ).length;
      setPendingCount(pending);
    }
  }, [data]);

  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  // Open transfer modal when Transfer button is clicked
  const handleTransferClick = (request: any) => {
    // Mark this request as having transfer clicked
    setTransferClickedRequests((prev) => new Set(prev).add(request.id));

    // Prepare product data for transfer modal
    const productForTransfer = {
      id: request.items?.[0]?.product_id || 0,
      name: request.items?.[0]?.product?.product_name || "Product",
      sku: request.items?.[0]?.product?.sku || "",
    };

    setRequestForTransfer({
      ...request,
      productForTransfer,
    });
    setShowTransferModal(true);
  };

  // Approve without transfer (just approve the request)
  const handleApproveOnly = async (request: any) => {
    if (
      !confirm(`Approve request for ${request.request_number || request.id}?`)
    )
      return;

    try {
      const approveItems = request.items?.map((item: any) => ({
        item_id: item.id,
        approved_quantity: item.requested_quantity,
      }));

      await approveRequest({
        id: request.id,
        items: approveItems,
        approval_notes: "Approved by admin",
      }).unwrap();

      alert("Request approved successfully!");
      refetch();
    } catch (error: any) {
      alert(error?.data?.message || "Failed to approve request");
    }
  };

  // Handle transfer completion - approve the request after successful transfer
  const handleTransferSuccess = async () => {
    try {
      // Approve the request after successful transfer
      const approveItems = requestForTransfer.items?.map((item: any) => ({
        item_id: item.id,
        approved_quantity: item.requested_quantity,
      }));

      await approveRequest({
        id: requestForTransfer.id,
        items: approveItems,
        approval_notes: "Approved - Stock transferred successfully",
      }).unwrap();

      alert("Stock transferred and request approved successfully!");
      setShowTransferModal(false);
      setRequestForTransfer(null);
      refetch();
    } catch (error: any) {
      console.error("Approval failed:", error);
      alert(error?.data?.message || "Failed to approve request after transfer");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Please enter a rejection reason");
      return;
    }

    try {
      await rejectRequest({
        id: selectedRequest.id,
        approval_notes: rejectReason,
      }).unwrap();

      alert("Request rejected");
      setShowRejectModal(false);
      setRejectReason("");
      refetch();
    } catch (error: any) {
      alert(error?.data?.message || "Failed to reject request");
    }
  };

  useEffect(() => {
    if (pendingCount > 0) {
      localStorage.setItem("pending_stock_requests", pendingCount.toString());
    } else {
      localStorage.setItem("pending_stock_requests", "0");
    }
  }, [pendingCount]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-3xl bg-white rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            {isSuperAdmin ? "Stock Requests" : "My Stock Requests"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              Failed to load requests. Please try again.
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No stock requests found
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request: any) => {
                const hasTransferClicked = transferClickedRequests.has(
                  request.id,
                );

                return (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm text-gray-500">
                          Request #{request.id}
                        </p>
                        <p className="font-medium">
                          Branch:{" "}
                          {request.requesting_branch?.branch_name ||
                            request.requesting_branch_id}
                        </p>
                        <p className="text-sm text-gray-500">
                          Priority:{" "}
                          <span
                            className={`font-medium ${
                              request.priority === "Urgent"
                                ? "text-red-600"
                                : request.priority === "High"
                                  ? "text-orange-600"
                                  : request.priority === "Normal"
                                    ? "text-blue-600"
                                    : "text-gray-600"
                            }`}
                          >
                            {request.priority || "Normal"}
                          </span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Requested:{" "}
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          request.status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : request.status === "Approved"
                              ? "bg-green-100 text-green-700"
                              : request.status === "Rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Product</th>
                            <th className="px-3 py-2 text-center">Requested</th>
                            {request.status === "Approved" && (
                              <th className="px-3 py-2 text-center">
                                Approved
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {request.items?.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b  border-gray-200">
                              <td className="px-3 py-2">
                                {item.product?.product_name || item.product_id}
                                {item.variant && (
                                  <span className="text-gray-500 ml-2">
                                    ({item.variant.variant_name})
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-center font-medium">
                                {item.requested_quantity}
                              </td>
                              {request.status === "Approved" && (
                                <td className="px-3 py-2 text-center text-green-600">
                                  {item.approved_quantity ||
                                    item.requested_quantity}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {request.notes && (
                      <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <span className="font-medium">Notes:</span>{" "}
                        {request.notes}
                      </div>
                    )}

                    {request.approval_notes && request.status !== "Pending" && (
                      <div className="mt-2 text-sm text-gray-500">
                        {request.status === "Rejected" ? (
                          <span className="text-red-600">
                            Rejection reason: {request.approval_notes}
                          </span>
                        ) : (
                          <span className="text-green-600">
                            Approval notes: {request.approval_notes}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons - Only for Admin on Pending requests */}
                    {isSuperAdmin && request.status === "Pending" && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {/* If Transfer button was clicked, show Approve button instead */}
                        {hasTransferClicked ? (
                          <button
                            onClick={() => handleApproveOnly(request)}
                            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Approve
                          </button>
                        ) : (
                          <>
                            {/* Transfer Button */}
                            <button
                              onClick={() => handleTransferClick(request)}
                              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Transfer
                            </button>
                          </>
                        )}

                        {/* Reject Button - Always visible for pending requests */}
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectModal(true);
                          }}
                          className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {/* Status display for non-admin users */}
                    {!isSuperAdmin && request.status !== "Pending" && (
                      <div className="mt-4 text-sm">
                        {request.status === "Approved" ? (
                          <p className="text-green-600">
                            ✓ Request approved by admin
                          </p>
                        ) : request.status === "Rejected" ? (
                          <p className="text-red-600">✗ Request rejected</p>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Reject Request</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-4 py-3 border rounded-lg mb-4 focus:ring-2 focus:ring-red-500"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Stock Modal */}
      {showTransferModal && requestForTransfer && (
        <TransferStockModal
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setRequestForTransfer(null);
          }}
          product={requestForTransfer.productForTransfer}
          onTransferComplete={handleTransferSuccess}
          preFillData={{
            fromBranchId: requestForTransfer.warehouse_id,
            toBranchId: requestForTransfer.requesting_branch_id,
            items: requestForTransfer.items?.map((item: any) => ({
              product_id: item.product_id,
              variant_id: item.variant_id,
              quantity: item.requested_quantity,
            })),
          }}
        />
      )}
    </>
  );
}
