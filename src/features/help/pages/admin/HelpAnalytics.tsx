// src/features/help/pages/admin/HelpAnalytics.tsx
import { useState } from 'react';
import HelpLayout from '../../components/HelpLayout';
import HelpStats from '../../components/HelpStats';
import {
  useGetFaqStatisticsQuery,
  useGetCategoriesQuery
} from '../../../../services/helpApi';

import download_icon from '../../../../assets/icons/download.svg';
import calendar_icon from '../../../../assets/icons/calendar.svg';

export default function HelpAnalytics() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const { data: statsData, isLoading: _statsLoading } = useGetFaqStatisticsQuery();
  const { data: categoriesData } = useGetCategoriesQuery({});

  const stats = statsData?.data || {};
  const categories = Array.isArray(categoriesData?.data) ? categoriesData.data : [];


  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    // Implement export logic
    console.log(`Exporting as ${format}`);
  };

  return (
    <HelpLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Help Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Track performance and user engagement</p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Date Range */}
            <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-1">
              <div className="flex items-center px-2">
                <img src={calendar_icon} alt="" className="w-4 h-4 mr-2" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="text-sm border-none focus:ring-0 w-28"
                />
              </div>
              <span className="text-gray-400">to</span>
              <div className="flex items-center px-2">
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="text-sm border-none focus:ring-0 w-28"
                />
              </div>
            </div>

            {/* Export Button */}
            <div className="relative group">
              <button className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                <img src={download_icon} alt="" className="w-4 h-4 mr-2" />
                Export
              </button>
              <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg hidden group-hover:block">
                <button
                  onClick={() => handleExport('csv')}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  PDF
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Component */}
        <HelpStats dateRange={dateRange} />

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Search Queries */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Search Queries</h3>
            <div className="space-y-3">
              {stats.top_searches?.map((search: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                    <span className="text-sm text-gray-900">{search.query}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">{search.count} searches</span>
                    <div className="w-20 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full" 
                        style={{ width: `${(search.count / stats.top_searches?.[0]?.count) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Performance */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
            <div className="space-y-3">
              {categories.slice(0, 8).map(category => (
                <div key={category.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">{category.category_name}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">{category.article_count} articles</span>
                    <span className="text-sm text-green-600">
                      {Math.round((category.article_count / (stats.total_articles || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback Summary */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {stats.total_helpful || 0}
                </div>
                <div className="text-sm text-gray-600">Helpful</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600 mb-1">
                  {stats.total_not_helpful || 0}
                </div>
                <div className="text-sm text-gray-600">Not Helpful</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Helpfulness Rate</span>
                <span className="text-sm font-medium">{stats.avg_helpfulness || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${stats.avg_helpfulness || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Recent Feedback Comments */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Feedback</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stats.recent_feedback?.map((feedback: any, index: number) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      feedback.feedback_type === 'helpful' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {feedback.feedback_type === 'helpful' ? '👍 Helpful' : '👎 Not Helpful'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(feedback.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {feedback.comment && (
                    <p className="text-sm text-gray-700 mt-1">"{feedback.comment}"</p>
                  )}
                  {feedback.article_title && (
                    <p className="text-xs text-gray-500 mt-1">on: {feedback.article_title}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div>
                <h4 className="font-medium text-gray-900">CSV Export</h4>
                <p className="text-xs text-gray-500 mt-1">Raw data for analysis</p>
              </div>
              <img src={download_icon} alt="" className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div>
                <h4 className="font-medium text-gray-900">PDF Report</h4>
                <p className="text-xs text-gray-500 mt-1">Formatted with charts</p>
              </div>
              <img src={download_icon} alt="" className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleExport('excel')}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div>
                <h4 className="font-medium text-gray-900">Excel Report</h4>
                <p className="text-xs text-gray-500 mt-1">With pivot tables</p>
              </div>
              <img src={download_icon} alt="" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </HelpLayout>
  );
}