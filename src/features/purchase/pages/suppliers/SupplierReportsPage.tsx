// src/features/purchase/pages/SupplierReportsPage.tsx
import { useState } from "react";
import DashboardLayout from "../../../../layouts/DashboardLayout";
import { useAppSelector } from "../../../../app/hooks";
import type { RootState } from "../../../../app/store";
import {
  useGetSupplierPerformanceQuery,
  useGetSupplierPurchasesQuery,
  useGetSupplierAgingQuery,
  useGetSupplierProductsQuery,
  useGetSuppliersQuery,
} from "../../../../services/purchaseApi";

import dropdown_arrow_icon from "../../../../assets/icons/dropdown_arrow_icon.svg";
import calendar_icon from "../../../../assets/icons/calender_icon.png";
import refresh_icon from "../../../../assets/icons/refresh_icon.png";

type ReportTab = "performance" | "purchases" | "aging" | "products";

const TAB_CONFIG = [
  { id: "performance" as const, label: "Supplier Performance", icon: "" },
  { id: "purchases" as const, label: "Purchase Summary", icon: "" },
  { id: "aging" as const, label: "Aging Report", icon: "" },
  { id: "products" as const, label: "Products by Supplier", icon: "" },
];

const num = (v: any) => parseFloat(v) || 0;

