import DashboardLayout from '../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../app/hooks';
import type { RootState } from '../../../app/store';
import icon_1 from '../../../assets/icons/icon_1.svg';
import icon_2 from '../../../assets/icons/icon_2.png';
import icon_3 from '../../../assets/icons/icon_3.png';
import icon_4 from '../../../assets/icons/icon_4.png';
import icon_5 from '../../../assets/icons/icon_5.svg';
import icon_6 from '../../../assets/icons/icon_6.svg';
import icon_7 from '../../../assets/icons/icon_7.svg';
import icon_8 from '../../../assets/icons/icon_8.svg';
import { useEffect, useMemo, useState } from 'react';
import {
  XAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
  YAxis
} from 'recharts';
import { useGetLowStockProductsQuery } from '../../../services/inventoryApi';
import { useGetActivityLogsQuery } from '../../../services/securityApi';
import {
  useGetSalesWeeklyQuery,
  useGetSalesMonthlyQuery,
  useGetChannelBreakdownQuery
} from '../../../services/salesApi';
import {
  useGetPendingApprovalsQuery as useGetPurchasePendingApprovalsQuery,
  useGetPurchaseOrderStatisticsQuery
} from '../../../services/purchaseApi';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const COLORS = ['#91C0EECC', '#1773CF99', '#91C0EE80', '#FF8042', '#00C49F'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-sm text-blue-600">
          Revenue: KWD {payload[0]?.value?.toLocaleString?.(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) || '0.000'}
        </p>
      </div>
    );
  }
  return null;
};

const EMPTY_BAR_DATA = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(name => ({ name, revenue: 0 }));
const EMPTY_PIE_DATA = [{ name: 'No Data', value: 1 }];

const Spinner = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
);

