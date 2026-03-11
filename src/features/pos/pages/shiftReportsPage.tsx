// src/features/pos/pages/ShiftReportsPage.tsx
import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useGetPOSsQuery, useGetDailyShiftSummaryQuery } from "../../../services/posApi";
import { useGetBranchesQuery } from "../../../services/superAdminApi";
import { useAppSelector } from "../../../app/hooks";
import type { RootState } from "../../../app/store";
import { canSwitchBranch } from "../../../utils/roleHelpers";
import ShiftReportDetailModal from "../components/Shiftreportdetailmodal";

import search_icon from "../../../assets/icons/search_icon.svg";
import export_pdf from "../../../assets/icons/export_pdf.svg";
import export_excel from "../../../assets/icons/export_excel.svg";
import market_icon from "../../../assets/icons/market_icon.svg";
import dropdown_arrow_icon from "../../../assets/icons/dropdown_arrow_icon.svg";
import date_icon from "../../../assets/icons/date_icon.svg";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function ShiftReportsPage() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const userCanSwitchBranch = canSwitchBranch(user?.role?.role_name);
  const userBranchId = user?.branch_id;

  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("Closed");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [selectedRegisterData, setSelectedRegisterData] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data: branchesData } = useGetBranchesQuery();
  const branches = Array.isArray(branchesData) ? branchesData : [];

  // Lock non-switchable users to their branch
  useEffect(() => {
    if (!userCanSwitchBranch && userBranchId && branches.length > 0) {
      const userBranch = branches.find((b: any) => b.id === userBranchId);
      if (userBranch) setSelectedBranch(userBranch.id.toString());
    }
  }, [userCanSwitchBranch, userBranchId, branches]);

  // Use useGetPOSsQuery — returns ALL registers across branches (same as old working code)
  const { data: registersResponse, isLoading } = useGetPOSsQuery({
    branch_id: selectedBranch ? parseInt(selectedBranch) : undefined,
    status: statusFilter || undefined,
    page: currentPage,
  });

  // Daily summary for stats cards
  const today = new Date().toISOString().split("T")[0];
  const { data: dailySummaryResponse } = useGetDailyShiftSummaryQuery({
    date: today,
    branch_id: selectedBranch ? parseInt(selectedBranch) : undefined,
  });

  const registers = registersResponse?.data?.data || [];
  const pagination = registersResponse?.data;
  const dailySummary = dailySummaryResponse?.data;

  // Summary stats calculated from current page (same as old code)
  const totalShifts = pagination?.total || registers.length;
  const totalSales = registers.reduce((sum: number, r: any) => {
    const sales = r.sales?.reduce((s: number, sale: any) => s + parseFloat(sale.total_amount || 0), 0) || 0;
    return sum + sales;
  }, 0);
  const totalDifference = registers.reduce((sum: number, r: any) => sum + (parseFloat(r.difference) || 0), 0);

  // Client-side filter by date range + search (same as old code)
  const filteredRegisters = useMemo(() => {
    let filtered = registers;
    if (startDate) {
      filtered = filtered.filter((r: any) => new Date(r.opened_at) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter((r: any) => new Date(r.opened_at) <= new Date(endDate));
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((r: any) =>
        r.user?.name?.toLowerCase().includes(query) ||
        r.branch?.branch_name?.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [registers, startDate, endDate, searchQuery]);


  console.log('fil... :', filteredRegisters)
  const handleViewReport = (registerId: number, registerRow: any) => {
    setSelectedReportId(registerId);
    setSelectedRegisterData(registerRow);
    setShowDetailModal(true);
  };

  const handleExportToExcel = () => {
    try {
      const exportData = filteredRegisters.map((r: any) => ({
        Cashier: r.user?.name,
        Branch: r.branch?.branch_name,
        "Shift Date": new Date(r.opened_at).toLocaleDateString(),
        "Shift Time": `${new Date(r.opened_at).toLocaleTimeString()} - ${r.closed_at ? new Date(r.closed_at).toLocaleTimeString() : ''}`,
        "Opening Cash": `KD ${parseFloat(r.opening_balance || 0).toFixed(3)}`,
        "Actual Cash": `KD ${parseFloat(r.closing_balance || 0).toFixed(3)}`,
        Difference: r.difference ? `KD ${r.difference}` : '-',
        Status: r.status,
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      ws["!cols"] = Object.keys(exportData[0] || {}).map(() => ({ wch: 20 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Shift Reports");
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([buf], { type: "application/octet-stream" }),
        `shift_reports_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (e) {
      console.error("Excel export failed:", e);
    }
  };

  const handleExportToPDF = () => {
    alert("Select a report and use the Export button inside it for PDF export.");
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6">
        {/* Header Filters */}
        <div className="bg-white px-8 py-4 rounded-lg grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Start Date */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <img src={date_icon} alt="" />
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="w-full pl-12 pr-10 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Start Date"
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <img src={date_icon} alt="" />
            </div>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="w-full pl-12 pr-10 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="End Date"
            />
          </div>

          {/* Branch */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <img src={market_icon} alt="" />
            </div>
            {userCanSwitchBranch ? (
              <select
                value={selectedBranch}
                onChange={(e) => { setSelectedBranch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-12 pr-10 py-3.5 border rounded-xl appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Branches</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.branch_name}</option>
                ))}
              </select>
            ) : (
              <div className="w-full pl-12 pr-10 py-3.5 border rounded-xl bg-gray-50 text-gray-700">
                {branches.find((b: any) => b.id === parseInt(selectedBranch))?.branch_name || 'My Branch'}
              </div>
            )}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
            </div>
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-3.5 border rounded-xl appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow">
            <p className="text-sm text-gray-500 mb-3">Today's Shifts</p>
            <p className="text-3xl font-semibold">{dailySummary?.total_shifts || totalShifts}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <p className="text-sm text-gray-500 mb-3">Total Sales</p>
            <p className="text-3xl font-semibold">KD {parseFloat(dailySummary?.total_sales || totalSales).toFixed(3)}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <p className="text-sm text-gray-500 mb-3">Cash Difference</p>
            <p className={`text-3xl font-semibold ${totalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              KD {parseFloat(dailySummary?.total_cash_difference || totalDifference).toFixed(3)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <p className="text-sm text-gray-500 mb-3">Total Transactions</p>
            <p className="text-3xl font-semibold">{dailySummary?.total_transactions || registers.reduce((sum: number, r: any) => sum + (r.sales?.length || 0), 0)}</p>
          </div>
        </div>

        {/* Search and Export */}
        <div className="bg-white rounded-xl p-4 mb-6">
          <div className="flex justify-between gap-4">
            <div className="relative w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <img src={search_icon} alt="" className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by cashier or branch..."
                className="pl-10 pr-4 py-2.5 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-3">
              <button onClick={handleExportToPDF} className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                <img src={export_pdf} alt="" className="w-5 h-5" />
                <span>Export PDF</span>
              </button>
              <button onClick={handleExportToExcel} className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                <img src={export_excel} alt="" className="w-5 h-5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold">Cashier Shift Details</h2>
            {pagination && (
              <p className="text-sm text-gray-500 mt-0.5">{pagination.total} total records</p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Cashier", "Branch", "Shift Time", "Opening", "Actual Cash", "Difference", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#37638F] uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                        Loading reports...
                      </div>
                    </td>
                  </tr>
                ) : filteredRegisters.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                      {searchQuery ? `No results matching "${searchQuery}"` : "No shift reports found."}
                    </td>
                  </tr>
                ) : (
                  filteredRegisters.map((r: any) => {
                    const diff = parseFloat(r.difference || 0);

                    return (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-sm text-gray-900">{r.user?.name}</td>
                        <td className="px-4 py-4 text-sm text-gray-700">{r.branch?.branch_name}</td>
                        <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(r.opened_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          {' — '}
                          {r.closed_at ? new Date(r.closed_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'Open'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">KD {parseFloat(r.opening_balance || 0).toFixed(3)}</td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">KD {parseFloat(r.closing_balance || 0).toFixed(3)}</td>
                        <td className={`px-4 py-4 text-sm font-semibold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {diff !== 0 ? `${diff > 0 ? '+' : ''}KD ${diff.toFixed(3)}` : '-'}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            r.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => handleViewReport(r.id, r)}
                            className="px-3 py-1.5 text-xs bg-[#1773CF] text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.last_page > 1 && (
            <div className="px-6 py-4 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {pagination.from} to {pagination.to} of {pagination.total}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50 font-medium"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 bg-[#1773CF] text-white rounded-lg text-sm font-medium">{currentPage}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))}
                    disabled={currentPage === pagination.last_page}
                    className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50 font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <ShiftReportDetailModal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedReportId(null); setSelectedRegisterData(null); }}
        reportId={selectedReportId}
        registerData={selectedRegisterData}
      />
    </DashboardLayout>
  );
}