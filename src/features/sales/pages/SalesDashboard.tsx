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
                    Revenue: KWD {payload[0]?.value?.toLocaleString?.(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3}) || '0.000'}
                </p>
                {payload[1] && (
                    <p className="text-sm text-gray-500">
                        Previous: KWD {payload[1]?.value?.toLocaleString?.(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3}) || '0.000'}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

export default function SalesDashboardPage() {
    const [selectedTimeframe, setSelectedTimeframe] = useState<'weekly' | 'monthly' >('weekly');
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


    // Calculate stats with safe fallbacks
    const totalSalesToday = invoiceStatsData.total_revenue || 0;
    const totalOrdersToday = orders.length;
    const b2bCount = Array.isArray(invoiceStatsData.by_type) 
        ? invoiceStatsData.by_type.find((t: any) => t?.invoice_type === 'b2b')?.count || 0 
        : 0;
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
            <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg p-6">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-lg font-medium text-gray-600">Total Sales</p>
                                <p className="text-[24px] font-semibold text-gray-900 mt-10">KWD {formatKWD(totalSalesToday)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-[#F7F9FB] flex items-center justify-center">
                                <img src={icon_3} alt="" />
                            </div>
                        </div>
                        <div className='flex flex-row items-center mt-2'>
                            <img src={icon_6} alt="" className='w-6 h-6 mr-2' />
                            <p className="text-md font-semibold text-green-600 ">+{currentData.changePercentage}% vs last week</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 ">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-lg font-medium text-gray-600">Total Orders</p>
                                <p className="text-[24px] font-semibold text-gray-900 mt-10">{totalOrdersToday}</p>
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

                    <div className="bg-white rounded-lg p-6">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-lg font-medium text-gray-600">B2B</p>
                                <p className="text-[24px] font-semibold text-gray-900 mt-10">{b2bCount}</p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-[#F7F9FB] flex items-center justify-center">
                                <img src={icon_1} alt="" />
                            </div>
                        </div>
                        <div className='flex flex-row items-center mt-2'>
                            <img src={icon_8} alt="" className='w-6 h-6 mr-2' />
                            <p className="text-md font-semibold text-red-600">+ {b2bCount} New Items</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-6">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-lg font-medium text-gray-600">Unpaid Invoices</p>
                                <p className="text-[24px] font-semibold text-gray-900 mt-10">KWD {formatKWD(unpaidInvoices)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-[#F7F9FB] flex items-center justify-center">
                                <img src={icon_2} alt="" />
                            </div>
                        </div>
                        <div className='flex flex-row items-center mt-2'>
                            <img src={icon_5} alt="" className='w-6 h-6 mr-2' />
                            <p className="text-md font-semibold text-gray-600">{unpaidCount} invoices pending</p>
                        </div>
                    </div>
                </div>

                {/* Revenue Analysis Section */}
                <div className="border border-[#00C0E8] rounded-xl">
                    {/* Header - Always Visible - Clickable */}
                    <div
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-6 cursor-pointer bg-white rounded-xl"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {!isExpanded && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Revenue Analysis</h2>
                                <p className="text-sm text-gray-600 mt-1">Sales performance across all channels</p>
                            </div>
                        )}
                        {/* Dropdown Arrow */}
                        <div className={`mt-3 sm:mt-0 ${isExpanded ? 'ml-auto' : ''}`}>
                            <img src={dropdown_arrow_icon} alt="" />
                        </div>
                    </div>

                    {/* Expandable Content */}
                    {isExpanded && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                            {/* Left Column - Revenue Analysis Chart */}
                            <div className="lg:col-span-2 bg-white rounded-xl p-6">
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Revenue Analysis</h2>
                                        <p className="text-sm text-gray-600 mt-1">Sales performance across all channels</p>
                                    </div>
                                    {/* Timeframe Buttons */}
                                    <div className="flex space-x-2 mt-3 sm:mt-0">
                                        {(['weekly', 'monthly'] as const).map((timeframe) => (
                                            <button
                                                key={timeframe}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedTimeframe(timeframe);
                                                }}
                                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${selectedTimeframe === timeframe
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {timeframe === 'weekly' ? 'Weekly' : timeframe === 'monthly' ? 'Monthly' : 'Yearly'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Revenue Total */}
                                <div className="mb-6">
                                    <p className="text-3xl font-bold items-center text-gray-900">
                                        KWD {currentData.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})}   
                                        <span className="bg-gray-100 rounded-full p-2 text-sm font-medium text-green-600 ml-2">
                                            +{currentData.changePercentage}%
                                        </span>
                                    </p>
                                </div>

                                {/* Chart */}
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={currentData.dataPoints.length ? currentData.dataPoints : [
                                                { day: 'Mon', revenue: 0 }, { day: 'Tue', revenue: 0 }, { day: 'Wed', revenue: 0 },
                                                { day: 'Thu', revenue: 0 }, { day: 'Fri', revenue: 0 }, { day: 'Sat', revenue: 0 }, { day: 'Sun', revenue: 0 }
                                            ]}
                                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                            <XAxis
                                                dataKey="day"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#6B7280', fontSize: 12 }}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar
                                                dataKey="revenue"
                                                fill="#00C0E8"
                                                radius={[20, 20, 20, 20]}
                                                barSize={30}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Right Column - Revenue Table */}
                            <div className="bg-white rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">Channels Contribution</h3>

                                {/* Three Concentric Circles - Dynamic Data from Orders */}
                                <div className="relative w-64 h-64 mx-auto mb-6">
                                    {channelBreakdownArray.length > 0 ? (
                                        channelBreakdownArray.slice(0, 3).map((channel: any, index: number) => {
                                            const percentage = totalRevenueFromOrders > 0 ? (channel.revenue / totalRevenueFromOrders) * 100 : 0;
                                            const colors = ['#91C0EECC', '#1773CF99', '#91C0EE80'];
                                            const sizes = [45, 35, 25];
                                            const rotations = [-190, -100, -30];
                                            
                                            return (
                                                <div key={channel.channel} className="absolute inset-0" style={{ padding: index > 0 ? `${index * 8}px` : '0' }}>
                                                    <svg className="w-full h-full" viewBox="0 0 100 100">
                                                        <circle
                                                            cx="50"
                                                            cy="50"
                                                            r={sizes[index]}
                                                            fill="none"
                                                            stroke={colors[index]}
                                                            strokeWidth="6"
                                                            strokeLinecap="round"
                                                            strokeDasharray={2 * Math.PI * sizes[index]}
                                                            strokeDashoffset={2 * Math.PI * sizes[index] * (1 - percentage / 100)}
                                                            transform={`rotate(${rotations[index]} 50 50)`}
                                                        />
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

                                    {/* Center Average */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                        <div className="text-3xl font-bold text-gray-900">
                                            {channelBreakdownArray.length > 0 
                                                ? Math.round(channelBreakdownArray.reduce((acc: number, c: any) => acc + (c.revenue / totalRevenueFromOrders) * 100, 0) / channelBreakdownArray.length) 
                                                : 30}%
                                        </div>
                                    </div>
                                </div>

                                {/* Sales Amount Details */}
                                <div className="space-y-3">
                                    {channelBreakdownArray.length > 0 ? (
                                        channelBreakdownArray.map((channel: any) => {
                                            const percentage = totalRevenueFromOrders > 0 ? ((channel.revenue / totalRevenueFromOrders) * 100).toFixed(1) : '0.0';
                                            return (
                                                <div key={channel.channel} className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-md font-medium text-gray-500">
                                                            {channel.channel}: <span className="text-md text-gray-500">{percentage}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-md font-medium text-gray-500">POS: <span className="text-md text-gray-500">45%</span></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-md font-medium text-gray-500">Website: <span className="text-md text-gray-500">30%</span></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-md font-medium text-gray-500">Mobile App: <span className="text-md text-gray-500">25%</span></div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl overflow-hidden">
                    {/* Filters Row */}
                    <div className="p-6">
                        <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
                            {/* Date Filter */}
                            <div className="flex-1 min-w-50 relative">
                                {/* Trigger Field */}
                                <div
                                    onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
                                    className="w-full px-4 py-2.5 shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold bg-white pr-10 cursor-pointer flex items-center justify-between"
                                >
                                    <span>
                                        {filters.dateRange === 'Custom' && filters.customStartDate && filters.customEndDate
                                            ? `${filters.customStartDate} - ${filters.customEndDate}`
                                            : filters.dateRange || "Date Range"}
                                    </span>

                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <img src={dropdown_arrow_icon} alt="" />
                                    </div>
                                </div>

                                {/* Custom Date Picker Dropdown */}
                                {showCustomDatePicker && (
                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-4 w-[320px]">
                                        <div className="space-y-3">
                                            <div className="pt-3">
                                                <h4 className="font-medium text-gray-900 mb-2">Custom Range</h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                            Start Date
                                                        </label>
                                                        <input
                                                            type="date"
                                                            value={filters.customStartDate}
                                                            onChange={(e) => setFilters(prev => ({ ...prev, customStartDate: e.target.value }))}
                                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                            End Date
                                                        </label>
                                                        <input
                                                            type="date"
                                                            value={filters.customEndDate}
                                                            onChange={(e) => setFilters(prev => ({ ...prev, customEndDate: e.target.value }))}
                                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Buttons */}
                                                <div className="flex justify-end space-x-2 pt-3">
                                                    <button
                                                        onClick={() => {
                                                            setFilters(prev => ({ ...prev, customStartDate: '', customEndDate: '' }));
                                                        }}
                                                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                                    >
                                                        Clear
                                                    </button>

                                                    <button
                                                        onClick={handleApplyCustomDate}
                                                        disabled={!filters.customStartDate || !filters.customEndDate}
                                                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Apply
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Invoice Type Filter */}
                            <div className="flex-1 min-w-50 relative">
                                <select 
                                    value={filters.invoiceType}
                                    onChange={(e) => handleFilterChange('invoiceType', e.target.value)}
                                    className="w-full px-4 py-2.5 shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold appearance-none bg-white pr-10"
                                >
                                    <option value="">Invoice Type</option>
                                    <option value="B2C">B2C</option>
                                    <option value="B2B">B2B</option>
                                    <option value="quotation">Quotation</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <img src={dropdown_arrow_icon} alt="" />
                                </div>
                            </div>

                            {/* Order Source Filter */}
                            <div className="flex-1 min-w-50 relative">
                                <select 
                                    value={filters.orderSource}
                                    onChange={(e) => handleFilterChange('orderSource', e.target.value)}
                                    className="w-full px-4 py-2.5 shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold appearance-none bg-white pr-10"
                                >
                                    <option value="">Order Source</option>
                                    <option value="POS">POS</option>
                                    <option value="Website">Website</option>
                                    <option value="Mobile App">Mobile App</option>
                                    <option value="Manual">Manual</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <img src={dropdown_arrow_icon} alt="" />
                                </div>
                            </div>

                            {/* Payment Status Filter */}
                            <div className="flex-1 min-w-50 relative">
                                <select 
                                    value={filters.paymentStatus}
                                    onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                                    className="w-full px-4 py-2.5 shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold appearance-none bg-white pr-10"
                                >
                                    <option value="">Payment Status</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Unpaid">Unpaid</option>
                                    <option value="Partially Paid">Partially Paid</option>
                                    <option value="Pending">Pending</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <img src={dropdown_arrow_icon} alt="" />
                                </div>
                            </div>

                            {/* Customer Type Filter */}
                            <div className="flex-1 min-w-50 relative">
                                <select 
                                    value={filters.customerType}
                                    onChange={(e) => handleFilterChange('customerType', e.target.value)}
                                    className="w-full px-4 py-2.5 shadow rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold appearance-none bg-white pr-10"
                                >
                                    <option value="">Customer Type</option>
                                    <option value="B2C">B2C</option>
                                    <option value="B2B">B2B</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <img src={dropdown_arrow_icon} alt="" />
                                </div>
                            </div>

                            {/* Filter Actions */}
                            <div className="shrink-0 flex gap-2">
                                <button 
                                    onClick={handleClearFilters}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    Clear
                                </button>
                                <button className="w-14 h-14 flex items-center justify-center cursor-pointer bg-blue-50 rounded-lg hover:bg-blue-100">
                                    <img src={filterIcon} alt="Filter" className="w-7 h-7" />
                                </button>
                            </div>
                        </div>

                        {/* Active Filters Display */}
                        {(filters.dateRange !== 'Today' || filters.invoiceType || filters.orderSource || filters.paymentStatus || filters.customerType) && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="text-sm text-gray-500">Active Filters:</span>
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

                    {/* Table Container */}
                    <div className="relative mx-6 shadow rounded-xl">
                        <div className="px-6 py-3 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Recent Invoices & Orders</h2>
                            <span className="text-sm text-gray-500">
                                {recentTransactions.length} records found
                            </span>
                        </div>
                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr className="bg-gray-50">
                                        {showBulkTransfer && (
                                            <th className="px-6 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProductIds.length === recentTransactions.length && recentTransactions.length > 0}
                                                    onChange={handleSelectAll}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                />
                                            </th>
                                        )}
                                        <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                            Order/Invoice #
                                        </th>
                                        <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                            Source
                                        </th>
                                        <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                            Payment
                                        </th>
                                        <th className="px-6 py-3 text-left text-md font-medium text-[#37638F] uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {recentTransactions.length > 0 ? (
                                        recentTransactions.map((transaction: any) => (
                                            <tr key={transaction.id} className="hover:bg-gray-50">
                                                {showBulkTransfer && (
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedProductIds.includes(transaction.id)}
                                                            onChange={() => handleProductSelect(transaction.id)}
                                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                        />
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-[14px] font-medium text-blue-600 hover:underline cursor-pointer">
                                                        {transaction.orderId}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex px-3 py-1 text-xs font-medium rounded-lg bg-blue-100 text-blue-800">
                                                        {transaction.source}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-[14px] text-gray-900">{transaction.invoiceType}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-[14px] font-medium text-gray-900">{transaction.customer}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-[14px] text-gray-900">{transaction.displayDate}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-[14px] font-semibold text-gray-900">KWD {formatKWD(transaction.amount)}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-[14px] text-gray-900">{transaction.payment}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-3 py-2 text-xs font-medium rounded-lg ${
                                                        transaction.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                                        transaction.status === 'Unpaid' ? 'bg-red-100 text-red-800' :
                                                        transaction.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                                                        transaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {transaction.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={showBulkTransfer ? 9 : 8} className="px-6 py-12 text-center text-gray-500">
                                                No transactions found for the selected filters
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                   {/* Pagination */}
<div className="px-6 py-4">
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-500">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{Math.min(recentTransactions.length, 10)}</span> of <span className="font-medium">{filteredTransactions.length}</span> transactions
        </div>
        <div className="flex items-center space-x-2">
            <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Previous
            </button>
            
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                    <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === pageNum 
                                ? 'bg-blue-600 text-white' 
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        {pageNum}
                    </button>
                );
            })}
            
            {totalPages > 3 && (
                <>
                    <span className="px-2 text-gray-400">...</span>
                    <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                        {totalPages}
                    </button>
                </>
            )}
            
            <button 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Next
            </button>
        </div>
    </div>
</div>
                </div>
            </div>
        </DashboardLayout>
    );
}