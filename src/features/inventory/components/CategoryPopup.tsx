// src/layouts/components/CategoryPopup.tsx
import { useState } from 'react';

interface CategoryPopupProps {
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
}

export default function CategoryPopup({ onClose, onSubmit }: CategoryPopupProps) {
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!categoryName.trim()) {
      setError('Category name is required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('category_name', categoryName.trim());
      
      // Only append if not empty
      if (description.trim()) {
        formData.append('description', description.trim());
      }
      
      // Only append parent_id if provided (backend expects nullable)
      if (parentId.trim() && parentId !== '0') {
        formData.append('parent_id', parentId.trim());
      }
      
      // Send is_active as integer (1 for true, 0 for false) - Laravel will cast it to boolean
      formData.append('is_active', isActive ? '1' : '0');
      
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      console.log('FormData being sent:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      await onSubmit(formData);
      onClose(); // Close on success
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to create category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (2MB = 2 * 1024 * 1024 bytes)
      if (file.size > 2 * 1024 * 1024) {
        setError('File size must be less than 2MB');
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('File must be an image (JPEG, PNG, JPG, GIF)');
        return;
      }
      
      setSelectedFile(file);
      setError(null); // Clear any previous error
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-opacity-50 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-full max-w-md z-50">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Create New Category</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={isSubmitting}
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter category name"
                  disabled={isSubmitting}
                />
              </div>

              {/* Parent ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent ID (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave empty for root category"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter parent category ID if this is a sub-category
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter category description"
                  disabled={isSubmitting}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <label className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span className="text-sm text-gray-600">Choose File</span>
                    <input
                      type="file"
                      accept=".jpeg,.jpg,.png,.gif"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                  </label>
                  {selectedFile && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 truncate max-w-[150px]">
                        {selectedFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-xs text-red-600 hover:text-red-800"
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Supported: JPEG, PNG, JPG, GIF (max 2MB)
                </p>
              </div>

              {/* Is Active */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Active Category
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !categoryName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}