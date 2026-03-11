// src/features/accounting/components/StatusBadge.tsx
interface StatusBadgeProps {
  status: string;
  type?: 'default' | 'payment' | 'account' | 'journal';
  size?: 'sm' | 'md';
}

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-red-100 text-red-700',
  Draft: 'bg-gray-100 text-gray-700',
  Posted: 'bg-blue-100 text-blue-700',
  Reversed: 'bg-purple-100 text-purple-700',
  Paid: 'bg-green-100 text-green-700',
  Unpaid: 'bg-red-100 text-red-700',
  Partial: 'bg-yellow-100 text-yellow-700',
  Overdue: 'bg-orange-100 text-orange-700',
  Asset: 'bg-blue-100 text-blue-700',
  Liability: 'bg-orange-100 text-orange-700',
  Equity: 'bg-purple-100 text-purple-700',
  Revenue: 'bg-green-100 text-green-700',
  Expense: 'bg-red-100 text-red-700',
  'Cost of Goods Sold': 'bg-yellow-100 text-yellow-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Completed: 'bg-blue-100 text-blue-700',
  Cleared: 'bg-cyan-100 text-cyan-700',
  Reconciled: 'bg-indigo-100 text-indigo-700',
  Void: 'bg-gray-100 text-gray-700',
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getColorClass = () => {
    // If status exists in predefined colors, use it
    if (STATUS_COLORS[status]) {
      return STATUS_COLORS[status];
    }

    // Otherwise generate a consistent color based on status string
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-purple-100 text-purple-700',
      'bg-orange-100 text-orange-700',
      'bg-cyan-100 text-cyan-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700',
    ];

    const hash = status.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const formatStatus = (status: string) => {
    // Convert camelCase or snake_case to Title Case
    return status
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <span className={`inline-flex items-center justify-center rounded-full font-medium ${SIZE_CLASSES[size]} ${getColorClass()}`}>
      {formatStatus(status)}
    </span>
  );
}