import { useState, useRef, useEffect } from 'react';
import {
  useGenerateDiscountTemplateMutation,
  useImportBulkDiscountMutation
} from '../../../services/inventoryApi';
import toast from 'react-hot-toast';

interface BulkDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  filters?: {
    category_id?: number;
    start_date?: string;
    end_date?: string;
  };
}

export default function BulkDiscountModal({
  isOpen,
  onClose,
  onSuccess,
  filters
}: BulkDiscountModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    errors: string[];
    total_processed: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // API Mutations
  const [generateTemplate, { isLoading: isGenerating }] = useGenerateDiscountTemplateMutation();
  const [importBulkDiscount, { isLoading: isImporting }] = useImportBulkDiscountMutation();

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreviewData([]);
      setUploadProgress(0);
      setError(null);
      setIsDragging(false);
      setImportResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    setImportResult(null);

    // Check file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/vnd.oasis.opendocument.spreadsheet'
    ];

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidExtension = fileExtension === 'xlsx' || fileExtension === 'xls' || fileExtension === 'csv';

    if (!validTypes.includes(file.type) && !isValidExtension) {
      setError('Please upload a valid Excel file (.xlsx, .xls, or .csv)');
      setSelectedFile(null);
      return;
    }

    // Check file size (max 10MB as per your backend)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size should be less than 10MB');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);

    // Parse and preview for CSV files
    if (fileExtension === 'csv') {
      parseCSVFile(file);
    } else {
      // For Excel files, just show file name
      setPreviewData([{
        'File Name': file.name,
        'Size': `${(file.size / 1024).toFixed(2)} KB`,
        'Status': 'Ready for import'
      }]);
    }
  };

  const parseCSVFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length === 0) {
          setError('File is empty');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim());

        // Check required columns based on your backend
        const requiredColumns = ['Product ID', 'Discount Type', 'Discount Value'];
        const missingColumns = requiredColumns.filter(col =>
          !headers.some(h => h.toLowerCase().includes(col.toLowerCase()))
        );

        if (missingColumns.length > 0) {
          setError(`Missing required columns: ${missingColumns.join(', ')}`);
          setSelectedFile(null);
          return;
        }

        const previewRows = lines.slice(1, 6).map(line => {
          const values = line.split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });

        setPreviewData(previewRows);
      } catch (err) {
        console.error('Error parsing CSV:', err);
        setError('Error parsing CSV file. Please check the format.');
      }
    };

    reader.onerror = () => {
      setError('Error reading file');
    };

    reader.readAsText(file);
  };

  const downloadTemplate = async () => {
    try {
      toast.loading('Generating template...', { id: 'template-gen' });

      // Use filters from props or default to next 30 days
      const defaultDates = {
        start_date: filters?.start_date || new Date().toISOString().split('T')[0],
        end_date: filters?.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      const response = await generateTemplate({
        category_id: filters?.category_id,
        start_date: defaultDates.start_date,
        end_date: defaultDates.end_date
      }).unwrap();

      toast.dismiss('template-gen');

      // Download the file
      if (response.data?.download_url) {
        window.open(response.data.download_url, '_blank');
        toast.success(`✅ Template generated with ${response.data.total_items} items`);
      }
    } catch (error: any) {
      toast.dismiss('template-gen');
      toast.error(error.data?.message || 'Failed to generate template');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setUploadProgress(30);
      toast.loading('Importing discounts...', { id: 'import' });

      const response = await importBulkDiscount(formData).unwrap();

      setUploadProgress(100);
      toast.dismiss('import');

      // Store results
      setImportResult(response.data);

      // Show success message with counts
      toast.success(
        `✅ Import successful! Created: ${response.data.created}, Updated: ${response.data.updated}`
      );

      if (response.data.errors?.length > 0) {
        toast.error(`${response.data.errors.length} errors occurred`);
        console.log('Import errors:', response.data.errors);
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Close modal after 2 seconds on success
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      toast.dismiss('import');
      console.error('Bulk discount error:', err);
      setError(err.data?.message || 'Failed to import discounts. Please check your file format.');
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop with blur effect */}
      <div className="fixed inset-0  bg-opacity-50 transition-opacity" />

      {/* Modal container */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          {/* Modal panel */}
          <div
            ref={modalRef}
            className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Bulk Discount Import
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Upload an Excel file to apply discounts in bulk
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              {/* Filter Summary - Show if filters are applied */}
              {filters && (filters.category_id || filters.start_date) && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">📋 Active Filters</h4>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {filters.category_id && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        Category ID: {filters.category_id}
                      </span>
                    )}
                    {filters.start_date && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        From: {filters.start_date}
                      </span>
                    )}
                    {filters.end_date && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        To: {filters.end_date}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Template Download */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">📥 Download Template</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Get a pre-formatted Excel file with your products
                    </p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    disabled={isGenerating}
                    className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Template
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* File Upload Area */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Excel/CSV File
                </label>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-lg p-8
                    transition-all duration-200 cursor-pointer
                    ${isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    }
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div className="text-center">
                    <svg
                      className={`mx-auto h-12 w-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      .XLSX, .XLS, or .CSV (max 10MB)
                    </p>
                  </div>
                </div>

                {selectedFile && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mb-6">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Importing...</span>
                    <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {/* Import Results */}
              {importResult && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 mb-3">📊 Import Results</h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <div className="text-xl font-bold text-green-600">{importResult.created}</div>
                      <div className="text-xs text-gray-600">Created</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <div className="text-xl font-bold text-blue-600">{importResult.updated}</div>
                      <div className="text-xs text-gray-600">Updated</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <div className="text-xl font-bold text-purple-600">{importResult.total_processed}</div>
                      <div className="text-xs text-gray-600">Total</div>
                    </div>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-3">
                      <details className="text-sm">
                        <summary className="text-red-600 cursor-pointer hover:text-red-700">
                          ⚠️ {importResult.errors.length} error{importResult.errors.length > 1 ? 's' : ''} (click to view)
                        </summary>
                        <div className="mt-2 max-h-24 overflow-y-auto bg-red-50 p-2 rounded text-xs text-red-600">
                          {importResult.errors.map((err, idx) => (
                            <div key={idx} className="py-0.5">• {err}</div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              )}

              {/* Preview Data */}
              {previewData.length > 0 && !importResult && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview (First 5 rows)</h4>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          {Object.keys(previewData[0]).map((key) => (
                            <th
                              key={key}
                              className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {previewData.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((value: any, colIdx) => (
                              <td key={colIdx} className="px-3 py-2 text-xs text-gray-600">
                                {value || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-2">📋 File Format Instructions:</h4>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                  <li><span className="font-medium">Product ID:</span> Required - Product identifier from the template</li>
                  <li><span className="font-medium">Variant ID:</span> Optional - For product variants (leave blank for main product)</li>
                  <li><span className="font-medium">Discount Type:</span> 'Percentage' or 'Fixed Amount'</li>
                  <li><span className="font-medium">Discount Value:</span> Number (percentage value or fixed amount in KWD)</li>
                  <li><span className="font-medium">Start/End Date:</span> Format YYYY-MM-DD (pre-filled in template)</li>
                </ul>
                <p className="text-xs text-blue-600 mt-2">
                  💡 Download the template first, fill in the discount values, then upload back
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex w-full space-x-3">
                <button
                  onClick={onClose}
                  disabled={isImporting}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || isImporting || !!importResult}
                  className={`
                    w-full px-4 py-2 text-sm font-medium text-white rounded-lg 
                    transition-all duration-200 flex items-center justify-center
                    ${!selectedFile || isImporting || importResult
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow-md'
                    }
                  `}
                >
                  {isImporting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Importing...
                    </>
                  ) : importResult ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      ✓ Import Complete
                    </>
                  ) : (
                    'Import Bulk Discount'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}