import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  loading?: boolean;
}

const colors = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
  red: 'bg-red-50 text-red-600',
};

export const StatCard = ({ label, value, sub, icon: Icon, color = 'blue', loading }: Props) => (
  <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
    <div className={`p-2 sm:p-3 rounded-lg ${colors[color]}`}>
      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 truncate">{label}</p>
      {loading
        ? <div className="h-5 sm:h-6 w-16 sm:w-20 bg-gray-100 rounded animate-pulse mt-1" />
        : <p className="text-base sm:text-xl font-semibold text-gray-800 truncate">{value}</p>
      }
      {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
    </div>
  </div>
);