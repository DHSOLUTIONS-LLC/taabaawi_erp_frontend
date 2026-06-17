// // src/features/pos/pages/POSOrdersPage.tsx
// import { useState, useMemo, useEffect } from "react";
// import { Link } from "react-router-dom";
// import DashboardLayout from "../../../layouts/DashboardLayout";
// import { useGetSalesQuery } from "../../../services/posApi";
// import { useGetBranchesQuery } from "../../../services/superAdminApi";
// import { useAppSelector } from "../../../app/hooks";
// import type { RootState } from "../../../app/store";
// import { canSwitchBranch } from "../../../utils/roleHelpers";
// import CreateReturnModal from "../components/CreateReturnModal";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// import search_icon from "../../../assets/icons/search_icon.svg";
// import export_pdf from "../../../assets/icons/export_pdf.svg";
// import export_excel from "../../../assets/icons/export_excel.svg";
// import returns from "../../../assets/icons/returns.png";
// import dropdown_arrow_icon from "../../../assets/icons/dropdown_arrow_icon.svg";
// import date_icon from "../../../assets/icons/date_icon.svg";
// import market_icon from "../../../assets/icons/market_icon.svg";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
// // import jsPDF from "jspdf";

// import {
//   useReactTable,
//   getCoreRowModel,
//   getFilteredRowModel,
//   // getPaginationRowModel,
//   getSortedRowModel,
//   flexRender,
// } from "@tanstack/react-table";

// import type { ColumnDef, SortingState } from "@tanstack/react-table";

// import { ChevronUp, ChevronDown } from "lucide-react";

// export default function POSOrdersPage() {
//   const { user } = useAppSelector((state: RootState) => state.auth);
//   const userCanSwitchBranch = canSwitchBranch(user?.role?.role_name);
//   const isSuperAdmin = user?.role?.role_name === "Super Admin";
//   const basePath = isSuperAdmin ? "/admin" : "";

//   const [returnSaleId, setReturnSaleId] = useState<number | null>(null);
//   const [showReturnModal, setShowReturnModal] = useState(false);

//   const [selectedBranchId, setSelectedBranchId] = useState<string>("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [paymentFilter, setPaymentFilter] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   const [sorting, setSorting] = useState<SortingState>([]);
//   const [globalFilter, setGlobalFilter] = useState("");

//   const { data: branchesData } = useGetBranchesQuery();
//   const branches = Array.isArray(branchesData) ? branchesData : [];

//   console.log("return sale id", returnSaleId);
//   // Lock branch-restricted users to their own branch automatically
//   useEffect(() => {
//     if (!userCanSwitchBranch && user?.branch_id) {
//       setSelectedBranchId(user.branch_id.toString());
//     }
//   }, [userCanSwitchBranch, user?.branch_id]);

//   const { data: salesResponse, isLoading } = useGetSalesQuery({
//     branch_id: selectedBranchId ? parseInt(selectedBranchId) : undefined,
//     payment_method: paymentFilter || undefined,
//     status: statusFilter || undefined,
//     start_date: startDate || undefined,
//     end_date: endDate || undefined,
//     search: searchQuery || undefined,
//     page: currentPage,
//     per_page: itemsPerPage,
//   });

//   const sales = salesResponse?.data?.data || [];
//   const pagination = salesResponse?.data;

//   const totalRevenue = sales.reduce(
//     (sum: number, s: any) => sum + parseFloat(s.total_amount || "0"),
//     0,
//   );

//   // Search suggestions from live data
//   const searchSuggestions = useMemo(() => {
//     if (!searchQuery.trim() || searchQuery.length < 2) return [];
//     const query = searchQuery.toLowerCase();
//     const suggestions = new Set<string>();
//     sales.forEach((s: any) => {
//       if (s.sale_number?.toLowerCase().includes(query))
//         suggestions.add(s.sale_number);
//       if (s.cashier?.name?.toLowerCase().includes(query))
//         suggestions.add(s.cashier.name);
//       if (s.branch?.branch_name?.toLowerCase().includes(query))
//         suggestions.add(s.branch.branch_name);
//     });
//     return Array.from(suggestions).slice(0, 5);
//   }, [searchQuery, sales]);

//   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearchQuery(e.target.value);
//     setShowSuggestions(e.target.value.length >= 2);
//     setCurrentPage(1);
//   };

//   const handleSuggestionClick = (s: string) => {
//     setSearchQuery(s);
//     setShowSuggestions(false);
//   };

//   const handleSearchBlur = () => {
//     setTimeout(() => setShowSuggestions(false), 200);
//   };

//   // Pagination
//   const totalPages = pagination?.last_page || 1;

//   const handlePageChange = (page: number) => {
//     if (page >= 1 && page <= totalPages) setCurrentPage(page);
//   };

//   const getPageNumbers = () => {
//     const pages: (number | string)[] = [];
//     if (totalPages <= 3) {
//       for (let i = 1; i <= totalPages; i++) pages.push(i);
//     } else if (currentPage <= 2) {
//       pages.push(1, 2, 3);
//       if (totalPages > 3) pages.push("...");
//     } else if (currentPage >= totalPages - 1) {
//       if (totalPages > 3) pages.push("...");
//       pages.push(totalPages - 2, totalPages - 1, totalPages);
//     } else {
//       pages.push("...", currentPage - 1, currentPage, currentPage + 1, "...");
//     }
//     return pages;
//   };

// // Export Excel with all details
// const handleExportToExcel = () => {
//   if (!sales.length) {
//     alert("No orders to export");
//     return;
//   }

