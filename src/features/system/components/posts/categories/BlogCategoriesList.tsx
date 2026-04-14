import React, { useState } from 'react';
import { useGetBlogCategoriesQuery, useDeleteBlogCategoryMutation } from '../../../../../services/blogApi';
import toast from 'react-hot-toast';
import type { BlogCategory } from '../../../../../types/blog';

interface Props {
  onSelect?: (category: BlogCategory) => void;
  onEdit?: (category: BlogCategory) => void;
}

const BlogCategoriesList: React.FC<Props> = ({ onSelect, onEdit }) => {
  const { data, isLoading, refetch } = useGetBlogCategoriesQuery();
  const [deleteCategory] = useDeleteBlogCategoryMutation();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const categories = data?.data || [];

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    setDeletingId(id);
    try {
      await deleteCategory(id).unwrap();
      toast.success('Category deleted successfully');
      refetch();
    } catch {
      toast.error('Failed to delete category');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderCategoryRow = (category: BlogCategory, level = 0) => (
    <React.Fragment key={category.id}>
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div style={{ paddingLeft: `${level * 20}px` }} className="flex items-center">
            {level > 0 && (
              <span className="mr-2 text-gray-400">↳</span>
            )}
            <span className="font-medium text-gray-900">{category.name}</span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="text-sm text-gray-600">{category.slug}</span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {category.is_active ? (
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Active
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
              Inactive
            </span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
          {category.posts_count || 0}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">

          <button
            onClick={() => onEdit?.(category)}
            className="text-indigo-600 hover:text-indigo-900 mr-3"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(category.id)}
            disabled={deletingId === category.id}
            className="text-red-600 hover:text-red-900 disabled:opacity-50"
          >
            {deletingId === category.id ? '...' : 'Delete'}
          </button>
        </td>
      </tr>
      {category.children?.map(child => renderCategoryRow(child, level + 1))}
    </React.Fragment>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
      <div className="xl:col-span-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Posts
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No categories found
                </td>
              </tr>
            ) : (
              categories
                .filter(c => !c.parent_id) // Only top-level categories
                .map(category => renderCategoryRow(category))
            )}
          </tbody>
        </table>
      </div>
    </div>

  );
};

export default BlogCategoriesList;