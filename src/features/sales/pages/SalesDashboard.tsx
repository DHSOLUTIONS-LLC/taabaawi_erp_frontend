// src/features/sales/pages/SalesDashboard.tsx
import DashboardLayout from '../../../layouts/DashboardLayout';
import icon_1 from '../../../assets/icons/icon_1.svg'
import icon_2 from '../../../assets/icons/icon_2.png'
import icon_3 from '../../../assets/icons/icon_3.png'
import icon_4 from '../../../assets/icons/icon_4.png'
import icon_5 from '../../../assets/icons/icon_5.svg'
import icon_6 from '../../../assets/icons/arrow_top_green.svg'
import icon_7 from '../../../assets/icons/icon_7.svg'
import icon_8 from '../../../assets/icons/icon_8.svg'
import dropdown_arrow_icon from '../../../assets/icons/dropdown_arrow_icon.svg';
import filterIcon from '../../../assets/icons/filter_icon.svg';

import { useState, useEffect } from 'react';
import { XAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useGetInvoiceStatisticsQuery } from '../../../services/invoiceApi';
import { useGetInvoicesQuery } from '../../../services/invoiceApi';
import { useGetOrdersQuery, useGetSalesWeeklyQuery, useGetSalesMonthlyQuery, useGetSalesOverviewQuery, useGetChannelBreakdownQuery } from '../../../services/salesApi';



