import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BlogPostForm from '../../components/posts/BlogPostForm';
import { useGetBlogPostByIdQuery } from '../../../../services/blogApi';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';

const BlogEditPage: React.FC = () => {
  
              const { user } = useAppSelector((state: RootState) => state.auth);
        
          const isSuperAdmin = user?.role?.role_name === 'Super Admin';
          const basePath = isSuperAdmin ? '/admin' : '';

          
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const postId = parseInt(id || '0');

  const { data, isLoading } = useGetBlogPostByIdQuery(postId, {
    skip: !postId,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data?.data) {
    return (
      <DashboardLayout>
        <div className="text-center py-8 text-red-600">
          Blog post not found
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-full">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => navigate(`${basePath}/blog/${postId}`)}
            className="text-blue-600 hover:text-blue-800 text-sm sm:text-base inline-block mb-2"
          >
            ← Back to Post
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Blog Post</h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <BlogPostForm post={data.data} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BlogEditPage;