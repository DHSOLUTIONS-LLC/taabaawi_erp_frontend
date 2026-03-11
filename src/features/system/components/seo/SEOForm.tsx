import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useSaveSeoMutation } from '../../../../services/seoApi';
import type { SeoSetting } from '../../../../types/seo';

interface Props {
  seo: SeoSetting | null;
  seoableType?: string;
  seoableId?: number;
  isGlobal?: boolean;
  pageName?: string;
  onSuccess?: () => void;
}

const SEOForm: React.FC<Props> = ({
  seo,
  seoableType,
  seoableId,
  pageName,
  onSuccess,
}) => {
  const [saveSeo, { isLoading }] = useSaveSeoMutation();
  const { register, handleSubmit, reset, formState: {  } } = useForm<Partial<SeoSetting>>({
    defaultValues: seo || {},
  });

  useEffect(() => {
    if (seo) {
      reset(seo);
    }
  }, [seo, reset]);

  const onSubmit = async (data: Partial<SeoSetting>) => {
    try {
      const payload: Partial<SeoSetting> = {
        ...data,
        ...(seoableType && seoableId ? {
          seoable_type: seoableType,
          seoable_id: seoableId,
          is_global: false,
        } : {
          is_global: true,
          page_name: pageName,
        }),
      };

      await saveSeo(payload).unwrap();
      toast.success('SEO settings saved successfully');
      onSuccess?.();
    } catch {
      toast.error('Failed to save SEO settings');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic SEO */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic SEO</h3>
        
        <div>
          <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700 mb-2">
            Meta Title
          </label>
          <input
            id="meta_title"
            type="text"
            {...register('meta_title')}
            maxLength={60}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter meta title (max 60 characters)"
          />
          <p className="mt-1 text-xs text-gray-500">Recommended: 50-60 characters</p>
        </div>

        <div>
          <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700 mb-2">
            Meta Description
          </label>
          <textarea
            id="meta_description"
            rows={3}
            {...register('meta_description')}
            maxLength={160}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter meta description (max 160 characters)"
          />
          <p className="mt-1 text-xs text-gray-500">Recommended: 150-160 characters</p>
        </div>

        <div>
          <label htmlFor="meta_keywords" className="block text-sm font-medium text-gray-700 mb-2">
            Meta Keywords
          </label>
          <input
            id="meta_keywords"
            type="text"
            {...register('meta_keywords')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="keyword1, keyword2, keyword3"
          />
        </div>

        <div>
          <label htmlFor="canonical_url" className="block text-sm font-medium text-gray-700 mb-2">
            Canonical URL
          </label>
          <input
            id="canonical_url"
            type="url"
            {...register('canonical_url')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="https://example.com/canonical-url"
          />
        </div>

        <div>
          <label htmlFor="robots" className="block text-sm font-medium text-gray-700 mb-2">
            Robots Directive
          </label>
          <select
            id="robots"
            {...register('robots')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="index, follow">Index, Follow</option>
            <option value="noindex, follow">No Index, Follow</option>
            <option value="index, nofollow">Index, No Follow</option>
            <option value="noindex, nofollow">No Index, No Follow</option>
          </select>
        </div>
      </div>

      {/* Open Graph */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium text-gray-900">Open Graph (Facebook)</h3>
        
        <div>
          <label htmlFor="og_title" className="block text-sm font-medium text-gray-700 mb-2">
            OG Title
          </label>
          <input
            id="og_title"
            type="text"
            {...register('og_title')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="og_description" className="block text-sm font-medium text-gray-700 mb-2">
            OG Description
          </label>
          <textarea
            id="og_description"
            rows={2}
            {...register('og_description')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="og_image" className="block text-sm font-medium text-gray-700 mb-2">
            OG Image URL
          </label>
          <input
            id="og_image"
            type="url"
            {...register('og_image')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <label htmlFor="og_type" className="block text-sm font-medium text-gray-700 mb-2">
            OG Type
          </label>
          <select
            id="og_type"
            {...register('og_type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="website">Website</option>
            <option value="article">Article</option>
            <option value="product">Product</option>
            <option value="profile">Profile</option>
          </select>
        </div>
      </div>

      {/* Twitter Card */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium text-gray-900">Twitter Card</h3>
        
        <div>
          <label htmlFor="twitter_card" className="block text-sm font-medium text-gray-700 mb-2">
            Card Type
          </label>
          <select
            id="twitter_card"
            {...register('twitter_card')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="summary">Summary</option>
            <option value="summary_large_image">Summary Large Image</option>
            <option value="app">App</option>
            <option value="player">Player</option>
          </select>
        </div>

        <div>
          <label htmlFor="twitter_title" className="block text-sm font-medium text-gray-700 mb-2">
            Twitter Title
          </label>
          <input
            id="twitter_title"
            type="text"
            {...register('twitter_title')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="twitter_description" className="block text-sm font-medium text-gray-700 mb-2">
            Twitter Description
          </label>
          <textarea
            id="twitter_description"
            rows={2}
            {...register('twitter_description')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="twitter_image" className="block text-sm font-medium text-gray-700 mb-2">
            Twitter Image URL
          </label>
          <input
            id="twitter_image"
            type="url"
            {...register('twitter_image')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Schema Markup */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium text-gray-900">Schema Markup (JSON-LD)</h3>
        
        <div>
          <label htmlFor="schema_markup" className="block text-sm font-medium text-gray-700 mb-2">
            Schema JSON
          </label>
          <textarea
            id="schema_markup"
            rows={6}
            {...register('schema_markup')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
            placeholder='{"@context": "https://schema.org", "@type": "Organization", ...}'
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save SEO Settings'}
        </button>
      </div>
    </form>
  );
};

export default SEOForm;