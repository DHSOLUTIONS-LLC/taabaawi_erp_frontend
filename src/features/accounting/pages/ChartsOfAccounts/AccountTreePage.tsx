// src/features/accounting/pages/chart-of-accounts/AccountTreePage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../../layouts/DashboardLayout";
import { useAppSelector } from "../../../../app/hooks";
import type { RootState } from "../../../../app/store";
import { useGetAccountTreeQuery } from "../../../../services/accountingApi";

import arrow_back_icon from "../../../../assets/icons/arrow_back_icon.svg";
import dropdown_arrow_icon from "../../../../assets/icons/dropdown_arrow_icon.svg";

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  Asset: "text-blue-600",
  Liability: "text-orange-600",
  Equity: "text-purple-600",
  Revenue: "text-green-600",
  Expense: "text-red-600",
  "Cost of Goods Sold": "text-yellow-600",
};

export default function AccountTreePage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [accountType, setAccountType] = useState("");

  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const basePath = isSuperAdmin ? "/admin" : "";

  const { data, isLoading } = useGetAccountTreeQuery({
    account_type: (accountType as any) || undefined,
  });

  const treeData = (data as any)?.data || [];

  const renderTree = (nodes: any[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.id}>
        <div
          className={`flex items-center py-2 hover:bg-gray-50 rounded-lg cursor-pointer whitespace-nowrap`}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
          onClick={() =>
            navigate(`${basePath}/accounting/chart-of-accounts/${node.id}`)
          }
        >
          <div className="w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
            {node.subAccounts && node.subAccounts.length > 0 ? (
              <svg
                className="w-4 h-4 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-gray-300 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 5v14m-7-7h14"
                />
              </svg>
            )}
          </div>

          <div className="flex-1 flex items-center justify-between gap-4 min-w-0">
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm font-mono font-semibold text-gray-900 whitespace-nowrap">
                {node.account_code}
              </span>
              <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                {node.account_name}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span
                className={`text-xs font-medium whitespace-nowrap ${ACCOUNT_TYPE_COLORS[node.account_type]}`}
              >
                {node.account_type}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                  node.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {node.is_active ? "Active" : "Inactive"}
              </span>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {node.currency}{" "}
                {parseFloat(node.current_balance || 0).toFixed(3)}
              </span>
            </div>
          </div>
        </div>
        {node.subAccounts && node.subAccounts.length > 0 && (
          <div>{renderTree(node.subAccounts, level + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Account Tree
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Hierarchical view of your chart of accounts
              </p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <span className="text-sm font-medium text-gray-700">
              Filter by type:
            </span>
            <div className="relative w-full sm:w-64">
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Account Types</option>
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
                <option value="Revenue">Revenue</option>
                <option value="Expense">Expense</option>
                <option value="Cost of Goods Sold">Cost of Goods Sold</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Tree View */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          <div className="xl:col-span-4 bg-white rounded-xl p-2 shadow-sm overflow-x-auto min-w-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : treeData.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-gray-500">No accounts found</p>
              </div>
            ) : (
              <div className="space-y-1">{renderTree(treeData)}</div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
