// src/features/pos/pages/CashRegistersPage.tsx
import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useGetPOSsQuery, useGetPOSByIdQuery } from "../../../services/posApi";
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
import jsPDF from "jspdf";

interface DenominationCount {
  [key: number]: number;
}

// Update the register type to include denominations
// If you have a proper type definition, add denominations field
// Otherwise, the code will work with the existing any type

const KUWAIT_DENOMINATIONS = [
  { value: 20, label: "20 KWD", type: "note", color: "bg-purple-100" },
  { value: 10, label: "10 KWD", type: "note", color: "bg-blue-100" },
  { value: 5, label: "5 KWD", type: "note", color: "bg-green-100" },
  { value: 1, label: "1 KWD", type: "note", color: "bg-yellow-100" },
  { value: 0.5, label: "500 Fils", type: "coin", color: "bg-gray-100" },
  { value: 0.25, label: "250 Fils", type: "coin", color: "bg-gray-100" },
  { value: 0.1, label: "100 Fils", type: "coin", color: "bg-gray-100" },
  { value: 0.05, label: "50 Fils", type: "coin", color: "bg-gray-100" },
];


export default function CashRegistersPage() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedRegisterId, setSelectedRegisterId] = useState<number | null>(
    null,
  );
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
      const userBranch = branches.find((b) => b.id === userBranchId);
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
  const { data: registerDetailsResponse } = useGetPOSByIdQuery(
    selectedRegisterId!,
    {
      skip: !selectedRegisterId,
    },
  );

  console.log("registerDetailsResponse", registerDetailsResponse);

  const registers = registersResponse?.data?.data || [];
  const pagination = registersResponse?.data;
  const selectedRegister = registerDetailsResponse?.data;

  // Calculate summary stats
  const totalOpening = registers.reduce(
    (sum: number, register: any) => sum + parseFloat(register.opening_balance),
    0,
  );
  const totalClosing = registers.reduce(
    (sum: any, r: any) => sum + (parseFloat(r.closing_balance) || 0),
    0,
  );
  const totalDifference = registers.reduce(
    (sum: number, r: any) => sum + (parseFloat(r.difference) || 0),
    0,
  );
  const activeRegisters = registers.filter(
    (r: any) => r.status === "Open",
  ).length;

  // Filter registers based on search query
  const filteredRegisters = useMemo(() => {
    if (!searchQuery.trim()) return registers;
    const query = searchQuery.toLowerCase().trim();
    return registers.filter(
      (register: any) =>
        register.user?.name?.toLowerCase().includes(query) ||
        register.branch?.branch_name?.toLowerCase().includes(query) ||
        register.status?.toLowerCase().includes(query),
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
    if (filteredRegisters.length === 0) {
      alert("No cash register data to export");
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
      doc.text("CASH REGISTERS REPORT", 148.5, yPos, { align: "center" });
      yPos += 10;

      // Report details
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, marginLeft, yPos);
      doc.text(`Total Registers: ${filteredRegisters.length}`, 250, yPos, {
        align: "right",
      });
      yPos += 8;

      // Draw line
      doc.setDrawColor(200, 200, 200);
      doc.line(marginLeft, yPos, 287, yPos);
      yPos += 10;

      // Define column widths for 10 columns
      const colWidths = [35, 35, 40, 40, 30, 30, 30, 25, 25, 25];
      const headers = [
        "Branch",
        "Cashier",
        "Opened At",
        "Closed At",
        "Opening Balance",
        "Closing Balance",
        // "Expected Balance",
        "Difference",
        "Status",
        "Total Sales",
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
      filteredRegisters.forEach((register: any, rowIndex: number) => {
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

        // Prepare row data
        const rowData = [
          register.branch?.branch_name || "-",
          register.user?.name || "-",
          new Date(register.opened_at).toLocaleString(),
          register.closed_at
            ? new Date(register.closed_at).toLocaleString()
            : "-",
          formatCurrency(register.opening_balance),
          register.closing_balance
            ? formatCurrency(register.closing_balance)
            : "-",
          // register.expected_balance ? formatCurrency(register.expected_balance) : "-",
          register.difference || "0",
          register.status || "-",
          String(register.sales?.length || 0),
        ];

        // Draw cell content
        xPos = marginLeft;
        doc.setFontSize(8);
        rowData.forEach((cell, index) => {
          let text = String(cell);
          const maxWidth = colWidths[index] - 4;

          // Truncate text if too long
          while (doc.getTextWidth(text) > maxWidth && text.length > 3) {
            text = text.substring(0, text.length - 4) + "...";
          }

          // Align numeric columns to the right
          const numericColumns = [4, 5, 6, 7, 9]; // Balance columns and total sales
          const align = numericColumns.includes(index) ? "right" : "left";
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
      doc.save(`cash_registers_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export to PDF");
    }
  };

  // Helper function to format currency
  const formatCurrency = (value: number | string | undefined) => {
    if (value === undefined || value === null) return "-";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "-";
    return `KWD ${numValue.toFixed(3)}`;
  };

  // Export functions remain the same but use actual data
  const handleExportToExcel = () => {
    try {
      const exportData = filteredRegisters.map((register: any) => ({
        Branch: register.branch?.branch_name,
        Cashier: register.user?.name,
        "Opened At": new Date(register.opened_at).toLocaleString(),
        "Closed At": register.closed_at
          ? new Date(register.closed_at).toLocaleString()
          : "-",
        "Opening Balance": register.opening_balance,
        "Closing Balance": register.closing_balance || "-",
        // "Expected Balance": register.expected_balance || "-",
        Difference: register.difference || "0",
        Status: register.status,
        "Total Sales": register.sales?.length || 0,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Cash Registers");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });
      saveAs(
        blob,
        `cash_registers_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (error) {
      console.error("Excel export failed:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        <div className="">
          {/* Header with Dropdowns */}
          <div className="bg-white px-4 py-4 rounded-lg grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
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
                      <option key={branch.id} value={branch.id}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  // Users with fixed branch
                  <div className="w-full pl-12 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700">
                    {branches.find((b) => b.id === parseInt(selectedBranch))
                      ?.branch_name || "No Branch Assigned"}
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
                <p className="text-2xl font-bold text-blue-800">
                  {activeRegisters}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-600">Total Difference</p>
                <p className="text-lg font-semibold text-blue-800">
                  KWD {totalDifference.toFixed(3)}
                </p>
              </div>
            </div>
          </div>
          {/* {selectedRegister?.denominations && Object.keys(selectedRegister.denominations).length > 0 && (
  <div className="mb-6">
    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
      Currency Denominations Counted
    </h3>
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {KUWAIT_DENOMINATIONS.map((denom) => {
          const count = selectedRegister.denominations[denom.value] || 0;
          if (count > 0) {
            return (
              <div key={denom.value} className={`${denom.color} rounded-lg p-3`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{denom.label}</p>
                    <p className="text-xs text-gray-500 capitalize">{denom.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">{count} × {denom.value}</p>
                    <p className="text-sm text-gray-600">= {(count * denom.value).toFixed(3)} KWD</p>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700">Total Cash Counted:</span>
          <span className="text-xl font-bold text-blue-600">
            KWD {Object.entries(selectedRegister.denominations).reduce(
              (sum, [value, count]) => sum + parseFloat(value) * (count as number),
              0
            ).toFixed(3)}
          </span>
        </div>
      </div>
    </div>
  </div>
)} */}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-3">Total Registers</p>
              <p className="text-3xl font-semibold">{registers.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-3">Total Opening Cash</p>
              <p className="text-3xl font-semibold">
                KWD {totalOpening.toFixed(3)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-3">Total Closing Cash</p>
              <p className="text-3xl font-semibold">
                KWD {totalClosing.toFixed(3)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-3">Net Difference</p>
              <p
                className={`text-3xl font-semibold ${totalDifference >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                KWD {totalDifference.toFixed(3)}
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
                  onFocus={() =>
                    searchQuery.length >= 2 && setShowSuggestions(true)
                  }
                  onBlur={handleSearchBlur}
                  placeholder="Search by cashier or branch..."
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-md w-full"
                />
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
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
                <button
                  onClick={handleExportToPDF}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <img src={export_pdf} alt="" className="w-5 h-5" />
                  <span>Export PDF</span>
                </button>
                <button
                  onClick={handleExportToExcel}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <img src={export_excel} alt="" className="w-5 h-5" />
                  <span>Export Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Registers Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-300">
              <h2 className="text-xl font-bold">Cash Registers</h2>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
              <div className="xl:col-span-4 overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                        Branch
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                        Cashier
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                        Opened
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                        Closed
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                        Opening
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                        Closing
                      </th>
                      {/* <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                        Expected
                      </th> */}
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                        Difference
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={10} className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <p>Loading cashbox</p>
                        </td>
                      </tr>
                    ) : filteredRegisters.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-8">
                          No registers found
                        </td>
                      </tr>
                    ) : (
                      filteredRegisters.map((register: any) => (
                        <tr key={register.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {register.branch?.branch_name}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">{register.user?.name}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {new Date(register.opened_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {register.closed_at
                              ? new Date(register.closed_at).toLocaleString()
                              : "-"}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            KWD {register.opening_balance}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {register.closing_balance
                              ? `KWD ${register.closing_balance}`
                              : "-"}
                          </td>
                          {/* <td className="px-4 py-4 text-sm text-gray-900">
                            {register.expected_balance
                              ? `KWD ${register.expected_balance}`
                              : "-"}
                          </td> */}
                          <td className="px-4 py-4 text-sm text-gray-900">
                            <span
                              className={
                                register.difference > 0
                                  ? "text-green-600"
                                  : register.difference < 0
                                    ? "text-red-600"
                                    : ""
                              }
                            >
                              {register.difference
                                ? `KWD ${register.difference}`
                                : "-"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${register.status === "Open"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100"
                                }`}
                            >
                              {register.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            <button
                              onClick={() => handleViewDetails(register.id)}
                              className="text-blue-600 hover:text-blue-800 cursor-pointer"
                            >
                              <img
                                src={view_icon}
                                alt="View"
                                className="w-5 h-5"
                              />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-300">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
                  <div className="text-xs sm:text-sm text-gray-500">
                    Showing {pagination.from} to {pagination.to} of{" "}
                    {pagination.total}
                  </div>
                  <div className="flex space-x-1 sm:space-x-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2 sm:px-3 py-1 border border-gray-300 rounded disabled:opacity-50 text-xs sm:text-sm"
                    >
                      Previous
                    </button>
                    <span className="px-2 sm:px-3 py-1 bg-blue-500 text-white rounded text-xs sm:text-sm">
                      {currentPage}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(pagination.last_page, p + 1),
                        )
                      }
                      disabled={currentPage === pagination.last_page}
                      className="px-2 sm:px-3 py-1 border border-gray-300 rounded disabled:opacity-50 text-xs sm:text-sm"
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
        <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="p-4 sm:p-6 border-b border-gray-300 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-lg sm:text-xl font-bold truncate">
                Register Details - {selectedRegister.branch?.branch_name}
              </h2>
              <button
                onClick={() => setShowRegisterDetails(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl ml-2 shrink-0"
              >
                ×
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-600">
                    Opening Balance
                  </p>
                  <p className="text-xl sm:text-2xl font-bold break-words">
                    KWD {selectedRegister.opening_balance}
                  </p>
                </div>
                {/* <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-green-600">Expected Balance</p>
                  <p className="text-xl sm:text-2xl font-bold break-words">
                    KWD {selectedRegister.expected_balance || "0.000"}
                  </p>
                </div> */}
                <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-purple-600">
                    Closing Balance
                  </p>
                  <p className="text-xl sm:text-2xl font-bold break-words">
                    KWD {selectedRegister.closing_balance || "0.000"}
                  </p>
                </div>
              </div>

              {/* Cash Movements */}
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                Cash Movements
              </h3>
              <div className="overflow-x-auto mb-4 sm:mb-6">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">
                          Type
                        </th>
                        <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">
                          Amount
                        </th>
                        <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">
                          Reason
                        </th>
                        <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">
                          Time
                        </th>
                        <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">
                          Recorded By
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRegister.cash_movements?.length > 0 ? (
                        selectedRegister.cash_movements.map((movement: any) => (
                          <tr key={movement.id}>
                            <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                              <span
                                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs ${movement.type === "Cash In"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                  }`}
                              >
                                {movement.type}
                              </span>
                            </td>
                            <td className="px-2 sm:px-4 py-2 font-medium text-xs sm:text-sm whitespace-nowrap">
                              KWD {movement.amount}
                            </td>
                            <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm break-words max-w-[150px] sm:max-w-[200px]">
                              {movement.reason}
                            </td>
                            <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">
                              {new Date(
                                movement.movement_date,
                              ).toLocaleString()}
                            </td>
                            <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">
                              {movement.recorded_by?.name}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center py-3 sm:py-4 text-xs sm:text-sm"
                          >
                            No cash movements
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sales from this register */}
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                Sales
              </h3>
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">
                          Invoice
                        </th>
                        <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">
                          Time
                        </th>
                        {/* <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Items</th> */}
                        <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">
                          Total
                        </th>
                        <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">
                          Payment
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRegister.sales?.length > 0 ? (
                        selectedRegister.sales.map((sale: any) => (
                          <tr key={sale.id}>
                            <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">
                              {sale.sale_number}
                            </td>
                            <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">
                              {new Date(sale.created_at).toLocaleString()}
                            </td>
                            {/* <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">
                              {sale.items?.length || 0}
                            </td> */}
                            <td className="px-2 sm:px-4 py-2 font-medium text-xs sm:text-sm whitespace-nowrap">
                              KWD {sale.total_amount}
                            </td>
                            <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">
                              {sale.payment_method}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center py-3 sm:py-4 text-xs sm:text-sm"
                          >
                            No sales
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-300 flex justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => setShowRegisterDetails(false)}
                className="px-3 sm:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm sm:text-base"
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
