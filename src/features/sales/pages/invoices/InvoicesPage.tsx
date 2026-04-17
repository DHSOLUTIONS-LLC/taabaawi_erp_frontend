// src/features/sales/pages/InvoicesPage.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../../layouts/DashboardLayout";
import { useAppSelector } from "../../../../app/hooks";
import type { RootState } from "../../../../app/store";
import { useGetInvoicesQuery } from "../../../../services/invoiceApi";
import add_icon from "../../../../assets/icons/add.svg";
import search_icon from "../../../../assets/icons/search_icon.svg";
type InvoiceType = "b2c" | "b2b" | "quotation" | undefined;

const STATUS_COLORS: Record<string, string> = {
  Paid: "bg-green-100 text-green-700",
  Unpaid: "bg-red-100 text-red-700",
  "Partially Paid": "bg-yellow-100 text-yellow-700",
};

const TYPE_COLORS: Record<string, string> = {
  b2c: "bg-blue-100 text-blue-700",
  b2b: "bg-purple-100 text-purple-700",
  quotation: "bg-orange-100 text-orange-700",
};

const TYPE_LABELS: Record<string, string> = {
  b2c: "B2C",
  b2b: "B2B",
  quotation: "Quotation",
};

export default function InvoicesPage() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const basePath = isSuperAdmin ? "/admin" : "";

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<InvoiceType>(undefined);

  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useGetInvoicesQuery({
    search: search || undefined,
    invoice_type: typeFilter,
    payment_status: statusFilter || undefined,
    page,
    per_page: 15,
  });

  const invoices = data?.data?.data || data?.data || [];
  const meta = data?.data?.meta || data?.meta || null;
  const totalPages = meta?.last_page || 1;

  const stats = [
    {
      label: "Total Invoices",
      value: meta?.total || invoices.length,
      color: "text-gray-900",
    },
    {
      label: "Paid",
      value: invoices.filter((i: any) => i.payment_status === "Paid").length,
      color: "text-green-600",
    },
    {
      label: "Unpaid",
      value: invoices.filter((i: any) => i.payment_status === "Unpaid").length,
      color: "text-red-600",
    },
    {
      label: "Partial",
      value: invoices.filter((i: any) => i.payment_status === "Partially Paid")
        .length,
      color: "text-yellow-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row lg:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Invoices
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
              Manage B2C, B2B invoices and quotations
            </p>
          </div>
          <button
            onClick={() => navigate(`${basePath}/sales/create_invoice`)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-blue-600 rounded-lg border border-blue-600 hover:bg-blue-100 transition-colors cursor-pointer font-medium text-sm sm:text-base"
          >
            <img src={add_icon} alt="" className="w-4 h-4" />
            Create Invoice
          </button>
        </div>

        {/* Stats Row - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-4 sm:p-5"
            >
              <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
              <p className={`text-xl sm:text-2xl font-bold mt-1 ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters - Responsive */}
        <div className="bg-white rounded-xl p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[0] sm:min-w-[220px]">
              <img
                src={search_icon}
                alt=""
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search invoice no, customer..."
                className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter || ""}
              onChange={(e) => {
                setTypeFilter((e.target.value as InvoiceType) || undefined);
                setPage(1);
              }}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
            >
              <option value="">All Types</option>
              {/* Add your type options here */}
              <option value="B2C">B2C</option>
              <option value="B2B">B2B</option>
              <option value="Quotation">Quotation</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partially Paid">Partially Paid</option>
            </select>

            {/* Clear Button */}
            {(search || typeFilter || statusFilter) && (
              <button
                onClick={() => {
                  setSearch("");
                  setTypeFilter(undefined);
                  setStatusFilter("");
                  setPage(1);
                }}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-500 hover:text-red-500 border border-gray-300 rounded-lg transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-24">
              <p className="text-red-500">Failed to load invoices.</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No invoices found</p>
              <p className="text-gray-400 text-sm mt-1">
                Try adjusting your filters or create a new invoice
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
              <div className="xl:col-span-4 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Invoice No
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Branch
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoices.map((invoice: any) => (
                      <tr
                        key={invoice.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-blue-600">
                            {invoice.invoice_number}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[invoice.invoice_type] || "bg-gray-100 text-gray-700"}`}
                          >
                            {TYPE_LABELS[invoice.invoice_type] ||
                              invoice.invoice_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.customer_name ||
                              invoice.company_name ||
                              "—"}
                          </div>
                          {invoice.customer_phone && (
                            <div className="text-xs text-gray-500">
                              {invoice.customer_phone}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {invoice.branch?.branch_name || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {invoice.created_at
                              ? new Date(invoice.created_at).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                              : "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            KWD{" "}
                            {parseFloat(invoice.grand_total || 0).toFixed(3)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[invoice.payment_status] || "bg-gray-100 text-gray-700"}`}
                          >
                            {invoice.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Link
                            to={`${basePath}/sales/invoices/${invoice.id}`}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
