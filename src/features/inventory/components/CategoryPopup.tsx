// src/layouts/components/CategoryPopup.tsx
import { useState } from 'react';
import { X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';

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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  return (
    <>
      {/* Backdrop - responsive overlay */}
      <div 
        className="fixed inset-0 bg-black/30 bg-opacity-50 z-40 transition-opacity duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal Container - fully responsive */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-auto my-4 sm:my-8 transform transition-all duration-300">
            {/* Header - responsive padding and font sizes */}
            <div className="sticky top-0 bg-white rounded-t-lg border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Create New Category
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                  disabled={isSubmitting}
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            {/* Body - responsive padding and spacing */}
            <div className="px-4 sm:px-6 py-4 sm:py-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md animate-shake">
                  <p className="text-xs sm:text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Category Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="Enter category name"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Parent ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Parent ID <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="Leave empty for root category"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Enter parent category ID if this is a sub-category
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    rows={3}
                    placeholder="Enter category description"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Image Upload - Enhanced responsive design */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Image <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                  </label>
                  
                  {imagePreview ? (
                    // Image Preview Mode
                    <div className="relative">
                      <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        <img 
                          src={imagePreview} 
                          alt="Category preview" 
                          className="w-full h-40 sm:h-48 object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                          disabled={isSubmitting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Upload Mode
                    <div className="relative">
                      <label className={`
                        flex flex-col items-center justify-center w-full 
                        h-32 sm:h-40 
                        border-2 border-dashed border-gray-300 rounded-lg 
                        cursor-pointer 
                        hover:border-blue-500 hover:bg-blue-50 
                        transition-all duration-200
                        ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                      `}>
                        <div className="flex flex-col items-center justify-center pt-4 pb-5">
                          <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mb-2" />
                          <p className="text-xs sm:text-sm text-gray-500 text-center px-4">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            JPEG, PNG, JPG, GIF (max 2MB)
                          </p>
                        </div>
                        <input
                          type="file"
                          accept=".jpeg,.jpg,.png,.gif"
                          onChange={handleFileChange}
                          className="hidden"
                          disabled={isSubmitting}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Is Active - Toggle Switch */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                      Active Category
                    </label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Inactive categories won't be visible to customers
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`
                      relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full 
                      border-2 border-transparent transition-colors duration-200 ease-in-out 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      ${isActive ? 'bg-blue-600' : 'bg-gray-200'}
                      ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    disabled={isSubmitting}
                  >
                    <span
                      className={`
                        pointer-events-none inline-block h-5 w-5 transform rounded-full 
                        bg-white shadow ring-0 transition duration-200 ease-in-out
                        ${isActive ? 'translate-x-5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </div>

                {/* Action Buttons - responsive layout */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !categoryName.trim()}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      'Create Category'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </>
  );
}