//   try {
//     const exportData = sales.map((s: any) => ({
//       "Order #": s.sale_number,
//       "Date": new Date(s.sale_date).toLocaleDateString("en-GB", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//       }),
//       "Time": new Date(s.sale_date).toLocaleTimeString("en-GB", {
//         hour: "2-digit",
//         minute: "2-digit",
//       }),
//       "Branch": s.branch?.branch_name || "—",
//       "Cashier": s.cashier?.name || "—",
//       "Sales Staff": s.sales_staff?.name || "—",
//       "Payment Method": s.payment_method || "—",
//       "Status": s.status || "—",
//       "Subtotal (KD)": parseFloat(s.subtotal || "0").toFixed(3),
//       "Discount (KD)": parseFloat(s.discount_amount || "0").toFixed(3),
//       "Coupon Discount (KD)": parseFloat(s.coupon_discount || "0").toFixed(3),
//       "Employee Discount (KD)": parseFloat(s.employee_discount_amount || "0").toFixed(3),
//       "Total (KD)": parseFloat(s.total_amount || "0").toFixed(3),
//       "Cash Received (KD)": s.cash_received ? parseFloat(s.cash_received).toFixed(3) : "—",
//       "Change Given (KD)": s.change_given ? parseFloat(s.change_given).toFixed(3) : "—",
//       "Card Reference": s.card_reference || "—",
//       "Coupon Code": s.coupon_code || "—",
//       "Items Count": s.items?.length || 0,
//       "Is Gift": s.is_gift ? "Yes" : "No",
//       "Is Employee Purchase": s.is_employee_purchase ? "Yes" : "No",
//       "Notes": s.notes || "—",
//     }));

//     const ws = XLSX.utils.json_to_sheet(exportData);

//     // Set column widths
//     const colWidths = {
//       "Order #": 20,
//       "Date": 15,
//       "Time": 12,
//       "Branch": 20,
//       "Cashier": 20,
//       "Sales Staff": 20,
//       "Payment Method": 18,
//       "Status": 15,
//       "Subtotal (KD)": 15,
//       "Discount (KD)": 15,
//       "Coupon Discount (KD)": 20,
//       "Employee Discount (KD)": 22,
//       "Total (KD)": 15,
//       "Cash Received (KD)": 18,
//       "Change Given (KD)": 18,
//       "Card Reference": 20,
//       "Coupon Code": 18,
//       "Items Count": 12,
//       "Is Gift": 10,
//       "Is Employee Purchase": 20,
//       "Notes": 30,
//     };

//     ws["!cols"] = Object.keys(exportData[0] || {}).map(key => ({ 
//       wch: colWidths[key as keyof typeof colWidths] || 15 
//     }));

//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Orders Report");

//     const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
//     saveAs(
//       new Blob([buf], {
//         type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//       }),
//       `orders_report_${new Date().toISOString().split("T")[0]}.xlsx`,
//     );
//   } catch (e) {
//     console.error("Excel export failed:", e);
//     alert("Failed to export Excel. Please try again.");
//   }
// };

// // Export PDF with all details

// const handleExportToPDF = () => {
//   if (!sales.length) {
//     alert("No orders to export");
//     return;
//   }

//   try {
//     const doc = new jsPDF("landscape", "mm", "a4");
//     const pageWidth = doc.internal.pageSize.getWidth();

//     // Title - Centered
//     doc.setFontSize(18);
//     doc.setFont("helvetica", "bold");
//     doc.text("ORDERS REPORT", pageWidth / 2, 15, { align: "center" });

//     // Report info
//     doc.setFontSize(10);
//     doc.setFont("helvetica", "normal");
//     doc.setTextColor(100);
//     doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);

//     const totalRevenue = sales.reduce(
//       (sum: number, s: any) => sum + parseFloat(s.total_amount || "0"),
//       0,
//     );
//     doc.text(`Total Orders: ${pagination?.total || sales.length}`, pageWidth - 14, 25, { align: "right" });
//     doc.text(`Total Revenue: KWD ${totalRevenue.toFixed(3)}`, 14, 32);

//     // Calculate table width to center it
//     const tableColumns = [
//       "Order #", "Date", "Branch", "Cashier", "Sales Staff",
//       "Payment", "Status", "Subtotal", "Discount", "Total"
//     ];

//     // Prepare table data
//     const tableData = sales.map((s: any) => [
//       s.sale_number || "-",
//       new Date(s.sale_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
//       s.branch?.branch_name || "-",
//       s.cashier?.name || "-",
//       s.sales_staff?.name || "-",
//       s.payment_method || "-",
//       s.status || "-",
//       parseFloat(s.subtotal || "0").toFixed(3),
//       parseFloat(s.discount_amount || "0").toFixed(3),
//       parseFloat(s.total_amount || "0").toFixed(3),
//     ]);

//     // Create centered table
//     autoTable(doc, {
//       startY: 40,
//       head: [tableColumns],
//       body: tableData,
//       theme: 'striped',
//       headStyles: {
//         fillColor: [23, 115, 207],
//         textColor: [255, 255, 255],
//         fontSize: 8,
//         fontStyle: 'bold',
//         halign: 'center',
//         valign: 'middle',
//       },
//       bodyStyles: {
//         fontSize: 7,
//         cellPadding: 2,
//         valign: 'middle',
//       },
//       alternateRowStyles: {
//         fillColor: [248, 248, 248],
//       },
//       columnStyles: {
//         0: { cellWidth: 30, halign: 'left' },
//         1: { cellWidth: 25, halign: 'center' },
//         2: { cellWidth: 35, halign: 'left' },
//         3: { cellWidth: 25, halign: 'left' },
//         4: { cellWidth: 30, halign: 'left' },
//         5: { cellWidth: 30, halign: 'center' },
//         6: { cellWidth: 25, halign: 'center' },
//         7: { cellWidth: 25, halign: 'right' },
//         8: { cellWidth: 20, halign: 'right' },
//         9: { cellWidth: 20, halign: 'right' },
//       },
//       margin: { left: 10, right: 10 },
//       horizontalPageBreak: false,
//       pageBreak: 'auto',
//       showHead: 'everyPage',
//       tableWidth: 'auto',
//     });

//     // Add page numbers centered
//     const pageCount = doc.internal.getNumberOfPages();
//     for (let i = 1; i <= pageCount; i++) {
//       doc.setPage(i);
//       doc.setFontSize(8);
//       doc.setTextColor(150);
//       doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 205, { align: "center" });
//     }

//     doc.save(`orders_report_${new Date().toISOString().split("T")[0]}.pdf`);
//   } catch (e) {
//     console.error("PDF export failed:", e);
//     alert("Failed to export PDF. Please try again.");
//   }
// };


