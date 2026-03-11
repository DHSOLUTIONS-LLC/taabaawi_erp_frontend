// src/features/auth/pages/DashboardPage.tsx
import DashboardLayout from '../../../layouts/DashboardLayout';

import { useAppSelector } from '../../../app/hooks';  // ← UNCOMMENTED
import type { RootState } from '../../../app/store';   // ← ADDED
import icon_1 from '../../../assets/icons/icon_1.svg'
import icon_2 from '../../../assets/icons/icon_2.png'
import icon_3 from '../../../assets/icons/icon_3.png'
import icon_4 from '../../../assets/icons/icon_4.png'
import icon_5 from '../../../assets/icons/icon_5.svg'
import icon_6 from '../../../assets/icons/icon_6.svg'
import icon_7 from '../../../assets/icons/icon_7.svg'
import icon_8 from '../../../assets/icons/icon_8.svg'
import { useEffect, useMemo, useState } from 'react';
import { XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useGetLowStockProductsQuery } from '../../../services/inventoryApi';
import { useGetActivityLogsQuery } from '../../../services/securityApi';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface RevenueDataPoint {
  day: string;
  revenue: number;
  previousPeriod?: number;
}

interface TimeframeData {
  label: string;
  totalRevenue: number;
  changePercentage: number;
  dataPoints: RevenueDataPoint[];
  periodLabel: string;
}

