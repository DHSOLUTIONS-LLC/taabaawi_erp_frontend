// src/features/auth/pages/DashboardPage.tsx
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
import { XAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { useGetLowStockProductsQuery } from '../../../services/inventoryApi';
import { useGetActivityLogsQuery } from '../../../services/securityApi';
import { useGetSalesWeeklyQuery, useGetSalesMonthlyQuery, useGetChannelBreakdownQuery } from '../../../services/salesApi';
import { useGetPendingApprovalsQuery as useGetPurchasePendingApprovalsQuery, useGetPurchaseOrderStatisticsQuery } from '../../../services/purchaseApi';
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

export default function DashboardPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  const [currentPage, setCurrentPage] = useState(1);

  const selectedBranchId = useAppSelector((state: RootState) => state.branch?.selectedBranchId);

  // Fetch real sales data
  const { data: weeklyData, isLoading: weeklyLoading } = useGetSalesWeeklyQuery();
  const { data: monthlyData, isLoading: monthlyLoading } = useGetSalesMonthlyQuery();
  const { data: channelData, isLoading: channelLoading } = useGetChannelBreakdownQuery();
  
  // Fetch pending approvals from purchase module
  const { data: purchasePendingData } = useGetPurchasePendingApprovalsQuery({ per_page: 1 });
  const { data: purchaseStatsData } = useGetPurchaseOrderStatisticsQuery({});

  const { data: lowStockResponse, isLoading: lowStockLoading, refetch } = useGetLowStockProductsQuery(
    { branch_id: selectedBranchId ?? undefined } as any,
  );

  useEffect(() => {
    refetch();
  }, [selectedBranchId, refetch]);

  const { data: activityLogsData, isLoading: logsLoading } = useGetActivityLogsQuery(
    { page: currentPage, per_page: 10, branch_id: selectedBranchId ?? undefined } as any,
  );

  const activityLogs = (activityLogsData as any)?.data?.data || [];
  const paginationMeta = (activityLogsData as any)?.data;
  const totalPages = paginationMeta?.last_page || 1;

  // Process sales data for chart
  const processedSalesData = useMemo(() => {
    if (selectedTimeframe === 'weekly' && weeklyData?.data?.daily_breakdown) {
      return weeklyData.data.daily_breakdown.map((item: any) => ({
        name: format(new Date(item.date), 'EEE'),
        revenue: parseFloat(item.revenue) || 0,
      }));
    } else if (selectedTimeframe === 'monthly' && monthlyData?.data?.daily_sales) {
      return monthlyData.data.daily_sales.map((item: any) => ({
        name: `Day ${item.day}`,
        revenue: parseFloat(item.revenue) || 0,
      }));
    }
    return [];
  }, [weeklyData, monthlyData, selectedTimeframe]);

  // Process channel breakdown data for pie chart
  const channelPieData = useMemo(() => {
    if (!channelData?.data?.channel_breakdown) return [];
    return channelData.data.channel_breakdown.map((channel: any) => ({
      name: channel.channel,
      value: parseFloat(channel.total_revenue) || 0,
      orders: channel.total_orders || 0,
      percentage: ((parseFloat(channel.total_revenue) / (channelData.data.summary?.total_revenue || 1)) * 100).toFixed(1)
    }));
  }, [channelData]);

  const totalRevenue = useMemo(() => {
    if (selectedTimeframe === 'weekly' && weeklyData?.data?.summary?.total_revenue) {
      return parseFloat(weeklyData.data.summary.total_revenue) || 0;
    } else if (selectedTimeframe === 'monthly' && monthlyData?.data?.summary?.total_revenue) {
      return parseFloat(monthlyData.data.summary.total_revenue) || 0;
    }
    return 0;
  }, [weeklyData, monthlyData, selectedTimeframe]);

  const revenueChange = useMemo(() => {
    if (selectedTimeframe === 'weekly' && weeklyData?.data?.comparison?.revenue_change_percentage) {
      return parseFloat(weeklyData.data.comparison.revenue_change_percentage) || 0;
    } else if (selectedTimeframe === 'monthly' && monthlyData?.data?.comparison?.revenue_change_percentage) {
      return parseFloat(monthlyData.data.comparison.revenue_change_percentage) || 0;
    }
    return 0;
  }, [weeklyData, monthlyData, selectedTimeframe]);

  const isLoading = selectedTimeframe === 'weekly' ? weeklyLoading : monthlyLoading;

  // Get pending orders count from orders data
  const pendingOrdersCount = useMemo(() => {
    return (weeklyData?.data?.summary?.pending_orders || monthlyData?.data?.summary?.pending_orders || 0);
  }, [weeklyData, monthlyData]);

  // Get pending approvals count from purchase module
  const pendingApprovalsCount = useMemo(() => {
    const purchasePending = (purchasePendingData as any)?.data?.data?.length || 0;
    return purchasePending;
  }, [purchasePendingData]);

  const mapLogToRow = (log: any) => {
    let statusText = 'Completed';
    let statusColor = 'bg-green-100 text-green-800';
    if (log.action === 'created') {
      statusText = 'Completed';
      statusColor = 'bg-green-100 text-green-800';
    } else if (log.action === 'updated') {
      statusText = 'In Progress';
      statusColor = 'bg-blue-100 text-blue-800';
    } else if (log.action === 'deleted') {
      statusText = 'Warning';
      statusColor = 'bg-red-100 text-red-800';
    } else if (log.action === 'login') {
      statusText = 'Completed';
      statusColor = 'bg-green-100 text-green-800';
    } else if (log.action === 'logout') {
      statusText = 'Completed';
      statusColor = 'bg-gray-100 text-gray-800';
    } else {
      statusText = 'Pending';
      statusColor = 'bg-yellow-100 text-yellow-800';
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

  // Custom pie chart label
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-medium">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 overflow-x-hidden">
        {/* Stats Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Card 1 - Total Revenue */}
          <div className="bg-white rounded-lg p-4 md:p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm md:text-lg font-medium text-gray-600">Total Revenue</p>
                <p className="text-xl md:text-[24px] font-semibold text-gray-900 mt-4 md:mt-10">
                  KWD {isLoading ? '...' : totalRevenue.toFixed(3)}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#F7F9FB] flex items-center justify-center">
                <img src={icon_3} alt="" className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
            <div className='flex flex-row items-center mt-2'>
              <img src={icon_6} alt="" className='w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2' />
              <p className="text-sm md:text-md font-semibold text-green-600">
                {revenueChange >= 0 ? '+' : ''}{revenueChange}% vs last period
              </p>
            </div>
          </div>

          {/* Card 2 - Pending Orders */}
          <div className="bg-white rounded-lg p-4 md:p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm md:text-lg font-medium text-gray-600">Pending Orders</p>
                <p className="text-xl md:text-[24px] font-semibold text-gray-900 mt-4 md:mt-10">
                  {pendingOrdersCount}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#F7F9FB] flex items-center justify-center">
                <img src={icon_4} alt="" className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
            <div className='flex flex-row items-center mt-2'>
              <img src={icon_7} alt="" className='w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2' />
              <p className="text-sm md:text-md font-semibold text-red-600">
                {pendingOrdersCount > 0 ? `${pendingOrdersCount} orders pending` : 'No pending orders'}
              </p>
            </div>
          </div>

          {/* Card 3 - Low Stock Alerts */}
          <div className="bg-white rounded-lg p-4 md:p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm md:text-lg font-medium text-gray-600">Low Stock Alerts</p>
                <p className="text-xl md:text-[24px] font-semibold text-gray-900 mt-4 md:mt-10">
                  {lowStockLoading ? <span className="animate-pulse">...</span> : statistics.lowStockCount}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#F7F9FB] flex items-center justify-center">
                <img src={icon_1} alt="" className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
            <div className='flex flex-row items-center mt-2'>
              <img src={icon_8} alt="" className='w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2' />
              <p className="text-sm md:text-md font-semibold text-red-600">
                {lowStockLoading ? 'Loading...' : statistics.lowStockCount > 0
                  ? `${statistics.lowStockCount} Items Need Restock`
                  : 'All Stock Levels Good'}
              </p>
            </div>
          </div>

          {/* Card 4 - Pending Approvals */}
          <div className="bg-white rounded-lg p-4 md:p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm md:text-lg font-medium text-gray-600">Pending Approvals</p>
                <p className="text-xl md:text-[24px] font-semibold text-gray-900 mt-4 md:mt-10">
                  {pendingApprovalsCount}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#F7F9FB] flex items-center justify-center">
                <img src={icon_2} alt="" className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
            <div className='flex flex-row items-center mt-2'>
              <img src={icon_5} alt="" className='w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2' />
              <p className="text-sm md:text-md font-semibold text-gray-600">
                {pendingApprovalsCount > 0 ? `${pendingApprovalsCount} requests awaiting approval` : 'No pending approvals'}
              </p>
            </div>
          </div>
        </div>

        {/* Revenue Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-md p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-gray-900">Revenue Analysis</h2>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Sales performance across all channels</p>
              </div>
              <div className="flex space-x-2 mt-3 sm:mt-0">
                {(['weekly', 'monthly'] as const).map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className={`px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-lg transition-colors ${
                      selectedTimeframe === timeframe
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {timeframe === 'weekly' ? 'Weekly' : 'Monthly'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-2xl md:text-3xl font-bold items-center text-gray-900">
                KWD {isLoading ? '...' : totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                <span className="bg-gray-100 rounded-full p-1.5 md:p-2 text-xs md:text-sm font-medium text-green-600 ml-2">
                  {revenueChange >= 0 ? '+' : ''}{revenueChange}%
                </span>
              </p>
            </div>

            <div className="h-64 w-full">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : processedSalesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processedSalesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 11 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={50}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" fill="#00C0E8" radius={[20, 20, 20, 20]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No revenue data available
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-6">Channels Contribution</h3>
            
            {channelLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : channelPieData.length > 0 ? (
              <>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={renderCustomizedLabel}
                        labelLine={false}
                      >
                        {channelPieData.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `KWD ${parseFloat(value).toFixed(3)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {channelPieData.map((channel: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-gray-600">{channel.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">KWD {channel.value.toFixed(3)}</div>
                        <div className="text-xs text-gray-500">{channel.orders} orders ({channel.percentage}%)</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No channel data available
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity - With Horizontal Scroll for Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 rounded-lg overflow-hidden">
            <div className="p-4 md:p-6 bg-white rounded-t-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <h2 className="text-base md:text-lg font-semibold text-gray-900">Recent Activities</h2>
                <Link to='/admin/security' className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-xs md:text-sm mt-2 sm:mt-0">
                  View All
                </Link>
              </div>
            </div>

            {/* Table with horizontal scroll on small screens */}
            <div className="overflow-x-auto w-full">
              <div className="min-w-[800px] md:min-w-full">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-transparent">
                    <tr>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity ID</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logsLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 md:px-6 py-8 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                        </td>
                      </tr>
                    ) : activityLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 md:px-6 py-8 text-center text-gray-500">No recent activities found</td>
                      </tr>
                    ) : (
                      activityLogs.map((log: any) => {
                        const row = mapLogToRow(log);
                        return (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{row.id}</div>
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{row.module}</div>
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4">
                              <div className="text-sm text-gray-900 max-w-xs">
                                <div className="line-clamp-1">{row.description}</div>
                                <div className="text-xs text-gray-500 mt-1">Activity details</div>
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{row.date}</div>
                              <div className="text-xs text-gray-400">{row.time}</div>
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-linear-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 text-xs md:text-sm font-semibold">
                                  {row.user.initials}
                                </div>
                                <div className="ml-2 md:ml-3">
                                  <div className="text-sm font-medium text-gray-900">{row.user.name}</div>
                                  <div className="text-xs text-gray-500">Staff ID: {log.user?.employee_id || 'N/A'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-medium ${row.status.color}`}>
                                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full mr-1 md:mr-2 bg-current opacity-70"></span>
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
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 px-3 pb-4 border-t border-gray-200">
                <div className="text-sm text-gray-500 order-2 sm:order-1">Page {currentPage} of {totalPages}</div>
                <div className="flex flex-wrap justify-center gap-1 sm:gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className={`px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium rounded-lg transition-colors ${
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
                    className="px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-xl p-4 md:p-6">
            <div className='flex flex-row items-center mb-2'>
              <img src={icon_1} alt="" className="w-5 h-5 md:w-6 md:h-6" />
              <h2 className="text-base md:text-lg font-semibold text-gray-900 ml-2">Low Stock Alerts</h2>
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
                <p className="text-xs md:text-sm mt-1">No items need restocking</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4 max-h-[400px] overflow-y-auto">
                {(lowStockResponse?.data || []).slice(0, 5).map((item: any, index: number) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 break-words">{item.product_name}</h3>
                        <p className="text-xs text-gray-500 mt-1">SKU: {item.sku}</p>
                        <p className="text-xs text-gray-500">Branch: {item.branch_name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-base md:text-lg font-bold p-1 rounded-xl ${
                          item.current_stock === 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {item.current_stock} Left
                        </div>
                        <button className="mt-1 text-blue-600 text-xs md:text-sm font-medium rounded transition-colors hover:underline">
                          Restock
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 mt-2">
                      <span>Reorder: {item.reorder_point}</span>
                      <span className="text-red-600 font-medium">Need: {item.quantity_needed}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <button className="w-full py-2 text-blue-600 hover:text-blue-800 hover:underline font-medium text-xs md:text-sm">
                View All Alerts ({lowStockLoading ? '...' : statistics.lowStockCount}) →
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}