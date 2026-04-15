import React from 'react';
import { useGetBlogStatisticsQuery } from '../../../../services/blogApi';

const BlogPostStats: React.FC = () => {
  const { data, isLoading } = useGetBlogStatisticsQuery();

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
    );
  }

  const stats = data?.data;

  if (!stats) return null;

  const statCards = [
    { label: 'Total Posts', value: stats.total_posts, color: 'bg-blue-500' },
    { label: 'Published', value: stats.published_posts, color: 'bg-green-500' },
    { label: 'Drafts', value: stats.draft_posts, color: 'bg-gray-500' },
    { label: 'Scheduled', value: stats.scheduled_posts, color: 'bg-yellow-500' },
    { label: 'Categories', value: stats.total_categories, color: 'bg-purple-500' },
    { label: 'Total Views', value: stats.total_views, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg  p-4">
            <div className={`w-2 h-2 ${stat.color} rounded-full mb-2`}></div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      
    </div>
  );
};

export default BlogPostStats;   