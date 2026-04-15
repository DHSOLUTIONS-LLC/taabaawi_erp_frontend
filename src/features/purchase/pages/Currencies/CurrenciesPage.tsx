// src/features/purchase/pages/currencies/CurrenciesPage.tsx
import { useState } from "react";
import DashboardLayout from "../../../../layouts/DashboardLayout";
import { useAppSelector } from "../../../../app/hooks";
import type { RootState } from "../../../../app/store";
import {
  useGetCurrenciesQuery,
  useUpdateCurrencyMutation,
  useDeleteCurrencyMutation,
} from "../../../../services/purchaseApi";
import CurrencyModal from "./CurrencyModal";
import CurrencyConverter from "./CurrencyConverter";

import search_icon from "../../../../assets/icons/search_icon.svg";
import add_icon from "../../../../assets/icons/add.svg";
import edit_icon from "../../../../assets/icons/edit_icon.svg";
import delete_icon from "../../../../assets/icons/delete-icon.png";

export default function CurrenciesPage() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [showModal, setShowModal] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  // const basePath = isSuperAdmin ? '/admin' : '';

  const { data, isLoading, refetch } = useGetCurrenciesQuery({
    is_active: showInactive ? undefined : (1 as any),
  });

  const [updateCurrency] = useUpdateCurrencyMutation();
  const [deleteCurrency] = useDeleteCurrencyMutation();

  const currencies = data?.data || [];
  console.log("currencies:", currencies);
  // Filter currencies based on search
  const filteredCurrencies = currencies.filter(
    (c: any) =>
      c.currency_code.toLowerCase().includes(search.toLowerCase()) ||
      c.currency_name.toLowerCase().includes(search.toLowerCase()),
  );

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredCurrencies.length / itemsPerPage);
  const paginatedCurrencies = filteredCurrencies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleToggleActive = async (currency: any) => {
    if (!isSuperAdmin) {
      alert("Only Super Admin can modify currencies");
      return;
    }
    try {
      await updateCurrency({
        id: currency.id,
        data: { is_active: !currency.is_active },
      }).unwrap();
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to update currency");
    }
  };

  const handleDelete = async (id: number) => {
    if (!isSuperAdmin) {
      alert("Only Super Admin can delete currencies");
      return;
    }
    if (!confirm("Are you sure you want to delete this currency?")) return;
    try {
      await deleteCurrency(id).unwrap();
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to delete currency");
    }
  };

  const handleEdit = (currency: any) => {
    if (!isSuperAdmin) {
      alert("Only Super Admin can edit currencies");
      return;
    }
    setSelectedCurrency(currency);
    setShowModal(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header - Optimized for mobile */}
        <div className="flex flex-col gap-4">
          {/* Header Section */}
          <div className="space-y-3 ">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Currencies</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage exchange rates and currencies</p>
            </div>

            {/* Action Buttons - Grid layout for mobile */}
            <div className="grid grid-cols-1 sm:flex sm:flex-row gap-3">
              <button
                onClick={() => setShowConverter(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Currency Converter</span>
              </button>

              {isSuperAdmin && (
                <button
                  onClick={() => {
                    setSelectedCurrency(null);
                    setShowModal(true);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <img src={add_icon} alt="" className="w-4 h-4" />
                  Add Currency
                </button>
              )}
            </div>
          </div>

          {/* Filters Section - Responsive */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
              <div className="relative flex-1">
                <img src={search_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by code or name..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2 pt-1 sm:pt-0">
                <input
                  type="checkbox"
                  id="showInactive"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="showInactive" className="text-sm text-gray-700">
                  Show inactive currencies
                </label>
              </div>
            </div>
          </div>
        </div>
        {/* Mobile Card View - Optimized for below md */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : paginatedCurrencies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <p className="text-gray-500 font-medium text-center">No currencies found</p>
              {(search || !showInactive) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setShowInactive(true);
                  }}
                  className="mt-3 text-sm text-blue-600 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {paginatedCurrencies.map((currency: any) => (
                <div key={currency.id} className="p-4 hover:bg-gray-50 transition-colors">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono font-bold text-base text-gray-900">
                          {currency.currency_code}
                        </span>
                        {currency.is_base_currency && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 whitespace-nowrap">
                            Base
                          </span>
                        )}
                        {!currency.is_active && !currency.is_base_currency && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 truncate">{currency.currency_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Symbol: {currency.currency_symbol}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => handleEdit(currency)}
                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                        disabled={!isSuperAdmin}
                      >
                        <img src={edit_icon} alt="Edit" className="w-4 h-4" />
                      </button>
                      {!currency.is_base_currency && (
                        <button
                          onClick={() => handleDelete(currency.id)}
                          className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                          disabled={!isSuperAdmin}
                        >
                          <img src={delete_icon} alt="Delete" className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Exchange Rate Card */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-500 mb-1">Exchange Rate</p>
                    <p className="text-sm font-mono font-medium text-gray-900 break-words">
                      1 KWD = {currency.exchange_rate.toFixed(6)} {currency.currency_code}
                    </p>
                  </div>

                  {/* Status and Last Updated */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">Status:</span>
                      <button
                        onClick={() => handleToggleActive(currency)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currency.is_active ? "bg-green-500" : "bg-gray-300"
                          }`}
                        disabled={currency.is_base_currency || !isSuperAdmin}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currency.is_active ? "translate-x-6" : "translate-x-1"
                            }`}
                        />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Updated: {new Date(currency.last_updated).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Disabled message for base currency */}
                  {currency.is_base_currency && (
                    <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100">
                      Base currency cannot be deactivated or deleted
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination - Mobile optimized */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        )}
      </div>

      {/* Currency Modal */}
      {showModal && (
        <CurrencyModal
          currency={selectedCurrency}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            refetch();
          }}
        />
      )}

      {/* Currency Converter */}
      {showConverter && (
        <CurrencyConverter
          currencies={currencies}
          onClose={() => setShowConverter(false)}
        />
      )}
    </DashboardLayout>
  );
}