//   const columns: ColumnDef<any>[] = useMemo(
//     () => [
//       {
//         accessorKey: "sale_number",
//         header: ({ column }) => (
//           <button
//             onClick={() => column.toggleSorting()}
//             className="flex items-center gap-1 group"
//           >
//             Order
//             {column.getIsSorted() === "asc" ? (
//               <ChevronUp className="w-3 h-3" />
//             ) : column.getIsSorted() === "desc" ? (
//               <ChevronDown className="w-3 h-3" />
//             ) : (
//               <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />
//             )}
//           </button>
//         ),
//         cell: ({ row }) => (
//           <div className="text-sm font-medium text-gray-900">
//             {row.original.sale_number}
//           </div>
//         ),
//       },
//       {
//         accessorKey: "branch.branch_name",
//         header: ({ column }) => (
//           <button
//             onClick={() => column.toggleSorting()}
//             className="flex items-center gap-1 group"
//           >
//             Branch
//             {column.getIsSorted() === "asc" ? (
//               <ChevronUp className="w-3 h-3" />
//             ) : column.getIsSorted() === "desc" ? (
//               <ChevronDown className="w-3 h-3" />
//             ) : (
//               <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />
//             )}
//           </button>
//         ),
//         cell: ({ row }) => (
//           <div className="text-sm text-gray-900">
//             {row.original.branch?.branch_name}
//           </div>
//         ),
//       },
//       {
//         accessorKey: "cashier.name",
//         header: ({ column }) => (
//           <button
//             onClick={() => column.toggleSorting()}
//             className="flex items-center gap-1 group"
//           >
//             Cashier
//             {column.getIsSorted() === "asc" ? (
//               <ChevronUp className="w-3 h-3" />
//             ) : column.getIsSorted() === "desc" ? (
//               <ChevronDown className="w-3 h-3" />
//             ) : (
//               <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />
//             )}
//           </button>
//         ),
//         cell: ({ row }) => (
//           <div className="text-sm text-gray-900">
//             {row.original.cashier?.name}
//           </div>
//         ),
//       },
//       {
//         accessorKey: "payment_method",
//         header: ({ column }) => (
//           <button
//             onClick={() => column.toggleSorting()}
//             className="flex items-center gap-1 group"
//           >
//             Pay
//             {column.getIsSorted() === "asc" ? (
//               <ChevronUp className="w-3 h-3" />
//             ) : column.getIsSorted() === "desc" ? (
//               <ChevronDown className="w-3 h-3" />
//             ) : (
//               <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />
//             )}
//           </button>
//         ),
//         cell: ({ row }) => {
//           const paymentMethod = row.original.payment_method;
//           const paymentBadge = (method: string) => {
//             const map: Record<string, string> = {
//               Cash: "bg-green-100 text-green-800",
//               Card: "bg-blue-100 text-blue-800",
//               "K-Net": "bg-purple-100 text-purple-800",
//               "Mobile Payment": "bg-orange-100 text-orange-800",
//               Mixed: "bg-gray-100 text-gray-800",
//             };
//             return map[method] || "bg-gray-100 text-gray-600";
//           };
//           return (
//             <span
//               className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${paymentBadge(paymentMethod)}`}
//             >
//               <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
//               {paymentMethod}
//             </span>
//           );
//         },
//       },
//       {
//         accessorKey: "status",
//         header: ({ column }) => (
//           <button
//             onClick={() => column.toggleSorting()}
//             className="flex items-center gap-1 group"
//           >
//             Status
//             {column.getIsSorted() === "asc" ? (
//               <ChevronUp className="w-3 h-3" />
//             ) : column.getIsSorted() === "desc" ? (
//               <ChevronDown className="w-3 h-3" />
//             ) : (
//               <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />
//             )}
//           </button>
//         ),
//         cell: ({ row }) => {
//           const status = row.original.status;
//           const statusClass =
//             status === "Completed"
//               ? "bg-green-100 text-green-800"
//               : status === "Refunded"
//                 ? "bg-red-100 text-red-800"
//                 : status === "Partially Refunded"
//                   ? "bg-yellow-100 text-yellow-800"
//                   : "bg-gray-100 text-gray-600";
//           return (
//             <span
//               className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}`}
//             >
//               <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
//               {status}
//             </span>
//           );
//         },
//       },
//       {
//         accessorKey: "total_amount",
//         header: ({ column }) => (
//           <button
//             onClick={() => column.toggleSorting()}
//             className="flex items-center gap-1 group"
//           >
//             Total
//             {column.getIsSorted() === "asc" ? (
//               <ChevronUp className="w-3 h-3" />
//             ) : column.getIsSorted() === "desc" ? (
//               <ChevronDown className="w-3 h-3" />
//             ) : (
//               <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />
//             )}
//           </button>
//         ),
//         cell: ({ row }) => (
//           <div className="text-sm font-semibold text-gray-900">
//             KWD {parseFloat(row.original.total_amount).toFixed(3)}
//           </div>
//         ),
//       },
//       {
//         accessorKey: "sale_date",
//         header: ({ column }) => (
//           <button
//             onClick={() => column.toggleSorting()}
//             className="flex items-center gap-1 group"
//           >
//             Date
//             {column.getIsSorted() === "asc" ? (
//               <ChevronUp className="w-3 h-3" />
//             ) : column.getIsSorted() === "desc" ? (
//               <ChevronDown className="w-3 h-3" />
//             ) : (
//               <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />
//             )}
//           </button>
//         ),
//         cell: ({ row }) => (
//           <div className="text-sm text-gray-500">
//             {new Date(row.original.sale_date).toLocaleDateString("en-GB", {
//               day: "2-digit",
//               month: "short",
//               year: "numeric",
//             })}
//           </div>
//         ),
//       },
//       {
//         id: "actions",
//         header: "Action",
//         cell: ({ row }) => (
//           <div className="flex justify-between gap-2">
//             <Link
//               to={`${basePath}/pos/orders/${row.original.id}`}
//               className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-blue-100 text-black-700 cursor-pointer rounded-lg hover:bg-blue-200 transition-colors"
//             >
//               <img src={returns} alt="" className="w-3.5 h-3.5" />
//               <span>View</span>
//             </Link>
//             <button
//               onClick={() => {
//                 setReturnSaleId(row.original.id);
//                 setShowReturnModal(true);
//               }}
//               className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-lg  cursor-pointer hover:bg-orange-200 transition-colors"
//             >
//               <img src={returns} alt="" className="w-3.5 h-3.5" />
//               <span>Return</span>
//             </button>
//           </div>
//         ),
//       },
//     ],
//     [],
//   );

