// src/features/pos/pages/POSOrdersPage.tsx
import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useGetSalesQuery } from "../../../services/posApi";
import { useGetBranchesQuery } from "../../../services/superAdminApi";
import { useAppSelector } from "../../../app/hooks";
import type { RootState } from "../../../app/store";
import { canSwitchBranch } from "../../../utils/roleHelpers";
import CreateReturnModal from "../components/CreateReturnModal";

import search_icon from "../../../assets/icons/search_icon.svg";
import export_pdf from "../../../assets/icons/export_pdf.svg";
import export_excel from "../../../assets/icons/export_excel.svg";
import returns from "../../../assets/icons/returns.png";
import dropdown_arrow_icon from "../../../assets/icons/dropdown_arrow_icon.svg";
import date_icon from "../../../assets/icons/date_icon.svg";
import market_icon from "../../../assets/icons/market_icon.svg";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";



import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

import type {
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";


import { ChevronUp, ChevronDown } from "lucide-react";

export default function POSOrdersPage() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const userCanSwitchBranch = canSwitchBranch(user?.role?.role_name);

  const [returnSaleId, setReturnSaleId] = useState<number | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  
const [sorting, setSorting] = useState<SortingState>([]);
const [globalFilter, setGlobalFilter] = useState("");




  const { data: branchesData } = useGetBranchesQuery();
  const branches = Array.isArray(branchesData) ? branchesData : [];

  console.log("return sale id", returnSaleId);
  // Lock branch-restricted users to their own branch automatically
  useEffect(() => {
    if (!userCanSwitchBranch && user?.branch_id) {
      setSelectedBranchId(user.branch_id.toString());
    }
  }, [userCanSwitchBranch, user?.branch_id]);

  const { data: salesResponse, isLoading } = useGetSalesQuery({
    branch_id: selectedBranchId ? parseInt(selectedBranchId) : undefined,
    payment_method: paymentFilter || undefined,
    status: statusFilter || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    search: searchQuery || undefined,
    page: currentPage,
    per_page: itemsPerPage,
  });

  const sales = salesResponse?.data?.data || [];
  const pagination = salesResponse?.data;

  const totalRevenue = sales.reduce(
    (sum: number, s: any) => sum + parseFloat(s.total_amount || "0"),
    0,
  );

  // Search suggestions from live data
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    const suggestions = new Set<string>();
    sales.forEach((s: any) => {
      if (s.sale_number?.toLowerCase().includes(query))
        suggestions.add(s.sale_number);
      if (s.cashier?.name?.toLowerCase().includes(query))
        suggestions.add(s.cashier.name);
      if (s.branch?.branch_name?.toLowerCase().includes(query))
        suggestions.add(s.branch.branch_name);
    });
    return Array.from(suggestions).slice(0, 5);
  }, [searchQuery, sales]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(e.target.value.length >= 2);
    setCurrentPage(1);
  };

  const handleSuggestionClick = (s: string) => {
    setSearchQuery(s);
    setShowSuggestions(false);
  };

  const handleSearchBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  // Pagination
  const totalPages = pagination?.last_page || 1;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 3) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 2) {
      pages.push(1, 2, 3);
      if (totalPages > 3) pages.push("...");
    } else if (currentPage >= totalPages - 1) {
      if (totalPages > 3) pages.push("...");
      pages.push(totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push("...", currentPage - 1, currentPage, currentPage + 1, "...");
    }
    return pages;
  };

  // Export Excel
  const handleExportToExcel = () => {
    try {
      const exportData = sales.map((s: any) => ({
        Order: s.sale_number,
        Branch: s.branch?.branch_name,
        Cashier: s.cashier?.name,
        "Payment Method": s.payment_method,
        Status: s.status,
        "Total (KD)": parseFloat(s.total_amount).toFixed(3),
        Date: new Date(s.sale_date).toLocaleDateString(),
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      ws["!cols"] = Object.keys(exportData[0] || {}).map(() => ({ wch: 22 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Orders Report");
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(
        new Blob([buf], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `orders_report_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (e) {
      console.error("Excel export failed:", e);
    }
  };

  // Export PDF
  const handleExportToPDF = () => {
    if (!sales.length) {
      alert("No orders to export");
      return;
    }
    try {
      const doc = new jsPDF("portrait", "mm", "a4");
      const marginLeft = 10;
      let yPos = 20;

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("ORDERS REPORT", 105, yPos, { align: "center" });
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        marginLeft,
        yPos,
      );
      doc.text(
        `Total Orders: ${pagination?.total || sales.length}`,
        200,
        yPos,
        { align: "right" },
      );
      yPos += 5;
      doc.text(
        `Total Revenue: KD ${totalRevenue.toFixed(3)}`,
        marginLeft,
        yPos,
      );
      yPos += 8;

      doc.setDrawColor(200, 200, 200);
      doc.line(marginLeft, yPos, 200, yPos);
      yPos += 10;

      const colWidths = [35, 40, 35, 35, 40];
      const headers = ["Sale #", "Branch", "Cashier", "Payment", "Total (KD)"];

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255);
      doc.setFillColor(23, 115, 207);
      let xPos = marginLeft;
      headers.forEach((h, i) => {
        doc.rect(xPos, yPos, colWidths[i], 8, "F");
        doc.text(h, xPos + colWidths[i] / 2, yPos + 5.5, { align: "center" });
        xPos += colWidths[i];
      });
      yPos += 8;

      doc.setTextColor(0);
      doc.setFont("helvetica", "normal");
      sales.forEach((s: any, rowIndex: number) => {
        if (yPos > 270) {
          doc.addPage("portrait");
          yPos = 20;
        }
        if (rowIndex % 2 === 0) {
          doc.setFillColor(248, 248, 248);
          xPos = marginLeft;
          colWidths.forEach((w) => {
            doc.rect(xPos, yPos, w, 8, "F");
            xPos += w;
          });
        }
        xPos = marginLeft;
        const row = [
          s.sale_number,
          s.branch?.branch_name || "",
          s.cashier?.name || "",
          s.payment_method,
          `KD ${parseFloat(s.total_amount).toFixed(3)}`,
        ];
        doc.setFontSize(9);
        row.forEach((cell, i) => {
          let text = String(cell);
          const maxW = colWidths[i] - 4;
          while (doc.getTextWidth(text) > maxW && text.length > 3) {
            text = text.substring(0, text.length - 4) + "...";
          }
          doc.text(text, xPos + colWidths[i] / 2, yPos + 5.5, {
            align: "center",
          });
          xPos += colWidths[i];
        });
        yPos += 8;
      });

      const pageCount = (doc.internal as any).pages.length;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
      }
      doc.save(`orders_report_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (e) {
      console.error("PDF export failed:", e);
    }
  };

  const paymentBadge = (method: string) => {
    const map: Record<string, string> = {
      Cash: "bg-green-100 text-green-800",
      Card: "bg-blue-100 text-blue-800",
      "K-Net": "bg-purple-100 text-purple-800",
      "Mobile Payment": "bg-orange-100 text-orange-800",
      Mixed: "bg-gray-100 text-gray-800",
    };
    return map[method] || "bg-gray-100 text-gray-600";
  };



  const columns: ColumnDef<any>[] = useMemo(
  () => [
    {
      accessorKey: "sale_number",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-1 group"
        >
          Order
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="w-3 h-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />
          )}
        </button>
      ),
      cell: ({ row }) => (
        <div className="text-sm font-medium text-gray-900">
          {row.original.sale_number}
        </div>
      ),
    },
    {
      accessorKey: "branch.branch_name",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-1 group"
        >
          Branch
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="w-3 h-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />
          )}
        </button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-gray-900">
          {row.original.branch?.branch_name}
        </div>
      ),
    },
    {
      accessorKey: "cashier.name",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-1 group"
        >
          Cashier
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="w-3 h-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />
          )}
        </button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-gray-900">
          {row.original.cashier?.name}
        </div>
      ),
    },
    {
      accessorKey: "payment_method",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-1 group"
        >
          Pay
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="w-3 h-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />
          )}
        </button>
      ),
      cell: ({ row }) => {
        const paymentMethod = row.original.payment_method;
        const paymentBadge = (method: string) => {
          const map: Record<string, string> = {
            Cash: "bg-green-100 text-green-800",
            Card: "bg-blue-100 text-blue-800",
            "K-Net": "bg-purple-100 text-purple-800",
            "Mobile Payment": "bg-orange-100 text-orange-800",
            Mixed: "bg-gray-100 text-gray-800",
          };
          return map[method] || "bg-gray-100 text-gray-600";
        };
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${paymentBadge(paymentMethod)}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {paymentMethod}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-1 group"
        >
          Status
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="w-3 h-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />
          )}
        </button>
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        const statusClass = status === "Completed"
          ? "bg-green-100 text-green-800"
          : status === "Refunded"
            ? "bg-red-100 text-red-800"
            : status === "Partially Refunded"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-600";
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "total_amount",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-1 group"
        >
          Total
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="w-3 h-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />
          )}
        </button>
      ),
      cell: ({ row }) => (
        <div className="text-sm font-semibold text-gray-900">
          KD {parseFloat(row.original.total_amount).toFixed(3)}
        </div>
      ),
    },
    {
      accessorKey: "sale_date",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-1 group"
        >
          Date
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="w-3 h-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />
          )}
        </button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">
          {new Date(row.original.sale_date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <button
          onClick={() => {
            setReturnSaleId(row.original.id);
            setShowReturnModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
        >
          <img src={returns} alt="" className="w-3.5 h-3.5" />
          <span>Return</span>
        </button>
      ),
    },
  ],
  []
);

