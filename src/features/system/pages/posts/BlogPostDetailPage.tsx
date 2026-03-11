import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useGetBlogPostByIdQuery, useDeleteBlogPostMutation } from '../../../../services/blogApi';
import toast from 'react-hot-toast';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';

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
      {/* <SEO
        seoData={{
          meta_title: post.meta_title || post.title,
          meta_description: post.meta_description || post.excerpt,
          meta_keywords: post.meta_keywords,
          canonical_url: post.canonical_url,
          og_image: post.featured_image,
        }}
      /> */}
      
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Navigation */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate(`${basePath}/blog`)}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Blog
            </button>
            <div className="space-x-3">
              <button
                onClick={() => navigate(`${basePath}/blog/${postId}/edit`)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Post Content */}
          <article className="bg-white rounded-lg shadow overflow-hidden">
            {/* Featured Image */}
            {post.featured_image && (
              <img
                src={post.featured_image}
                alt={post.image_alt_text || post.title}
                className="w-full h-96 object-cover"
              />
            )}

            <div className="p-8">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-3">
                  {getStatusBadge()}
                  {post.is_featured && (
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      Featured
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {post.published_at 
                      ? format(new Date(post.published_at), 'MMMM dd, yyyy')
                      : format(new Date(post.created_at), 'MMMM dd, yyyy')}
                  </span>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

                {/* Author & Meta */}
                <div className="flex items-center justify-between border-b pb-4 mb-6">
                  <div className="flex items-center space-x-3">
                    {post.author?.avatar ? (
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{post.author?.name}</p>
                      <p className="text-sm text-gray-500">
                        {post.view_count} views • {post.reading_time} min read
                      </p>
                    </div>
                  </div>

                  {post.category && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                      {post.category.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Excerpt */}
              {post.excerpt && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6 italic text-gray-700">
                  {post.excerpt}
                </div>
              )}

              {/* Content */}
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Tags:</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>
      </DashboardLayout>
    </>
  );
};

export default BlogPostDetailPage;