import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetBlogPostsQuery } from '../../../../services/blogApi';
import BlogPostCard from './BlogPostCard';
import type { BlogPostFilters, BlogPost } from '../../../../types/blog';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';

interface Props {
  filters?: BlogPostFilters;
  onSelect?: (post: BlogPost) => void;
}

const BlogPostsList: React.FC<Props> = ({ filters, onSelect }) => {
    
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetBlogPostsQuery(filters);
const posts = data?.data?.data ?? [];

      const { user } = useAppSelector((state: RootState) => state.auth);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';


  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Failed to load blog posts
      </div>
    );
  }

  

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No blog posts found</p>
        <button
          onClick={() => navigate(`${basePath}/blog/create`)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create First Post
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post: any) => (
        <BlogPostCard
          key={post.id}
          post={post}
          onClick={() => onSelect ? onSelect(post) : navigate(`${basePath}/blog/${post.id}`)}
        />
      ))}
    </div>
  );
};

export default BlogPostsList;