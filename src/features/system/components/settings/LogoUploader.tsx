import React, { useState } from 'react';
import  type { ChangeEvent } from 'react';
import { useUploadLogoMutation } from '../../../../services/systemApi';
import { useAppSelector } from '../../../../app/hooks';
import toast from 'react-hot-toast';
import type { RootState } from '../../../../app/store';

const LogoUploader: React.FC = () => {
  const [uploadLogo, { isLoading: isUploading }] = useUploadLogoMutation();
  const settings = useAppSelector((state: RootState) => state.system?.settings);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('logo', file)
    // Upload
    try {
      await uploadLogo(formData).unwrap();
      toast.success('Logo uploaded successfully');
      setPreview(null);
    } catch {
      toast.error('Failed to upload logo');
    }
  };

  return (
    <div className="mb-6 p-4 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Company Logo</h3>
      
      <div className="flex items-center space-x-6">
        {/* Current Logo */}
        {(settings?.logo_url || preview) && (
          <div className="relative">
            <img
              src={preview || settings?.logo_url}
              alt="Company Logo"
              className="h-24 w-auto object-contain border rounded-lg"
            />
            {preview && (
              <button
                onClick={() => setPreview(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                aria-label="Remove preview"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Upload Button */}
        <div>
          <label className="relative cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
              className="sr-only"
            />
            <div className={`
              px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium
              ${isUploading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }
            `}>
              {isUploading ? 'Uploading...' : 'Upload New Logo'}
            </div>
          </label>
          <p className="mt-2 text-xs text-gray-500">
            Recommended: 200x200px, PNG or JPG, max 2MB
          </p>
        </div>
      </div>
    </div>
  );
};

export default LogoUploader;