//   // Create table instance
//   const table = useReactTable({
//     data: sales,
//     columns,
//     state: {
//       sorting,
//       globalFilter,
//     },
//     onSortingChange: setSorting,
//     onGlobalFilterChange: setGlobalFilter,
//     getCoreRowModel: getCoreRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//     // getPaginationRowModel: getPaginationRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     // initialState: {
//     //   pagination: {
//     //     pageSize: 10,
//     //   },
//     // },
//   });

//   return (
//     <DashboardLayout>
//       <div className="min-h-screen flex flex-col gap-4 sm:gap-6 overflow-x-hidden min-w-0">
//         {/* HEADER SECTION */}
//         <div
//           className="bg-white rounded-lg grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6"
//           style={{
//             padding: "12px 24px",
//             width: "100%",
//             boxSizing: "border-box",
//             flexShrink: 0,
//           }}
//         >
//           {/* Start Date */}
//           <div className="relative">
//             <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
//               <img src={date_icon} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
//             </div>
//             <input
//               type="date"
//               value={startDate}
//               onChange={(e) => {
//                 setStartDate(e.target.value);
//                 setCurrentPage(1);
//               }}
//               className="w-full pl-9 sm:pl-12 pr-7 sm:pr-10 py-2 sm:py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium text-xs sm:text-sm md:text-base appearance-none cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200
//             [&::-webkit-calendar-picker-indicator]:opacity-0
//             [&::-webkit-calendar-picker-indicator]:absolute
//             [&::-webkit-calendar-picker-indicator]:w-full
//             [&::-webkit-calendar-picker-indicator]:h-full
//             [&::-webkit-calendar-picker-indicator]:cursor-pointer"
//             />
//             <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
//               <img
//                 src={dropdown_arrow_icon}
//                 alt=""
//                 className="w-3 h-3 sm:w-4 sm:h-4"
//               />
//             </div>
//           </div>

//           {/* End Date */}
//           <div className="relative">
//             <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
//               <img src={date_icon} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
//             </div>
//             <input
//               type="date"
//               value={endDate}
//               min={startDate}
//               onChange={(e) => {
//                 setEndDate(e.target.value);
//                 setCurrentPage(1);
//               }}
//               className="w-full pl-9 sm:pl-12 pr-7 sm:pr-10 py-2 sm:py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium text-xs sm:text-sm md:text-base appearance-none cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200
//             [&::-webkit-calendar-picker-indicator]:opacity-0
//             [&::-webkit-calendar-picker-indicator]:absolute
//             [&::-webkit-calendar-picker-indicator]:w-full
//             [&::-webkit-calendar-picker-indicator]:h-full
//             [&::-webkit-calendar-picker-indicator]:cursor-pointer"
//             />
//             <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
//               <img
//                 src={dropdown_arrow_icon}
//                 alt=""
//                 className="w-3 h-3 sm:w-4 sm:h-4"
//               />
//             </div>
//           </div>

//           {/* Branch */}
//           <div className="relative">
//             <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
//               <img src={market_icon} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
//             </div>
//             {userCanSwitchBranch ? (
//               <select
//                 value={selectedBranchId}
//                 onChange={(e) => {
//                   setSelectedBranchId(e.target.value);
//                   setCurrentPage(1);
//                 }}
//                 className="w-full pl-9 sm:pl-12 pr-7 sm:pr-10 py-2 sm:py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium text-xs sm:text-sm md:text-base appearance-none cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//               >
//                 <option value="">All Branches</option>
//                 {branches.map((b: any) => (
//                   <option key={b.id} value={b.id}>
//                     {b.branch_name}
//                   </option>
//                 ))}
//               </select>
//             ) : (
//               <div className="w-full pl-9 sm:pl-12 pr-4 py-2 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium text-xs sm:text-sm md:text-base truncate">
//                 {branches.find((b: any) => b.id === user?.branch_id)
//                   ?.branch_name || "My Branch"}
//               </div>
//             )}
//             <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
//               <img
//                 src={dropdown_arrow_icon}
//                 alt=""
//                 className="w-3 h-3 sm:w-4 sm:h-4"
//               />
//             </div>
//           </div>
//         </div>

//         {/* TABLE CARD */}
//         <div className="bg-white rounded-xl w-full min-w-0 flex-shrink-0">
//           {/* Search + Filters Row */}
//           <div className="p-5 pb-0 w-full">
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
//               {/* Search input */}
//               <div className="relative flex-1 min-w-[200px] sm:max-w-[400px]">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
//                   <img
//                     src={search_icon}
//                     alt="Search"
//                     className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
//                   />
//                 </div>
//                 <input
//                   type="text"
//                   value={searchQuery}
//                   onChange={handleSearchChange}
//                   onFocus={() =>
//                     searchQuery.length >= 2 && setShowSuggestions(true)
//                   }
//                   onBlur={handleSearchBlur}
//                   placeholder="Search by Order, Branch, Cashier, Payment..."
//                   className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border border-gray-400 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
//                 />
//                 {showSuggestions && searchSuggestions.length > 0 && (
//                   <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
//                     <ul className="py-1 max-h-48 sm:max-h-60 overflow-auto">
//                       {searchSuggestions.map((s, i) => (
//                         <li
//                           key={i}
//                           className="px-3 sm:px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-700 hover:text-gray-900 border-b border-gray-100 last:border-b-0"
//                           onClick={() => handleSuggestionClick(s)}
//                         >
//                           <div className="flex items-center space-x-2">
//                             <img
//                               src={search_icon}
//                               alt=""
//                               className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400"
//                             />
//                             <span className="text-xs sm:text-sm">{s}</span>
//                           </div>
//                         </li>
//                       ))}
//                     </ul>
//                     <div className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs text-gray-500 bg-gray-50 border-t border-gray-200">
//                       {searchSuggestions.length} suggestion
//                       {searchSuggestions.length !== 1 ? "s" : ""}
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Filters + Export */}
//               <div className="flex flex-wrap gap-2 items-center justify-end">
//                 {/* Payment Filter */}
//                 <div className="relative">
//                   <select
//                     value={paymentFilter}
//                     onChange={(e) => {
//                       setPaymentFilter(e.target.value);
//                       setCurrentPage(1);
//                     }}
//                     className="pl-3 pr-7 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[110px]"
//                   >
//                     <option value="">All Payments</option>
//                     <option value="Cash">Cash</option>
//                     <option value="Card">Card</option>
//                     <option value="K-Net">K-Net</option>
//                     <option value="Mobile Payment">Mobile Payment</option>
//                     <option value="Mixed">Mixed</option>
//                   </select>
//                   <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
//                     <img
//                       src={dropdown_arrow_icon}
//                       alt=""
//                       className="w-3 h-3 sm:w-4 sm:h-4"
//                     />
//                   </div>
//                 </div>

