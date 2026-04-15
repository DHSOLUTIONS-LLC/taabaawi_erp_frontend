import React, { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { useUploadLogoMutation } from '../../../../services/systemApi';
import { useAppSelector } from '../../../../app/hooks';
import toast from 'react-hot-toast';
import type { RootState } from '../../../../app/store';

const LogoUploader: React.FC = () => {
  const [uploadLogo, { isLoading: isUploading }] = useUploadLogoMutation();
  const settings = useAppSelector((state: RootState) => state.system?.settings);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());

  // Get the full logo URL (handle relative paths) - Vite compatible
  const getFullLogoUrl = (url: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;

    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
    const logoPath = url.startsWith('logos/') ? `/storage/${url}` : `/storage/${url}`;

    // Add timestamp to prevent caching
    const timestamp = Date.now();
    return `${baseUrl}${logoPath}?t=${timestamp}`;
  };

  const logoUrl = settings?.logo_url || settings?.logo;
  const fullLogoUrl = logoUrl ? getFullLogoUrl(logoUrl) : null;
  const hasLogo = fullLogoUrl && !preview && !uploadSuccess;

  // Refresh image key when logo URL changes
  useEffect(() => {
    if (logoUrl) {
      setImageKey(Date.now());
    }
  }, [logoUrl]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadSuccess(false);

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size should be less than 2MB');
      setError('File size too large');
      e.target.value = '';
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WEBP)');
      setError('Invalid file type');
      e.target.value = '';
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      setError('File read error');
    };
    reader.readAsDataURL(file);

    // Prepare FormData
    const formData = new FormData();
    formData.append('logo', file);

    // Upload
    try {
      const result = await uploadLogo(formData).unwrap();
      console.log('Upload successful:', result);

      // Check if upload was successful
      if (result?.success && result?.data?.logo_url) {
        toast.success('Logo uploaded successfully!');
        setUploadSuccess(true);

        // Clear preview after 2 seconds
        setTimeout(() => {
          setPreview(null);
          setUploadSuccess(false);
        }, 2000);
      } else {
        toast.warning('Logo uploaded but URL not returned');
      }

      // Reset file input
      e.target.value = '';
    } catch (err: any) {
      console.error('Upload error details:', err);

      // Handle different error types
      if (err?.data?.message) {
        toast.error(err.data.message);
        setError(err.data.message);
      } else if (err?.data?.errors) {
        const errorMessages = Object.values(err.data.errors).flat().join(', ');
        toast.error(errorMessages);
        setError(errorMessages);
      } else {
        toast.error('Failed to upload logo. Please try again.');
        setError('Upload failed');
      }

      // Clear preview on error
      setPreview(null);

      // Reset file input
      e.target.value = '';
    }
  };

  // Log settings changes for debugging
  useEffect(() => {
    if (settings) {
      console.log('Settings updated:', {
        logo: settings.logo,
        logo_url: settings.logo_url,
        fullLogoUrl
      });
    }
  }, [settings, fullLogoUrl]);

  return (
    <div className="mb-4 sm:mb-6 p-4 sm:p-5 border border-gray-200 rounded-xl bg-white">
      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Company Logo</h3>

      {/* Show error if any */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Show success message */}
      {uploadSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">✓ Logo uploaded successfully!</p>
        </div>
      )}

      <div className="flex flex-col xs:flex-row items-center xs:items-start gap-4 sm:gap-6">
        {/* Current Logo / Preview */}
        {(preview || hasLogo) && (
          <div className="relative flex-shrink-0">
            <img
              key={imageKey}
              src={preview || fullLogoUrl || ''}
              alt="Company Logo"
              className="h-20 w-20 xs:h-16 xs:w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 object-contain border border-gray-300 rounded-md bg-gray-50 p-1"
              onError={(e) => {
                console.error('Image failed to load:', e.currentTarget.src);
                // Show a fallback icon
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"%3E%3Crect x="2" y="2" width="20" height="20" rx="2.18"%3E%3C/rect%3E%3Cpath d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"%3E%3C/path%3E%3C/svg%3E';
              }}
            />
            {preview && (
              <button
                onClick={() => setPreview(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600 transition-colors"
                aria-label="Remove preview"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Upload Button and Info */}
        <div className="flex-1 w-full xs:w-auto">
          <label className="relative cursor-pointer block w-full xs:w-auto">
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
              onChange={handleFileChange}
              disabled={isUploading}
              className="sr-only"
            />
            <div className={`
              w-full xs:w-auto inline-flex items-center justify-center px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 border border-gray-300 rounded-lg shadow-sm text-xs sm:text-sm font-medium
              transition-colors duration-200
              ${isUploading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }
            `}>
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="ml-1">Uploading...</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="whitespace-nowrap">Upload New Logo</span>
                </>
              )}
            </div>
          </label>
          <p className="mt-2 text-xs text-gray-500 text-center xs:text-left">
            Recommended: 200x200px, PNG or JPG, max 2MB
          </p>
        </div>
      </div>

      {/* Preview info */}
      {preview && (
        <div className="mt-3 text-xs text-blue-600 text-center xs:text-left">
          Preview mode - The logo will be saved when upload completes
        </div>
      )}

    </div>
  );
};

export default LogoUploader;