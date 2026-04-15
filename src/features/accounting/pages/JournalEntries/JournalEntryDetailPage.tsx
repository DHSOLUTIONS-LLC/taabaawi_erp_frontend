// src/features/accounting/pages/journal-entries/JournalEntryDetailPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import {
  useGetJournalEntryByIdQuery,
  usePostJournalEntryMutation,
  useReverseJournalEntryMutation,
} from '../../../../services/accountingApi';
import JournalEntryLines from '../../components/JournalEntryLines';
import PostJournalEntryModal from '../../components/PostJournalEntryModal';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import edit_icon from '../../../../assets/icons/edit_icon.svg';
import check_icon from '../../../../assets/icons/check_icon.png';
import close_icon from '../../../../assets/icons/cross_icon.svg';

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Posted: 'bg-green-100 text-green-700',
  Reversed: 'bg-red-100 text-red-700',
};

const num = (v: any) => parseFloat(v) || 0;

export default function JournalEntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState(false);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const journalId = id ? parseInt(id, 10) : 0;
  const { data, isLoading, refetch } = useGetJournalEntryByIdQuery(journalId);
  const [postJournal, { isLoading: isPosting }] = usePostJournalEntryMutation();
  const [reverseJournal, { isLoading: isReversing }] = useReverseJournalEntryMutation();

  const journal = (data as any)?.data;

  const handlePost = async () => {
    try {
      await postJournal(journalId).unwrap();
      refetch();
      setShowPostModal(false);
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to post journal entry');
    }
  };

  const handleReverse = async (data?: { reversal_date: string; reason: string }) => {
    if (!data) return;
    try {
      await reverseJournal({
        id: journalId,
        reversal_date: data.reversal_date,
        reason: data.reason,
      }).unwrap();
      refetch();
      setShowReverseModal(false);
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to reverse journal entry');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!journal) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-red-500 font-medium">Journal entry not found</p>
          <button
            onClick={() => navigate(`${basePath}/accounting/journal-entries`)}
            className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Back to Journal Entries
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const canEdit = journal.status === 'Draft';
  const canPost = journal.status === 'Draft';
  const canReverse = journal.status === 'Posted';

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate(`${basePath}/accounting/journal-entries`)}
              className="flex-shrink-0 mt-1"
            >
              <img src={arrow_back_icon} alt="" className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{journal.journal_number}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[journal.status]}`}>
                  {journal.status}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">
                {new Date(journal.entry_date).toLocaleDateString()} · {journal.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {canEdit && (
              <button
                onClick={() => navigate(`${basePath}/accounting/journal-entries/edit/${journal.id}`)}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 text-sm sm:text-base"
              >
                <img src={edit_icon} alt="" className="w-4 h-4" />
                Edit
              </button>
            )}
            {canPost && (
              <button
                onClick={() => setShowPostModal(true)}
                disabled={isPosting}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm sm:text-base"
              >
                <img src={check_icon} alt="" className="w-4 h-4" />
                {isPosting ? 'Posting...' : 'Post Entry'}
              </button>
            )}
            {canReverse && (
              <button
                onClick={() => setShowReverseModal(true)}
                disabled={isReversing}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm sm:text-base"
              >
                <img src={close_icon} alt="" className="w-4 h-4" />
                {isReversing ? 'Reversing...' : 'Reverse Entry'}
              </button>
            )}
          </div>
        </div>

        {/* Journal Details */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - 2/3 width on desktop, full width on mobile */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Journal Lines */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Journal Lines</h2>
              <div className="overflow-x-auto">
                <JournalEntryLines
                  lines={journal.lines?.map((l: any) => ({
                    id: `line-${l.id}`,
                    account_id: l.account_id.toString(),
                    description: l.description,
                    debit: num(l.debit),
                    credit: num(l.credit),
                  })) || []}
                  onChange={() => { }}
                  currency="KWD"
                  readOnly
                />
              </div>
            </div>

            {/* Notes */}
            {journal.notes && (
              <div className="bg-white rounded-xl p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Notes</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{journal.notes}</p>
              </div>
            )}
          </div>

          {/* Right Column - 1/3 width on desktop, full width on mobile */}
          <div className="space-y-4 sm:space-y-6">
            {/* Reference Info */}
            {journal.reference_type && (
              <div className="bg-white rounded-xl p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Reference</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{journal.reference_type}</p>
                  </div>
                  {journal.reference_number && (
                    <div>
                      <p className="text-xs text-gray-500">Number</p>
                      <p className="text-sm font-medium text-blue-600 mt-1 break-words">{journal.reference_number}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Audit Info */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Audit Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Created By</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{journal.createdBy?.name || '—'}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(journal.created_at).toLocaleString()}
                  </p>
                </div>
                {journal.postedBy && (
                  <div>
                    <p className="text-xs text-gray-500">Posted By</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{journal.postedBy.name}</p>
                    <p className="text-xs text-gray-400">
                      {journal.posted_at ? new Date(journal.posted_at).toLocaleString() : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total Debit</span>
                  <span className="text-sm font-mono font-bold text-blue-600 whitespace-nowrap">
                    KWD {num(journal.total_debit).toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total Credit</span>
                  <span className="text-sm font-mono font-bold text-blue-600 whitespace-nowrap">
                    KWD {num(journal.total_credit).toFixed(3)}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500">Status</span>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{journal.status}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post Modal */}
      {showPostModal && (
        <PostJournalEntryModal
          type="post"
          journalNumber={journal.journal_number}
          onConfirm={handlePost}
          onClose={() => setShowPostModal(false)}
          isLoading={isPosting}
        />
      )}

      {/* Reverse Modal */}
      {showReverseModal && (
        <PostJournalEntryModal
          type="reverse"
          journalNumber={journal.journal_number}
          onConfirm={(data) => handleReverse(data!)}
          onClose={() => setShowReverseModal(false)}
          isLoading={isReversing}
        />
      )}
    </DashboardLayout>
  );
}