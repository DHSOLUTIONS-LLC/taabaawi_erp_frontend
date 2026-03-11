// src/features/accounting/components/ReportActions.tsx
interface ReportActionsProps {
  onExport: (format: 'pdf' | 'excel') => void;
  onPrint: () => void;
  onRefresh: () => void;
}

export default function ReportActions({ onExport, onPrint, onRefresh }: ReportActionsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onRefresh}
        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        title="Refresh"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
      <button
        onClick={onPrint}
        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        title="Print"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      </button>
      <div className="relative group">
        <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-300 rounded-lg shadow-lg hidden group-hover:block z-50">
          <button
            onClick={() => onExport('pdf')}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
          >
            Export PDF
          </button>
          <button
            onClick={() => onExport('excel')}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
          >
            Export Excel
          </button>
        </div>
      </div>
    </div>
  );
}