export default function SupplierReportsPage() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const basePath = isSuperAdmin ? "/admin" : "";

  const [activeTab, setActiveTab] = useState<ReportTab>("performance");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 6))
      .toISOString()
      .split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Fetch suppliers for dropdown
  const { data: suppliersResponse, isLoading: suppliersLoading } =
    useGetSuppliersQuery({
      is_active: 1 as any,
      per_page: 100,
    });

  // Fix: Extract suppliers from the correct nested structure
  const suppliers =
    (suppliersResponse as any)?.data?.data ||
    (suppliersResponse as any)?.data ||
    [];

  // Fetch reports based on active tab
  const {
    data: performanceData,
    isLoading: performanceLoading,
    refetch: refetchPerformance,
    error: performanceError,
  } = useGetSupplierPerformanceQuery(
    {
      supplier_id: selectedSupplier ? parseInt(selectedSupplier) : undefined,
      start_date: startDate,
      end_date: endDate,
    },
    { skip: activeTab !== "performance" },
  );

  const {
    data: purchasesData,
    isLoading: purchasesLoading,
    refetch: refetchPurchases,
    error: purchasesError,
  } = useGetSupplierPurchasesQuery(
    {
      supplier_id: selectedSupplier ? parseInt(selectedSupplier) : undefined,
      start_date: startDate,
      end_date: endDate,
      group_by: "month",
    },
    { skip: activeTab !== "purchases" },
  );

  const {
    data: agingData,
    isLoading: agingLoading,
    refetch: refetchAging,
    error: agingError,
  } = useGetSupplierAgingQuery(
    {
      as_of_date: asOfDate,
      supplier_id: selectedSupplier ? parseInt(selectedSupplier) : undefined,
    },
    { skip: activeTab !== "aging" },
  );

  const {
    data: productsData,
    isLoading: productsLoading,
    refetch: refetchProducts,
    error: productsError,
  } = useGetSupplierProductsQuery(
    {
      supplier_id: selectedSupplier ? parseInt(selectedSupplier) : 0,
      start_date: startDate,
      end_date: endDate,
    },
    { skip: activeTab !== "products" || !selectedSupplier },
  );

  const performance = performanceData?.data;
  const purchases = purchasesData?.data;
  const aging = agingData?.data;
  const products = productsData?.data;

  const handleRefresh = () => {
    switch (activeTab) {
      case "performance":
        refetchPerformance();
        break;
      case "purchases":
        refetchPurchases();
        break;
      case "aging":
        refetchAging();
        break;
      case "products":
        refetchProducts();
        break;
    }
  };

  const isLoading = () => {
    switch (activeTab) {
      case "performance":
        return performanceLoading;
      case "purchases":
        return purchasesLoading;
      case "aging":
        return agingLoading;
      case "products":
        return productsLoading;
      default:
        return false;
    }
  };

  const getError = () => {
    switch (activeTab) {
      case "performance":
        return performanceError;
      case "purchases":
        return purchasesError;
      case "aging":
        return agingError;
      case "products":
        return productsError;
      default:
        return null;
    }
  };

  const renderFilters = () => {
    if (activeTab === "aging") {
      return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative w-full sm:w-auto">
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-full sm:w-auto pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <img
              src={calendar_icon}
              alt=""
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            />
          </div>
          <span className="text-sm text-gray-500">As of this date</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <div className="relative w-full sm:w-64">
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={suppliersLoading}
          >
            <option value="" className="w-auto">
              All Suppliers
            </option>
            {suppliers.map((supplier: any) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.supplier_name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
          </div>
        </div>
        <div className="relative w-full sm:w-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full sm:w-auto pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="text-gray-500">to</span>
        <div className="relative w-full sm:w-auto">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            className="w-full sm:w-auto pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {(selectedSupplier ||
          startDate !==
            new Date(new Date().setMonth(new Date().getMonth() - 6))
              .toISOString()
              .split("T")[0] ||
          endDate !== new Date().toISOString().split("T")[0]) && (
          <button
            onClick={() => {
              setSelectedSupplier("");
              setStartDate(
                new Date(new Date().setMonth(new Date().getMonth() - 6))
                  .toISOString()
                  .split("T")[0],
              );
              setEndDate(new Date().toISOString().split("T")[0]);
            }}
            className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    );
  };

  const renderPerformance = () => {
    const summary = performance?.summary;
    const purchaseOrders = performance?.purchase_orders || [];
    const payments = performance?.payments || [];

    if (!summary && !isLoading()) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No data available for selected filters
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Total Purchase Orders</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {summary?.total_purchase_orders || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Total Purchase Amount</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              KWD {num(summary?.total_purchase_amount).toFixed(3)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Total Payments</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              KWD {num(summary?.total_payments).toFixed(3)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Outstanding Balance</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              KWD {num(summary?.outstanding_balance).toFixed(3)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Avg Payment Days</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {summary?.avg_payment_days || 0} days
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">On-Time Delivery Rate</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {summary?.on_time_delivery_rate || 0}%
            </p>
          </div>
        </div>

        {/* Purchase Orders Table */}
        {purchaseOrders.length > 0 && (
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                Purchase Orders
              </h3>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
              <div className="xl:col-span-4 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        PO Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Order Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Payment Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {purchaseOrders.map((po: any) => (
                      <tr key={po.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-blue-600">
                          {po.po_number}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {po.order_date}
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                          {po.currency || "KWD"}{" "}
                          {num(po.total_amount).toFixed(3)}
                        </td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            {po.status}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              po.payment_status === "Paid"
                                ? "bg-green-100 text-green-700"
                                : po.payment_status === "Partially Paid"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {po.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Payments Table */}
        {payments.length > 0 && (
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                Payment History
              </h3>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
              <div className="xl:col-span-4 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Payment #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Payment Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Method
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((payment: any) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-blue-600">
                          {payment.payment_number}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {payment.payment_date}
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-semibold text-green-600">
                          KWD {num(payment.amount).toFixed(3)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {payment.payment_method}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPurchases = () => {
    const data = purchases;
    const topSuppliers = data?.top_suppliers || [];
    const purchasesByPeriod = data?.purchases_by_period || [];

    if (!data && !isLoading()) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No data available for selected filters
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Total Purchases</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              KWD {num(data?.total_purchases).toFixed(3)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Total Suppliers</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {data?.total_suppliers || 0}
            </p>
          </div>
        </div>

        {/* Top Suppliers Table */}
        {topSuppliers.length > 0 && (
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                Top Suppliers
              </h3>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
              <div className="xl:col-span-4 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Total Purchases
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        % of Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topSuppliers.map((supplier: any, idx: number) => (
                      <tr
                        key={supplier.supplier_id || idx}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                          {supplier.supplier_name}
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-semibold text-blue-600">
                          KWD {num(supplier.total_purchases).toFixed(3)}
                        </td>
                        <td className="px-6 py-3 text-center text-sm text-gray-600">
                          {supplier.orders_count}
                        </td>
                        <td className="px-6 py-3 text-center text-sm font-medium text-gray-700">
                          {supplier.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Purchases by Period */}
        {purchasesByPeriod.length > 0 && (
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                Purchases by Period
              </h3>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
              <div className="xl:col-span-4 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Period
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        Orders
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {purchasesByPeriod.map((period: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {period.period}
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-semibold text-blue-600">
                          KWD {num(period.amount).toFixed(3)}
                        </td>
                        <td className="px-6 py-3 text-center text-sm text-gray-600">
                          {period.orders_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAging = () => {
    const data = aging;
    const agingSummary = data?.aging_summary || {};
    const suppliersList = data?.suppliers || [];

    if (!data && !isLoading()) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No data available for selected filters
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Aging Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <p className="text-xs text-gray-500">Current</p>
            <p className="text-lg font-bold text-gray-900">
              KWD {num(agingSummary.current).toFixed(3)}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 text-center">
            <p className="text-xs text-yellow-600">1-30 Days</p>
            <p className="text-lg font-bold text-yellow-700">
              KWD {num(agingSummary["1_30_days"]).toFixed(3)}
            </p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 text-center">
            <p className="text-xs text-orange-600">31-60 Days</p>
            <p className="text-lg font-bold text-orange-700">
              KWD {num(agingSummary["31_60_days"]).toFixed(3)}
            </p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-center">
            <p className="text-xs text-red-600">61-90 Days</p>
            <p className="text-lg font-bold text-red-700">
              KWD {num(agingSummary["61_90_days"]).toFixed(3)}
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 text-center">
            <p className="text-xs text-purple-600">Over 90 Days</p>
            <p className="text-lg font-bold text-purple-700">
              KWD {num(agingSummary["over_90_days"]).toFixed(3)}
            </p>
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-blue-800">
              Total Outstanding
            </span>
            <span className="text-2xl font-bold text-blue-600">
              KWD {num(agingSummary.total_outstanding).toFixed(3)}
            </span>
          </div>
        </div>

        {/* Suppliers Aging Table */}
        {suppliersList.length > 0 && (
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                Suppliers Aging Breakdown
              </h3>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
              <div className="xl:col-span-4 overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Supplier
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Current
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        1-30 Days
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        31-60 Days
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        61-90 Days
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Over 90
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {suppliersList.map((supplier: any, idx: number) => (
                      <tr
                        key={supplier.supplier_id || idx}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {supplier.supplier_name}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                          KWD {num(supplier.current).toFixed(3)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-yellow-600">
                          KWD {num(supplier["1_30_days"]).toFixed(3)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-orange-600">
                          KWD {num(supplier["31_60_days"]).toFixed(3)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-red-600">
                          KWD {num(supplier["61_90_days"]).toFixed(3)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-purple-600">
                          KWD {num(supplier["over_90_days"]).toFixed(3)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-blue-600">
                          KWD {num(supplier.total).toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProducts = () => {
    const data = products;
    const productList = data?.products || [];

    if (!selectedSupplier) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">
            Please select a supplier to view products
          </p>
        </div>
      );
    }

    if (!data && !isLoading()) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No products found for this supplier in the selected period
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Supplier</p>
          <p className="text-lg font-bold text-gray-900">
            {data?.supplier_name}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Period: {data?.period?.start_date} to {data?.period?.end_date}
          </p>
        </div>

        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
            <div className="xl:col-span-4 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Last Purchase
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productList.map((product: any, idx: number) => (
                    <tr
                      key={product.product_id || idx}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {product.product_name}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500 font-mono">
                        {product.sku || "—"}
                      </td>
                      <td className="px-6 py-3 text-center text-sm text-gray-600">
                        {product.total_quantity}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-semibold text-blue-600">
                        KWD {num(product.total_amount).toFixed(3)}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {product.last_purchase_date || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const error = getError();

    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-red-500">Failed to load data. Please try again.</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Retry
          </button>
        </div>
      );
    }

    if (isLoading()) {
      return (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      );
    }

    switch (activeTab) {
      case "performance":
        return renderPerformance();
      case "purchases":
        return renderPurchases();
      case "aging":
        return renderAging();
      case "products":
        return renderProducts();
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Supplier Reports
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Track supplier performance, purchases, aging, and product history
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <img
                src={refresh_icon}
                alt=""
                className="w-4 h-4 md:w-5 md:h-5"
              />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="hidden sm:flex overflow-x-auto">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile Dropdown */}
          <div className="sm:hidden p-3">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as ReportTab)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {TAB_CONFIG.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.icon} {tab.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          {renderFilters()}
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {TAB_CONFIG.find((t) => t.id === activeTab)?.label}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {activeTab === "aging"
                ? `As of ${new Date(asOfDate).toLocaleDateString()}`
                : `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
            </p>
          </div>
          {renderContent()}
        </div>
      </div>
    </DashboardLayout>
  );
}