export default function DashboardPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  const [currentPage, setCurrentPage] = useState(1);

  const selectedBranchId = useAppSelector((state: RootState) => state.branch?.selectedBranchId);

  const { data: weeklyData, isLoading: weeklyLoading } = useGetSalesWeeklyQuery();
  const { data: monthlyData, isLoading: monthlyLoading } = useGetSalesMonthlyQuery();
  const { data: channelData, isLoading: channelLoading } = useGetChannelBreakdownQuery();
  const { data: purchasePendingData } = useGetPurchasePendingApprovalsQuery({ per_page: 1 });
  const { data: purchaseStatsData } = useGetPurchaseOrderStatisticsQuery({});

  const { data: lowStockResponse, isLoading: lowStockLoading, refetch } = useGetLowStockProductsQuery(
    { branch_id: selectedBranchId ?? undefined } as any,
  );

  const { data: activityLogsData, isLoading: logsLoading } = useGetActivityLogsQuery(
    { page: currentPage, per_page: 10, branch_id: selectedBranchId ?? undefined } as any,
  );

  useEffect(() => { refetch(); }, [selectedBranchId, refetch]);

  const activityLogs = (activityLogsData as any)?.data?.data || [];
  const paginationMeta = (activityLogsData as any)?.data;
  const totalPages = paginationMeta?.last_page || 1;

  const processedSalesData = useMemo(() => {
    if (selectedTimeframe === 'weekly' && weeklyData?.data?.daily_breakdown) {
      return weeklyData.data.daily_breakdown.map((item: any) => ({
        name: format(new Date(item.date), 'EEE'),
        revenue: parseFloat(item.revenue) || 0,
      }));
    }
    if (selectedTimeframe === 'monthly' && monthlyData?.data?.daily_sales) {
      return monthlyData.data.daily_sales.map((item: any) => ({
        name: `Day ${item.day}`,
        revenue: parseFloat(item.revenue) || 0,
      }));
    }
    return [];
  }, [weeklyData, monthlyData, selectedTimeframe]);

  const channelPieData = useMemo(() => {
    if (!channelData?.data?.channel_breakdown) return [];
    return channelData.data.channel_breakdown.map((channel: any) => ({
      name: channel.channel,
      value: parseFloat(channel.total_revenue) || 0,
      orders: channel.total_orders || 0,
      percentage: (
        (parseFloat(channel.total_revenue) / (channelData.data.summary?.total_revenue || 1)) * 100
      ).toFixed(1),
    }));
  }, [channelData]);

  const totalRevenue = useMemo(() => {
    if (selectedTimeframe === 'weekly') return parseFloat(weeklyData?.data?.summary?.total_revenue) || 0;
    return parseFloat(monthlyData?.data?.summary?.total_revenue) || 0;
  }, [weeklyData, monthlyData, selectedTimeframe]);

  const revenueChange = useMemo(() => {
    if (selectedTimeframe === 'weekly') return parseFloat(weeklyData?.data?.comparison?.revenue_change_percentage) || 0;
    return parseFloat(monthlyData?.data?.comparison?.revenue_change_percentage) || 0;
  }, [weeklyData, monthlyData, selectedTimeframe]);

  const isLoading = selectedTimeframe === 'weekly' ? weeklyLoading : monthlyLoading;

  const pendingOrdersCount = useMemo(() => (
    weeklyData?.data?.summary?.pending_orders || monthlyData?.data?.summary?.pending_orders || 0
  ), [weeklyData, monthlyData]);

  const pendingApprovalsCount = useMemo(() => (
    (purchasePendingData as any)?.data?.data?.length || 0
  ), [purchasePendingData]);

  const statistics = useMemo(() => ({
    lowStockCount: (lowStockResponse?.data || []).length,
  }), [lowStockResponse]);

  const mapLogToRow = (log: any) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      created: { text: 'Completed', color: 'bg-green-100 text-green-800' },
      updated: { text: 'In Progress', color: 'bg-blue-100 text-blue-800' },
      deleted: { text: 'Warning', color: 'bg-red-100 text-red-800' },
      login: { text: 'Completed', color: 'bg-green-100 text-green-800' },
      logout: { text: 'Completed', color: 'bg-gray-100 text-gray-800' },
    };
    const status = statusMap[log.action] || { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    const name = log.user_name || 'System';
    const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

    return {
      id: `#${log.id}`,
      module: log.log_name || 'System',
      description: log.description,
      date: format(new Date(log.created_at), 'MMM dd, yyyy'),
      time: format(new Date(log.created_at), 'hh:mm a'),
      user: { name, initials },
      status,
    };
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={500}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const statCards = [
    {
      label: 'Total Revenue',
      value: isLoading ? '...' : `KWD ${totalRevenue.toFixed(3)}`,
      icon: icon_3,
      badge: icon_6,
      sub: `${revenueChange >= 0 ? '+' : ''}${revenueChange}% vs last period`,
      subColor: 'text-green-600',
    },
    {
      label: 'Pending Orders',
      value: String(pendingOrdersCount),
      icon: icon_4,
      badge: icon_7,
      sub: pendingOrdersCount > 0 ? `${pendingOrdersCount} orders pending` : 'No pending orders',
      subColor: 'text-red-600',
    },
    {
      label: 'Low Stock Alerts',
      value: lowStockLoading ? '...' : String(statistics.lowStockCount),
      icon: icon_1,
      badge: icon_8,
      sub: lowStockLoading ? 'Loading...' : statistics.lowStockCount > 0 ? `${statistics.lowStockCount} Items Need Restock` : 'All Stock Levels Good',
      subColor: 'text-red-600',
    },
    {
      label: 'Pending Approvals',
      value: String(pendingApprovalsCount),
      icon: icon_2,
      badge: icon_5,
      sub: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} requests awaiting approval` : 'No pending approvals',
      subColor: 'text-gray-600',
    },
  ];

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 overflow-x-hidden min-w-0">

        {/* Stat Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 xl:gap-6">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white rounded-lg p-4 md:p-5 xl:p-6 min-w-0">
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-sm md:text-base font-medium text-gray-600 truncate">{card.label}</p>
                  <p className="text-lg md:text-xl xl:text-2xl font-semibold text-gray-900 mt-6 md:mt-8 break-words">
                    {card.value}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#F7F9FB] flex items-center justify-center shrink-0">
                  <img src={card.icon} alt="" className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center mt-2 gap-1">
                <img src={card.badge} alt="" className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                <p className={`text-xs md:text-sm font-semibold truncate ${card.subColor}`}>{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue + Channel */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">

          {/* Revenue Bar Chart */}
          <div className="xl:col-span-2 bg-white rounded-lg p-4 md:p-5 xl:p-6 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <div className="min-w-0">
                <h2 className="text-sm md:text-base xl:text-lg font-semibold text-gray-900">Revenue Analysis</h2>
                <p className="text-xs md:text-sm text-gray-500 mt-0.5">Sales performance across all channels</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {(['weekly', 'monthly'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setSelectedTimeframe(tf)}
                    className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-colors ${
                      selectedTimeframe === tf ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tf === 'weekly' ? 'Weekly' : 'Monthly'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xl md:text-2xl xl:text-3xl font-bold text-gray-900 flex items-center flex-wrap gap-2">
                KWD {isLoading ? '...' : totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                <span className="bg-gray-100 rounded-full px-2 py-1 text-xs md:text-sm font-medium text-green-600">
                  {revenueChange >= 0 ? '+' : ''}{revenueChange}%
                </span>
              </p>
            </div>

            <div className="h-56 md:h-64 xl:h-72 w-full">
              {isLoading ? (
                <Spinner />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={processedSalesData.length > 0 ? processedSalesData : EMPTY_BAR_DATA}
                    margin={{ top: 10, right: 5, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 11 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 10 }}
                      width={55}
                      tickFormatter={(v) => v.toFixed(0)}
                      domain={processedSalesData.length === 0 ? [0, 10] : undefined}
                    />
                    <Tooltip content={processedSalesData.length > 0 ? <CustomTooltip /> : <></>} />
                    <Bar
                      dataKey="revenue"
                      fill={processedSalesData.length > 0 ? '#00C0E8' : '#E5E7EB'}
                      radius={[8, 8, 8, 8]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-lg p-4 md:p-5 xl:p-6 min-w-0">
            <h3 className="text-sm md:text-base xl:text-lg font-semibold text-gray-900 mb-4">Channels Contribution</h3>

            {channelLoading ? (
              <div className="h-64"><Spinner /></div>
            ) : (
              <>
                <div className="h-52 md:h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelPieData.length > 0 ? channelPieData : EMPTY_PIE_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius="40%"
                        outerRadius="65%"
                        paddingAngle={channelPieData.length > 0 ? 4 : 0}
                        dataKey="value"
                        label={channelPieData.length > 0 ? renderCustomizedLabel : false}
                        labelLine={false}
                        stroke="none"
                      >
                        {channelPieData.length > 0
                          ? channelPieData.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))
                          : <Cell fill="#E5E7EB" />
                        }
                      </Pie>
                      {channelPieData.length > 0 && (
                        <Tooltip formatter={(value: any) => `KWD ${parseFloat(value).toFixed(3)}`} />
                      )}
                      {channelPieData.length > 0 && (
                        <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                      )}
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {channelPieData.length > 0 ? (
                  <div className="mt-3 space-y-2 overflow-y-auto max-h-40">
                    {channelPieData.map((channel: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs md:text-sm gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="text-gray-600 truncate">{channel.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-medium text-gray-900">KWD {channel.value.toFixed(3)}</div>
                          <div className="text-xs text-gray-400">{channel.orders} orders ({channel.percentage}%)</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-gray-400 mt-3">No channel data available</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Activity Table + Low Stock */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">

          {/* Activity Table */}
          <div className="xl:col-span-3 rounded-lg overflow-hidden bg-white min-w-0">
            <div className="p-4 md:p-5 xl:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-sm md:text-base xl:text-lg font-semibold text-gray-900">Recent Activities</h2>
              <Link to="/admin/security" className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-xs md:text-sm">
                View All
              </Link>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full divide-y divide-gray-200" style={{ minWidth: '680px' }}>
                <thead className="bg-gray-50">
                  <tr>
                    {['Activity ID', 'Module', 'Description', 'Date', 'User', 'Status'].map((h) => (
                      <th key={h} className="px-4 md:px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                      </td>
                    </tr>
                  ) : activityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500 text-sm">No recent activities found</td>
                    </tr>
                  ) : (
                    activityLogs.map((log: any) => {
                      const row = mapLogToRow(log);
                      return (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.id}</td>
                          <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap text-sm text-gray-700">{row.module}</td>
                          <td className="px-4 md:px-5 py-3 md:py-4 max-w-[200px]">
                            <div className="text-sm text-gray-900 line-clamp-1">{row.description}</div>
                            <div className="text-xs text-gray-400 mt-0.5">Activity details</div>
                          </td>
                          <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{row.date}</div>
                            <div className="text-xs text-gray-400">{row.time}</div>
                          </td>
                          <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 text-xs font-semibold shrink-0">
                                {row.user.initials}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">{row.user.name}</div>
                                <div className="text-xs text-gray-400">ID: {log.user?.employee_id || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${row.status.color}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 md:px-5 py-3 border-t border-gray-100">
                <span className="text-xs md:text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 text-xs md:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>
                  {pageNumbers.map((num) => (
                    <button
                      key={num}
                      onClick={() => setCurrentPage(num)}
                      className={`w-8 h-8 text-xs md:text-sm font-medium rounded-lg transition-colors ${
                        currentPage === num ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 text-xs md:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Low Stock */}
          <div className="bg-white rounded-xl p-4 md:p-5 xl:p-6 min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <img src={icon_1} alt="" className="w-5 h-5 shrink-0" />
              <h2 className="text-sm md:text-base xl:text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
            </div>

            {lowStockLoading ? (
              <div className="h-40"><Spinner /></div>
            ) : (lowStockResponse?.data || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-center gap-2">
                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-gray-600">All Stock Levels Good</p>
                <p className="text-xs text-gray-400">No items need restocking</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {(lowStockResponse?.data || []).slice(0, 5).map((item: any, index: number) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{item.product_name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>
                        <p className="text-xs text-gray-400">Branch: {item.branch_name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-bold px-2 py-1 rounded-lg ${
                          item.current_stock === 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {item.current_stock} Left
                        </div>
                        <button className="mt-1 text-blue-600 text-xs font-medium hover:underline">
                          Restock
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Reorder: {item.reorder_point}</span>
                      <span className="text-red-500 font-medium">Need: {item.quantity_needed}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-100">
              <button className="w-full py-2 text-blue-600 hover:text-blue-800 hover:underline font-medium text-xs md:text-sm transition-colors">
                View All Alerts ({lowStockLoading ? '...' : statistics.lowStockCount}) →
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}