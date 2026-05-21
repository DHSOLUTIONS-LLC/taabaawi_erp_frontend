// src/features/hr/components/DocumentAlerts.tsx
import { useState } from 'react';
import { useGetExpiringDocumentsQuery, useGetExpiredDocumentsQuery } from '../../../services/hrApi';

interface DocumentAlertsProps {
  onViewEmployee?: (employeeId: number) => void;
}

export default function DocumentAlerts({ onViewEmployee }: DocumentAlertsProps) {
  const [showExpiring, setShowExpiring] = useState(true);
  const [showExpired, setShowExpired] = useState(true);

  const { data: expiringData, isLoading: expiringLoading } = useGetExpiringDocumentsQuery();
  const { data: expiredData, isLoading: expiredLoading } = useGetExpiredDocumentsQuery();

  const expiringDocs = expiringData?.data || [];
  const expiredDocs = expiredData?.data || [];

  if (expiringLoading || expiredLoading) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="animate-pulse">Loading alerts...</div>
      </div>
    );
  }

  if (expiringDocs.length === 0 && expiredDocs.length === 0) {
    return (
      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-green-700">All documents are up to date. No expiring or expired documents.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Expiring Documents */}
      {expiringDocs.length > 0 && showExpiring && (
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-yellow-200">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-semibold text-yellow-800">
                Expiring Soon ({expiringDocs.length} document{expiringDocs.length !== 1 ? 's' : ''})
              </h3>
            </div>
            <button onClick={() => setShowExpiring(false)} className="text-yellow-600 hover:text-yellow-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="divide-y divide-yellow-100">
            {expiringDocs.map((doc: any) => {
              const daysLeft = Math.ceil((new Date(doc.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
              return (
                <div key={doc.id} className="p-4 hover:bg-yellow-100/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{doc.document_name}</p>
                      <p className="text-sm text-gray-600">
                        {doc.user?.name} • {doc.document_type}
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Expires: {new Date(doc.expiry_date).toLocaleDateString()} ({daysLeft} days left)
                      </p>
                    </div>
                    {onViewEmployee && (
                      <button
                        onClick={() => onViewEmployee(doc.user_id)}
                        className="px-3 py-1 text-sm text-yellow-700 border border-yellow-300 rounded-lg hover:bg-yellow-100"
                      >
                        View Employee
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expired Documents */}
      {expiredDocs.length > 0 && showExpired && (
        <div className="bg-red-50 rounded-xl border border-red-200 overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-red-200">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-semibold text-red-800">
                Expired Documents ({expiredDocs.length} document{expiredDocs.length !== 1 ? 's' : ''})
              </h3>
            </div>
            <button onClick={() => setShowExpired(false)} className="text-red-600 hover:text-red-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="divide-y divide-red-100">
            {expiredDocs.map((doc: any) => {
              const daysOverdue = Math.ceil((new Date().getTime() - new Date(doc.expiry_date).getTime()) / (1000 * 3600 * 24));
              return (
                <div key={doc.id} className="p-4 hover:bg-red-100/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{doc.document_name}</p>
                      <p className="text-sm text-gray-600">
                        {doc.user?.name} • {doc.document_type}
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Expired: {new Date(doc.expiry_date).toLocaleDateString()} ({daysOverdue} days overdue)
                      </p>
                    </div>
                    {onViewEmployee && (
                      <button
                        onClick={() => onViewEmployee(doc.user_id)}
                        className="px-3 py-1 text-sm text-red-700 border border-red-300 rounded-lg hover:bg-red-100"
                      >
                        View Employee
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}