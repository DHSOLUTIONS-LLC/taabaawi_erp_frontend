import React, { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCreateBlogPostMutation, useUpdateBlogPostMutation, useGetBlogCategoriesQuery } from '../../../../services/blogApi';
import {
  useGenerateSeoTitleMutation,
  useGenerateMetaDescriptionMutation,
  useGenerateKeywordsMutation
} from '../../../../services/aiContentApi';

import type { BlogPost, CreateBlogPostPayload } from '../../../../types/blog';
import type { RootState } from '../../../../app/store';
import { useAppSelector } from '../../../../app/hooks';

interface Props {
  post?: BlogPost;
  onSuccess?: (postId: number) => void;
}

const BlogPostForm: React.FC<Props> = ({ post, onSuccess }) => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const navigate = useNavigate();
  const [createPost] = useCreateBlogPostMutation();
  const [updatePost] = useUpdateBlogPostMutation();
  const { data: categoriesData } = useGetBlogCategoriesQuery({ is_active: true });

  const [generateSeoTitle, { isLoading: isGeneratingTitle }] = useGenerateSeoTitleMutation();
  const [generateMetaDescription, { isLoading: isGeneratingMeta }] = useGenerateMetaDescriptionMutation();
  const [generateKeywords, { isLoading: isGeneratingKeywords }] = useGenerateKeywordsMutation();

  const [imagePreview, setImagePreview] = useState<string | null>(post?.featured_image || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialTags: string[] = post?.tags
    ? (Array.isArray(post.tags) ? post.tags : String(post.tags).split(',').map(t => t.trim()).filter(Boolean))
    : [];
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateBlogPostPayload>({
    defaultValues: post ? {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category_id: post.category_id,
      status: post.status,
      published_at: post.published_at?.split('T')[0],
      scheduled_at: post.scheduled_at?.split('T')[0],
      allow_comments: post.allow_comments,
      is_featured: post.is_featured,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      meta_keywords: post.meta_keywords,
      canonical_url: post.canonical_url,
      image_alt_text: post.image_alt_text,
    } : {
      status: 'draft',
      allow_comments: true,
      is_featured: false,
    },
  });

  const status = watch('status');
  const categories = categoriesData?.data || [];

  // ========== AI GENERATION ==========

  // SEO Title — based on main post title + content
  const handleGenerateSeoTitle = async () => {
    const title = watch('title') || '';
    const content = watch('content') || watch('excerpt') || '';
    const combined = `${title} ${content}`.trim();

    if (!combined) {
      toast.error('Please add a title or content first');
      return;
    }
    try {
      const result = await generateSeoTitle({ content: combined.substring(0, 500) }).unwrap();
      if (result?.data?.generated_title) {
        setValue('meta_title', result.data.generated_title);
        toast.success('SEO title generated!');
      } else {
        toast.error('Invalid response from AI');
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to generate SEO title');
    }
  };

  // Meta Description — based on content
  const handleGenerateMetaDescription = async () => {
    const content = watch('content') || watch('excerpt') || '';
    if (!content) { toast.error('Please add some content first'); return; }
    try {
      const result = await generateMetaDescription({ content: content.substring(0, 1000), max_length: 160 }).unwrap();
      if (result?.data?.generated_description) {
        setValue('meta_description', result.data.generated_description);
        toast.success('Meta description generated!');
      } else {
        toast.error('Invalid response from AI');
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to generate meta description');
    }
  };

  // Keywords — based on title + content
  const handleGenerateKeywords = async () => {
    const title = watch('title') || '';
    const excerpt = watch('excerpt') || '';
    const content = watch('content') || '';
    const combined = `${title} ${excerpt} ${content.substring(0, 500)}`.trim();
    if (!combined) { toast.error('Please add some content first'); return; }
    try {
      const result = await generateKeywords({ content: combined.substring(0, 1000), count: 10 }).unwrap();
      if (result?.data?.keywords && Array.isArray(result.data.keywords)) {
        setValue('meta_keywords', result.data.keywords.join(', '));
        toast.success('Keywords generated!');
      } else {
        toast.error('Invalid response from AI');
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to generate keywords');
    }
  };

  // ========== TAG HELPERS ==========

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (tags.length >= 10) { toast.error('Maximum 10 tags allowed'); return; }
    if (tags.includes(trimmed)) { setTagInput(''); return; }
    setTags(prev => [...prev, trimmed]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(); }
    if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  // ========== SUBMIT ==========

  const onSubmit = async (data: CreateBlogPostPayload) => {
    try {
      setIsSubmitting(true);
      const hasFile = data.featured_image instanceof File;
      let response;

      if (hasFile) {
        const fd = new FormData();
        fd.append('title', data.title);
        fd.append('content', data.content);
        fd.append('status', data.status ?? 'draft');
        fd.append('allow_comments', data.allow_comments ? '1' : '0');
        fd.append('is_featured', data.is_featured ? '1' : '0');

        if (data.slug)             fd.append('slug', data.slug);
        if (data.excerpt)          fd.append('excerpt', data.excerpt);
        if (data.image_alt_text)   fd.append('image_alt_text', data.image_alt_text);
        if (data.meta_title)       fd.append('meta_title', data.meta_title);
        if (data.meta_description) fd.append('meta_description', data.meta_description);
        if (data.meta_keywords)    fd.append('meta_keywords', data.meta_keywords);
        if (data.canonical_url)    fd.append('canonical_url', data.canonical_url);
        if (data.category_id)      fd.append('category_id', String(Number(data.category_id)));

        if (data.status === 'published') {
          fd.append('published_at', data.published_at || new Date().toISOString().split('T')[0]);
        }
        if (data.status === 'scheduled' && data.scheduled_at) {
          fd.append('scheduled_at', data.scheduled_at);
        }

        if (tags.length) tags.forEach(tag => fd.append('tags[]', tag));
        fd.append('featured_image', data.featured_image as File);

        if (post) {
          fd.append('_method', 'PUT');
          response = await updatePost({ id: post.id, ...Object.fromEntries(fd) } as any);
        } else {
          response = await createPost(fd as any);
        }
      } else {
        const payload: Record<string, any> = {
          title: data.title,
          content: data.content,
          status: data.status ?? 'draft',
          allow_comments: data.allow_comments ?? true,
          is_featured: data.is_featured ?? false,
        };

        if (data.slug)             payload.slug = data.slug;
        if (data.excerpt)          payload.excerpt = data.excerpt;
        if (data.image_alt_text)   payload.image_alt_text = data.image_alt_text;
        if (data.meta_title)       payload.meta_title = data.meta_title;
        if (data.meta_description) payload.meta_description = data.meta_description;
        if (data.meta_keywords)    payload.meta_keywords = data.meta_keywords;
        if (data.canonical_url)    payload.canonical_url = data.canonical_url;
        if (data.category_id)      payload.category_id = Number(data.category_id);

        if (data.status === 'published') {
          payload.published_at = data.published_at || new Date().toISOString().split('T')[0];
        }
        if (data.status === 'scheduled' && data.scheduled_at) {
          payload.scheduled_at = data.scheduled_at;
        }

        if (tags.length) payload.tags = tags;

        if (post) {
          response = await updatePost({ id: post.id, ...payload } as any);
        } else {
          response = await createPost(payload as any);
        }
      }

      if ('error' in response) throw (response as any).error;

      toast.success(post ? 'Blog post updated successfully' : 'Blog post created successfully');

      if (post) {
        onSuccess?.(post.id);
      } else {
        const newId = (response as any)?.data?.data?.id ?? (response as any)?.data?.id;
        navigate(newId ? `${basePath}/blog/${newId}` : `${basePath}/blog`);
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      if (error?.data?.errors) {
        Object.entries(error.data.errors).forEach(([key, msgs]) => {
          toast.error(`${key}: ${(msgs as string[]).join(', ')}`);
        });
      } else {
        toast.error(error?.data?.message ?? 'Failed to save post');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue('featured_image', file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Title — plain, no AI */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          {...register('title', { required: 'Title is required' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Enter post title"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
        <input
          id="slug"
          type="text"
          {...register('slug')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="leave empty to auto-generate"
        />
      </div>

      {/* Excerpt */}
      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">Excerpt</label>
        <textarea
          id="excerpt"
          rows={3}
          {...register('excerpt')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Brief summary of the post"
        />
      </div>

      {/* Content — plain, no AI */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
          Content <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          rows={10}
          {...register('content', { required: 'Content is required' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono"
          placeholder="Write your blog post content here..."
        />
        {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
        <p className="mt-1 text-xs text-gray-500">HTML content supported.</p>
      </div>

      {/* Featured Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Featured Image</label>
        <div className="flex items-center space-x-4">
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      </div>

      {/* Image Alt Text */}
      <div>
        <label htmlFor="image_alt_text" className="block text-sm font-medium text-gray-700 mb-2">
          Image Alt Text
        </label>
        <input
          id="image_alt_text"
          type="text"
          {...register('image_alt_text')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Describe the image for SEO"
        />
      </div>

      {/* Category & Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            id="category_id"
            {...register('category_id')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Uncategorized</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags <span className="text-gray-400 font-normal">(max 10, press Enter to add)</span>
          </label>
          <div
            className="min-h-[42px] w-full px-2 py-1.5 border border-gray-300 rounded-md flex flex-wrap gap-1.5 items-center focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 cursor-text"
            onClick={() => document.getElementById('tag-input')?.focus()}
          >
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                  className="hover:text-blue-900 leading-none"
                >
                  ×
                </button>
              </span>
            ))}
            {tags.length < 10 && (
              <input
                id="tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length === 0 ? 'Type a tag and press Enter' : ''}
                className="flex-1 min-w-[120px] outline-none text-sm py-0.5 bg-transparent"
              />
            )}
          </div>
          {tags.length >= 10 && (
            <p className="mt-1 text-xs text-amber-600">Maximum 10 tags reached</p>
          )}
        </div>
      </div>

      {/* Status & Dates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            id="status"
            {...register('status')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {status === 'published' && (
          <div>
            <label htmlFor="published_at" className="block text-sm font-medium text-gray-700 mb-2">Publish Date</label>
            <input
              id="published_at"
              type="date"
              {...register('published_at')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        )}

        {status === 'scheduled' && (
          <div>
            <label htmlFor="scheduled_at" className="block text-sm font-medium text-gray-700 mb-2">Schedule Date</label>
            <input
              id="scheduled_at"
              type="datetime-local"
              {...register('scheduled_at')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        )}
      </div>

      {/* Options */}
      <div className="flex items-center space-x-6">
        <label className="flex items-center">
          <input type="checkbox" {...register('allow_comments')} className="h-4 w-4 text-blue-600 rounded border-gray-300" />
          <span className="ml-2 text-sm text-gray-700">Allow Comments</span>
        </label>
        <label className="flex items-center">
          <input type="checkbox" {...register('is_featured')} className="h-4 w-4 text-blue-600 rounded border-gray-300" />
          <span className="ml-2 text-sm text-gray-700">Featured Post</span>
        </label>
      </div>

      {/* SEO Section — all 3 AI buttons live here */}
      <details className="border rounded-md p-4">
        <summary className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2">
          SEO Settings
          <span className="text-xs text-purple-600 font-normal">✨ AI-powered</span>
        </summary>
        <div className="mt-4 space-y-4">

          {/* SEO Title — AI generates from main title */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700">SEO Title</label>
              <button
                type="button"
                onClick={handleGenerateSeoTitle}
                disabled={isGeneratingTitle}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {isGeneratingTitle ? '⏳ Generating...' : '✨ Generate from Title'}
              </button>
            </div>
            <input
              id="meta_title"
              type="text"
              {...register('meta_title')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="SEO title (60 chars recommended)"
            />
          </div>

          {/* Meta Description — AI generates from content */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700">Meta Description</label>
              <button
                type="button"
                onClick={handleGenerateMetaDescription}
                disabled={isGeneratingMeta}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {isGeneratingMeta ? '⏳ Generating...' : '✨ Generate from Content'}
              </button>
            </div>
            <textarea
              id="meta_description"
              rows={2}
              {...register('meta_description')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Meta description (160 chars recommended)"
            />
          </div>

          {/* Keywords — AI generates from title + content */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="meta_keywords" className="block text-sm font-medium text-gray-700">Meta Keywords</label>
              <button
                type="button"
                onClick={handleGenerateKeywords}
                disabled={isGeneratingKeywords}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {isGeneratingKeywords ? '⏳ Generating...' : '✨ Generate Keywords'}
              </button>
            </div>
            <input
              id="meta_keywords"
              type="text"
              {...register('meta_keywords')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>

          {/* Canonical URL */}
          <div>
            <label htmlFor="canonical_url" className="block text-sm font-medium text-gray-700 mb-2">Canonical URL</label>
            <input
              id="canonical_url"
              type="url"
              {...register('canonical_url')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="https://example.com/canonical-url"
            />
          </div>
        </div>
      </details>

      {/* Submit */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : (post ? 'Update Post' : 'Create Post')}
        </button>
      </div>
    </form>
  );
};

export default BlogPostForm;