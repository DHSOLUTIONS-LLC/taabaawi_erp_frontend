// src/features/help/components/HelpBreadcrumb.tsx
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../../app/hooks';
import type { RootState } from '../../../app/store';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface HelpBreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function HelpBreadcrumb({ items }: HelpBreadcrumbProps) {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  return (
    <nav className="flex flex-wrap items-center text-xs sm:text-sm mb-3 sm:mb-4 overflow-x-auto whitespace-nowrap">
      <Link to={`${basePath}/help`} className="text-gray-500 hover:text-blue-600 transition-colors">
        Help Center
      </Link>

      {items.map((item, index) => (
        <span key={index} className="flex items-center flex-shrink-0">
          <span className="mx-1 sm:mx-2 text-gray-400">/</span>
          {item.path ? (
            <Link
              to={`${basePath}/${item.path}`}
              className="text-gray-500 hover:text-blue-600 transition-colors truncate max-w-[120px] sm:max-w-[200px] md:max-w-none"
              title={item.label}
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium truncate max-w-[120px] sm:max-w-[200px] md:max-w-none" title={item.label}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}