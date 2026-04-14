import React, { useState } from 'react';
import type { BlogCategory } from '../../../../types/blog';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import BlogCategoriesList from '../../components/posts/categories/BlogCategoriesList';
import BlogCategoryForm from '../../components/posts/categories/BlogCategoryForm';

const BlogCategoriesPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | null>(null);

  const handleAddNew = () => {
    setSelectedCategory(null);
    setShowForm(true);
  };

  const handleEdit = (category: BlogCategory) => {
    setSelectedCategory(category);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setSelectedCategory(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedCategory(null);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Blog Categories</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Organize your blog posts with categories</p>
          </div>
          <button
            onClick={handleAddNew}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm sm:text-base"
          >
            + New Category
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Categories List */}
          <div className="flex-1 lg:flex-[2]">
            <div className="overflow-x-auto">
              <BlogCategoriesList onEdit={handleEdit} />
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 lg:flex-1">
            {showForm ? (
              <div className="bg-white rounded-lg shadow p-4 sm:p-6 sticky top-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                  {selectedCategory ? 'Edit Category' : 'New Category'}
                </h2>
                <BlogCategoryForm
                  category={selectedCategory}
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 sm:p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                </svg>
                <p className="text-sm">Select a category to edit or create a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BlogCategoriesPage;