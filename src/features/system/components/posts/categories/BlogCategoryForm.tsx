import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useCreateBlogCategoryMutation, useUpdateBlogCategoryMutation } from '../../../../../services/blogApi';
import { useGetBlogCategoriesQuery } from '../../../../../services/blogApi';
import type { BlogCategory, CreateCategoryPayload } from '../../../../../types/blog';

interface Props {
  category?: BlogCategory | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const BlogCategoryForm: React.FC<Props> = ({ category, onSuccess, onCancel }) => {
  const [createCategory] = useCreateBlogCategoryMutation();
  const [updateCategory] = useUpdateBlogCategoryMutation();
  const { data: categoriesData } = useGetBlogCategoriesQuery();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateCategoryPayload>({
    defaultValues: category ? {
      name: category.name,
      slug: category.slug,
      description: category.description,
      parent_id: category.parent_id,
      meta_title: category.meta_title,
      meta_description: category.meta_description,
      sort_order: category.sort_order,
      is_active: category.is_active,
    } : {
      is_active: true,
      sort_order: 0,
    },
  });

  useEffect(() => {
    if (category) {
      reset(category);
    }
  }, [category, reset]);

  const onSubmit = async (data: CreateCategoryPayload) => {
    try {
      if (category) {
        await updateCategory({ id: category.id, ...data }).unwrap();
        toast.success('Category updated successfully');
      } else {
        await createCategory(data).unwrap();
        toast.success('Category created successfully');
      }
      onSuccess?.();
    } catch {
      toast.error(category ? 'Failed to update category' : 'Failed to create category');
    }
  };

  const categories = categoriesData?.data || [];
  const parentCategories = categories.filter(c => !c.parent_id && c.id !== category?.id);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register('name', { required: 'Name is required' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
          Slug
        </label>
        <input
          id="slug"
          type="text"
          {...register('slug')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="leave empty to auto-generate"
        />
      </div>

      {/* Parent Category */}
      <div>
        <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 mb-1">
          Parent Category
        </label>
        <select
          id="parent_id"
          {...register('parent_id')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">None (Top Level)</option>
          {parentCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          {...register('description')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* Sort Order */}
      <div>
        <label htmlFor="sort_order" className="block text-sm font-medium text-gray-700 mb-1">
          Sort Order
        </label>
        <input
          id="sort_order"
          type="number"
          {...register('sort_order')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* Active Status */}
      <div className="flex items-center">
        <input
          id="is_active"
          type="checkbox"
          {...register('is_active')}
          className="h-4 w-4 text-blue-600 rounded border-gray-300"
        />
        <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
          Active
        </label>
      </div>

      {/* SEO Fields - Collapsible */}
      <details className="border rounded-md p-3">
        <summary className="text-sm font-medium text-gray-700 cursor-pointer">
          SEO Settings (Optional)
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="meta_title" className="block text-xs text-gray-600 mb-1">
              Meta Title
            </label>
            <input
              id="meta_title"
              type="text"
              {...register('meta_title')}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <div>
            <label htmlFor="meta_description" className="block text-xs text-gray-600 mb-1">
              Meta Description
            </label>
            <textarea
              id="meta_description"
              rows={2}
              {...register('meta_description')}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>
      </details>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : category ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};

export default BlogCategoryForm;