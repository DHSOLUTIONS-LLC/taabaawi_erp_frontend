// src/features/help/pages/admin/ArticleManager.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetArticlesQuery,
  useDeleteArticleMutation,
  useUpdateArticleMutation,
  useCreateArticleMutation,
  useGetHelpCategoriesQuery,
  type HelpArticle
} from '../../../../services/helpApi'
import HelpLayout from '../../components/HelpLayout';
import HelpTable from '../../components/HelpTable';
import HelpForm from '../../components/HelpForm';

import add_icon from '../../../../assets/icons/add.svg';
import search_icon from '../../../../assets/icons/search_icon.svg';
import close_icon from '../../../../assets/icons/cross_icon.svg';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';

export default function ArticleManager() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const navigate = useNavigate();
  const { id } = useParams();

  const [showModal, setShowModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category_id: '',
    module: '',
    page: 1,
    per_page: 10
  });

  // Fetch articles
  const { data, isLoading, refetch } = useGetArticlesQuery({
    search: filters.search || undefined,
    status: filters.status || undefined,
    category_id: filters.category_id ? Number(filters.category_id) : undefined,
    module: filters.module || undefined,
    page: filters.page,
    per_page: filters.per_page
  });

  // Fetch categories for filter
  const { data: catdata } = useGetHelpCategoriesQuery({ is_active: undefined });
  const categories = Array.isArray(catdata?.data) ? catdata.data : [];

  // Mutations
  const [deleteArticle] = useDeleteArticleMutation();
  const [updateArticle] = useUpdateArticleMutation();
  const [createArticle] = useCreateArticleMutation();

  const articles = Array.isArray(data?.data?.data) ? data.data.data :
    Array.isArray(data?.data) ? data.data : [];

  const total = data?.total || 0;

  // Check if editing from URL
  useEffect(() => {
    if (id === 'new') {
      setModalMode('create');
      setSelectedArticle(null);
      setShowModal(true);
    } else if (id) {
      const article = articles.find((a: any) => a.id === Number(id));
      if (article) {
        setModalMode('edit');
        setSelectedArticle(article);
        setShowModal(true);
      }
    }
  }, [id, articles]);

  const handleDelete = async (article: HelpArticle) => {
    if (!window.confirm(`Are you sure you want to delete "${article.title}"?`)) return;

    try {
      await deleteArticle(article.id).unwrap();
      refetch();
    } catch (error: any) {
      alert(error?.data?.message || 'Failed to delete article');
    }
  };

  const handleToggleActive = async (article: HelpArticle) => {
    try {
      await updateArticle({
        id: article.id,
        data: { status: article.status === 'published' ? 'draft' : 'published' }
      }).unwrap();
      refetch();
    } catch (error: any) {
      alert(error?.data?.message || 'Failed to update article status');
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (modalMode === 'edit' && selectedArticle) {
        await updateArticle({ id: selectedArticle.id, data: formData }).unwrap();
      } else {
        await createArticle(formData).unwrap();
      }
      setShowModal(false);
      refetch();
    } catch (error: any) {
      alert(error?.data?.message || 'Failed to save article');
    }
  };

  const handleCreateNew = () => {
    setModalMode('create');
    setSelectedArticle(null);
    setShowModal(true);
  };

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (article: HelpArticle) => (
        <div>
          <div className="font-medium text-gray-900 text-sm sm:text-base">{article.title}</div>
          <div className="text-xs text-gray-500">{article.summary?.substring(0, 60)}...</div>
        </div>
      )
    },
    {
      key: 'article_type',
      label: 'Type',
      render: (article: HelpArticle) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">
          {article.article_type}
        </span>
      )
    },
    {
      key: 'difficulty_level',
      label: 'Difficulty',
      render: (article: HelpArticle) => {
        const colors = {
          Beginner: 'bg-green-100 text-green-700',
          Intermediate: 'bg-yellow-100 text-yellow-700',
          Advanced: 'bg-red-100 text-red-700'
        };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${colors[article.difficulty_level as keyof typeof colors] || 'bg-gray-100 text-gray-700'}`}>
            {article.difficulty_level}
          </span>
        );
      }
    },
    {
      key: 'category',
      label: 'Category',
      render: (article: HelpArticle) => article.category?.category_name || '-'
    },
    {
      key: 'view_count',
      label: 'Views',
      className: 'text-center',
      render: (article: HelpArticle) => article.view_count?.toLocaleString() || '0'
    },
    {
      key: 'status',
      label: 'Status',
      className: 'text-center',
      render: (article: HelpArticle) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${article.status === 'published'
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700'
          }`}>
          {article.status}
        </span>
      )
    },
    {
      key: 'published_at',
      label: 'Published',
      render: (article: HelpArticle) => new Date(article.published_at).toLocaleDateString()
    }
  ];

  const formFields = [
    {
      name: 'title',
      label: 'Title',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter article title'
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text' as const,
      required: true,
      placeholder: 'url-friendly-identifier'
    },
    {
      name: 'summary',
      label: 'Summary',
      type: 'textarea' as const,
      required: true,
      placeholder: 'Brief description of the article'
    },
    {
      name: 'content',
      label: 'Content',
      type: 'rich-text' as const,
      required: true
    },
    {
      name: 'category_id',
      label: 'Category',
      type: 'select' as const,
      required: true,
      options: categories.map(c => ({ value: c.id, label: c.category_name }))
    },
    {
      name: 'article_type',
      label: 'Article Type',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'Guide', label: 'Guide' },
        { value: 'Tutorial', label: 'Tutorial' },
        { value: 'FAQ', label: 'FAQ' },
        { value: 'Video', label: 'Video' },
        { value: 'Troubleshooting', label: 'Troubleshooting' },
        { value: 'How To', label: 'How To' },
        { value: 'Best Practices', label: 'Best Practices' }
      ]
    },
    {
      name: 'difficulty_level',
      label: 'Difficulty',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'Beginner', label: 'Beginner' },
        { value: 'Intermediate', label: 'Intermediate' },
        { value: 'Advanced', label: 'Advanced' }
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
      name: 'tags',
      label: 'Tags',
      type: 'tags' as const,
      placeholder: 'Add tags...'
    },
    {
      name: 'featured_image',
      label: 'Featured Image',
      type: 'file' as const
    },
    {
      name: 'video_url',
      label: 'Video URL',
      type: 'text' as const,
      placeholder: 'https://youtube.com/watch?v=...'
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
        { value: 'archived', label: 'Archived' }
      ],
      defaultValue: 'draft'
    },
    {
      name: 'is_featured',
      label: 'Featured Article',
      type: 'checkbox' as const
    }
  ];

  return (
    <HelpLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Articles Management</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Create and manage help articles</p>
          </div>
          <button
            onClick={handleCreateNew}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            <img src={add_icon} alt="" className="w-4 h-4 mr-2" />
            New Article
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full sm:hidden flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <img src={search_icon} alt="" className="w-4 h-4" />
              <span className="text-sm text-gray-600">Filters</span>
              {(filters.search || filters.status || filters.category_id || filters.module) && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">Active</span>
              )}
            </div>
            <svg className={`w-4 h-4 text-gray-500 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className={`${showMobileFilters ? 'block' : 'hidden'} sm:block space-y-3 sm:space-y-0 mt-3 sm:mt-0`}>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <img src={search_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                    placeholder="Search articles..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>

              <select
                value={filters.category_id}
                onChange={(e) => setFilters({ ...filters, category_id: e.target.value, page: 1 })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.category_name}</option>
                ))}
              </select>

              <select
                value={filters.module}
                onChange={(e) => setFilters({ ...filters, module: e.target.value, page: 1 })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">All Modules</option>
                <option value="General">General</option>
                <option value="POS">POS</option>
                <option value="Accounting">Accounting</option>
              </select>

              <button
                onClick={() => setFilters({ search: '', status: '', category_id: '', module: '', page: 1, per_page: 10 })}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <HelpTable
          columns={columns}
          data={articles}
          onEdit={(article) => {
            setModalMode('edit');
            setSelectedArticle(article);
            setShowModal(true);
          }}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          onView={(article) => navigate(`${basePath}/help/article/${article.slug}`)}
          isLoading={isLoading}
        />

        {/* Pagination */}
        {total > filters.per_page && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
              Showing {((filters.page - 1) * filters.per_page) + 1} to {Math.min(filters.page * filters.per_page, total)} of {total} articles
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page * filters.per_page >= total}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 py-8">
              <div className="fixed inset-0 bg-gray-500 opacity-75" onClick={() => setShowModal(false)}></div>

              <div className="relative bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    {modalMode === 'edit' ? 'Edit Article' : 'Create New Article'}
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
                    initialData={selectedArticle || undefined}
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