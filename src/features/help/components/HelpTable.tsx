// src/features/help/components/HelpTable.tsx
import { useState } from 'react';
import edit_icon from '../../../assets/icons/edit_icon.svg';
import delete_icon from '../../../assets/icons/delete-icon.png';
import view_icon from '../../../assets/icons/view-icon.png';

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
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl">
        <p className="text-gray-500 font-medium">No data found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 w-10">
                <input
                  type="checkbox"
                  checked={selectedRows.length === data.length && data.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              {columns.map(column => (
                <th
                  key={column.key as string}
                  className={`px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase ${column.className || ''}`}
                >
                  {column.label}
                </th>
              ))}
              {showActions && (
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(item.id)}
                    onChange={() => handleSelectRow(item.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
                {columns.map(column => (
                  <td key={column.key as string} className={`px-6 py-4 ${column.className || ''}`}>
                    {column.render
                      ? column.render(item)
                      : String(item[column.key as keyof T] ?? '-')}
                  </td>
                ))}
                {showActions && (
                  <td className="px-6 py-4">
                    <div className="flex justify-center items-center space-x-2">
                      {onToggleActive && item.is_active !== undefined && (
                        <button
                          onClick={() => onToggleActive(item)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            item.is_active ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              item.is_active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      )}
                      
                      {onView && (
                        <button
                          onClick={() => onView(item)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View"
                        >
                          <img src={view_icon} alt="View" className="w-4 h-4" />
                        </button>
                      )}
                      
                      {onEdit && canEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                          title="Edit"
                        >
                          <img src={edit_icon} alt="Edit" className="w-4 h-4" />
                        </button>
                      )}
                      
                      {onDelete && canDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <img src={delete_icon} alt="Delete" className="w-4 h-4" />
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

      {selectedRows.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedRows.length} item(s) selected
            </span>
            <button
              onClick={() => setSelectedRows([])}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}