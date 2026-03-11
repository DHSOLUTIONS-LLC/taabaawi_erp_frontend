// src/features/help/components/HelpStats.tsx
import { useGetFaqStatisticsQuery } from '../../../services/helpApi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface HelpStatsProps {
  dateRange?: { start: string; end: string };
}

export default function HelpStats({  }: HelpStatsProps) {
  const { data: statsData, isLoading } = useGetFaqStatisticsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const stats = statsData?.data || {};

  // Overview Cards
  const overviewCards = [
    {
      label: 'Total Articles',
      value: stats.total_articles || 0,
      change: '+12%',
      icon: '📄',
      color: 'blue'
    },
    {
      label: 'Total FAQs',
      value: stats.total_faqs || 0,
      change: '+5%',
      icon: '❓',
      color: 'green'
    },
    {
      label: 'Total Views',
      value: stats.total_views?.toLocaleString() || '0',
      change: '+23%',
      icon: '👁️',
      color: 'purple'
    },
    {
      label: 'Helpfulness Rate',
      value: `${stats.avg_helpfulness || 0}%`,
      change: '+2%',
      icon: '👍',
      color: 'orange'
    }
  ];

  // Popular Articles Chart Data
  const popularArticlesData = {
    labels: stats.popular_articles?.map((a: any) => a.title) || [],
    datasets: [
      {
        label: 'Views',
        data: stats.popular_articles?.map((a: any) => a.view_count) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }
    ]
  };

  // Module Distribution Chart Data
  const moduleData = {
    labels: stats.by_module?.map((m: any) => m.module) || [],
    datasets: [
      {
        data: stats.by_module?.map((m: any) => m.count) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderWidth: 0
      }
    ]
  };

  // Feedback Trends
  const feedbackData = {
    labels: stats.feedback_trends?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Helpful',
        data: stats.feedback_trends?.helpful || [65, 72, 80, 78, 85, 90, 95],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      },
      {
        label: 'Not Helpful',
        data: stats.feedback_trends?.not_helpful || [12, 15, 10, 18, 14, 9, 11],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${card.color}-100 text-${card.color}-700`}>
                {card.change}
              </span>
            </div>
            <h3 className="text-sm text-gray-500 mb-1">{card.label}</h3>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Articles */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Articles</h3>
          <div className="h-64">
            <Bar
              data={popularArticlesData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                }
              }}
            />
          </div>
        </div>

        {/* Module Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content by Module</h3>
          <div className="h-64 flex items-center justify-center">
            <Pie
              data={moduleData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'right' }
                }
              }}
            />
          </div>
        </div>

        {/* Feedback Trends */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Trends</h3>
          <div className="h-80">
            <Line
              data={feedbackData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Additional Stats Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Engagement</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Avg. Time on Page</span>
                <span className="font-medium">4m 32s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Bounce Rate</span>
                <span className="font-medium">23%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Return Visitors</span>
                <span className="font-medium">45%</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Content Quality</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Avg. Helpfulness</span>
                <span className="font-medium">87%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Feedback</span>
                <span className="font-medium">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Comments</span>
                <span className="font-medium">89</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Search</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Avg. Searches/Day</span>
                <span className="font-medium">234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">No Result Rate</span>
                <span className="font-medium">12%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Top Search</span>
                <span className="font-medium">"invoice"</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}