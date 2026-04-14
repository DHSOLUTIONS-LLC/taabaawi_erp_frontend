// src/features/help/components/HelpSidebar.tsx
import { useNavigate } from 'react-router-dom';
import { useGetHelpCategoriesQuery } from '../../../services/helpApi';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { setFilters } from '../helpSlice';
import type { RootState } from '../../../app/store';

const MODULES = [
  'General',
  'User Management',
  'Branch Management',
  'Product & Inventory',
  'HR Management',
  'POS',
  'Sales & Orders',
  'Purchase Management',
  'Accounting',
  'CRM',
  'Reporting',
  'System Settings'
];

interface HelpSidebarProps {
  onMobileItemClick?: () => void;
}

export default function HelpSidebar({ onMobileItemClick }: HelpSidebarProps) {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { filters } = useAppSelector(state => state.help);

  const { data: categoriesData } = useGetHelpCategoriesQuery({ is_active: 1 as any });

  const categories = Array.isArray(categoriesData?.data) ? categoriesData.data : [];

  const handleModuleChange = (module: string) => {
    dispatch(setFilters({ module, category_id: null, page: 1 }));
    // Close sidebar on mobile after selection
    if (onMobileItemClick) {
      onMobileItemClick();
    }
  };

  const handleCategoryClick = (categoryId: number) => {
    dispatch(setFilters({ category_id: categoryId }));
    navigate(`${basePath}/help/browse?category=${categoryId}`);
    // Close sidebar on mobile after selection
    if (onMobileItemClick) {
      onMobileItemClick();
    }
  };

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 bg-white border-b lg:border-r border-gray-200 lg:h-[calc(100vh-4rem)] lg:sticky top-16 overflow-y-auto">
      <div className="p-3 sm:p-4">
        {/* Modules Section */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3 px-2">
            Modules
          </h3>
          <div className="space-y-0.5 sm:space-y-1">
            <button
              onClick={() => handleModuleChange('')}
              className={`w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors ${filters.module === ''
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              All Modules
            </button>
            {MODULES.map(module => (
              <button
                key={module}
                onClick={() => handleModuleChange(module)}
                className={`w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors ${filters.module === module
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <span className="truncate block">{module}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3 px-2">
            Categories
          </h3>
          <div className="space-y-0.5 sm:space-y-1">
            {categories.length === 0 ? (
              <p className="text-xs sm:text-sm text-gray-500 italic px-2 py-2">No categories</p>
            ) : (
              categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-between ${filters.category_id === category.id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <span className="truncate flex-1">{category.category_name}</span>
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {category.article_count || 0}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}