//                 {/* Status Filter */}
//                 <div className="relative">
//                   <select
//                     value={statusFilter}
//                     onChange={(e) => {
//                       setStatusFilter(e.target.value);
//                       setCurrentPage(1);
//                     }}
//                     className="pl-3 pr-7 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[110px]"
//                   >
//                     <option value="">All Status</option>
//                     <option value="Completed">Completed</option>
//                     <option value="Refunded">Refunded</option>
//                     <option value="Partially Refunded">
//                       Partially Refunded
//                     </option>
//                     <option value="Cancelled">Cancelled</option>
//                   </select>
//                   <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
//                     <img
//                       src={dropdown_arrow_icon}
//                       alt=""
//                       className="w-3 h-3 sm:w-4 sm:h-4"
//                     />
//                   </div>
//                 </div>

//                 {/* Export PDF */}
//                 <button
//                   onClick={handleExportToPDF}
//                   className="flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
//                 >
//                   <img
//                     src={export_pdf}
//                     alt="PDF"
//                     className="w-4 h-4 sm:w-5 sm:h-5"
//                   />
//                   <span className="text-xs sm:text-sm font-medium text-black">
//                     Export PDF
//                   </span>
//                 </button>

//                 {/* Export Excel */}
//                 <button
//                   onClick={handleExportToExcel}
//                   className="flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
//                 >
//                   <img
//                     src={export_excel}
//                     alt="Excel"
//                     className="w-4 h-4 sm:w-5 sm:h-5"
//                   />
//                   <span className="text-xs sm:text-sm font-medium text-gray-700">
//                     Export Excel
//                   </span>
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Table Title */}
//           <div className="px-5 pt-4 pb-2">
//             <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
//               Orders
//             </h2>
//             {(searchQuery ||
//               selectedBranchId ||
//               paymentFilter ||
//               statusFilter) && (
//               <p className="text-xs sm:text-sm text-gray-600 mt-1">
//                 Showing {pagination?.total || sales.length} orders
//                 {searchQuery && ` for "${searchQuery}"`}
//               </p>
//             )}
//           </div>

//           {/* Table Area with Horizontal Scroll Only */}
//           <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
//             <div className="xl:col-span-4 overflow-x-auto w-full">
//               <table
//                 className="w-full divide-y divide-gray-200"
//                 style={{ minWidth: "680px" }}
//               >
//                 <thead className="bg-gray-50">
//                   {table.getHeaderGroups().map((headerGroup) => (
//                     <tr key={headerGroup.id}>
//                       {headerGroup.headers.map((header) => (
//                         <th
//                           key={header.id}
//                           className="px-4 md:px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
//                         >
//                           {header.isPlaceholder
//                             ? null
//                             : flexRender(
//                                 header.column.columnDef.header,
//                                 header.getContext(),
//                               )}
//                         </th>
//                       ))}
//                     </tr>
//                   ))}
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-100">
//                   {isLoading ? (
//                     <tr>
//                       <td
//                         colSpan={columns.length}
//                         className="py-12 text-center"
//                       >
//                         <div className="flex justify-center">
//                           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
//                         </div>
//                       </td>
//                     </tr>
//                   ) : table.getRowModel().rows.length === 0 ? (
//                     <tr>
//                       <td
//                         colSpan={columns.length}
//                         className="py-12 text-center text-gray-500 text-sm"
//                       >
//                         {searchQuery
//                           ? `No orders found matching your search.`
//                           : "No orders available."}
//                       </td>
//                     </tr>
//                   ) : (
//                     table.getRowModel().rows.map((row) => (
//                       <tr
//                         key={row.id}
//                         className="hover:bg-gray-50 transition-colors"
//                       >
//                         {row.getVisibleCells().map((cell) => (
//                           <td
//                             key={cell.id}
//                             className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap"
//                           >
//                             {flexRender(
//                               cell.column.columnDef.cell,
//                               cell.getContext(),
//                             )}
//                           </td>
//                         ))}
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           {/* Pagination */}
//           <div className="px-5 py-4 border-t border-gray-100">
//             <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
//               <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
//                 {pagination ? (
//                   <>
//                     Showing{" "}
//                     <span className="font-medium">{pagination.from}</span> to{" "}
//                     <span className="font-medium">{pagination.to}</span> of{" "}
//                     <span className="font-medium">{pagination.total}</span>{" "}
//                     orders
//                   </>
//                 ) : (
//                   `${sales.length} orders`
//                 )}
//               </div>
//               <div className="flex items-center flex-wrap justify-center gap-1">
//                 <button
//                   onClick={() => handlePageChange(currentPage - 1)}
//                   disabled={currentPage === 1}
//                   className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
//                     currentPage === 1
//                       ? "text-gray-400 bg-gray-100 cursor-not-allowed"
//                       : "text-gray-700 bg-gray-100 hover:bg-gray-200"
//                   }`}
//                 >
//                   Prev
//                 </button>

//                 {getPageNumbers().map((page, index) =>
//                   page === "..." ? (
//                     <span
//                       key={`ellipsis-${index}`}
//                       className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-500"
//                     >
//                       ...
//                     </span>
//                   ) : (
//                     <button
//                       key={`page-${page}`}
//                       onClick={() => handlePageChange(page as number)}
//                       className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
//                         currentPage === page
//                           ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
//                           : "text-gray-700 hover:bg-gray-100"
//                       }`}
//                     >
//                       {page}
//                     </button>
//                   ),
//                 )}

//                 <button
//                   onClick={() => handlePageChange(currentPage + 1)}
//                   disabled={currentPage === totalPages}
//                   className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
//                     currentPage === totalPages
//                       ? "text-gray-400 bg-gray-100 cursor-not-allowed"
//                       : "text-gray-700 bg-gray-100 hover:bg-gray-200"
//                   }`}
//                 >
//                   Next
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <CreateReturnModal
//         isOpen={showReturnModal}
//         onClose={() => {
//           setShowReturnModal(false);
//           setReturnSaleId(null);
//         }}
//         onSuccess={() => {
//           setShowReturnModal(false);
//           setReturnSaleId(null);
//         }}
//         saleId={returnSaleId ?? undefined}
//       />
//     </DashboardLayout>
//   );
// }



