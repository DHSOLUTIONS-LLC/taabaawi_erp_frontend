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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Blog Categories</h1>
            <p className="text-gray-600 mt-2">Organize your blog posts with categories</p>
          </div>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + New Category
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories List */}
          <div className="lg:col-span-2">
            <BlogCategoriesList onEdit={handleEdit} />
          </div>

          {/* Form */}
          <div className="lg:col-span-1">
            {showForm ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {selectedCategory ? 'Edit Category' : 'New Category'}
                </h2>
                <BlogCategoryForm
                  category={selectedCategory}
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                <p>Select a category to edit or create a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BlogCategoriesPage;