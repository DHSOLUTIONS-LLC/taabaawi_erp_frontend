// src/features/hr/components/EmployeeDocuments.tsx
import { useState } from 'react';
import {
  useGetEmployeeDocumentsQuery,
  useDeleteEmployeeDocumentMutation,
} from '../../../services/hrApi';
import DocumentUploadModal from './DocumentUploadModal';
import { useUploadEmployeeDocumentMutation } from '../../../services/hrApi';

interface EmployeeDocumentsProps {
  employeeId: number;
  employeeName?: string;
}

export default function EmployeeDocuments({ employeeId, employeeName }: EmployeeDocumentsProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
//   const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { data, isLoading, refetch } = useGetEmployeeDocumentsQuery(employeeId);
  const [uploadDocument, { isLoading: isUploading }] = useUploadEmployeeDocumentMutation();
  const [deleteDocument] = useDeleteEmployeeDocumentMutation();

  const documents = data?.data || [];

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Contract: 'bg-blue-100 text-blue-700',
      'ID Copy': 'bg-gray-100 text-gray-700',
      Passport: 'bg-purple-100 text-purple-700',
      'Work Permit': 'bg-green-100 text-green-700',
      Visa: 'bg-yellow-100 text-yellow-700',
      Certificate: 'bg-indigo-100 text-indigo-700',
      Other: 'bg-gray-100 text-gray-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (daysLeft < 0) return { text: 'Expired', color: 'text-red-600 bg-red-50' };
    if (daysLeft <= 30) return { text: `${daysLeft} days left`, color: 'text-yellow-600 bg-yellow-50' };
    return { text: `${daysLeft} days left`, color: 'text-green-600 bg-green-50' };
  };

  const handleUpload = async (formData: FormData) => {
    formData.append('user_id', employeeId.toString());
    await uploadDocument({ employeeId, data: formData }).unwrap();
    refetch();
    setShowUploadModal(false);
  };

  const handleDelete = async (docId: number) => {
    if (confirm('Are you sure you want to delete this document?')) {
      setDeletingId(docId);
      await deleteDocument(docId).unwrap();
      refetch();
      setDeletingId(null);
    }
  };

  const handleDownload = async (docId: number, fileName: string) => {
    // This requires backend to implement download endpoint
    // For now, just show alert
    alert('Download endpoint coming soon');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Employee Documents</h3>
          {employeeName && <p className="text-sm text-gray-500">{employeeName}</p>}
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Upload Document
        </button>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500">No documents uploaded yet</p>
          <p className="text-sm text-gray-400 mt-1">Upload contracts, IDs, visas, and other documents</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc: any) => {
            const expiryStatus = getExpiryStatus(doc.expiry_date);
            return (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.document_name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getDocumentTypeColor(doc.document_type)}`}>
                          {doc.document_type}
                        </span>
                        {expiryStatus && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${expiryStatus.color}`}>
                            {expiryStatus.text}
                          </span>
                        )}
                        {doc.uploaded_by && (
                          <span className="text-xs text-gray-400">
                            Uploaded by: {doc.uploaded_by?.name}
                          </span>
                        )}
                      </div>
                      {doc.notes && <p className="text-sm text-gray-500 mt-1">{doc.notes}</p>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(doc.id, doc.document_name)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === doc.id ? (
                      <div className="w-5 h-5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
        isUploading={isUploading}
      />
    </div>
  );
}