// src/features/help/pages/admin/FaqManager.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetFaqsQuery,
  useDeleteFaqMutation,
  useUpdateFaqMutation,
  useCreateFaqMutation,
  useGetHelpCategoriesQuery,
  type HelpFaq,
} from '../../../../services/helpApi';
import HelpLayout from '../../components/HelpLayout';
import HelpTable from '../../components/HelpTable';
import HelpForm from '../../components/HelpForm';

import add_icon from '../../../../assets/icons/add.svg';
import search_icon from '../../../../assets/icons/search_icon.svg';
import close_icon from '../../../../assets/icons/cross_icon.svg';
import type { RootState } from '../../../../app/store';
import { useAppSelector } from '../../../../app/hooks';

export default function FaqManager() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const navigate = useNavigate();
  const { id } = useParams();

  const [showModal, setShowModal] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<HelpFaq | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    module: '',
    category_id: '',
    is_featured: '',
    page: 1,
    per_page: 10,
  });

  // Fetch FAQs
  const {
    data: apiResponse,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useGetFaqsQuery({
    search: filters.search || undefined,
    module: filters.module || undefined,
    category_id: filters.category_id ? Number(filters.category_id) : undefined,
    is_featured:
      filters.is_featured === 'true'
        ? true
        : filters.is_featured === 'false'
          ? false
          : undefined,
    page: filters.page,
    per_page: filters.per_page,
  });

  // Extract data safely
const faqs = Array.isArray(apiResponse?.data?.data) 
  ? apiResponse.data.data 
  : [];

  const total = typeof apiResponse?.data?.total === 'number' 
  ? apiResponse.data.total 
  : 0;
  // Debug logs – keep until table shows data
  console.log('API Response (raw):', apiResponse);
  console.log('Extracted faqs (length):', faqs.length);
  console.log('Total count:', total);
  console.log('Loading states:', { isLoading, isFetching, error });

  // Fetch categories
  const { data: categoriesData } = useGetHelpCategoriesQuery({ is_active: true });

  // Mutations
  const [deleteFaq] = useDeleteFaqMutation();
  const [updateFaq] = useUpdateFaqMutation();
  const [createFaq] = useCreateFaqMutation();

  const categories = Array.isArray(categoriesData?.data) ? categoriesData.data : [];

  // Handle direct URL edit (/:id)
  useEffect(() => {
    if (id === 'new') {
      setModalMode('create');
      setSelectedFaq(null);
      setShowModal(true);
    } else if (id && faqs.length > 0) {
      const faq = faqs.find((f) => f.id === Number(id));
      if (faq) {
        setModalMode('edit');
        setSelectedFaq(faq);
        setShowModal(true);
      }
    }
  }, [id, faqs]); // Depend on faqs array

  const handleDelete = async (faq: HelpFaq) => {
    if (!window.confirm(`Are you sure you want to delete this FAQ?`)) return;
    try {
      await deleteFaq(faq.id).unwrap();
      refetch();
    } catch (error: any) {
      alert(error?.data?.message || 'Failed to delete FAQ');
    }
  };

  const handleToggleActive = async (faq: HelpFaq) => {
    try {
      await updateFaq({
        id: faq.id,
        data: { is_active: !faq.is_active },
      }).unwrap();
      refetch();
    } catch (error: any) {
      alert(error?.data?.message || 'Failed to update FAQ status');
    }
  };

  const handleToggleFeatured = async (faq: HelpFaq) => {
    try {
      await updateFaq({
        id: faq.id,
        data: { is_featured: !faq.is_featured },
      }).unwrap();
      refetch();
    } catch (error: any) {
      alert(error?.data?.message || 'Failed to update featured status');
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (modalMode === 'edit' && selectedFaq) {
        await updateFaq({ id: selectedFaq.id, data: formData }).unwrap();
      } else {
        await createFaq(formData).unwrap();
      }
      setShowModal(false);
      refetch();
      navigate(`${basePath}/help/faqs`);
    } catch (error: any) {
      alert(error?.data?.message || 'Failed to save FAQ');
    }
  };

  const columns = [
    {
      key: 'question',
      label: 'Question',
      render: (faq: HelpFaq) => (
        <div>
          <div className="font-medium text-gray-900">{faq.question}</div>
          <div className="text-xs text-gray-500">{faq.answer.substring(0, 80)}...</div>
        </div>
      ),
    },
    {
      key: 'module',
      label: 'Module',
      render: (faq: HelpFaq) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
          {faq.module || 'General'}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (faq: HelpFaq) => faq.category?.category_name || '-',
    },
    {
      key: 'view_count',
      label: 'Views',
      className: 'text-center',
      render: (faq: HelpFaq) => faq.view_count?.toLocaleString() || '0',
    },
    {
      key: 'helpfulness',
      label: 'Helpful %',
      className: 'text-center',
      render: (faq: HelpFaq) => `${faq.helpfulness_ratio || 0}%`,
    },
    {
      key: 'is_featured',
      label: 'Featured',
      className: 'text-center',
      render: (faq: HelpFaq) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleFeatured(faq);
          }}
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            faq.is_featured ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {faq.is_featured ? 'Featured' : 'Regular'}
        </button>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      className: 'text-center',
      render: (faq: HelpFaq) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            faq.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {faq.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const formFields = [
    {
      name: 'question',
      label: 'Question',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter the frequently asked question',
    },
    {
      name: 'answer',
      label: 'Answer',
      type: 'rich-text' as const,
      required: true,
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
        { value: 'System Settings', label: 'System Settings' },
      ],
    },
    {
      name: 'category_id',
      label: 'Category',
      type: 'select' as const,
      options: [
        { value: '', label: 'No Category' },
        ...categories.map((c) => ({ value: c.id, label: c.category_name })),
      ],
    },
    {
      name: 'tags',
      label: 'Tags',
      type: 'tags' as const,
      placeholder: 'Add tags...',
    },
    {
      name: 'sort_order',
      label: 'Sort Order',
      type: 'number' as const,
      defaultValue: 0,
    },
    {
      name: 'is_featured',
      label: 'Featured FAQ',
      type: 'checkbox' as const,
      defaultValue: false,
    },
    {
      name: 'is_active',
      label: 'Active',
      type: 'checkbox' as const,
      defaultValue: true,
    },
  ];

  return (
    <HelpLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">FAQs Management</h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage frequently asked questions</p>
          </div>
          <button
            onClick={() => {
              setModalMode('create');
              setSelectedFaq(null);
              setShowModal(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <img src={add_icon} alt="" className="w-4 h-4 mr-2" />
            New FAQ
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <img
                  src={search_icon}
                  alt=""
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  placeholder="Search FAQs..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <select
              value={filters.module}
              onChange={(e) => setFilters({ ...filters, module: e.target.value, page: 1 })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Modules</option>
              <option value="General">General</option>
              <option value="POS">POS</option>
              <option value="Accounting">Accounting</option>
            </select>

            <select
              value={filters.category_id}
              onChange={(e) => setFilters({ ...filters, category_id: e.target.value, page: 1 })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category_name}
                </option>
              ))}
            </select>

            <select
              value={filters.is_featured}
              onChange={(e) => setFilters({ ...filters, is_featured: e.target.value, page: 1 })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All FAQs</option>
              <option value="true">Featured Only</option>
              <option value="false">Regular Only</option>
            </select>

            <button
              onClick={() => setFilters({ ...filters, page: 1 })}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <HelpTable
          columns={columns}
          data={faqs}
          onEdit={(faq) => navigate(`${basePath}/help/faqs/${faq.id}`)}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          onView={(faq) => navigate(`${basePath}/help/faq/${faq.id}`)}
          isLoading={isLoading || isFetching}
        />

        {/* Pagination */}
        {total > filters.per_page && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {((filters.page - 1) * filters.per_page) + 1} to{' '}
              {Math.min(filters.page * filters.per_page, total)} of {total} FAQs
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page * filters.per_page >= total}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div
                className="fixed inset-0 bg-gray-500 opacity-75"
                onClick={() => {
                  setShowModal(false);
                  navigate(`${basePath}/help/faqs`);
                }}
              />

              <div className="relative bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {modalMode === 'edit' ? 'Edit FAQ' : 'Create New FAQ'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      navigate(`${basePath}/help/faqs`);
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <img src={close_icon} alt="Close" className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                  <HelpForm
                    fields={formFields}
                    initialData={selectedFaq || undefined}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                      setShowModal(false);
                      navigate(`${basePath}/help/faqs`);
                    }}
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