import React, { useState } from 'react';
import { useGetAIStatisticsQuery, useGetAILogsQuery } from '../../../services/aiContentApi';
import DashboardLayout from '../../../layouts/DashboardLayout';
import { format } from 'date-fns';
import {
  ChartBarIcon,
  DocumentTextIcon,
  TagIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const AIContentDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [contentType, setContentType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate date range
  const getDateParams = () => {
    const now = new Date();
    let start_date = '';
    let end_date = '';

    if (dateRange === 'today') {
      start_date = format(now, 'yyyy-MM-dd');
      end_date = format(now, 'yyyy-MM-dd');
    } else if (dateRange === 'week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      start_date = format(weekAgo, 'yyyy-MM-dd');
      end_date = format(new Date(), 'yyyy-MM-dd');
    } else if (dateRange === 'month') {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      start_date = format(monthAgo, 'yyyy-MM-dd');
      end_date = format(new Date(), 'yyyy-MM-dd');
    }

    return { start_date, end_date };
  };

  const { start_date, end_date } = getDateParams();

  // Fetch statistics
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useGetAIStatisticsQuery();

  // Fetch logs with filters
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useGetAILogsQuery({
    content_type: contentType !== 'all' ? contentType : undefined,
    start_date,
    end_date,
    page: currentPage,
    per_page: 10,
  });

  const stats = statsData?.data;
  console.log('ai stats:', stats)
  const logs = logsData?.data?.data || [];
  const pagination = logsData?.data;

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'product_description':
        return <DocumentTextIcon className="w-5 h-5 text-blue-500" />;
      case 'seo_title':
        return <TagIcon className="w-5 h-5 text-green-500" />;
      case 'meta_description':
        return <DocumentTextIcon className="w-5 h-5 text-purple-500" />;
      case 'keywords':
        return <TagIcon className="w-5 h-5 text-orange-500" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'success') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Success
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircleIcon className="w-3 h-3 mr-1" />
        Failed
      </span>
    );
  };

  const handleRefresh = () => {
    refetchStats();
    refetchLogs();
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AI Content Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Monitor AI usage, costs, and generation logs</p>
          </div>
          <button
            onClick={handleRefresh}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-7 sm:h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <StatCard
              title="Total Generations"
              value={stats?.successful_requests || 0}
              icon={<DocumentTextIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
              color="bg-blue-500"
            />
            <StatCard
              title="Total Tokens Used"
              value={stats?.total_tokens?.toLocaleString() || 0}
              icon={<ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
              color="bg-green-500"
            />
            <StatCard
              title="Avg Response Time"
              value={`${Math.round(stats?.average_response_time_ms || 0)}ms`}
              icon={<ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
              color="bg-purple-500"
            />
            <StatCard
              title="Success Rate"
              value={`${Math.round((stats?.success_rate || 0) * 100)}%`}
              icon={<CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
              color="bg-orange-500"
            />
          </div>
        )}

        {/* Usage by Type Chart */}
        {stats?.usage_by_type && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Usage by Content Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {Object.entries(stats.usage_by_type).map(([type, count]) => (
                <div key={type} className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-700 capitalize">
                      {type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-blue-600">{count as number}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 rounded-full h-2 transition-all duration-500"
                      style={{
                        width: `${((count as number) / (stats.total_generations || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-xs text-gray-400">
                      {((count as number) / (stats.total_generations || 1) * 100).toFixed(1)}% of total
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage by User */}
        {stats?.usage_by_user && stats.usage_by_user.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Users</h2>
            <div className="space-y-3">
              {stats.usage_by_user.slice(0, 5).map((user) => (
                <div key={user.user_id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{user.user_name}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">{user.count} generations</span>
                    <span className="text-sm text-gray-600">{user.total_tokens} tokens</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content Type
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Types</option>
                <option value="product_description">Product Descriptions</option>
                <option value="seo_title">SEO Titles</option>
                <option value="meta_description">Meta Descriptions</option>
                <option value="keywords">Keywords</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Generation Logs</h2>
          </div>

          {logsLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
              <div className="xl:col-span-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prompt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Generated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tokens
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                          No logs found
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getContentTypeIcon(log.content_type)}
                              <span className="ml-2 text-sm text-gray-900 capitalize">
                                {log.content_type.replace('_', ' ')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {log.prompt}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {log.generated_content}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{log.user?.name || 'Unknown'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{log.tokens_used}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{log.response_time_ms}ms</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(log.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          )}

          {/* Pagination */}
          {pagination && pagination.last_page > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {pagination.current_page} of {pagination.last_page}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIContentDashboard;