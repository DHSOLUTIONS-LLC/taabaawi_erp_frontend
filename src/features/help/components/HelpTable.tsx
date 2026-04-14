import { useState } from 'react';


interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface HelpTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  onToggleActive?: (item: T) => void;
  isLoading?: boolean;
  showActions?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function HelpTable<T extends { id: number; is_active?: boolean }>({
  columns,
  data,
  onEdit,
  onDelete,
  onView,
  onToggleActive,
  isLoading,
  showActions = true,
  canEdit = true,
  canDelete = true,
}: HelpTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const handleSelectAll = () => {
    if (selectedRows.length === data.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.map(item => item.id));
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-24 bg-white rounded-xl">
        <p className="text-sm sm:text-base text-gray-500 font-medium">No data found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
        <div className="xl:col-span-4 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                {columns.map((column, index) => (
                  <th
                    key={column.key as string}
                    className={`px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap ${column.className || ''}`}
                    style={{
                      width: index === 0 ? '30%' :
                        index === 1 ? '15%' :
                          index === 2 ? '12%' :
                            index === 3 ? '12%' :
                              index === 4 ? '8%' :
                                index === 5 ? '10%' :
                                  'auto'
                    }}
                  >
                    {column.label}
                  </th>
                ))}
                {showActions && (
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-gray-600 uppercase whitespace-nowrap w-24">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(item.id)}
                      onChange={() => handleSelectRow(item.id)}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  {columns.map(column => (
                    <td key={column.key as string} className={`px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm align-top ${column.className || ''}`}>
                      {column.render
                        ? column.render(item)
                        : String(item[column.key as keyof T] ?? '-')}
                    </td>
                  ))}
                  {showActions && (
                    <td className="px-3 sm:px-6 py-3 sm:py-4 align-top">
                      <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2">
                        {onToggleActive && item.is_active !== undefined && (
                          <button
                            onClick={() => onToggleActive(item)}
                            className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors ${item.is_active ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${item.is_active ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0.5 sm:translate-x-1'
                                }`}
                            />
                          </button>
                        )}

                        {onView && (
                          <button
                            onClick={() => onView(item)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}

                        {onEdit && canEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}

                        {onDelete && canDelete && (
                          <button
                            onClick={() => onDelete(item)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRows.length > 0 && (
        <div className="bg-gray-50 px-3 sm:px-6 py-2 sm:py-3 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-xs sm:text-sm text-gray-600">
              {selectedRows.length} item(s) selected
            </span>
            <button
              onClick={() => setSelectedRows([])}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-700"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}