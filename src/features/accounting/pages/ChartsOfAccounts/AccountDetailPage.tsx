// src/features/accounting/pages/chart-of-accounts/AccountDetailPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import DashboardLayout from "../../../../layouts/DashboardLayout";
import { useAppSelector } from "../../../../app/hooks";
import type { RootState } from "../../../../app/store";
import {
  useGetAccountByIdQuery,
  useGetAccountBalanceQuery,
} from "../../../../services/accountingApi";

import arrow_back_icon from "../../../../assets/icons/arrow_back_icon.svg";
import edit_icon from "../../../../assets/icons/edit_icon.svg";

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  Asset: "bg-blue-100 text-blue-700",
  Liability: "bg-orange-100 text-orange-700",
  Equity: "bg-purple-100 text-purple-700",
  Revenue: "bg-green-100 text-green-700",
  Expense: "bg-red-100 text-red-700",
  "Cost of Goods Sold": "bg-yellow-100 text-yellow-700",
};

const num = (v: any) => parseFloat(v) || 0;

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  });

  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const basePath = isSuperAdmin ? "/admin" : "";

  const accountId = id ? parseInt(id, 10) : 0;
  const { data, isLoading } = useGetAccountByIdQuery(accountId);
  const { data: balanceData } = useGetAccountBalanceQuery({
    id: accountId,
    start_date: dateRange.start_date,
    end_date: dateRange.end_date,
  });

  const account = (data as any)?.data;
  const balance = (balanceData as any)?.data;
  // console.log("AccountDetailPage account:", account);
  console.log("AccountDetailPage balance:", balance);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!account) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-red-500 font-medium">Account not found</p>
          <button
            onClick={() => navigate(`${basePath}/accounting/chart-of-accounts`)}
            className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Back to Chart of Accounts
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <button
              onClick={() =>
                navigate(`${basePath}/accounting/chart-of-accounts`)
              }
              className="flex-shrink-0 mt-1"
            >
              <img
                src={arrow_back_icon}
                alt=""
                className="w-6 h-6 sm:w-8 sm:h-8"
              />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {account.account_name}
                </h1>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${ACCOUNT_TYPE_COLORS[account.account_type]}`}
                >
                  {account.account_type}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    account.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {account.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Code: {account.account_code} · Created:{" "}
                {new Date(account.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {!account.is_system_account && (
            <button
              onClick={() =>
                navigate(
                  `${basePath}/accounting/chart-of-accounts/edit/${account.id}`,
                )
              }
              className="flex items-center justify-center gap-2 px-4 py-2 border border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 text-sm sm:text-base"
            >
              <img src={edit_icon} alt="" className="w-4 h-4" />
              Edit Account
            </button>
          )}
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-xl p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <span className="text-sm font-medium text-gray-700">Period:</span>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
                className="flex-1 sm:flex-initial px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    end_date: e.target.value,
                  }))
                }
                className="flex-1 sm:flex-initial px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - 2/3 width on desktop, full width on mobile */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Account Details */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Account Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Account Code</p>
                  <p className="text-sm font-mono font-medium text-gray-900 mt-1 break-all">
                    {account.account_code}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Account Type</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {account.account_type}
                  </p>
                </div>
                {account.account_sub_type && (
                  <div>
                    <p className="text-xs text-gray-500">Sub Type</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {account.account_sub_type}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Currency</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {account.currency}
                  </p>
                </div>
                {account.parentAccount && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500">Parent Account</p>
                    <button
                      onClick={() =>
                        navigate(
                          `${basePath}/accounting/chart-of-accounts/${account.parentAccount.id}`,
                        )
                      }
                      className="text-sm text-blue-600 hover:underline mt-1 text-left"
                    >
                      {account.parentAccount.account_code} -{" "}
                      {account.parentAccount.account_name}
                    </button>
                  </div>
                )}
                {account.description && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500">Description</p>
                    <p className="text-sm text-gray-700 mt-1 break-words">
                      {account.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Balance Information */}
            {balance && (
              <div className="bg-white rounded-xl p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">
                  Balance Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <p className="text-xs text-gray-500">Opening Balance</p>
                    <p className="text-base sm:text-lg font-bold text-gray-900 mt-1 break-all">
                      {account.currency}{" "}
                      {num(balance.opening_balance).toFixed(3)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <p className="text-xs text-gray-500">Total Debit</p>
                    <p className="text-base sm:text-lg font-bold text-blue-600 mt-1 break-all">
                      {account.currency} {num(balance.total_debit).toFixed(3)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <p className="text-xs text-gray-500">Total Credit</p>
                    <p className="text-base sm:text-lg font-bold text-orange-600 mt-1 break-all">
                      {account.currency} {num(balance.total_credit).toFixed(3)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <p className="text-xs text-gray-500">Current Balance</p>
                    <p className="text-base sm:text-lg font-bold text-green-600 mt-1 break-all">
                      {account.currency}{" "}
                      {num(balance.current_balance).toFixed(3)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3 break-words">
                  Period: {new Date(balance.period_start).toLocaleDateString()}{" "}
                  to {new Date(balance.period_end).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Right Column - 1/3 width on desktop, full width on mobile */}
          <div className="space-y-4 sm:space-y-6">
            {/* Hierarchy */}
            {(() => {
              const hierarchy = Array.isArray(account.hierarchy)
                ? account.hierarchy
                : typeof account.hierarchy === "string"
                  ? [account.hierarchy]
                  : [];
              return hierarchy.length > 0 ? (
                <div className="bg-white rounded-xl p-4 sm:p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">
                    Hierarchy
                  </h2>
                  <div className="space-y-2">
                    {hierarchy.map((item: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="text-gray-400 flex-shrink-0">
                          {index + 1}.
                        </span>
                        <span className="text-gray-700 break-words">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Sub Accounts */}
            {account.subAccounts && account.subAccounts.length > 0 && (
              <div className="bg-white rounded-xl p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">
                  Sub Accounts
                </h2>
                <div className="space-y-2">
                  {account.subAccounts.map((sub: any) => (
                    <button
                      key={sub.id}
                      onClick={() =>
                        navigate(
                          `${basePath}/accounting/chart-of-accounts/${sub.id}`,
                        )
                      }
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900 break-words">
                            {sub.account_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {sub.account_code}
                          </p>
                        </div>
                        <span
                          className={`self-start sm:self-center px-2 py-1 rounded-full text-xs font-medium ${
                            sub.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {sub.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
