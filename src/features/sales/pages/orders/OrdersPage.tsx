// src/features/sales/pages/OrdersPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../../layouts/DashboardLayout";
import {
  useGetOrdersQuery,
  useGetOrderStatisticsQuery,
  useDeleteOrderMutation,
} from "../../../../services/salesApi";
import { useGetBranchesQuery } from "../../../../services/superAdminApi";
import { useAppSelector } from "../../../../app/hooks";
import type { RootState } from "../../../../app/store";
import { canSwitchBranch } from "../../../../utils/roleHelpers";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import search_icon from "../../../../assets/icons/search_icon.svg";
import export_excel from "../../../../assets/icons/export_excel.svg";
import date_icon from "../../../../assets/icons/date_icon.svg";
import dropdown_arrow_icon from "../../../../assets/icons/dropdown_arrow_icon.svg";
import market_icon from "../../../../assets/icons/market_icon.svg";

const ORDER_STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Processing: "bg-indigo-100 text-indigo-800",
  Packed: "bg-purple-100 text-purple-800",
  Shipped: "bg-cyan-100 text-cyan-800",
  "Out for Delivery": "bg-orange-100 text-orange-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
  Returned: "bg-gray-100 text-gray-800",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Paid: "bg-green-100 text-green-700",
  "Partially Paid": "bg-blue-100 text-blue-700",
  Refunded: "bg-purple-100 text-purple-700",
  Failed: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const userCanSwitchBranch = canSwitchBranch(user?.role?.role_name);

  const [selectedBranch, setSelectedBranch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [channel, setChannel] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: branchesData } = useGetBranchesQuery();
  const branches = Array.isArray(branchesData) ? branchesData : [];

  // Fix: Properly calculate basePath
  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const basePath = isSuperAdmin ? "/admin" : "";

  useEffect(() => {
    if (!userCanSwitchBranch && user?.branch_id && branches.length > 0) {
      setSelectedBranch(user.branch_id.toString());
    }
  }, [userCanSwitchBranch, user?.branch_id, branches]);

  const {
    data: ordersResponse,
    isLoading,
    refetch,
  } = useGetOrdersQuery({
    branch_id: selectedBranch ? parseInt(selectedBranch) : undefined,
    order_status: orderStatus || undefined,
    payment_status: paymentStatus || undefined,
    channel: channel || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    search: search || undefined,
    page: currentPage,
    per_page: 15,
  });

  const { data: statsResponse } = useGetOrderStatisticsQuery({
    branch_id: selectedBranch ? parseInt(selectedBranch) : undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  });

  const [deleteOrder] = useDeleteOrderMutation();

  const orders = ordersResponse?.data?.data || [];
  const pagination = ordersResponse?.data;
  const stats = statsResponse?.data;
  console.log("Stats data structure:", stats);

  // Log for debugging
  useEffect(() => {
    console.log("Orders data:", orders);
    console.log("Orders response:", ordersResponse);
  }, [orders, ordersResponse]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this order? This cannot be undone.")) return;
    try {
      await deleteOrder(id).unwrap();
      refetch(); // Refetch after delete
    } catch (err: any) {
      alert(err?.data?.message || "Failed to delete order");
    }
  };

  const handleExport = () => {
    try {
      const data = orders.map((o: any) => ({
        "Order #": o.order_number,
        Customer: o.customer_name,
        Channel: o.channel,
        "Order Status": o.order_status,
        "Payment Status": o.payment_status,
        "Payment Method": o.payment_method,
        Total: `KD ${parseFloat(o.total_amount).toFixed(3)}`,
        Date: new Date(o.created_at).toLocaleDateString(),
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Orders");
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(
        new Blob([buf], { type: "application/octet-stream" }),
        `orders_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Fix: Access data correctly based on your API response structure
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce(
    (sum: number, order: any) => sum + (parseFloat(order.total_amount) || 0),
    0,
  );
  const pendingCount = orders.filter(
    (order: any) => order.order_status === "pending",
  ).length;
  const deliveredCount = orders.filter(
    (order: any) => order.order_status === "Delivered",
  ).length;

  return (
    <DashboardLayout>
      <div className="min-h-screen space-y-6">
        {/* Filters */}
        <div className="bg-white px-4 py-4 rounded-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <img src={date_icon} alt="" />
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <img src={date_icon} alt="" />
            </div>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <img src={market_icon} alt="" />
            </div>
            {userCanSwitchBranch ? (
              <select
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-12 pr-10 py-3.5 border rounded-xl appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Branches</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full pl-12 pr-4 py-3.5 border rounded-xl bg-gray-50 text-gray-700">
                {branches.find((b: any) => b.id === user?.branch_id)
                  ?.branch_name || "My Branch"}
              </div>
            )}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
            </div>
          </div>
          <button
            onClick={() => navigate(`${basePath}/sales/create-order`)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1773CF] text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
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
            New Order
          </button>
        </div>

        {/* Stats - Now showing total orders correctly */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Orders",
              value: totalOrders,
              color: "text-gray-900",
            },
            {
              label: "Total Revenue",
              value: `KD ${Number(totalRevenue).toFixed(3)}`,
              color: "text-[#1773CF]",
            },
            { label: "Pending", value: pendingCount, color: "text-yellow-600" },
            {
              label: "Delivered",
              value: deliveredCount,
              color: "text-green-600",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
            >
              <p className="text-sm text-gray-500 mb-1">{card.label}</p>
              <p className={`text-[18px] lg:text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Table header filters */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b flex flex-col lg:flex-row gap-3 sm:gap-4 items-start lg:items-center justify-between">
  <div className="flex flex-col sm:flex-row lg:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
    {/* Search Input */}
    <div className="relative w-full sm:w-auto">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <img src={search_icon} alt="" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
        placeholder="Search orders..."
        className="w-full sm:w-56 pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 border rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    
    {/* Order Status Filter */}
    <select
      value={orderStatus}
      onChange={(e) => {
        setOrderStatus(e.target.value);
        setCurrentPage(1);
      }}
      className="w-full sm:w-auto px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">All Statuses</option>
      {[
        "Pending",
        "Confirmed",
        "Processing",
        "Packed",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
        "Returned",
      ].map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
    
    {/* Payment Status Filter */}
    <select
      value={paymentStatus}
      onChange={(e) => {
        setPaymentStatus(e.target.value);
        setCurrentPage(1);
      }}
      className="w-full sm:w-auto px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">All Payments</option>
      {[
        "Pending",
        "Paid",
        "Partially Paid",
        "Refunded",
        "Failed",
      ].map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
    
    {/* Channel Filter */}
    <select
      value={channel}
      onChange={(e) => {
        setChannel(e.target.value);
        setCurrentPage(1);
      }}
      className="w-full sm:w-auto px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">All Channels</option>
      {["Website", "Mobile App", "POS", "Phone", "Manual"].map(
        (s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ),
      )}
    </select>
  </div>
  
  {/* Export Button */}
  <div className="w-full sm:w-auto">
    <button
      onClick={handleExport}
      className="w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border rounded-lg hover:bg-gray-50 text-xs sm:text-sm transition-colors"
    >
      <img src={export_excel} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
      <span>Export</span>
    </button>
  </div>
</div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
            <div className="xl:col-span-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Order #",
                      "Customer",
                      "Channel",
                      "Items",
                      "Total",
                      "Payment",
                      "Status",
                      "Date",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-[#37638F] uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-500">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                          Loading orders...
                        </div>
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-12 text-center text-gray-500"
                      >
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order: any) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td
                          className="px-4 py-4 text-sm font-semibold text-[#1773CF] cursor-pointer hover:underline"
                          onClick={() =>
                            navigate(`${basePath}/sales/orders/${order.id}`)
                          }
                        >
                          {order.order_number}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {order.customer_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.customer_email}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-700">
                            {order.channel}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {order.items?.length || 0}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                          KD {parseFloat(order.total_amount).toFixed(3)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${PAYMENT_STATUS_COLORS[order.payment_status] || "bg-gray-100 text-gray-600"}`}
                          >
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${ORDER_STATUS_COLORS[order.order_status] || "bg-gray-100 text-gray-600"}`}
                          >
                            {order.order_status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString(
                            "en-GB",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                navigate(`${basePath}/sales/orders/${order.id}`)
                              }
                              className="px-3 py-1.5 text-xs bg-[#1773CF] text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                              View
                            </button>
                            {order.order_status === "Pending" && (
                              <button
                                onClick={() => handleDelete(order.id)}
                                className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                              >
                                Delete
                              </button>
                            )}
                          </div>
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
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {pagination.from}–{pagination.to} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
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
                  className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
