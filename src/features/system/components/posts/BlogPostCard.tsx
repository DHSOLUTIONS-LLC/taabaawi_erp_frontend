import React from 'react';
import { format } from 'date-fns';
import type { BlogPost } from '../../../../types/blog';

interface Props {
  post: BlogPost;
  onClick?: () => void;
}

const BlogPostCard: React.FC<Props> = ({ post, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Not set';
    return format(new Date(date), 'MMM dd, yyyy');
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
    >
      {/* Featured Image */}
      {post.featured_image ? (
        <img
          src={post.featured_image}
          alt={post.image_alt_text || post.title}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400">No image</span>
        </div>
      )}

      <div className="p-4">
        {/* Status & Date */}
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(post.status)}`}>
            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(post.published_at || post.created_at)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {post.excerpt}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
          <div className="flex items-center space-x-2">
            {post.author?.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-5 h-5 rounded-full"
              />
            ) : (
              <div className="w-5 h-5 bg-gray-300 rounded-full" />
            )}
            <span>{post.author?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center space-x-3">
            <span>👁️ {post.view_count}</span>
            {post.category && (
              <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">
                {post.category.name}
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
              >
                #{tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                +{post.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPostCard;