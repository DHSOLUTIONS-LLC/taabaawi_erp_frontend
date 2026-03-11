// src/features/purchase/components/POStatusBadge.tsx
interface POStatusBadgeProps {
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  'Pending Approval': 'bg-yellow-100 text-yellow-700',
  Approved: 'bg-blue-100 text-blue-700',
  Ordered: 'bg-purple-100 text-purple-700',
  'Partially Received': 'bg-indigo-100 text-indigo-700',
  Received: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
  Returned: 'bg-orange-100 text-orange-700',
};

export default function POStatusBadge({ status }: POStatusBadgeProps) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}