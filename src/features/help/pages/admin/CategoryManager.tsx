// src/features/help/pages/admin/CategoryManager.tsx
import { useState } from 'react';
import {
  useGetHelpCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  type HelpCategory
} from '../../../../services/helpApi';
import HelpLayout from '../../components/HelpLayout';
import HelpForm from '../../components/HelpForm';

import add_icon from '../../../../assets/icons/add.svg';
import edit_icon from '../../../../assets/icons/edit_icon.svg';
import delete_icon from '../../../../assets/icons/delete-icon.png';
import close_icon from '../../../../assets/icons/cross_icon.svg';

interface CategoryNode extends HelpCategory {
  children?: CategoryNode[];
  level: number;
}

export default function CategoryManager() {
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(null);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const { data, isLoading, refetch } = useGetHelpCategoriesQuery({ is_active: undefined });
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const categories = Array.isArray(data?.data) ? data.data : [];

  // Build category tree
  const buildTree = (items: HelpCategory[], parentId: number | null = null, level = 0): CategoryNode[] => {
    return items
      .filter(c => c.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(c => ({
        ...c,
        level,
        children: buildTree(items, c.id, level + 1)
      }));
  };

  const categoryTree = buildTree(categories);

  const handleDelete = async (category: HelpCategory) => {
    if (category.article_count > 0 || category.faq_count > 0) {
      alert('Cannot delete category with existing articles or FAQs');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${category.category_name}"?`)) return;

    try {
      await deleteCategory(category.id).unwrap();
      refetch();
    } catch (error: any) {
      alert(error?.data?.message || 'Failed to delete category');
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (selectedCategory) {
        await updateCategory({ id: selectedCategory.id, data: formData }).unwrap();
      } else {
        await createCategory(formData).unwrap();
      }
      setShowModal(false);
      setSelectedCategory(null);
      refetch();
    } catch (error: any) {
      alert(error?.data?.message || 'Failed to save category');
    }
  };

  const handleMove = async (categoryId: number, direction: 'up' | 'down') => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const siblings = categories
      .filter(c => c.parent_id === category.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const currentIndex = siblings.findIndex(c => c.id === categoryId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === siblings.length - 1)
    ) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const tempOrder = category.sort_order;

    try {
      await updateCategory({ id: categoryId, data: { sort_order: siblings[newIndex].sort_order } }).unwrap();
      await updateCategory({ id: siblings[newIndex].id, data: { sort_order: tempOrder } }).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to reorder:', error);
    }
  };

  const toggleExpand = (categoryId: number) => {
    setExpandedIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const renderCategoryRows = (nodes: CategoryNode[]) => {
    return nodes.map((category) => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedIds.includes(category.id);
      const indentLevel = category.level;

      return (
        <tbody key={category.id}>
          <tr className="hover:bg-gray-50 border-b border-gray-100">
            {/* Category Name with Expand/Collapse */}
            <td className="px-1 md:px-3 py-1 md:py-3">
              <div className="flex items-center" style={{ paddingLeft: `${indentLevel * 20}px` }}>
                {hasChildren && (
                  <button
                    onClick={() => toggleExpand(category.id)}
                    className="mr-2 w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700 flex-shrink-0"
                  >
                    {isExpanded ? '▼' : '►'}
                  </button>
                )}
                {!hasChildren && <div className="w-5 mr-2 flex-shrink-0" />}
                <div>
                  <div className="font-medium text-gray-900 text-sm sm:text-base break-words">
                    {category.category_name}
                  </div>
                  {category.description && (
                    <div className="text-xs text-gray-500 mt-0.5 break-words">
                      {category.description}
                    </div>
                  )}
                </div>
              </div>
            </td>

            {/* Statistics */}
            <td className="px-1 md:px-3 py-1 md:py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                  📄 {category.article_count || 0}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">
                  ❓ {category.faq_count || 0}
                </span>

              </div>
            </td>

            {/* status */}
            <td className="px-1 md:px-3 py-1 md:py-3">
              <span className={`px-2 py-1 text-xs rounded-full ${category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                {category.is_active ? 'Active' : 'Inactive'}
              </span>
            </td>

            {/* Actions */}
            <td className="px-1 md:px-3 py-1 md:py-3 whitespace-nowrap">
              <div className="flex items-center gap-1 sm:gap-2">
                {/* <button
                  onClick={() => handleMove(category.id, 'up')}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Move Up"
                >
                  ↑
                </button>
                <button
                  onClick={() => handleMove(category.id, 'down')}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Move Down"
                >
                  ↓
                </button> */}
                <button
                  onClick={() => {
                    setSelectedCategory(category);
                    setShowModal(true);
                  }}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <img src={edit_icon} alt="Edit" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                  title="Delete"
                  disabled={category.article_count > 0 || category.faq_count > 0}
                >
                  <img src={delete_icon} alt="Delete" className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>

          {/* Render children if expanded */}
          {hasChildren && isExpanded && renderCategoryRows(category.children!)}
        </tbody>
      );
    });
  };

  const formFields = [
    {
      name: 'category_name',
      label: 'Category Name',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g., Getting Started'
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text' as const,
      required: false,
      placeholder: 'getting-started'
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      placeholder: 'Brief description of this category'
    },
    {
      name: 'parent_id',
      label: 'Parent Category',
      type: 'select' as const,
      options: [
        { value: '', label: 'None (Top Level)' },
        ...categories.map(c => ({ value: c.id, label: c.category_name }))
      ]
    },
    {
      name: 'module',
      label: 'Module',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'General', label: 'General' },
        { value: 'User Management', label: 'User Management' },
        { value: 'Branch Management', label: 'Branch Management' },
        { value: 'Product & Inventory', label: 'Product & Inventory' },
        { value: 'HR Management', label: 'HR Management' },
        { value: 'POS', label: 'POS' },
        { value: 'Sales & Orders', label: 'Sales & Orders' },
        { value: 'Purchase Management', label: 'Purchase Management' },
        { value: 'Accounting', label: 'Accounting' },
        { value: 'CRM', label: 'CRM' },
        { value: 'Reporting', label: 'Reporting' },
        { value: 'System Settings', label: 'System Settings' }
      ]
    },
    {
      name: 'icon',
      label: 'Icon',
      type: 'text' as const,
      placeholder: 'Upload icon image'
    },
    {
      name: 'sort_order',
      label: 'Sort Order',
      type: 'number' as const,
      defaultValue: 0
    },
    {
      name: 'is_active',
      label: 'Active',
      type: 'checkbox' as const,
      defaultValue: true
    }
  ];

  return (
    <HelpLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Categories Management</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Organize help content into categories</p>
          </div>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setShowModal(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            <img src={add_icon} alt="" className="w-4 h-4 mr-2" />
            New Category
          </button>
        </div>

        {/* Category Table */}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
          <div className="xl:col-span-4 overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-1 md:px-3 py-1 md:py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Category Name
                  </th>
                  <th className="px-1 md:px-3 py-1 md:py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Statistics
                  </th>
                  <th className="px-1 md:px-3 py-1 md:py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-1 md:px-3 py-1 md:py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>

              {isLoading ? (
                <tbody>
                  <tr>
                    <td colSpan={3} className="text-center py-12">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      </div>
                    </td>
                  </tr>
                </tbody>
              ) : categoryTree.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={3} className="text-center py-12 text-gray-500">
                      No categories found. Create your first category.
                    </td>
                  </tr>
                </tbody>
              ) : (
                renderCategoryRows(categoryTree)
              )}
            </table>

          </div>

        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 py-8">
              <div className="fixed inset-0 bg-gray-500 opacity-75" onClick={() => setShowModal(false)}></div>

              <div className="relative bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    {selectedCategory ? 'Edit Category' : 'Create New Category'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-500 p-1"
                  >
                    <img src={close_icon} alt="Close" className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                <div className="p-4 sm:p-6">
                  <HelpForm
                    fields={formFields}
                    initialData={selectedCategory || undefined}
                    onSubmit={handleSubmit}
                    onCancel={() => setShowModal(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </HelpLayout>
  );
}