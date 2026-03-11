// src/features/accounting/pages/journal-entries/PostJournalEntryModal.tsx
import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface PostJournalEntryModalProps {
  type: 'post' | 'reverse';
  journalNumber: string;
  onConfirm: (data?: { reversal_date: string; reason: string }) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function PostJournalEntryModal({
  type,
  journalNumber,
  onConfirm,
  onClose,
  isLoading = false,
}: PostJournalEntryModalProps) {
  const [reversalDate, setReversalDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  const isReverse = type === 'reverse';

  const handleConfirm = () => {
  if (isReverse) {
    onConfirm({ reversal_date: reversalDate, reason });
  } else {
    onConfirm();
  }
};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {isReverse ? 'Reverse Journal Entry' : 'Post Journal Entry'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Journal Entry</p>
            <p className="text-base font-semibold text-gray-900">{journalNumber}</p>
          </div>

          {isReverse ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reversal Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={reversalDate}
                  onChange={(e) => setReversalDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reason for Reversal <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this entry needs to be reversed..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  This will create a reversing journal entry that negates the original transaction.
                  The original entry will be marked as reversed.
                </p>
              </div>
            </>
          ) : (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Once posted, this journal entry cannot be edited. It will affect account balances and appear in financial reports.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || (isReverse && (!reversalDate || !reason))}
              className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                isReverse ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isLoading ? 'Processing...' : isReverse ? 'Confirm Reversal' : 'Confirm Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}