// src/features/pos/pages/ReturnsPage.tsx
import { useState, useEffect } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import {
  useGetReturnsQuery,
  useGetReturnStatisticsQuery,
  useApproveReturnMutation,
  useRejectReturnMutation,
} from "../../../services/posApi";
import CreateReturnModal from "../components/CreateReturnModal";
import { useGetBranchesQuery } from "../../../services/superAdminApi";
import { useAppSelector } from "../../../app/hooks";
import type { RootState } from "../../../app/store";
import { canSwitchBranch } from "../../../utils/roleHelpers";

import search_icon from "../../../assets/icons/search_icon.svg";
import export_pdf from '../../../assets/icons/export_pdf.svg';
import export_excel from "../../../assets/icons/export_excel.svg";
import date_icon from "../../../assets/icons/date_icon.svg";
import dropdown_arrow_icon from "../../../assets/icons/dropdown_arrow_icon.svg";
import market_icon from "../../../assets/icons/market_icon.svg";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";

export default function ReturnsPage() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const userCanSwitchBranch = canSwitchBranch(user?.role?.role_name);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [refundMethodFilter, setRefundMethodFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: branchesData } = useGetBranchesQuery();
  const branches = Array.isArray(branchesData) ? branchesData : [];

  // Lock non-switchable users (Cashier/Branch Manager) to their branch
  useEffect(() => {
    if (!userCanSwitchBranch && user?.branch_id && branches.length > 0) {
      const userBranch = branches.find((b: any) => b.id === user.branch_id);
      if (userBranch) setSelectedBranch(userBranch.id.toString());
    }
  }, [userCanSwitchBranch, user?.branch_id, branches]);

  const { data: returnsResponse, isLoading } = useGetReturnsQuery({
    branch_id: selectedBranch ? parseInt(selectedBranch) : undefined,
    status: statusFilter || undefined,
    refund_method: refundMethodFilter || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    search: searchQuery || undefined,
    page: currentPage,
    per_page: 10,
  });

  const { data: statsResponse } = useGetReturnStatisticsQuery({
    branch_id: selectedBranch ? parseInt(selectedBranch) : undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  });

  const [approveReturn] = useApproveReturnMutation();
  const [rejectReturn, { isLoading: isRejecting }] = useRejectReturnMutation();

  const returns = returnsResponse?.data?.data || [];
  const pagination = returnsResponse?.data;

  // Debug — remove once confirmed working
  console.log("statsResponse raw:", statsResponse);

  // Handle both { data: { total_returns, ... } } and { total_returns, ... }
  const stats =
    statsResponse?.data?.data ?? statsResponse?.data ?? statsResponse ?? null;

  const handleApprove = async (id: number) => {
    try {
      await approveReturn(id).unwrap();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to approve return");
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) {
      alert("Please enter a reason");
      return;
    }
    try {
      await rejectReturn({ id, reason: rejectReason }).unwrap();
      setRejectingId(null);
      setRejectReason("");
    } catch (err: any) {
      alert(err?.data?.message || "Failed to reject return");
    }
  };

  const handleExportExcel = () => {
    try {
      const data = returns.map((r: any) => ({
        "Return #": r.return_number,
        "Sale #": r.sale?.sale_number,
        Branch: r.branch?.branch_name,
        "Processed By": r.processed_by?.name,
        "Refund Amount": r.return_amount,
        "Refund Method": r.refund_method,
        Status: r.status,
        Reason: r.reason,
        Date: new Date(r.return_date).toLocaleDateString(),
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Returns");
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(
        new Blob([buf], { type: "application/octet-stream" }),
        `returns_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportPdf = () => {
    if (returns.length === 0) {
      alert("No returns data to export");
      return;
    }

    try {
      // Create PDF in landscape mode
      const doc = new jsPDF("landscape", "mm", "a4");

      // Set margins
      const marginLeft = 10;
      const marginTop = 20;
      let yPos = marginTop;

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("RETURNS REPORT", 148.5, yPos, { align: "center" });
      yPos += 10;

      // Report details
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, marginLeft, yPos);
      doc.text(`Total Returns: ${returns.length}`, 250, yPos, {
        align: "right",
      });
      yPos += 8;

      // Draw line
      doc.setDrawColor(200, 200, 200);
      doc.line(marginLeft, yPos, 287, yPos);
      yPos += 10;

      // Define column widths for 9 columns
      const colWidths = [30, 30, 35, 35, 30, 30, 25, 40, 30];
      const headers = [
        "Return #",
        "Sale #",
        "Branch",
        "Processed By",
        "Refund Amount",
        "Refund Method",
        "Status",
        "Reason",
        "Date",
      ];

      // Draw table header
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255);
      doc.setFillColor(59, 130, 246);

      let xPos = marginLeft;
      headers.forEach((header, index) => {
        doc.rect(xPos, yPos, colWidths[index], 8, "F");
        doc.text(header, xPos + 2, yPos + 5.5);
        xPos += colWidths[index];
      });

      yPos += 8;
      doc.setTextColor(0);
      doc.setFont("helvetica", "normal");

      // Draw table rows
      returns.forEach((returnItem: any, rowIndex: number) => {
        // Check if we need a new page
        if (yPos > 190) {
          doc.addPage("landscape");
          yPos = marginTop;

          // Draw header again on new page
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255);
          doc.setFillColor(59, 130, 246);
          xPos = marginLeft;
          headers.forEach((header, index) => {
            doc.rect(xPos, yPos, colWidths[index], 8, "F");
            doc.text(header, xPos + 2, yPos + 5.5);
            xPos += colWidths[index];
          });
          yPos += 8;
          doc.setTextColor(0);
          doc.setFont("helvetica", "normal");
        }

        // Alternate row colors
        if (rowIndex % 2 === 0) {
          doc.setFillColor(248, 248, 248);
          xPos = marginLeft;
          colWidths.forEach((width) => {
            doc.rect(xPos, yPos, width, 8, "F");
            xPos += width;
          });
        }

        // Prepare row data (matching Excel export exactly)
        const rowData = [
          returnItem.return_number || "-",
          returnItem.sale?.sale_number || "-",
          returnItem.branch?.branch_name || "-",
          returnItem.processed_by?.name || "-",
          `KWD ${parseFloat(returnItem.return_amount || 0).toFixed(3)}`,
          returnItem.refund_method || "-",
          returnItem.status || "-",
          returnItem.reason || "-",
          new Date(returnItem.return_date).toLocaleDateString(),
        ];

        // Draw cell content
        xPos = marginLeft;
        doc.setFontSize(8);
        rowData.forEach((cell, index) => {
          let text = String(cell);
          const maxWidth = colWidths[index] - 4;

          // Truncate text if too long (especially for Reason column)
          while (doc.getTextWidth(text) > maxWidth && text.length > 3) {
            text = text.substring(0, text.length - 4) + "...";
          }

          // Align currency column to the right
          const align = index === 4 ? "right" : "left";
          const xOffset = align === "right" ? colWidths[index] - 2 : 2;

          doc.text(text, xPos + xOffset, yPos + 5.5, { align });
          xPos += colWidths[index];
        });

        yPos += 8;
      });

      // Add page numbers
      const pageCount = doc.internal.pages.length;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, 148.5, 205, { align: "center" });
      }

      // Save PDF
      doc.save(`returns_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export to PDF");
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Approved: "bg-green-100 text-green-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Rejected: "bg-red-100 text-red-800",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        {/* Filters Header */}
        <div className="bg-white px-4 py-4 rounded-lg grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <img src={date_icon} alt="" />
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 border border-gray-300 rounded-md "
            />
          </div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <img src={date_icon} alt="" />
            </div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 border border-gray-300 rounded-md "
            />
          </div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <img src={market_icon} alt="" />
            </div>
            {userCanSwitchBranch ? (
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 border border-gray-300 rounded-md  "
              >
                <option value="">All Branches</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full pl-12 pr-10 py-3.5 border rounded-xl bg-gray-50 text-gray-700">
                {branches.find((b: any) => b.id === user?.branch_id)
                  ?.branch_name || "My Branch"}
              </div>
            )}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1773CF] text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Return
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Returns",
              value: stats?.total_returns || 0,
              color: "text-gray-900",
            },
            {
              label: "Total Refunded",
              value: `KWD ${parseFloat(stats?.total_refund_amount || 0).toFixed(3)}`,
              color: "text-red-600",
            },
            {
              label: "Approved",
              value:
                stats?.by_status?.find((s: any) => s.status === "Approved")
                  ?.count || 0,
              color: "text-green-600",
            },
            {
              label: "Pending",
              value:
                stats?.by_status?.find((s: any) => s.status === "Pending")
                  ?.count || 0,
              color: "text-yellow-600",
            },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-xl p-5">
              <p className="text-sm text-gray-500 mb-1">{card.label}</p>
              <p className={`text-[18px] lg:text-2xl font-bold ${card.color}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Search + Filters */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b  border-gray-300  flex flex-col lg:flex-row flex-wrap items-start lg:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              {/* Search Input */}
              <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <img src={search_icon} alt="" className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search returns..."
                  className="w-full sm:w-56 pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>

              {/* Refund Method Filter */}
              <select
                value={refundMethodFilter}
                onChange={(e) => setRefundMethodFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Store Credit">Store Credit</option>
              </select>
            </div>



            {/* Export Button */}
            <div className="flex flex-row space-x-2 w-full sm:w-auto">
              <button
                onClick={handleExportPdf}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm transition-colors"
              >
                <img src={export_pdf} alt="" className="w-5 h-5" />
                Export PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm transition-colors"
              >
                <img src={export_excel} alt="" className="w-5 h-5" />
                Export Excel
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
            <div className="xl:col-span-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Return #",
                      "Sale #",
                      "Branch",
                      "Items",
                      "Refund Amount",
                      "Method",
                      "Status",
                      "Date",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold text-[#37638F] uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-500">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          Loading returns...
                        </div>
                      </td>
                    </tr>
                  ) : returns.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No returns found.
                      </td>
                    </tr>
                  ) : (
                    returns.map((r: any) => (
                      <tr
                        key={r.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-4 text-sm font-medium text-gray-900">
                          {r.return_number}
                        </td>
                        <td className="px-5 py-4 text-sm text-blue-600">
                          {r.sale?.sale_number}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700">
                          {r.branch?.branch_name}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700">
                          {r.items?.length || 0} item(s)
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                          KWD {parseFloat(r.return_amount).toFixed(3)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                            {r.refund_method}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge(r.status)}`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">
                          {new Date(r.return_date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-4">
                          {r.status === "Pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(r.id)}
                                className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectingId(r.id)}
                                className="px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200 font-medium"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination?.last_page > 1 && (
            <div className="px-6 py-4 border-t border-gray-300 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {pagination.from}–{pagination.to} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 bg-[#1773CF] text-white rounded-lg text-sm">
                  {currentPage}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(pagination.last_page, p + 1))
                  }
                  disabled={currentPage === pagination.last_page}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Reject Return</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Enter rejection reason *"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason("");
                }}
                className="flex-1 py-2.5 border rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectingId)}
                disabled={isRejecting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {isRejecting ? "Rejecting..." : "Reject Return"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Return Modal */}
      <CreateReturnModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
      />
    </DashboardLayout>
  );
}
