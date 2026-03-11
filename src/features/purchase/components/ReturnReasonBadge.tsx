// src/features/purchase/components/ReturnReasonBadge.tsx

const REASON_COLORS: Record<string, string> = {
  Damaged: 'bg-red-100 text-red-700',
  Defective: 'bg-orange-100 text-orange-700',
  'Wrong Item': 'bg-purple-100 text-purple-700',
  'Excess Quantity': 'bg-yellow-100 text-yellow-700',
  Other: 'bg-gray-100 text-gray-700',
};

interface ReturnReasonBadgeProps {
  reason: string;
}

export default function ReturnReasonBadge({ reason }: ReturnReasonBadgeProps) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${REASON_COLORS[reason] || 'bg-gray-100 text-gray-700'}`}>
      {reason}
    </span>
  );
}