// Types for filters
interface FilterState {
    dateRange: string;
    customStartDate: string;
    customEndDate: string;
    invoiceType: string;
    orderSource: string;
    paymentStatus: string;
    customerType: string;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-sm text-blue-600">
                    Revenue: KWD {payload[0]?.value?.toLocaleString?.(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) || '0.000'}
                </p>
                {payload[1] && (
                    <p className="text-sm text-gray-500">
                        Previous: KWD {payload[1]?.value?.toLocaleString?.(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) || '0.000'}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

export default function SalesDashboardPage() {
    const [selectedTimeframe, setSelectedTimeframe] = useState<'weekly' | 'monthly'>('weekly');
    const [isExpanded, setIsExpanded] = useState(false);
    const [showBulkTransfer] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

    const [_dashboardData, setDashboardData] = useState<any>(null);
    const [_channelData, setChannelData] = useState<any>(null);
    const [processedChartData, setProcessedChartData] = useState<any>({
        weekly: { dataPoints: [], totalRevenue: 0, changePercentage: 0 },
        monthly: { dataPoints: [], totalRevenue: 0, changePercentage: 0 },
    });



    // Filter states
    const [filters, setFilters] = useState<FilterState>({
        dateRange: 'Today',
        customStartDate: '',
        customEndDate: '',
        invoiceType: '',
        orderSource: '',
        paymentStatus: '',
        customerType: ''
    });

    // API query params based on filters
    const [queryParams, setQueryParams] = useState({
        page: 1,
        per_page: 5,
        start_date: new Date().toISOString().split('T')[0], // Today
        end_date: new Date().toISOString().split('T')[0],   // Today
        invoice_type: undefined as string | undefined,
        payment_status: undefined as string | undefined,
        source: undefined as string | undefined,
    });

    // Update query params when filters change
    useEffect(() => {
        const params: any = {
            page: 1,
            per_page: 10
        };

        // Handle date range
        const today = new Date().toISOString().split('T')[0];

        if (filters.dateRange === 'Today') {
            params.start_date = today;
            params.end_date = today;
        } else if (filters.dateRange === 'Last 7 Days') {
            const last7Days = new Date();
            last7Days.setDate(last7Days.getDate() - 7);
            params.start_date = last7Days.toISOString().split('T')[0];
            params.end_date = today;
        } else if (filters.dateRange === 'This Month') {
            const firstDay = new Date();
            firstDay.setDate(1);
            params.start_date = firstDay.toISOString().split('T')[0];
            params.end_date = today;
        } else if (filters.dateRange === 'Custom' && filters.customStartDate && filters.customEndDate) {
            params.start_date = filters.customStartDate;
            params.end_date = filters.customEndDate;
        }

        // Apply other filters
        if (filters.invoiceType) {
            params.invoice_type = filters.invoiceType.toLowerCase();
        }

        if (filters.paymentStatus) {
            params.payment_status = filters.paymentStatus;
        }

        if (filters.orderSource) {
            params.source = filters.orderSource;
        }

        setQueryParams(params);
    }, [filters]);

    // Fetch real data from APIs
    const { data: invoiceStats } = useGetInvoiceStatisticsQuery({
        start_date: queryParams.start_date,
        end_date: queryParams.end_date
    });

    const { data: weeklyData } = useGetSalesWeeklyQuery();
    const { data: monthlyData } = useGetSalesMonthlyQuery();
    const { data: overviewData } = useGetSalesOverviewQuery();
    const { data: channelBreakdownData } = useGetChannelBreakdownQuery();


    console.log('channel contribution:', channelBreakdownData)
    const { data: invoicesData, refetch: refetchInvoices } = useGetInvoicesQuery({
        ...queryParams,
        invoice_type: (queryParams.invoice_type as 'b2c' | 'b2b' | 'quotation' | undefined)
    });

    const { data: ordersData, refetch: refetchOrders } = useGetOrdersQuery({
        ...queryParams,
        channel: queryParams.source
    });

    useEffect(() => {
        if (overviewData?.data) {
            setDashboardData(overviewData.data);
        }
        if (channelBreakdownData?.data) {
            setChannelData(channelBreakdownData.data);
        }
    }, [overviewData, channelBreakdownData]);

    // Process chart data from APIs
    useEffect(() => {
        const newChartData = {
            weekly: {
                dataPoints: [] as any[],
                totalRevenue: 0,
                changePercentage: 0
            },
            monthly: {
                dataPoints: [] as any[],
                totalRevenue: 0,
                changePercentage: 0
            }
        };

        // Process weekly data
        if (weeklyData?.data?.daily_breakdown) {
            newChartData.weekly.dataPoints = weeklyData.data.daily_breakdown.map((d: any) => ({
                day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
                revenue: parseFloat(d.revenue) || 0
            }));
            newChartData.weekly.totalRevenue = parseFloat(weeklyData.data.summary?.total_revenue || 0);
            newChartData.weekly.changePercentage = weeklyData.data.comparison?.revenue_change_percentage || 0;
        }

        // Process monthly data
        if (monthlyData?.data?.daily_sales) {
            newChartData.monthly.dataPoints = monthlyData.data.daily_sales.map((d: any) => ({
                day: `Day ${d.day}`,
                revenue: parseFloat(d.revenue) || 0
            }));
            newChartData.monthly.totalRevenue = parseFloat(monthlyData.data.summary?.total_revenue || 0);
            newChartData.monthly.changePercentage = monthlyData.data.comparison?.revenue_change_percentage || 0;
        }



        setProcessedChartData(newChartData);
    }, [weeklyData, monthlyData]);

    // Refetch when filters change
    useEffect(() => {
        refetchInvoices();
        refetchOrders();
    }, [queryParams, refetchInvoices, refetchOrders]);

    // Safely extract data with fallbacks
    const invoiceStatsData: any = invoiceStats?.data || {};
    console.log('invoice stats:', invoiceStatsData)

    // Get invoices and orders data
    const invoices = invoicesData?.data?.data || [];
    const orders = ordersData?.data?.data || [];

    // Calculate channel breakdown from orders data
    const channelBreakdownFromOrders = orders.reduce((acc: any, order: any) => {
        const channel = order.channel || 'Other';
        if (!acc[channel]) {
            acc[channel] = {
                channel,
                orders: 0,
                revenue: 0
            };
        }
        acc[channel].orders += 1;
        acc[channel].revenue += parseFloat(order.total_amount || 0);
        return acc;
    }, {});

    const channelBreakdownArray = Object.values(channelBreakdownFromOrders);
    const totalRevenueFromOrders = channelBreakdownArray.reduce((sum: number, c: any) => sum + c.revenue, 0);

    // Combine and filter transactions based on all filters
    const allTransactions = [
        ...invoices.map((inv: any) => ({
            id: `inv-${inv?.id || Math.random()}`,
            orderId: inv?.invoice_number || 'N/A',
            source: inv?.source || 'Manual',
            type: 'Invoice',
            invoiceType: inv?.invoice_type === 'b2c' ? 'Sales Invoice' :
                inv?.invoice_type === 'b2b' ? 'B2B Invoice' : 'Quotation',
            customer: inv?.customer_name || inv?.company_name || '—',
            date: inv?.created_at || '',
            displayDate: inv?.created_at ? new Date(inv.created_at).toLocaleDateString('en-CA') : '—',
            amount: parseFloat(inv?.grand_total || 0),
            payment: inv?.payment_method || '—',
            status: inv?.payment_status || '—',
            customerType: inv?.customer_type || (inv?.company_name ? 'B2B' : 'B2C')
        })),
        ...orders.map((order: any) => ({
            id: `order-${order?.id || Math.random()}`,
            orderId: order?.order_number || 'N/A',
            source: order?.channel || '—',
            type: 'Order',
            invoiceType: 'Sales Order',
            customer: order?.customer_name || '—',
            date: order?.created_at || '',
            displayDate: order?.created_at ? new Date(order.created_at).toLocaleDateString('en-CA') : '—',
            amount: parseFloat(order?.total_amount || 0),
            payment: order?.payment_method || '—',
            status: order?.payment_status || '—',
            customerType: 'B2C'
        }))
    ];

    // Apply client-side filters for customer type
    const filteredTransactions = allTransactions.filter((transaction: any) => {
        // Customer Type filter
        if (filters.customerType && filters.customerType !== 'Customer Type') {
            if (filters.customerType === 'B2C' && transaction.customerType !== 'B2C') return false;
            if (filters.customerType === 'B2B' && transaction.customerType !== 'B2B') return false;
        }
        return true;
    }).sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const recentTransactions = paginatedTransactions.slice(0, 5);
    console.log('recent transactions:', recentTransactions)

    // Calculate stats with safe fallbacks
    // Calculate total revenue from by_type array since total_revenue is returning 0
    const totalSales = invoiceStatsData.by_type?.reduce(
        (sum: number, type: any) => sum + parseFloat(type.total || 0), 0
    ) || invoiceStatsData.total_revenue || 0;


    console.log('todat sales:', totalSales)


    const totalOrders = orders.length || invoiceStatsData.total_invoices || 0;

    const b2bCount = Array.isArray(invoiceStatsData.by_type)
        ? invoiceStatsData.by_type.reduce((sum: number, t: any) => {
            if (t?.invoice_type === 'b2b') return sum + (t.count || 0);
            return sum;
        }, 0)
        : 0;

    console.log('b2bCount', b2bCount)

    const unpaidInvoices = invoiceStatsData.unpaid_amount || 0;
    const unpaidCount = invoiceStatsData.unpaid_count || 0;

    const currentData = {
        label: selectedTimeframe === 'weekly' ? 'Weekly' : selectedTimeframe === 'monthly' ? 'Monthly' : 'Yearly',
        totalRevenue: processedChartData[selectedTimeframe]?.totalRevenue || 0,
        changePercentage: processedChartData[selectedTimeframe]?.changePercentage || 0,
        dataPoints: processedChartData[selectedTimeframe]?.dataPoints || []
    };

    const handleProductSelect = (productId: string) => {
        setSelectedProductIds(prev => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId);
            } else {
                return [...prev, productId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedProductIds.length === recentTransactions.length) {
            setSelectedProductIds([]);
        } else {
            setSelectedProductIds(recentTransactions.map(p => p.id));
        }
    };

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        setFilters(prev => {
            const newFilters = { ...prev, [key]: value };
            if (key === 'dateRange' && value !== 'Custom') {
                newFilters.customStartDate = '';
                newFilters.customEndDate = '';
            }
            return newFilters;
        });
        setShowCustomDatePicker(false);
    };

    const handleApplyCustomDate = () => {
        if (filters.customStartDate && filters.customEndDate) {
            handleFilterChange('dateRange', 'Custom');
            setShowCustomDatePicker(false);
        }
    };

    const handleClearFilters = () => {
        setFilters({
            dateRange: 'Today',
            customStartDate: '',
            customEndDate: '',
            invoiceType: '',
            orderSource: '',
            paymentStatus: '',
            customerType: ''
        });
        setSelectedProductIds([]);
    };

    // Format number safely
    const formatKWD = (value: any): string => {
        const num = parseFloat(value) || 0;
        return num.toFixed(3);
    };

    return (
       <DashboardLayout>
  <div className="space-y-4 md:space-y-6 overflow-x-hidden min-w-0">

    {/* Stats Grid */}
    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 xl:gap-6">

      <div className="bg-white rounded-lg p-4 md:p-5 xl:p-6 min-w-0">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-sm md:text-base font-medium text-gray-600">Total Sales</p>
            <p className="text-lg md:text-xl xl:text-2xl font-semibold text-gray-900 mt-6 md:mt-8 break-words">
              KWD {formatKWD(totalSales)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#F7F9FB] flex items-center justify-center shrink-0">
            <img src={icon_3} alt="" className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-center mt-2 gap-1">
          <img src={icon_6} alt="" className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
          <p className="text-xs md:text-sm font-semibold text-green-600 truncate">
            +{currentData.changePercentage}% vs last week
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 md:p-5 xl:p-6 min-w-0">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-sm md:text-base font-medium text-gray-600">Total Orders</p>
            <p className="text-lg md:text-xl xl:text-2xl font-semibold text-gray-900 mt-6 md:mt-8 break-words">
              {totalOrders}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#F7F9FB] flex items-center justify-center shrink-0">
            <img src={icon_4} alt="" className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-center mt-2 gap-1">
          <img src={icon_7} alt="" className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
          <p className="text-xs md:text-sm font-semibold text-red-600 truncate">+24% vs last week</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 md:p-5 xl:p-6 min-w-0">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-sm md:text-base font-medium text-gray-600">Total Invoices</p>
            <p className="text-lg md:text-xl xl:text-2xl font-semibold text-gray-900 mt-6 md:mt-8 break-words">
              {invoiceStatsData.total_invoices || 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#F7F9FB] flex items-center justify-center shrink-0">
            <img src={icon_1} alt="" className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-center mt-2 gap-1">
          <img src={icon_8} alt="" className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
          <p className="text-xs md:text-sm font-semibold text-blue-600 truncate">
            {invoiceStatsData.by_type?.map((t: any) => `${t.invoice_type?.toUpperCase()}: ${t.count}`).join(' · ') || 'No invoices'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 md:p-5 xl:p-6 min-w-0">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-sm md:text-base font-medium text-gray-600">Unpaid Invoices</p>
            <p className="text-lg md:text-xl xl:text-2xl font-semibold text-gray-900 mt-6 md:mt-8 break-words">
              KWD {formatKWD(unpaidInvoices)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#F7F9FB] flex items-center justify-center shrink-0">
            <img src={icon_2} alt="" className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-center mt-2 gap-1">
          <img src={icon_5} alt="" className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
          <p className="text-xs md:text-sm font-semibold text-gray-600 truncate">
            {unpaidCount} invoices pending
          </p>
        </div>
      </div>
    </div>

    {/* Revenue Analysis Section */}
    <div className="border border-[#00C0E8] rounded-xl min-w-0">

      {/* Header */}
      <div
        className="flex items-center justify-between p-4 md:p-5 xl:p-6 cursor-pointer bg-white rounded-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {!isExpanded && (
          <div className="min-w-0">
            <h2 className="text-sm md:text-base xl:text-lg font-semibold text-gray-900">Revenue Analysis</h2>
            <p className="text-xs md:text-sm text-gray-600 mt-0.5">Sales performance across all channels</p>
          </div>
        )}
        <div className={`shrink-0 ${isExpanded ? 'ml-auto' : ''}`}>
          <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 p-4 md:p-5 xl:p-6">

          {/* Bar Chart */}
          <div className="xl:col-span-2 bg-white rounded-xl p-4 md:p-5 xl:p-6 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
              <div className="min-w-0">
                <h2 className="text-sm md:text-base xl:text-lg font-semibold text-gray-900">Revenue Analysis</h2>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5">Sales performance across all channels</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {(['weekly', 'monthly'] as const).map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={(e) => { e.stopPropagation(); setSelectedTimeframe(timeframe); }}
                    className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-colors ${
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

            <div className="mb-4 md:mb-6">
              <p className="text-xl md:text-2xl xl:text-3xl font-bold text-gray-900 flex items-center flex-wrap gap-2">
                KWD {currentData.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                <span className="bg-gray-100 rounded-full px-2 py-1 text-xs md:text-sm font-medium text-green-600">
                  +{currentData.changePercentage}%
                </span>
              </p>
            </div>

            {/* Chart — untouched */}
            <div className="h-56 md:h-64 xl:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={currentData.dataPoints.length ? currentData.dataPoints : [
                    { day: 'Mon', revenue: 0 }, { day: 'Tue', revenue: 0 }, { day: 'Wed', revenue: 0 },
                    { day: 'Thu', revenue: 0 }, { day: 'Fri', revenue: 0 }, { day: 'Sat', revenue: 0 }, { day: 'Sun', revenue: 0 }
                  ]}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="#00C0E8" radius={[20, 20, 20, 20]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Channels — untouched internals, only wrapper responsive */}
          <div className="bg-white rounded-xl p-4 md:p-5 xl:p-6 min-w-0">
            <h3 className="text-sm md:text-base xl:text-lg font-semibold text-gray-900 mb-4 md:mb-6">
              Channels Contribution
            </h3>

            {/* Concentric circles — completely untouched */}
            <div className="relative w-48 h-48 md:w-56 md:h-56 xl:w-64 xl:h-64 mx-auto mb-4 md:mb-6">
              {channelBreakdownData?.data?.channel_breakdown && channelBreakdownData.data.channel_breakdown.length > 0 ? (
                channelBreakdownData.data.channel_breakdown.slice(0, 3).map((channel: any, index: number) => {
                  const totalRevenue = channelBreakdownData.data.summary?.total_revenue || 1;
                  const percentage = (parseFloat(channel.total_revenue) / totalRevenue) * 100;
                  const colors = ['#91C0EECC', '#1773CF99', '#91C0EE80'];
                  const sizes = [45, 35, 25];
                  const rotations = [-190, -100, -30];
                  return (
                    <div key={channel.channel} className="absolute inset-0" style={{ padding: index > 0 ? `${index * 8}px` : '0' }}>
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r={sizes[index]} fill="none" stroke={colors[index]} strokeWidth="6"
                          strokeLinecap="round" strokeDasharray={2 * Math.PI * sizes[index]}
                          strokeDashoffset={2 * Math.PI * sizes[index] * (1 - percentage / 100)}
                          transform={`rotate(${rotations[index]} 50 50)`} />
                      </svg>
                    </div>
                  );
                })
              ) : (
                <>
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
                </>
              )}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-2xl md:text-3xl font-bold text-gray-900">
                  {channelBreakdownData?.data?.channel_breakdown && channelBreakdownData.data.channel_breakdown.length > 0
                    ? Math.round(channelBreakdownData.data.channel_breakdown.reduce((acc: number, c: any) =>
                        acc + (parseFloat(c.total_revenue) / (channelBreakdownData.data.summary?.total_revenue || 1)) * 100, 0
                      ) / channelBreakdownData.data.channel_breakdown.length)
                    : 30}%
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {channelBreakdownData?.data?.channel_breakdown && channelBreakdownData.data.channel_breakdown.length > 0 ? (
                channelBreakdownData.data.channel_breakdown.map((channel: any) => {
                  const totalRev = channelBreakdownData.data.summary?.total_revenue || 1;
                  const percentage = ((parseFloat(channel.total_revenue) / totalRev) * 100).toFixed(1);
                  return (
                    <div key={channel.channel} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs md:text-sm font-medium text-gray-500 truncate">
                          {channel.channel}: <span>{percentage}%</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {channel.total_orders} orders · KWD {parseFloat(channel.total_revenue).toFixed(3)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs md:text-sm font-semibold text-gray-700">
                          KWD {parseFloat(channel.total_revenue).toFixed(3)}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-xs md:text-sm font-medium text-gray-500">POS: <span>45%</span></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs md:text-sm font-medium text-gray-500">Website: <span>30%</span></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs md:text-sm font-medium text-gray-500">Mobile App: <span>25%</span></div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Table Card */}
    <div className="rounded-lg overflow-hidden bg-white min-w-0">

      {/* Filters Row */}
      <div className="p-4 md:p-5 xl:p-6">
        <div className="flex flex-wrap gap-3 items-end">

          {/* Date Filter */}
          <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[140px]">
            <div
              onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
              className="w-full px-4 py-2.5 shadow rounded-lg font-semibold bg-white pr-10 cursor-pointer flex items-center justify-between text-xs md:text-sm border border-transparent hover:border-gray-200 transition-colors"
            >
              <span className="truncate">
                {filters.dateRange === 'Custom' && filters.customStartDate && filters.customEndDate
                  ? `${filters.customStartDate} - ${filters.customEndDate}`
                  : filters.dateRange || "Date Range"}
              </span>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 md:w-4 md:h-4" />
              </div>
            </div>

            {showCustomDatePicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-4 w-[280px] md:w-[320px]">
                <div className="space-y-3">
                  <div className="pt-1">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">Custom Range</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={filters.customStartDate}
                          onChange={(e) => setFilters(prev => ({ ...prev, customStartDate: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-xs md:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                        <input
                          type="date"
                          value={filters.customEndDate}
                          onChange={(e) => setFilters(prev => ({ ...prev, customEndDate: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-xs md:text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-3">
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, customStartDate: '', customEndDate: '' }))}
                        className="px-3 py-1 text-xs md:text-sm text-gray-600 hover:text-gray-800"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleApplyCustomDate}
                        disabled={!filters.customStartDate || !filters.customEndDate}
                        className="px-3 py-1 text-xs md:text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Invoice Type */}
          <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[130px]">
            <select
              value={filters.invoiceType}
              onChange={(e) => handleFilterChange('invoiceType', e.target.value)}
              className="w-full px-4 py-2.5 shadow rounded-lg font-semibold appearance-none bg-white pr-10 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Invoice Type</option>
              <option value="B2C">B2C</option>
              <option value="B2B">B2B</option>
              <option value="quotation">Quotation</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 md:w-4 md:h-4" />
            </div>
          </div>

          {/* Order Source */}
          <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[130px]">
            <select
              value={filters.orderSource}
              onChange={(e) => handleFilterChange('orderSource', e.target.value)}
              className="w-full px-4 py-2.5 shadow rounded-lg font-semibold appearance-none bg-white pr-10 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Order Source</option>
              <option value="POS">POS</option>
              <option value="Website">Website</option>
              <option value="Mobile App">Mobile App</option>
              <option value="Manual">Manual</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 md:w-4 md:h-4" />
            </div>
          </div>

          {/* Payment Status */}
          <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[130px]">
            <select
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              className="w-full px-4 py-2.5 shadow rounded-lg font-semibold appearance-none bg-white pr-10 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Payment Status</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 md:w-4 md:h-4" />
            </div>
          </div>

          {/* Customer Type */}
          <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[130px]">
            <select
              value={filters.customerType}
              onChange={(e) => handleFilterChange('customerType', e.target.value)}
              className="w-full px-4 py-2.5 shadow rounded-lg font-semibold appearance-none bg-white pr-10 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Customer Type</option>
              <option value="B2C">B2C</option>
              <option value="B2B">B2B</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <img src={dropdown_arrow_icon} alt="" className="w-3 h-3 md:w-4 md:h-4" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-xs md:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
            <button className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center cursor-pointer bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors shrink-0">
              <img src={filterIcon} alt="Filter" className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {(filters.dateRange !== 'Today' || filters.invoiceType || filters.orderSource || filters.paymentStatus || filters.customerType) && (
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs md:text-sm text-gray-500">Active Filters:</span>
            {filters.dateRange !== 'Today' && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs">
                Date: {filters.dateRange === 'Custom' ? `${filters.customStartDate} to ${filters.customEndDate}` : filters.dateRange}
              </span>
            )}
            {filters.invoiceType && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs">
                Type: {filters.invoiceType}
              </span>
            )}
            {filters.orderSource && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs">
                Source: {filters.orderSource}
              </span>
            )}
            {filters.paymentStatus && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs">
                Payment: {filters.paymentStatus}
              </span>
            )}
            {filters.customerType && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs">
                Customer: {filters.customerType}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table header */}
      <div className="px-4 md:px-5 xl:px-6 pb-2 flex items-center justify-between">
        <h2 className="text-sm md:text-base xl:text-lg font-bold text-gray-900">Recent Invoices & Orders</h2>
        <span className="text-xs md:text-sm text-gray-500">{recentTransactions.length} records found</span>
      </div>

      {/* Table */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
          <div className="xl:col-span-4 overflow-x-auto w-full">
        <table className="w-full divide-y divide-gray-200" style={{ minWidth: '780px' }}>
          <thead className="bg-gray-50">
            <tr>
              {showBulkTransfer && (
                <th className="px-4 md:px-5 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.length === recentTransactions.length && recentTransactions.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </th>
              )}
              {['Order/Invoice #', 'Source', 'Type', 'Customer', 'Date', 'Amount', 'Payment', 'Status'].map((h) => (
                <th
                  key={h}
                  className="px-4 md:px-5 py-3 text-left text-xs font-medium text-[#37638F] uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction: any) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  {showBulkTransfer && (
                    <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(transaction.id)}
                        onChange={() => handleProductSelect(transaction.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:underline cursor-pointer">
                    {transaction.orderId}
                  </td>
                  <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800">
                      {transaction.source}
                    </span>
                  </td>
                  <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.invoiceType}
                  </td>
                  <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.customer}
                  </td>
                  <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.displayDate}
                  </td>
                  <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    KWD {formatKWD(transaction.amount)}
                  </td>
                  <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.payment}
                  </td>
                  <td className="px-4 md:px-5 py-3 md:py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                      transaction.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'Unpaid' ? 'bg-red-100 text-red-800' :
                      transaction.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                      transaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={showBulkTransfer ? 9 : 8}
                  className="px-4 md:px-5 py-12 text-center text-sm text-gray-500"
                >
                  No transactions found for the selected filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 md:px-5 py-3 border-t border-gray-100">
        <span className="text-xs md:text-sm text-gray-500">
          Showing <span className="font-medium">1</span> to{' '}
          <span className="font-medium">{Math.min(recentTransactions.length, 10)}</span> of{' '}
          <span className="font-medium">{filteredTransactions.length}</span> transactions
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1.5 text-xs md:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-8 h-8 text-xs md:text-sm font-medium rounded-lg transition-colors ${
                currentPage === pageNum ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {pageNum}
            </button>
          ))}
          {totalPages > 3 && (
            <>
              <span className="px-1 text-xs text-gray-400">...</span>
              <button
                onClick={() => setCurrentPage(totalPages)}
                className="w-8 h-8 text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {totalPages}
              </button>
            </>
          )}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1.5 text-xs md:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>

    </div>
  </div>
</DashboardLayout>
    );
}