// // ---------------------

// src/features/pos/pages/POSOrdersPage.tsx
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useGetSalesQuery } from "../../../services/posApi";
import { useGetBranchesQuery } from "../../../services/superAdminApi";
import { useAppSelector } from "../../../app/hooks";
import type { RootState } from "../../../app/store";
import { canSwitchBranch } from "../../../utils/roleHelpers";
import CreateReturnModal from "../components/CreateReturnModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import search_icon from "../../../assets/icons/search_icon.svg";
import export_pdf from "../../../assets/icons/export_pdf.svg";
import export_excel from "../../../assets/icons/export_excel.svg";
import returns from "../../../assets/icons/returns.png";
import dropdown_arrow_icon from "../../../assets/icons/dropdown_arrow_icon.svg";
import date_icon from "../../../assets/icons/date_icon.svg";
import market_icon from "../../../assets/icons/market_icon.svg";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
// import jsPDF from "jspdf";

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  // getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

import type { ColumnDef, SortingState } from "@tanstack/react-table";

import { ChevronUp, ChevronDown } from "lucide-react";

export default function POSOrdersPage() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const userCanSwitchBranch = canSwitchBranch(user?.role?.role_name);
  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const basePath = isSuperAdmin ? "/admin" : "";

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

  const { data: salesResponse, isLoading, refetch } = useGetSalesQuery({
    branch_id: selectedBranchId ? parseInt(selectedBranchId) : undefined,
    payment_method: paymentFilter || undefined,
    status: statusFilter || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    search: searchQuery || undefined,
    page: currentPage,
    per_page: itemsPerPage,
  });

  let sales = salesResponse?.data?.data || [];
  const pagination = salesResponse?.data;

  // Sort orders: those with customer details first, then those without
  const sortedSales = useMemo(() => {
    return [...sales].sort((a: any, b: any) => {
      // DPPR orders should go to the bottom
      const aIsDPPR = a.is_dppr === 1 || a.is_dppr === true;
      const bIsDPPR = b.is_dppr === 1 || b.is_dppr === true;

      // If one is DPPR and the other isn't, put DPPR at bottom
      if (aIsDPPR && !bIsDPPR) return 1;
      if (!aIsDPPR && bIsDPPR) return -1;

      // For non-DPPR orders, sort by customer details
      const aHasCustomer = a.customer_name || a.customer_email || a.customer_phone || a.customer;
      const bHasCustomer = b.customer_name || b.customer_email || b.customer_phone || b.customer;

      if (aHasCustomer && !bHasCustomer) return -1;
      if (!aHasCustomer && bHasCustomer) return 1;

      return 0;
    });
  }, [sales]);

  const totalRevenue = sortedSales.reduce(
    (sum: number, s: any) => sum + parseFloat(s.total_amount || "0"),
    0,
  );

  // Search suggestions from live data
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    const suggestions = new Set<string>();
    sortedSales.forEach((s: any) => {
      if (s.sale_number?.toLowerCase().includes(query))
        suggestions.add(s.sale_number);
      if (s.cashier?.name?.toLowerCase().includes(query))
        suggestions.add(s.cashier.name);
      if (s.branch?.branch_name?.toLowerCase().includes(query))
        suggestions.add(s.branch.branch_name);
      if (s.customer_name?.toLowerCase().includes(query))
        suggestions.add(s.customer_name);
    });
    return Array.from(suggestions).slice(0, 5);
  }, [searchQuery, sortedSales]);

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

  // Export Excel with all details - with customer details first
  // Export Excel with proper sorting - Customer orders first, DPPR at bottom
  const handleExportToExcel = () => {
    if (!sortedSales.length) {
      alert("No orders to export");
      return;
    }

    try {
      // Separate orders into two groups
      const nonDPPROrders = sortedSales.filter((s: any) => s.is_dppr !== 1 && s.is_dppr !== true);
      const dpprOrders = sortedSales.filter((s: any) => s.is_dppr === 1 || s.is_dppr === true);

      // Prepare data for non-DPPR orders
      const nonDPPRData = nonDPPROrders.map((s: any) => ({
        "Order #": s.sale_number,
        "Date": new Date(s.sale_date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        "Time": new Date(s.sale_date).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        "Customer Name": s.customer_name || s.customer?.first_name + ' ' + s.customer?.last_name || "—",
        "Customer Email": s.customer_email || "—",
        "Customer Phone": s.customer_phone || "—",
        "Branch": s.branch?.branch_name || "—",
        "Cashier": s.cashier?.name || "—",
        "Sales Staff": s.sales_staff?.name || "—",
        "Payment Method": s.payment_method || "—",
        "Status": s.status || "—",
        "Subtotal (KD)": parseFloat(s.subtotal || "0").toFixed(3),
        "Discount (KD)": parseFloat(s.discount_amount || "0").toFixed(3),
        "Coupon Discount (KD)": parseFloat(s.coupon_discount || "0").toFixed(3),
        "Employee Discount (KD)": parseFloat(s.employee_discount_amount || "0").toFixed(3),
        "Total (KD)": parseFloat(s.total_amount || "0").toFixed(3),
        "Cash Received (KD)": s.cash_received ? parseFloat(s.cash_received).toFixed(3) : "—",
        "Change Given (KD)": s.change_given ? parseFloat(s.change_given).toFixed(3) : "—",
        "Card Reference": s.card_reference || "—",
        "Coupon Code": s.coupon_code || "—",
        "Items Count": s.items?.length || 0,
        "Is Gift": s.is_gift ? "Yes" : "No",
        "Is Employee Purchase": s.is_employee_purchase ? "Yes" : "No",
        "Notes": s.notes || "—",
      }));

      // Prepare data for DPPR orders (fewer columns)
      const dpprData = dpprOrders.map((s: any) => ({
        "Order #": s.sale_number,
        "Date": new Date(s.sale_date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        "Time": new Date(s.sale_date).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        "Branch": s.branch?.branch_name || "—",
        "Cashier": s.cashier?.name || "—",
        "Sales Staff": s.sales_staff?.name || "—",
        "Payment Method": s.payment_method || "—",
        "Status": s.status || "—",
        "Total (KD)": parseFloat(s.total_amount || "0").toFixed(3),
        "Items Count": s.items?.length || 0,
        "Is Gift": s.is_gift ? "Yes" : "No",
        "Notes": s.notes || "—",
      }));

      const wb = XLSX.utils.book_new();

      // Sheet 1: Non-DPPR Orders (Customer Orders)
      if (nonDPPRData.length > 0) {
        const ws1 = XLSX.utils.json_to_sheet(nonDPPRData);
        ws1["!cols"] = Object.keys(nonDPPRData[0] || {}).map(key => ({ wch: 20 }));
        XLSX.utils.book_append_sheet(wb, ws1, "Customer Orders");
      }

      // Sheet 2: DPPR Orders
      if (dpprData.length > 0) {
        const ws2 = XLSX.utils.json_to_sheet(dpprData);
        ws2["!cols"] = Object.keys(dpprData[0] || {}).map(key => ({ wch: 20 }));
        XLSX.utils.book_append_sheet(wb, ws2, "DPPR Orders");
      }

      // Sheet 3: Summary
      const summaryData = [
        ["=== REPORT SUMMARY ==="],
        [],
        ["Total Orders", sortedSales.length],
        ["Customer Orders (Non-DPPR)", nonDPPROrders.length],
        ["DPPR Orders", dpprOrders.length],
        [],
        ["Total Revenue", `KWD ${sortedSales.reduce((sum: number, s: any) => sum + parseFloat(s.total_amount || "0"), 0).toFixed(3)}`],
        ["Generated On", new Date().toLocaleString()],
        ["Branch", selectedBranchId ? branches.find((b: any) => b.id === parseInt(selectedBranchId))?.branch_name : "All Branches"],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(
        new Blob([buf], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `orders_report_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (e) {
      console.error("Excel export failed:", e);
      alert("Failed to export Excel. Please try again.");
    }
  };

  // Export PDF with all details - with customer details first
  const handleExportToPDF = () => {
    if (!sortedSales.length) {
      alert("No orders to export");
      return;
    }

    try {
      const doc = new jsPDF("landscape", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      // Separate orders into two groups
      const nonDPPROrders = sortedSales.filter((s: any) => s.is_dppr !== 1 && s.is_dppr !== true);
      const dpprOrders = sortedSales.filter((s: any) => s.is_dppr === 1 || s.is_dppr === true);

      // Title - Centered
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("ORDERS REPORT", pageWidth / 2, 15, { align: "center" });

      // Report info
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
      doc.text(`Branch: ${selectedBranchId ? branches.find((b: any) => b.id === parseInt(selectedBranchId))?.branch_name : "All Branches"}`, 14, 32);

      const totalRevenue = sortedSales.reduce(
        (sum: number, s: any) => sum + parseFloat(s.total_amount || "0"),
        0,
      );
      doc.text(`Total Orders: ${sortedSales.length}`, pageWidth - 14, 25, { align: "right" });
      doc.text(`Total Revenue: KWD ${totalRevenue.toFixed(3)}`, pageWidth - 14, 32, { align: "right" });

      let currentY = 40;

      // ===== SECTION 1: CUSTOMER ORDERS (Non-DPPR) =====
      if (nonDPPROrders.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text(`CUSTOMER ORDERS (${nonDPPROrders.length} orders)`, 14, currentY);
        currentY += 7;

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text("Orders with customer details", 14, currentY);
        currentY += 5;

        const nonDPPRColumns = [
          "Order #", "Date", "Customer Name", "Customer Phone",
          "Branch", "Cashier", "Sales Staff", "Payment", "Status", "Total"
        ];

        const nonDPPRData = nonDPPROrders.map((s: any) => [
          s.sale_number || "-",
          new Date(s.sale_date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          }),
          s.customer_name || s.customer?.first_name + ' ' + s.customer?.last_name || "—",
          s.customer_phone || "—",
          s.branch?.branch_name || "-",
          s.cashier?.name || "-",
          s.sales_staff?.name || "-",
          s.payment_method || "-",
          s.status || "-",
          parseFloat(s.total_amount || "0").toFixed(3),
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [nonDPPRColumns],
          body: nonDPPRData,
          theme: 'striped',
          headStyles: {
            fillColor: [23, 115, 207],
            textColor: [255, 255, 255],
            fontSize: 7,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
          },
          bodyStyles: {
            fontSize: 6,
            cellPadding: 2,
            valign: 'middle',
          },
          alternateRowStyles: {
            fillColor: [248, 248, 248],
          },
          columnStyles: {
            0: { cellWidth: 28, halign: 'left' },
            1: { cellWidth: 22, halign: 'center' },
            2: { cellWidth: 35, halign: 'left' },
            3: { cellWidth: 25, halign: 'left' },
            4: { cellWidth: 30, halign: 'left' },
            5: { cellWidth: 25, halign: 'left' },
            6: { cellWidth: 28, halign: 'center' },
            7: { cellWidth: 22, halign: 'center' },
            8: { cellWidth: 20, halign: 'right' },
          },
          margin: { left: 8, right: 8 },
          showHead: 'everyPage',
          tableWidth: 'auto',
        });

        currentY = (doc as any).lastAutoTable?.finalY || 180;
        currentY += 8;
      }

      // ===== SECTION 2: DPPR ORDERS =====
      if (dpprOrders.length > 0) {
        // Add a new page if needed
        if (currentY > 180) {
          doc.addPage();
          currentY = 20;
        }

        // DPPR Section Header with background
        doc.setFillColor(255, 240, 220);
        doc.rect(8, currentY - 3, pageWidth - 16, 10, 'F');

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(200, 100, 0);
        doc.text(`DPPR ORDERS (${dpprOrders.length} orders)`, 14, currentY + 3);
        currentY += 12;

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text("DPPR = Don't Print Personal Receipt (No customer details)", 14, currentY);
        currentY += 5;

        const dpprColumns = [
          "Order #", "Date", "Branch", "Cashier", "Sales Staff",
          "Payment", "Status", "Total", "Items"
        ];

        const dpprData = dpprOrders.map((s: any) => [
          s.sale_number || "-",
          new Date(s.sale_date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          }),
          s.branch?.branch_name || "-",
          s.cashier?.name || "-",
          s.sales_staff?.name || "-",
          s.payment_method || "-",
          s.status || "-",
          parseFloat(s.total_amount || "0").toFixed(3),
          s.items?.length || 0,
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [dpprColumns],
          body: dpprData,
          theme: 'striped',
          headStyles: {
            fillColor: [255, 165, 0],
            textColor: [255, 255, 255],
            fontSize: 7,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
          },
          bodyStyles: {
            fontSize: 6,
            cellPadding: 2,
            valign: 'middle',
          },
          alternateRowStyles: {
            fillColor: [255, 248, 240],
          },
          columnStyles: {
            0: { cellWidth: 35, halign: 'left' },
            1: { cellWidth: 25, halign: 'center' },
            2: { cellWidth: 35, halign: 'left' },
            3: { cellWidth: 30, halign: 'left' },
            4: { cellWidth: 30, halign: 'center' },
            5: { cellWidth: 25, halign: 'center' },
            6: { cellWidth: 25, halign: 'right' },
            7: { cellWidth: 20, halign: 'center' },
          },
          margin: { left: 8, right: 8 },
          showHead: 'everyPage',
          tableWidth: 'auto',
        });

        currentY = (doc as any).lastAutoTable?.finalY || 180;
        currentY += 8;
      }

      // ===== FOOTER =====
      // Add summary footer on last page
      const lastPage = doc.internal.getNumberOfPages();
      for (let i = 1; i <= lastPage; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${lastPage}`, pageWidth / 2, 205, { align: "center" });

        // Only add summary on last page
        if (i === lastPage) {
          doc.setFontSize(7);
          doc.setTextColor(100);
          const summaryY = 195;
          doc.text(`Total Orders: ${sortedSales.length} | Customer Orders: ${nonDPPROrders.length} | DPPR Orders: ${dpprOrders.length}`, pageWidth / 2, summaryY, { align: "center" });
          doc.text(`Total Revenue: KWD ${totalRevenue.toFixed(3)}`, pageWidth / 2, summaryY + 5, { align: "center" });
        }
      }

      doc.save(`orders_report_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (e) {
      console.error("PDF export failed:", e);
      alert("Failed to export PDF. Please try again.");
    }
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
        accessorKey: "customer_name",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 group"
          >
            Customer
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
          const customerName = row.original.customer_name;
          const hasCustomer = customerName || row.original.customer_email || row.original.customer_phone;
          return (
            <div className="text-sm text-gray-900">
              {hasCustomer ? (
                <span className="font-medium">{customerName || "—"}</span>
              ) : (
                <span className="text-gray-400 italic">Guest Order</span>
              )}
            </div>
          );
        },
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
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${paymentBadge(paymentMethod)}`}
            >
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
          const statusClass =
            status === "Completed"
              ? "bg-green-100 text-green-800"
              : status === "Refunded"
                ? "bg-red-100 text-red-800"
                : status === "Partially Refunded"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-600";
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}`}
            >
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
            KWD {parseFloat(row.original.total_amount).toFixed(3)}
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
          <div className="flex justify-between gap-2">
            <Link
              to={`${basePath}/pos/orders/${row.original.id}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-blue-100 text-black-700 cursor-pointer rounded-lg hover:bg-blue-200 transition-colors"
            >
              <img src={returns} alt="" className="w-3.5 h-3.5" />
              <span>View</span>
            </Link>
            <button
              onClick={() => {
                setReturnSaleId(row.original.id);
                setShowReturnModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-lg  cursor-pointer hover:bg-orange-200 transition-colors"
            >
              <img src={returns} alt="" className="w-3.5 h-3.5" />
              <span>Return</span>
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  // Create table instance with sorted data
  const table = useReactTable({
    data: sortedSales,
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
                  placeholder="Search by Order, Customer, Branch, Cashier, Payment..."
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
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="American Express">American Express</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Kuwait Finance House">Kuwait Finance House</option>
                    <option value="NBK">NBK (National Bank of Kuwait)</option>
                    <option value="CBK">CBK (Commercial Bank of Kuwait)</option>
                    <option value="GBK">GBK (Gulf Bank of Kuwait)</option>
                    <option value="Boubyan Bank">Boubyan Bank</option>
                    <option value="Al Ahli Bank">Al Ahli Bank</option>
                    <option value="Burgan Bank">Burgan Bank</option>
                    <option value="KIB">KIB (Kuwait International Bank)</option>
                    <option value="Wallet">Wallet</option>
                    <option value="Kuwait Wallet">Kuwait Wallet</option>
                    <option value="Apple Pay">Apple Pay</option>
                    <option value="Samsung Pay">Samsung Pay</option>
                    <option value="Google Pay">Google Pay</option>
                    <option value="Mobile Payment">Mobile Payment</option>
                    <option value="Mixed">Mixed</option>
                    <option value="Other">Other</option>
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
                    Export PDF
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
                    Export Excel
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
            {/* <div className="flex flex-wrap gap-3 mt-1">
              <p className="text-xs sm:text-sm text-gray-600">
                Showing {pagination?.total || sortedSales.length} orders
                {searchQuery && ` for "${searchQuery}"`}
              </p>
              <p className="text-xs sm:text-sm text-green-600">
                 Orders with customer details: {sortedSales.filter((s: any) => s.customer_name || s.customer_email || s.customer_phone).length}
              </p>
              <p className="text-xs sm:text-sm text-orange-600">
                 Guest orders: {sortedSales.filter((s: any) => !(s.customer_name || s.customer_email || s.customer_phone)).length}
              </p>
            </div> */}
          </div>

          {/* Table Area with Horizontal Scroll Only */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
            <div className="xl:col-span-4 overflow-x-auto w-full">
              <table
                className="w-full divide-y divide-gray-200"
                style={{ minWidth: "680px" }}
              >
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
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="py-12 text-center"
                      >
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                        </div>
                      </td>
                    </tr>
                  ) : table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="py-12 text-center text-gray-500 text-sm"
                      >
                        {searchQuery
                          ? `No orders found matching your search.`
                          : "No orders available."}
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
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
                  `${sortedSales.length} orders`
                )}
              </div>
              <div className="flex items-center flex-wrap justify-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-lg transition-colors ${currentPage === 1
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
                      className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-lg transition-colors ${currentPage === page
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
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-lg transition-colors ${currentPage === totalPages
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