// Create table instance
const table = useReactTable({
  data: sales,
  columns,
  state: {
    sorting,
    globalFilter,
  },
  onSortingChange: setSorting,
  onGlobalFilterChange: setGlobalFilter,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  // getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  // initialState: {
  //   pagination: {
  //     pageSize: 10,
  //   },
  // },
});


  return (
    <DashboardLayout>
      <div className="min-h-screen flex flex-col gap-4 sm:gap-6 overflow-x-hidden min-w-0">
        {/* HEADER SECTION */}
        <div
          className="bg-white rounded-lg grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6"
          style={{
            padding: "12px 24px",
            width: "100%",
            boxSizing: "border-box",
            flexShrink: 0,
          }}
        >
          {/* Start Date */}
          <div className="relative">
            <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
              <img src={date_icon} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 sm:pl-12 pr-7 sm:pr-10 py-2 sm:py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium text-xs sm:text-sm md:text-base appearance-none cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200
            [&::-webkit-calendar-picker-indicator]:opacity-0
            [&::-webkit-calendar-picker-indicator]:absolute
            [&::-webkit-calendar-picker-indicator]:w-full
            [&::-webkit-calendar-picker-indicator]:h-full
            [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
            <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <img
                src={dropdown_arrow_icon}
                alt=""
                className="w-3 h-3 sm:w-4 sm:h-4"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="relative">
            <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
              <img src={date_icon} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 sm:pl-12 pr-7 sm:pr-10 py-2 sm:py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium text-xs sm:text-sm md:text-base appearance-none cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200
            [&::-webkit-calendar-picker-indicator]:opacity-0
            [&::-webkit-calendar-picker-indicator]:absolute
            [&::-webkit-calendar-picker-indicator]:w-full
            [&::-webkit-calendar-picker-indicator]:h-full
            [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
            <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <img
                src={dropdown_arrow_icon}
                alt=""
                className="w-3 h-3 sm:w-4 sm:h-4"
              />
            </div>
          </div>

          {/* Branch */}
          <div className="relative">
            <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <img src={market_icon} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            {userCanSwitchBranch ? (
              <select
                value={selectedBranchId}
                onChange={(e) => {
                  setSelectedBranchId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 sm:pl-12 pr-7 sm:pr-10 py-2 sm:py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium text-xs sm:text-sm md:text-base appearance-none cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">All Branches</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full pl-9 sm:pl-12 pr-4 py-2 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium text-xs sm:text-sm md:text-base truncate">
                {branches.find((b: any) => b.id === user?.branch_id)
                  ?.branch_name || "My Branch"}
              </div>
            )}
            <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <img
                src={dropdown_arrow_icon}
                alt=""
                className="w-3 h-3 sm:w-4 sm:h-4"
              />
            </div>
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="bg-white rounded-xl w-full min-w-0 flex-shrink-0">
          {/* Search + Filters Row */}
          <div className="p-5 pb-0 w-full">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px] sm:max-w-[400px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <img
                    src={search_icon}
                    alt="Search"
                    className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                  />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() =>
                    searchQuery.length >= 2 && setShowSuggestions(true)
                  }
                  onBlur={handleSearchBlur}
                  placeholder="Search by Order, Branch, Cashier, Payment..."
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border border-gray-400 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                />
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <ul className="py-1 max-h-48 sm:max-h-60 overflow-auto">
                      {searchSuggestions.map((s, i) => (
                        <li
                          key={i}
                          className="px-3 sm:px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-700 hover:text-gray-900 border-b border-gray-100 last:border-b-0"
                          onClick={() => handleSuggestionClick(s)}
                        >
                          <div className="flex items-center space-x-2">
                            <img
                              src={search_icon}
                              alt=""
                              className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400"
                            />
                            <span className="text-xs sm:text-sm">{s}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs text-gray-500 bg-gray-50 border-t border-gray-200">
                      {searchSuggestions.length} suggestion
                      {searchSuggestions.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                )}
              </div>

              {/* Filters + Export */}
              <div className="flex flex-wrap gap-2 items-center justify-end">
                {/* Payment Filter */}
                <div className="relative">
                  <select
                    value={paymentFilter}
                    onChange={(e) => {
                      setPaymentFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-3 pr-7 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[110px]"
                  >
                    <option value="">All Payments</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="K-Net">K-Net</option>
                    <option value="Mobile Payment">Mobile Payment</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <img
                      src={dropdown_arrow_icon}
                      alt=""
                      className="w-3 h-3 sm:w-4 sm:h-4"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-3 pr-7 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[110px]"
                  >
                    <option value="">All Status</option>
                    <option value="Completed">Completed</option>
                    <option value="Refunded">Refunded</option>
                    <option value="Partially Refunded">
                      Partially Refunded
                    </option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <img
                      src={dropdown_arrow_icon}
                      alt=""
                      className="w-3 h-3 sm:w-4 sm:h-4"
                    />
                  </div>
                </div>

                {/* Export PDF */}
                <button
                  onClick={handleExportToPDF}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <img
                    src={export_pdf}
                    alt="PDF"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  />
                  <span className="text-xs sm:text-sm font-medium text-black">
                    PDF
                  </span>
                </button>

                {/* Export Excel */}
                <button
                  onClick={handleExportToExcel}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <img
                    src={export_excel}
                    alt="Excel"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    Excel
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Table Title */}
          <div className="px-5 pt-4 pb-2">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
              Orders
            </h2>
            {(searchQuery ||
              selectedBranchId ||
              paymentFilter ||
              statusFilter) && (
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Showing {pagination?.total || sales.length} orders
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            )}
          </div>

         {/* Table Area with Horizontal Scroll Only */}
           <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
<div className="xl:col-span-4 overflow-x-auto w-full">
  <table className="w-full divide-y divide-gray-200" style={{ minWidth: '680px' }}>
    <thead className="bg-gray-50">
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <th
              key={header.id}
              className="px-4 md:px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
            >
              {header.isPlaceholder
                ? null
                : flexRender(header.column.columnDef.header, header.getContext())}
            </th>
          ))}
        </tr>
      ))}
    </thead>
    <tbody className="bg-white divide-y divide-gray-100">
      {isLoading ? (
        <tr>
          <td colSpan={columns.length} className="py-12 text-center">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          </td>
        </tr>
      ) : table.getRowModel().rows.length === 0 ? (
        <tr>
          <td colSpan={columns.length} className="py-12 text-center text-gray-500 text-sm">
            {searchQuery
              ? `No orders found matching your search.`
              : "No orders available."}
          </td>
        </tr>
      ) : (
        table.getRowModel().rows.map((row) => (
          <tr key={row.id} className="hover:bg-gray-50 transition-colors">
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap"
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
           </div>


          {/* Pagination */}
<div className="px-5 py-4 border-t border-gray-100">
  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
    <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
      {pagination ? (
        <>
          Showing{" "}
          <span className="font-medium">{pagination.from}</span> to{" "}
          <span className="font-medium">{pagination.to}</span> of{" "}
          <span className="font-medium">{pagination.total}</span>{" "}
          orders
        </>
      ) : (
        `${sales.length} orders`
      )}
    </div>
    <div className="flex items-center flex-wrap justify-center gap-1">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
          currentPage === 1
            ? "text-gray-400 bg-gray-100 cursor-not-allowed"
            : "text-gray-700 bg-gray-100 hover:bg-gray-200"
        }`}
      >
        Prev
      </button>

      {getPageNumbers().map((page, index) =>
        page === "..." ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-500"
          >
            ...
          </span>
        ) : (
          <button
            key={`page-${page}`}
            onClick={() => handlePageChange(page as number)}
            className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
              currentPage === page
                ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        ),
      )}

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
          currentPage === totalPages
            ? "text-gray-400 bg-gray-100 cursor-not-allowed"
            : "text-gray-700 bg-gray-100 hover:bg-gray-200"
        }`}
      >
        Next
      </button>
    </div>
  </div>
</div>
        </div>
      </div>

      <CreateReturnModal
        isOpen={showReturnModal}
        onClose={() => {
          setShowReturnModal(false);
          setReturnSaleId(null);
        }}
        onSuccess={() => {
          setShowReturnModal(false);
          setReturnSaleId(null);
        }}
        saleId={returnSaleId ?? undefined}
      />
    </DashboardLayout>
  );
}