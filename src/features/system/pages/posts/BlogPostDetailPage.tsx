import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useGetBlogPostByIdQuery, useDeleteBlogPostMutation } from '../../../../services/blogApi';
import toast from 'react-hot-toast';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';


const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://erp-backend.ttexpresskw.com';


const BlogPostDetailPage: React.FC = () => {



  const { user } = useAppSelector((state: RootState) => state.auth);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const postId = parseInt(id || '0');

  const { data, isLoading } = useGetBlogPostByIdQuery(postId);
  const [deletePost] = useDeleteBlogPostMutation();

  const post = data?.data;
  console.log('posts:', post)

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await deletePost(postId).unwrap();
      toast.success('Post deleted successfully');
      navigate('/blog');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!post) {
    return (
      <DashboardLayout>
        <div className="text-center py-8 text-red-600">
          Blog post not found
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = () => {
    const colors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      archived: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[post.status]}`}>
        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
      </span>
    );
  };

return (
    <>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-full mx-auto">
            
            {/* Navigation */}
            <div className="mb-2">
              <button
                onClick={() => navigate(`${basePath}/blog`)}
                className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm sm:text-base group"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Blog
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6 justify-end">
              <button
                onClick={() => navigate(`${basePath}/blog/${postId}/edit`)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-400 transition-all text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>

            {/* Post Content */}
            <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Featured Image */}
              {post.featured_image && (
                <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[500px]">
                  <img
                    src={post.featured_image.startsWith('http')
                      ? post.featured_image
                      : `${API_BASE_URL}/storage/${post.featured_image}`}
                    alt={post.image_alt_text || post.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format';
                    }}
                  />
                </div>
              )}

              <div className="p-6 sm:p-8 md:p-10">
                {/* Header Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {getStatusBadge()}
                  {post.is_featured && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Featured
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {post.published_at
                      ? format(new Date(post.published_at), 'MMMM dd, yyyy')
                      : format(new Date(post.created_at), 'MMMM dd, yyyy')}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {post.title}
                </h1>

                {/* Author Info */}
                <div className="flex items-center justify-between flex-wrap gap-4 pb-6 mb-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {post.author?.avatar ? (
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {post.author?.name?.charAt(0) || 'A'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {post.author?.name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {post.view_count || 0} views • {post.reading_time || 1} min read
                      </p>
                    </div>
                  </div>

                  {post.category && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                      </svg>
                      {post.category.name}
                    </span>
                  )}
                </div>

                {/* Excerpt */}
                {post.excerpt && (
                  <div className="bg-gradient-to-r from-gray-50 to-white p-4 sm:p-5 rounded-xl mb-6 border-blue-400">
                    <p className="text-gray-600 text-sm sm:text-base italic leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                )}

                {/* Content */}
                <div
                  className="prose prose-gray max-w-none prose-headings:font-semibold prose-a:text-blue-600 prose-img:rounded-xl prose-img:shadow-md"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                          <span className="text-gray-400">#</span>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default BlogPostDetailPage;