import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import BlogPostForm from '../../components/posts/BlogPostForm'
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
const BlogCreatePage: React.FC = () => {
  const navigate = useNavigate();


  
        const { user } = useAppSelector((state: RootState) => state.auth);
  
    const isSuperAdmin = user?.role?.role_name === 'Super Admin';
    const basePath = isSuperAdmin ? '/admin' : '';

    
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`${basePath}/blog`)}
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Blog
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create New Blog Post</h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <BlogPostForm />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BlogCreatePage;