const revenueData: Record<'weekly' | 'monthly' | 'yearly', TimeframeData> = {
  weekly: {
    label: 'Weekly',
    totalRevenue: 12743,
    changePercentage: 12.5,
    periodLabel: 'This Week',
    dataPoints: [
      { day: 'Mon', revenue: 1000, previousPeriod: 900 },
      { day: 'Tue', revenue: 800, previousPeriod: 1100 },
      { day: 'Wed', revenue: 1100, previousPeriod: 1000 },
      { day: 'Thu', revenue: 1300, previousPeriod: 1270 },
      { day: 'Fri', revenue: 1600, previousPeriod: 1800 },
      { day: 'Sat', revenue: 1000, previousPeriod: 950 },
      { day: 'Sun', revenue: 1400, previousPeriod: 2300 },
    ]
  },
  monthly: {
    label: 'Monthly',
    totalRevenue: 48750,
    changePercentage: 8.2,
    periodLabel: 'This Month',
    dataPoints: [
      { day: 'Week 1', revenue: 11500, previousPeriod: 10800 },
      { day: 'Week 2', revenue: 12500, previousPeriod: 11800 },
      { day: 'Week 3', revenue: 12750, previousPeriod: 12000 },
      { day: 'Week 4', revenue: 12000, previousPeriod: 11200 },
    ]
  },
  yearly: {
    label: 'Yearly',
    totalRevenue: 585000,
    changePercentage: 15.3,
    periodLabel: 'This Year',
    dataPoints: [
      { day: 'Jan', revenue: 45000, previousPeriod: 42000 },
      { day: 'Feb', revenue: 48000, previousPeriod: 44000 },
      { day: 'Mar', revenue: 52000, previousPeriod: 48000 },
      { day: 'Apr', revenue: 49000, previousPeriod: 45000 },
      { day: 'May', revenue: 51000, previousPeriod: 47000 },
      { day: 'Jun', revenue: 53000, previousPeriod: 49000 },
      { day: 'Jul', revenue: 50000, previousPeriod: 46000 },
      { day: 'Aug', revenue: 52000, previousPeriod: 48000 },
      { day: 'Sep', revenue: 54000, previousPeriod: 50000 },
      { day: 'Oct', revenue: 56000, previousPeriod: 52000 },
      { day: 'Nov', revenue: 58000, previousPeriod: 54000 },
      { day: 'Dec', revenue: 60000, previousPeriod: 55000 },
    ]
  }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-sm text-blue-600">Revenue: ${payload[0].value.toLocaleString()}</p>
        {payload[1] && (
          <p className="text-sm text-gray-500">Previous: ${payload[1].value.toLocaleString()}</p>
        )}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [currentPage, setCurrentPage] = useState(1);

  // ── BRANCH SELECTION ────────────────────────────────────────────────────────
  // Read the currently selected branch from Redux.
  // Passing it as part of the query arg (branch_id) makes RTK Query treat
  // "branch A" and "branch B" as different cache entries — so it automatically
  // refetches the moment the user switches branches in the Topbar.
  // The actual filtering is done server-side via the X-Branch-Id header set in api.ts.
  // null = "All Branches" → no header sent → backend returns everything.
  const selectedBranchId = useAppSelector((state: RootState) => state.branch?.selectedBranchId);
  // ────────────────────────────────────────────────────────────────────────────

  const { data: lowStockResponse, isLoading: lowStockLoading, refetch  } = useGetLowStockProductsQuery(
    // Pass branch_id as arg so cache key changes when branch switches → auto-refetch
    { branch_id: selectedBranchId ?? undefined } as any,
  );

  useEffect(() => {
  refetch();
}, [selectedBranchId]);

  const { data: activityLogsData, isLoading: logsLoading } = useGetActivityLogsQuery(
    // Include selectedBranchId in the arg so this also refetches on branch switch
    { page: currentPage, per_page: 10, branch_id: selectedBranchId ?? undefined } as any,
  );

  const activityLogs = activityLogsData?.data?.data || [];
  const paginationMeta = activityLogsData?.data;
  const totalPages = paginationMeta?.last_page || 1;

  const mapLogToRow = (log: any) => {
    let statusText = 'Completed';
    let statusColor = 'bg-green-100 text-green-800';
    if (log.action === 'created') {
      statusText = 'Completed'; statusColor = 'bg-green-100 text-green-800';
    } else if (log.action === 'updated') {
      statusText = 'In Progress'; statusColor = 'bg-blue-100 text-blue-800';
    } else if (log.action === 'deleted') {
      statusText = 'Warning'; statusColor = 'bg-red-100 text-red-800';
    } else if (log.action === 'login') {
      statusText = 'Completed'; statusColor = 'bg-green-100 text-green-800';
    } else if (log.action === 'logout') {
      statusText = 'Completed'; statusColor = 'bg-gray-100 text-gray-800';
    } else {
      statusText = 'Pending'; statusColor = 'bg-yellow-100 text-yellow-800';
    }

    const name = log.user_name || 'System';
    const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

    return {
      id: `#${log.id}`,
      module: log.log_name || 'System',
      description: log.description,
      date: format(new Date(log.created_at), 'MMM dd, yyyy'),
      time: format(new Date(log.created_at), 'hh:mm a'),
      user: { name, initials },
      status: { text: statusText, color: statusColor }
    };
  };

  const statistics = useMemo(() => {
    const lowStockData = lowStockResponse?.data || [];
    return { lowStockCount: lowStockData.length };
  }, [lowStockResponse]);

  const currentData = revenueData[selectedTimeframe];

  // Human-readable label shown in the UI
  const branchLabel = selectedBranchId ? `Branch #${selectedBranchId}` : 'All Branches';

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Branch context pill — lets the admin know which branch they're viewing */}
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Showing: {branchLabel}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 - Total Revenue */}
          <div className="bg-white rounded-lg p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-lg font-medium text-gray-600">Total Revenue</p>
                <p className="text-[24px] font-semibold text-gray-900 mt-10">$ 12,450</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#F7F9FB] flex items-center justify-center">
                <img src={icon_3} alt="" />
              </div>
            </div>
            <div className='flex flex-row items-center mt-2'>
              <img src={icon_6} alt="" className='w-6 h-6 mr-2' />
              <p className="text-md font-semibold text-green-600">+24% vs last week</p>
            </div>
          </div>

          {/* Card 2 - Pending Orders */}
          <div className="bg-white rounded-lg p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-lg font-medium text-gray-600">Pending Orders</p>
                <p className="text-[24px] font-semibold text-gray-900 mt-10">156</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#F7F9FB] flex items-center justify-center">
                <img src={icon_4} alt="" />
              </div>
            </div>
            <div className='flex flex-row items-center mt-2'>
              <img src={icon_7} alt="" className='w-6 h-6 mr-2' />
              <p className="text-md font-semibold text-red-600">+24% vs last week</p>
            </div>
          </div>

          {/* Card 3 - Low Stock Alerts */}
          <div className="bg-white rounded-lg p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-lg font-medium text-gray-600">Low Stock Alerts</p>
                <p className="text-[24px] font-semibold text-gray-900 mt-10">
                  {lowStockLoading ? <span className="animate-pulse">...</span> : statistics.lowStockCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#F7F9FB] flex items-center justify-center">
                <img src={icon_1} alt="" />
              </div>
            </div>
            <div className='flex flex-row items-center mt-2'>
              <img src={icon_8} alt="" className='w-6 h-6 mr-2' />
              <p className="text-md font-semibold text-red-600">
                {lowStockLoading ? 'Loading...' : statistics.lowStockCount > 0
                  ? `${statistics.lowStockCount} Items Need Restock`
                  : 'All Stock Levels Good'}
              </p>
            </div>
          </div>

          {/* Card 4 - Pending Approvals */}
          <div className="bg-white rounded-lg p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-lg font-medium text-gray-600">Pending Approvals</p>
                <p className="text-[24px] font-semibold text-gray-900 mt-10">2,847</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#F7F9FB] flex items-center justify-center">
                <img src={icon_2} alt="" />
              </div>
            </div>
            <div className='flex flex-row items-center mt-2'>
              <img src={icon_5} alt="" className='w-6 h-6 mr-2' />
              <p className="text-md font-semibold text-gray-600">requests awaiting admin approval</p>
            </div>
          </div>
        </div>

        {/* Revenue Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-md p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Revenue Analysis</h2>
                <p className="text-sm text-gray-600 mt-1">Sales performance across all channels</p>
              </div>
              <div className="flex space-x-2 mt-3 sm:mt-0">
                {(['weekly', 'monthly', 'yearly'] as const).map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      selectedTimeframe === timeframe
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {revenueData[timeframe].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-3xl font-bold items-center text-gray-900">
                ${currentData.totalRevenue.toLocaleString()}
                <span className="bg-gray-100 rounded-full p-2 text-sm font-medium text-green-600 ml-2">
                  +{currentData.changePercentage}%
                </span>
              </p>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentData.dataPoints} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#93C5FD" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#93C5FD" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" strokeWidth={3} stroke="#1773cf" fill="url(#colorRevenue)" activeDot={{ r: 6 }} />
                  <Area type="monotone" dataKey="previousPeriod" strokeWidth={2} stroke="#a3c1de" fill="url(#colorPrevious)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Channels Contribution</h3>
            <div className="relative w-64 h-64 mx-auto mb-6">
              <div className="absolute inset-0">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#91C0EECC" strokeWidth="6" strokeLinecap="round" strokeDasharray="400.743" strokeDashoffset="155.508" transform="rotate(-190 50 50)" />
                </svg>
              </div>
              <div className="absolute inset-0 p-2">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#1773CF99" strokeWidth="5" strokeLinecap="round" strokeDasharray="320.911" strokeDashoffset="153.938" transform="rotate(-100 50 50)" />
                </svg>
              </div>
              <div className="absolute inset-0 p-2">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="25" fill="none" stroke="#91C0EE80" strokeWidth="4" strokeLinecap="round" strokeDasharray="250.08" strokeDashoffset="117.81" transform="rotate(-30 50 50)" />
                </svg>
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-3xl font-bold text-gray-900">30%</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-md font-medium text-gray-500">POS: <span>45%</span></div>
              <div className="text-md font-medium text-gray-500">Website: <span>30%</span></div>
              <div className="text-md font-medium text-gray-500">Mobile App: <span>25%</span></div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 rounded-lg">
            <div className="p-6 bg-white rounded-t-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
                <Link to='/admin/security' className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm mt-2 sm:mt-0">
                  View All
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-transparent">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : activityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No recent activities found</td>
                    </tr>
                  ) : (
                    activityLogs.map((log: any) => {
                      const row = mapLogToRow(log);
                      return (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{row.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{row.module}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs">
                              <div className="line-clamp-1">{row.description}</div>
                              <div className="text-xs text-gray-500 mt-1">Activity details</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{row.date}</div>
                            <div className="text-xs text-gray-400">{row.time}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="shrink-0 w-10 h-10 rounded-full bg-linear-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 text-sm font-semibold">
                                {row.user.initials}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{row.user.name}</div>
                                <div className="text-xs text-gray-500">Staff ID: {log.user?.employee_id || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${row.status.color}`}>
                              <span className="w-2 h-2 rounded-full mr-2 bg-current opacity-70"></span>
                              {row.status.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 px-3 border-t border-gray-200">
                <div className="text-sm text-gray-500">Page {currentPage} of {totalPages}</div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else {
                      const start = Math.max(1, currentPage - 2);
                      const end = Math.min(totalPages, start + 4);
                      pageNum = start + i;
                      if (pageNum > end) return null;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === pageNum ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-xl p-6">
            <div className='flex flex-row items-center mb-2'>
              <img src={icon_1} alt="" />
              <h2 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
            </div>

            {lowStockLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (lowStockResponse?.data || []).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">All Stock Levels Good</p>
                <p className="text-sm mt-1">No items need restocking</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(lowStockResponse?.data || []).slice(0, 5).map((item: any, index: number) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{item.product_name}</h3>
                        <p className="text-xs text-gray-500 mt-1">SKU: {item.sku}</p>
                        <p className="text-xs text-gray-500">Branch: {item.branch_name}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold p-1 rounded-xl ${
                          item.current_stock === 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {item.current_stock} Left
                        </div>
                        <button className="py-1 text-blue-600 text-sm font-medium rounded transition-colors hover:underline">
                          Restock
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <span>Reorder: {item.reorder_point}</span>
                      <span className="text-red-600 font-medium">Need: {item.quantity_needed}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <button className="w-full py-2 text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm">
                View All Alerts ({lowStockLoading ? '...' : statistics.lowStockCount}) →
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}