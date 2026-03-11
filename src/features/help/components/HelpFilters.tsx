// src/features/help/components/HelpFilters.tsx
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { setFilters } from '../helpSlice';

const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const ARTICLE_TYPES = ['Guide', 'Tutorial', 'FAQ', 'Video', 'Troubleshooting', 'How To', 'Best Practices'];

export default function HelpFilters() {
  const dispatch = useAppDispatch();
  const { filters, activeTab } = useAppSelector((state) => state.help);

  if (activeTab === 'faqs') {
    return (
      <div className="bg-white rounded-lg p-4 mt-4 border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.module}
            onChange={(e) => dispatch(setFilters({ module: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Modules</option>
            <option value="General">General</option>
            <option value="User Management">User Management</option>
            <option value="POS">POS</option>
            <option value="Accounting">Accounting</option>
          </select>
        </div>
      </div>
    );
  }

  if (activeTab === 'articles') {
    return (
      <div className="bg-white rounded-lg p-4 mt-4 border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.difficulty}
            onChange={(e) => dispatch(setFilters({ difficulty: e.target.value as any }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Difficulties</option>
            {DIFFICULTY_LEVELS.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>

          <select
            value={filters.article_type}
            onChange={(e) => dispatch(setFilters({ article_type: e.target.value as any }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {ARTICLE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return null;
}