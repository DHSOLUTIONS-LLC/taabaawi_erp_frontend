import React from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { SystemSettings } from '../../../../types/system';

interface Props {
  register: UseFormRegister<SystemSettings>;
  errors: FieldErrors<SystemSettings>;
}

const SocialMediaSettings: React.FC<Props> = ({ register }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Social Media Links</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Facebook */}
        <div>
          <label htmlFor="facebook_url" className="block text-sm font-medium text-gray-700 mb-2">
            <span className="mr-2">📘</span> Facebook URL
          </label>
          <input
            id="facebook_url"
            type="url"
            {...register('facebook_url')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="https://facebook.com/company"
          />
        </div>

        {/* Twitter */}
        <div>
          <label htmlFor="twitter_url" className="block text-sm font-medium text-gray-700 mb-2">
            <span className="mr-2">🐦</span> Twitter URL
          </label>
          <input
            id="twitter_url"
            type="url"
            {...register('twitter_url')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="https://twitter.com/company"
          />
        </div>

        {/* Instagram */}
        <div>
          <label htmlFor="instagram_url" className="block text-sm font-medium text-gray-700 mb-2">
            <span className="mr-2">📷</span> Instagram URL
          </label>
          <input
            id="instagram_url"
            type="url"
            {...register('instagram_url')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="https://instagram.com/company"
          />
        </div>

        {/* LinkedIn */}
        <div>
          <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700 mb-2">
            <span className="mr-2">💼</span> LinkedIn URL
          </label>
          <input
            id="linkedin_url"
            type="url"
            {...register('linkedin_url')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="https://linkedin.com/company"
          />
        </div>

        {/* YouTube */}
        <div>
          <label htmlFor="youtube_url" className="block text-sm font-medium text-gray-700 mb-2">
            <span className="mr-2">▶️</span> YouTube URL
          </label>
          <input
            id="youtube_url"
            type="url"
            {...register('youtube_url')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="https://youtube.com/company"
          />
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
        <p className="text-sm text-gray-600">
          These links will appear in the website footer and on your company profile.
        </p>
      </div>
    </div>
  );
};

export default SocialMediaSettings;