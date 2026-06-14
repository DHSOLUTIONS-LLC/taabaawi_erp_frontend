import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users,
  UserCheck,
  UserPlus,
  TrendingUp,
  Plus,
  RefreshCw,
  Download,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { CustomerFilters } from "../components/customers/CustomerFilters";
import { CustomerModal } from "../components/customers/CustomerModal";
import { StatCard } from "../components/customers/CustomerCard";
import { openCustomerModal } from "../crmSlice";
import {
  useGetCustomerStatisticsQuery,
  useGetLoyaltyStatisticsQuery,
  useGetCustomersQuery,
} from "../../../services/crmApi";
import type { RootState } from "../../../app/store";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../app/hooks";
import { TierBadge } from "../components/customers/CustomerStatusBadge";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Helper function to fetch last order using native fetch (NOT a Hook)
const fetchLastOrderForCustomer = async (customerId: number, token: string) => {
  try {
    const response = await fetch(
      `https://prearticulate-nonsymbiotically-mira.ngrok-free.dev/api/customers/${customerId}/purchase-history?per_page=1&page=1`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    const result = await response.json();
    const orders = result?.data?.orders?.data || [];
    const lastOrder = orders.length > 0 ? orders[0] : null;
    
    return {
      last_invoice_number: lastOrder?.order_number || "N/A",
      last_invoice_value: lastOrder?.total_amount ? parseFloat(lastOrder.total_amount) : 0,
      last_order_date: lastOrder?.created_at || null,
    };
  } catch (error) {
    console.error(`Error fetching orders for customer ${customerId}:`, error);
    return {
      last_invoice_number: "N/A",
      last_invoice_value: 0,
      last_order_date: null,
    };
  }
};

export const CustomersPage = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [customersWithLastInvoice, setCustomersWithLastInvoice] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [, forceUpdate] = useState({});

  const dispatch = useDispatch();
  const { isCustomerModalOpen } = useSelector((s: RootState) => s.crm);
  const {
    data: statsData,
    isLoading: statsLoading,
    refetch,
  } = useGetCustomerStatisticsQuery({});
  const stats = statsData?.data;
  const navigate = useNavigate();

  const { data: loyaltyData, isLoading: loyaltyLoading } =
    useGetLoyaltyStatisticsQuery({});
  const loyalty = loyaltyData?.data;

  // Fetch all customers
  const { data: allCustomersData, refetch: refetchCustomers } = useGetCustomersQuery({
    per_page: 1000,
    page: 1,
  });

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token') || '';
  };

  // Get filtered customers based on active filters
  const getFilteredCustomers = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get("search") || "";
    const tier = urlParams.get("tier") || "";
    const minSpent = urlParams.get("min_spent") || "";
    const maxSpent = urlParams.get("max_spent") || "";
    const startDate = urlParams.get("start_date") || "";
    const endDate = urlParams.get("end_date") || "";

    let filtered = [...customersWithLastInvoice];

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone?.includes(searchTerm)
      );
    }

    if (tier) {
      filtered = filtered.filter((c) => c.loyalty_tier === tier);
    }

    if (minSpent) {
      filtered = filtered.filter(
        (c) => (c.total_spent || 0) >= parseFloat(minSpent)
      );
    }

    if (maxSpent) {
      filtered = filtered.filter(
        (c) => (c.total_spent || 0) <= parseFloat(maxSpent)
      );
    }

    if (startDate && endDate) {
      filtered = filtered.filter((c) => {
        const createdAt = new Date(c.created_at);
        return createdAt >= new Date(startDate) && createdAt <= new Date(endDate);
      });
    }

    return filtered;
  };

  // Update filtered customers when data or URL changes
  useEffect(() => {
    const filtered = getFilteredCustomers();
    setFilteredCustomers(filtered);
  }, [customersWithLastInvoice, window.location.search]);

  // Listen for URL changes
  useEffect(() => {
    const handleUrlChange = () => {
      forceUpdate({});
      const filtered = getFilteredCustomers();
      setFilteredCustomers(filtered);
    };
    
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [customersWithLastInvoice]);

  // Function to fetch last orders for all customers
  const fetchLastOrdersForAllCustomers = async (customers: any[]) => {
    if (!customers || customers.length === 0) return;
    
    setLoadingOrders(true);
    const token = getAuthToken();
    
    try {
      const batchSize = 5;
      const processedCustomers = [...customers];
      
      for (let i = 0; i < customers.length; i += batchSize) {
        const batch = customers.slice(i, Math.min(i + batchSize, customers.length));
        const batchPromises = batch.map(async (customer) => {
          const orderData = await fetchLastOrderForCustomer(customer.id, token);
          return {
            ...customer,
            ...orderData,
          };
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        for (let j = 0; j < batchResults.length; j++) {
          processedCustomers[i + j] = batchResults[j];
        }
        
        setCustomersWithLastInvoice([...processedCustomers.slice(0, i + batchSize)]);
        
        if (i + batchSize < customers.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      setCustomersWithLastInvoice(processedCustomers);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      const defaultCustomers = customers.map((customer: any) => ({
        ...customer,
        last_invoice_number: "N/A",
        last_invoice_value: 0,
        last_order_date: customer.created_at,
      }));
      setCustomersWithLastInvoice(defaultCustomers);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (allCustomersData?.data?.data) {
      const customers = allCustomersData.data.data;
      setCustomersList(customers);
      fetchLastOrdersForAllCustomers(customers);
    }
  }, [allCustomersData]);

  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const isEmp = user?.role?.role_name;
  const basePath = isSuperAdmin ? "/admin" : isEmp ? "" : "";

  // Export to Excel
  const handleExportExcel = async () => {
    setLoadingOrders(true);
    const token = getAuthToken();
    
    let customers = getFilteredCustomers();
    
    if (customers.length === 0) {
      alert("No customers to export");
      setLoadingOrders(false);
      return;
    }
    
    const customersToUpdate = customers.filter(
      c => !c.last_invoice_number || c.last_invoice_number === "N/A"
    );
    
    if (customersToUpdate.length > 0) {
      const updatedCustomers = await Promise.all(
        customers.map(async (customer) => {
          if (!customer.last_invoice_number || customer.last_invoice_number === "N/A") {
            const orderData = await fetchLastOrderForCustomer(customer.id, token);
            return { ...customer, ...orderData };
          }
          return customer;
        })
      );
      customers = updatedCustomers;
    }
    
    const exportData = customers.map((customer) => ({
      ID: customer.id,
      "Full Name": `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
      "Mobile Number": customer.phone || "N/A",
      Email: customer.email || "N/A",
      "Last Invoice Number": customer.last_invoice_number || "N/A",
      "Invoice Value (KWD)": `${Number(customer.last_invoice_value || 0).toFixed(3)}`,
      "Last Order Date": customer.last_order_date 
        ? new Date(customer.last_order_date).toLocaleString() 
        : "No orders yet",
      "Date of Creation": new Date(customer.created_at).toLocaleString(),
      "Loyalty Tier": customer.loyalty_tier || "N/A",
      "Total Orders": customer.total_orders || 0,
      "Total Spent (KWD)": customer.total_spent ? `${Number(customer.total_spent).toFixed(3)}` : "0.000",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, `customers_${new Date().toISOString().split("T")[0]}.xlsx`);
    setShowExportMenu(false);
    setLoadingOrders(false);
  };

  // Export to PDF
  const handleExportPDF = async () => {
    setLoadingOrders(true);
    const token = getAuthToken();
    
    let customers = getFilteredCustomers();
    
    if (customers.length === 0) {
      alert("No customers to export");
      setLoadingOrders(false);
      return;
    }
    
    const customersToUpdate = customers.filter(
      c => !c.last_invoice_number || c.last_invoice_number === "N/A"
    );
    
    if (customersToUpdate.length > 0) {
      const updatedCustomers = await Promise.all(
        customers.map(async (customer) => {
          if (!customer.last_invoice_number || customer.last_invoice_number === "N/A") {
            const orderData = await fetchLastOrderForCustomer(customer.id, token);
            return { ...customer, ...orderData };
          }
          return customer;
        })
      );
      customers = updatedCustomers;
    }
    
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Customers Report", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Customers: ${customers.length}`, 14, 34);
    
    const urlParams = new URLSearchParams(window.location.search);
    const hasFilters = urlParams.get("search") || urlParams.get("tier") || 
                      urlParams.get("min_spent") || urlParams.get("max_spent");
    if (hasFilters) {
      doc.text(`Filters Applied: Yes`, 14, 40);
    }

    const tableHeaders = [
      "ID",
      "Full Name",
      "Mobile No.",
      "Last Invoice #",
      "Invoice Value (KWD)",
      "Last Order Date & Time",
    ];

    const tableRows = customers.map((customer) => [
      customer.id?.toString() || "",
      `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
      customer.phone || "N/A",
      customer.last_invoice_number || "N/A",
      `${Number(customer.last_invoice_value || 0).toFixed(3)}`,
      customer.last_order_date 
        ? new Date(customer.last_order_date).toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "No orders yet",
    ]);

    autoTable(doc, {
      head: [tableHeaders],
      body: tableRows,
      startY: hasFilters ? 48 : 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: {
        fillColor: [23, 115, 207],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 45 },
        2: { cellWidth: 30 },
        3: { cellWidth: 35 },
        4: { cellWidth: 30 },
        5: { cellWidth: 40 },
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(`customers_${new Date().toISOString().split("T")[0]}.pdf`);
    setShowExportMenu(false);
    setLoadingOrders(false);
  };

  const handleRefresh = () => {
    refetch();
    refetchCustomers();
    if (allCustomersData?.data?.data) {
      fetchLastOrdersForAllCustomers(allCustomersData.data.data);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Customers
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage your customer base and relationships
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Download className="h-4 w-4" /> Export
                </button>
                {showExportMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowExportMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <button
                        onClick={handleExportPDF}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-t-lg flex items-center gap-2"
                        disabled={loadingOrders}
                      >
                        <FileText className="h-4 w-4" /> Export PDF
                      </button>
                      <button
                        onClick={handleExportExcel}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-b-lg flex items-center gap-2"
                        disabled={loadingOrders}
                      >
                        <FileSpreadsheet className="h-4 w-4" /> Export Excel
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => dispatch(openCustomerModal({ mode: "create" }))}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" /> New Customer
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard
              label="Total Customers"
              value={stats?.total_customers?.toLocaleString() ?? "0"}
              icon={Users}
              color="blue"
              loading={statsLoading}
            />
            <StatCard
              label="Active Customers"
              value={stats?.active_customers?.toLocaleString() ?? "0"}
              icon={UserCheck}
              color="green"
              loading={statsLoading}
            />
            <StatCard
              label="New This Month"
              value={stats?.new_customers_this_month?.toLocaleString() ?? "0"}
              icon={UserPlus}
              color="purple"
              loading={statsLoading}
            />
            <StatCard
              label="Total Revenue"
              value={
                stats?.total_spent_all
                  ? `KWD ${stats.total_spent_all.toLocaleString()}`
                  : "0"
              }
              sub={`Avg order: KWD ${stats?.average_order_value_all?.toLocaleString() ?? "0"}`}
              icon={TrendingUp}
              color="orange"
              loading={statsLoading}
            />
          </div>

          {/* Filters */}
          <div className="mb-6">
            <CustomerFilters />
          </div>

          {/* Filter Summary */}
          {!loadingOrders && filteredCustomers.length > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredCustomers.length} customer(s)
              {filteredCustomers.length !== customersList.length && 
                ` (filtered from ${customersList.length} total)`
              }
            </div>
          )}

          {loadingOrders && (
            <div className="mb-4 text-sm text-blue-600 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading customer orders... This may take a moment.
            </div>
          )}

          {/* Customers Table - Desktop View */}
          <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Invoice #</th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Value</th>
                    <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Last Order Date</th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                    <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingOrders ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-3 sm:px-4 py-3"><div className="h-4 bg-gray-100 rounded w-6" /></td>
                        <td className="px-3 sm:px-4 py-3"><div className="flex items-center gap-2"><div className="h-8 w-8 bg-gray-100 rounded-full" /><div><div className="h-4 bg-gray-100 rounded w-24 mb-1" /><div className="h-3 bg-gray-100 rounded w-32" /></div></div></td>
                        <td className="px-3 sm:px-4 py-3"><div className="h-4 bg-gray-100 rounded w-24" /></td>
                        <td className="px-3 sm:px-4 py-3"><div className="h-4 bg-gray-100 rounded w-16 ml-auto" /></td>
                        <td className="px-3 sm:px-4 py-3"><div className="h-4 bg-gray-100 rounded w-24 mx-auto" /></td>
                        <td className="px-3 sm:px-4 py-3"><div className="h-4 bg-gray-100 rounded w-20 ml-auto" /></td>
                        <td className="px-3 sm:px-4 py-3"><div className="h-5 bg-gray-100 rounded w-16 mx-auto" /></td>
                      </tr>
                    ))
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 sm:px-4 py-8 text-center text-gray-400">
                        No customers found matching the filters
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer: any, i: number) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`${basePath}/crm/customers/${customer.id}`)}
                      >
                        <td className="px-3 sm:px-4 py-3 text-gray-400 font-medium text-sm">{i + 1}</td>
                        <td className="px-3 sm:px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                              <span className="text-xs font-semibold text-blue-700">
                                {customer.first_name?.[0]}{customer.last_name?.[0]}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 text-sm truncate max-w-[150px]">
                                {customer.full_name ?? `${customer.first_name} ${customer.last_name}`}
                              </p>
                              <p className="text-xs text-gray-400 truncate max-w-[150px]">
                                {customer.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-gray-600 text-sm">
                          {customer.last_invoice_number || "N/A"}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-right text-gray-700 font-medium">
                          {customer.last_invoice_value ? `${customer.last_invoice_value.toFixed(3)} KWD` : "0.000 KWD"}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-center text-gray-600 text-sm">
                          {customer.last_order_date 
                            ? new Date(customer.last_order_date).toLocaleDateString() 
                            : "No orders"}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-right text-gray-700 font-semibold">
                          {customer.total_spent ? `${Number(customer.total_spent).toFixed(3)} KWD` : "0.000 KWD"}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-center">
                          <TierBadge tier={customer.loyalty_tier} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customers Table - Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {loadingOrders
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-full" />
                      <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-32" /><div className="h-3 bg-gray-100 rounded w-24" /></div>
                      <div className="h-6 w-16 bg-gray-100 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-12 bg-gray-100 rounded" />
                      <div className="h-12 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))
              : filteredCustomers.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                    No customers found matching the filters
                  </div>
                ) : (
                  filteredCustomers.map((customer: any) => (
                    <div
                      key={customer.id}
                      className="bg-white rounded-xl border border-gray-200 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`${basePath}/crm/customers/${customer.id}`)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-blue-700">
                            {customer.first_name?.[0]}{customer.last_name?.[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">
                            {customer.full_name ?? `${customer.first_name} ${customer.last_name}`}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{customer.email}</p>
                        </div>
                        <TierBadge tier={customer.loyalty_tier} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-400">Last Invoice</p>
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {customer.last_invoice_number || "N/A"}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-400">Invoice Value</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {customer.last_invoice_value ? `${customer.last_invoice_value.toFixed(3)} KWD` : "0.000 KWD"}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-400">Last Order Date</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {customer.last_order_date 
                              ? new Date(customer.last_order_date).toLocaleDateString() 
                              : "No orders"}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-400">Total Spent</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {customer.total_spent ? `${Number(customer.total_spent).toFixed(3)} KWD` : "0.000 KWD"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
          </div>

          {isCustomerModalOpen && <CustomerModal />}
        </div>
      </div>
    </DashboardLayout>
  );
};