import React from 'react';
import type { SeoSetting } from '../../../../types/seo';

interface Props {
  seo: SeoSetting | null;
  pageUrl?: string;
}

const SEOPreview: React.FC<Props> = ({ seo, pageUrl = 'https://example.com/page' }) => {
  if (!seo) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
        No SEO data to preview
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Google Preview */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Google Search Preview</h3>
        <div className="space-y-1">
          <div className="text-sm text-green-700">{pageUrl}</div>
          <div className="text-xl text-blue-700 font-medium hover:underline cursor-pointer">
            {seo.meta_title || 'Meta Title'}
          </div>
          <div className="text-sm text-gray-600">
            {seo.meta_description || 'Meta description will appear here...'}
          </div>
        </div>
      </div>

      {/* Social Media Previews */}
      <div className="grid grid-cols-2 gap-4">
        {/* Facebook Preview */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="bg-gray-100 h-32 flex items-center justify-center">
            {seo.og_image ? (
              <img src={seo.og_image} alt="OG Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400">No Image</span>
            )}
          </div>
          <div className="p-3">
            <div className="text-xs text-gray-500 uppercase">{pageUrl}</div>
            <div className="font-medium text-sm mt-1">{seo.og_title || seo.meta_title || 'OG Title'}</div>
            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
              {seo.og_description || seo.meta_description || 'OG description...'}
            </div>
          </div>
          <div className="px-3 pb-2 text-xs text-gray-400">Facebook Preview</div>
        </div>

        {/* Twitter Preview */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="bg-gray-100 h-32 flex items-center justify-center">
            {seo.twitter_image ? (
              <img src={seo.twitter_image} alt="Twitter Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400">No Image</span>
            )}
          </div>
          <div className="p-3">
            <div className="font-medium text-sm">{seo.twitter_title || seo.meta_title || 'Twitter Title'}</div>
            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
              {seo.twitter_description || seo.meta_description || 'Twitter description...'}
            </div>
            <div className="text-xs text-gray-400 mt-1">{pageUrl}</div>
          </div>
          <div className="px-3 pb-2 text-xs text-gray-400">Twitter Card</div>
        </div>
      </div>

      {/* Schema Markup Preview */}
      {seo.schema_markup && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Schema Markup</h3>
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
            {JSON.stringify(seo.schema_markup, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SEOPreview;