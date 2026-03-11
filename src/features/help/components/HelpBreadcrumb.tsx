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
    <nav className="flex mb-4 text-sm">
      <Link to={`${basePath}/help`} className="text-gray-500 hover:text-blue-600">
        Help Center
      </Link>
      
      {items.map((item, index) => (
        <span key={index} className="flex items-center">
          <span className="mx-2 text-gray-400">/</span>
          {item.path ? (
            <Link to={`${basePath}/${item.path}`} className="text-gray-500 hover:text-blue-600">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}