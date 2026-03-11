// src/features/pos/pages/CashRegistersPage.tsx
import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { 
  useGetPOSsQuery, 
  useGetPOSByIdQuery 
} from "../../../services/posApi";
import { useGetBranchesQuery } from "../../../services/superAdminApi";
import { useAppSelector } from "../../../app/hooks";
import type { RootState } from "../../../app/store";
import { canSwitchBranch } from "../../../utils/roleHelpers";

import search_icon from "../../../assets/icons/search_icon.svg";
import export_pdf from "../../../assets/icons/export_pdf.svg";
import export_excel from "../../../assets/icons/export_excel.svg";
import market_icon from "../../../assets/icons/market_icon.svg";
import dropdown_arrow_icon from "../../../assets/icons/dropdown_arrow_icon.svg";
import date_icon from "../../../assets/icons/date_icon.svg";
import view_icon from "../../../assets/icons/view-icon.png";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function CashRegistersPage() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedRegisterId, setSelectedRegisterId] = useState<number | null>(null);
  const [showRegisterDetails, setShowRegisterDetails] = useState(false);

  // Search and pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch branches
  const { data: branchesData } = useGetBranchesQuery();
  const branches = Array.isArray(branchesData) ? branchesData : [];

  const userCanSwitchBranch = canSwitchBranch(user?.role?.role_name);
  const userBranchId = user?.branch_id;

  // Set initial branch based on user role
  useEffect(() => {
    if (!userCanSwitchBranch && userBranchId && branches.length > 0) {
      const userBranch = branches.find(b => b.id === userBranchId);
      if (userBranch) {
        setSelectedBranch(userBranch.id.toString());
      }
    }
  }, [userCanSwitchBranch, userBranchId, branches]);

  // Fetch cash registers
  const { data: registersResponse, isLoading } = useGetPOSsQuery({
    branch_id: selectedBranch ? parseInt(selectedBranch) : undefined,
    status: selectedStatus || undefined,
    date: selectedDate || undefined,
    page: currentPage,
  });

  // Fetch selected register details
  const { data: registerDetailsResponse } = useGetPOSByIdQuery(selectedRegisterId!, {
    skip: !selectedRegisterId
  });

  const registers = registersResponse?.data?.data || [];
  const pagination = registersResponse?.data;
  const selectedRegister = registerDetailsResponse?.data;

  // Calculate summary stats
  const totalOpening = registers.reduce((sum: number, register: any) => sum + parseFloat(register.opening_balance), 0);
  const totalClosing = registers.reduce((sum: any, r: any) => sum + (parseFloat(r.closing_balance) || 0), 0);
  const totalDifference = registers.reduce((sum: number, r: any) => sum + (parseFloat(r.difference) || 0), 0);
  const activeRegisters = registers.filter((r: any) => r.status === 'Open').length;

  // Filter registers based on search query
  const filteredRegisters = useMemo(() => {
    if (!searchQuery.trim()) return registers;
    const query = searchQuery.toLowerCase().trim();
    return registers.filter((register: any) =>
        register.user?.name?.toLowerCase().includes(query) ||
        register.branch?.branch_name?.toLowerCase().includes(query) ||
        register.status?.toLowerCase().includes(query)
    );
  }, [searchQuery, registers]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Get search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase().trim();
    const suggestions = new Set<string>();
    registers.forEach((register: any) => {
        if (register.user?.name?.toLowerCase().includes(query)) {
            suggestions.add(register.user.name);
        }
        if (register.branch?.branch_name?.toLowerCase().includes(query)) {
            suggestions.add(register.branch.branch_name);
        }
    });
    return Array.from(suggestions).slice(0, 5);
  }, [searchQuery, registers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length >= 2);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  const handleSearchBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleViewDetails = (registerId: number) => {
    setSelectedRegisterId(registerId);
    setShowRegisterDetails(true);
  };

  const handleExportToPDF = () => {
    alert('PDF export functionality coming soon');
  };

  // Export functions remain the same but use actual data
  const handleExportToExcel = () => {
    try {
      const exportData = filteredRegisters.map((register: any) => ({
        Branch: register.branch?.branch_name,
        Cashier: register.user?.name,
        "Opened At": new Date(register.opened_at).toLocaleString(),
        "Closed At": register.closed_at ? new Date(register.closed_at).toLocaleString() : '-',
        "Opening Balance": register.opening_balance,
        "Closing Balance": register.closing_balance || '-',
        "Expected Balance": register.expected_balance || '-',
        Difference: register.difference || '0',
        Status: register.status,
        "Total Sales": register.sales?.length || 0
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Cash Registers");
      
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(blob, `cash_registers_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (error) {
      console.error("Excel export failed:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        <div className="p-6">
          {/* Header with Dropdowns */}
          <div className="bg-white px-8 py-4 rounded-lg grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            {/* Date Selector */}
            <div className="relative">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <img src={date_icon} alt="" className="w-5 h-5" />
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-12 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <img src={dropdown_arrow_icon} alt="" className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Branch Selector - Conditional based on user role */}
            <div className="relative">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <img src={market_icon} alt="" />
                </div>
                {userCanSwitchBranch ? (
                  // Users who can switch branches (Super Admin/Accountant)
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full pl-12 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl appearance-none"
                  >
                    <option value="">All Branches</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                    ))}
                  </select>
                ) : (
                  // Users with fixed branch
                  <div className="w-full pl-12 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700">
                    {branches.find(b => b.id === parseInt(selectedBranch))?.branch_name || 'No Branch Assigned'}
                  </div>
                )}
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <img src={dropdown_arrow_icon} alt="" />
                </div>
              </div>
            </div>

            {/* Status Selector */}
            <div className="relative">
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full pl-4 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl appearance-none"
                >
                  <option value="">All Status</option>
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <img src={dropdown_arrow_icon} alt="" />
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600">Active Registers</p>
                <p className="text-2xl font-bold text-blue-800">{activeRegisters}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-600">Total Difference</p>
                <p className="text-lg font-semibold text-blue-800">KD {totalDifference.toFixed(3)}</p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg p-6 shadow">
              <p className="text-sm text-gray-500 mb-3">Total Registers</p>
              <p className="text-3xl font-semibold">{registers.length}</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <p className="text-sm text-gray-500 mb-3">Total Opening Cash</p>
              <p className="text-3xl font-semibold">KD {totalOpening.toFixed(3)}</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <p className="text-sm text-gray-500 mb-3">Total Closing Cash</p>
              <p className="text-3xl font-semibold">KD {totalClosing.toFixed(3)}</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <p className="text-sm text-gray-500 mb-3">Net Difference</p>
              <p className={`text-3xl font-semibold ${totalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                KD {totalDifference.toFixed(3)}
              </p>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="bg-white rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <img src={search_icon} alt="Search" className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  onBlur={handleSearchBlur}
                  placeholder="Search by cashier or branch..."
                  className="pl-10 pr-4 py-2.5 border rounded-lg w-full"
                />
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg">
                    {searchSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
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

          {/* Registers Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold">Cash Registers</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Branch</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Cashier</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Opened</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Closed</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Opening</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Closing</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Expected</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Difference</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={10} className="text-center py-8">Loading...</td></tr>
                  ) : filteredRegisters.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-8">No registers found</td></tr>
                  ) : (
                    filteredRegisters.map((register: any) => (
                      <tr key={register.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">{register.branch?.branch_name}</td>
                        <td className="px-6 py-4">{register.user?.name}</td>
                        <td className="px-6 py-4">{new Date(register.opened_at).toLocaleString()}</td>
                        <td className="px-6 py-4">{register.closed_at ? new Date(register.closed_at).toLocaleString() : '-'}</td>
                        <td className="px-6 py-4">KD {register.opening_balance}</td>
                        <td className="px-6 py-4">{register.closing_balance ? `KD ${register.closing_balance}` : '-'}</td>
                        <td className="px-6 py-4">{register.expected_balance ? `KD ${register.expected_balance}` : '-'}</td>
                        <td className="px-6 py-4">
                          <span className={register.difference > 0 ? 'text-green-600' : register.difference < 0 ? 'text-red-600' : ''}>
                            {register.difference ? `KD ${register.difference}` : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            register.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                          }`}>
                            {register.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewDetails(register.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <img src={view_icon} alt="View" className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
              <div className="px-6 py-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Showing {pagination.from} to {pagination.to} of {pagination.total}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 bg-blue-500 text-white rounded">{currentPage}</span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))}
                      disabled={currentPage === pagination.last_page}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Register Details Modal */}
      {showRegisterDetails && selectedRegister && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Register Details - {selectedRegister.branch?.branch_name}</h2>
              <button onClick={() => setShowRegisterDetails(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            
            <div className="p-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">Opening Balance</p>
                  <p className="text-2xl font-bold">KD {selectedRegister.opening_balance}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">Expected Balance</p>
                  <p className="text-2xl font-bold">KD {selectedRegister.expected_balance || '0.000'}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600">Closing Balance</p>
                  <p className="text-2xl font-bold">KD {selectedRegister.closing_balance || '0.000'}</p>
                </div>
              </div>

              {/* Cash Movements */}
              <h3 className="text-lg font-semibold mb-4">Cash Movements</h3>
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Amount</th>
                      <th className="px-4 py-2 text-left">Reason</th>
                      <th className="px-4 py-2 text-left">Time</th>
                      <th className="px-4 py-2 text-left">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRegister.cash_movements?.length > 0 ? (
                      selectedRegister.cash_movements.map((movement: any) => (
                        <tr key={movement.id}>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              movement.type === 'Cash In' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {movement.type}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-medium">KD {movement.amount}</td>
                          <td className="px-4 py-2">{movement.reason}</td>
                          <td className="px-4 py-2">{new Date(movement.movement_date).toLocaleString()}</td>
                          <td className="px-4 py-2">{movement.recorded_by?.name}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5} className="text-center py-4">No cash movements</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sales from this register */}
              <h3 className="text-lg font-semibold mb-4">Sales</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Invoice</th>
                      <th className="px-4 py-2 text-left">Time</th>
                      <th className="px-4 py-2 text-left">Items</th>
                      <th className="px-4 py-2 text-left">Total</th>
                      <th className="px-4 py-2 text-left">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRegister.sales?.length > 0 ? (
                      selectedRegister.sales.map((sale: any) => (
                        <tr key={sale.id}>
                          <td className="px-4 py-2">{sale.invoice_number}</td>
                          <td className="px-4 py-2">{new Date(sale.created_at).toLocaleString()}</td>
                          <td className="px-4 py-2">{sale.items?.length || 0}</td>
                          <td className="px-4 py-2 font-medium">KD {sale.total_amount}</td>
                          <td className="px-4 py-2">{sale.payment_method}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5} className="text-center py-4">No sales</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end">
              <button
                onClick={() => setShowRegisterDetails(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}