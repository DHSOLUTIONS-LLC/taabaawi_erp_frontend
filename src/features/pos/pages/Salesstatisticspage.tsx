// src/features/pos/pages/SalesStatisticsPage.tsx
import { useState, useEffect } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useGetSalesStatisticsQuery } from "../../../services/posApi";
import { useGetBranchesQuery } from "../../../services/superAdminApi";
import { useAppSelector } from "../../../app/hooks";
import type { RootState } from "../../../app/store";
import { canSwitchBranch } from "../../../utils/roleHelpers";

import market_icon from "../../../assets/icons/market_icon.svg";
import dropdown_arrow_icon from "../../../assets/icons/dropdown_arrow_icon.svg";
import date_icon from "../../../assets/icons/date_icon.svg";

export default function SalesStatisticsPage() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const userCanSwitchBranch = canSwitchBranch(user?.role?.role_name);

  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);

  const { data: branchesData } = useGetBranchesQuery();
  const branches = Array.isArray(branchesData) ? branchesData : [];

  useEffect(() => {
    if (!userCanSwitchBranch && user?.branch_id) {
      setSelectedBranch(user.branch_id.toString());
    }
  }, [userCanSwitchBranch, user?.branch_id]);

  const { data: statsResponse, isLoading } = useGetSalesStatisticsQuery({
    branch_id: selectedBranch ? parseInt(selectedBranch) : undefined,
    start_date: startDate,
    end_date: endDate,
  });

  const stats = statsResponse?.data;

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
    <DashboardLayout>
      <div className="min-h-screen p-6">
        {/* Filters */}
        <div className="bg-white px-8 py-4 rounded-lg grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <img src={date_icon} alt="" className="w-5 h-5" />
            </div>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500
                [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <img src={dropdown_arrow_icon} alt="" className="w-5 h-5" />
            </div>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <img src={date_icon} alt="" className="w-5 h-5" />
            </div>
            <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500
                [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <img src={dropdown_arrow_icon} alt="" className="w-5 h-5" />
            </div>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <img src={market_icon} alt="" />
            </div>
            {userCanSwitchBranch ? (
              <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Branches</option>
                {branches.map((b: any) => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
              </select>
            ) : (
              <div className="w-full pl-12 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium">
                {branches.find((b: any) => b.id === user?.branch_id)?.branch_name || "My Branch"}
              </div>
            )}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <img src={dropdown_arrow_icon} alt="" className="w-5 h-5" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Sales", value: `KD ${parseFloat(stats?.total_revenue || 0).toFixed(3)}`, color: "text-[#1773CF]", bg: "bg-blue-50" },
                { label: "Total Orders", value: stats?.total_orders || 0, color: "text-gray-900", bg: "bg-gray-50" },
                { label: "Average Order", value: `KD ${parseFloat(stats?.average_order_value || 0).toFixed(3)}`, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Total Refunds", value: `KD ${parseFloat(stats?.total_refunds || 0).toFixed(3)}`, color: "text-red-600", bg: "bg-red-50" },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-xl p-5`}>
                  <p className="text-sm text-gray-500 mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment method breakdown */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Sales by Payment Method</h3>
                {stats?.by_payment_method?.length ? (
                  <div className="space-y-3">
                    {stats.by_payment_method.map((item: any) => {
                      const pct = stats.total_revenue > 0
                        ? (parseFloat(item.total) / parseFloat(stats.total_revenue)) * 100
                        : 0;
                      return (
                        <div key={item.payment_method}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-lg ${paymentBadge(item.payment_method)}`}>
                                {item.payment_method}
                              </span>
                              <span className="text-xs text-gray-500">{item.count} orders</span>
                            </div>
                            <span className="font-semibold text-sm">KD {parseFloat(item.total).toFixed(3)}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#1773CF] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm py-8 text-center">No data available</p>
                )}
              </div>

              {/* Sales by Branch */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Sales by Branch</h3>
                {stats?.by_branch?.length ? (
                  <div className="space-y-3">
                    {stats.by_branch.map((item: any) => {
                      const pct = stats.total_revenue > 0
                        ? (parseFloat(item.total) / parseFloat(stats.total_revenue)) * 100
                        : 0;
                      return (
                        <div key={item.branch_id}>
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.branch_name}</p>
                              <p className="text-xs text-gray-400">{item.count} orders</p>
                            </div>
                            <span className="font-semibold text-sm">KD {parseFloat(item.total).toFixed(3)}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm py-8 text-center">No data available</p>
                )}
              </div>

              {/* Top products */}
              {stats?.top_products?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Top Selling Products</h3>
                  <div className="space-y-3">
                    {stats.top_products.map((item: any, i: number) => (
                      <div key={item.product_id} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                          <p className="text-xs text-gray-400">{item.total_quantity} units sold</p>
                        </div>
                        <span className="font-semibold text-sm text-gray-900">KD {parseFloat(item.total_revenue).toFixed(3)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sales by day */}
              {stats?.daily_breakdown?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Daily Sales</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {stats.daily_breakdown.map((day: any) => (
                      <div key={day.date} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', weekday: 'short' })}
                          </p>
                          <p className="text-xs text-gray-400">{day.count} orders</p>
                        </div>
                        <span className="font-semibold text-sm text-[#1773CF]">KD {parseFloat(day.total).toFixed(3)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}