// src/features/accounting/components/ExpenseStatsCards.tsx
interface ExpenseStatsCardsProps {
  stats: {
    total_expenses?: number;
    total_amount?: string;
    pending_amount?: string;
    approved_amount?: string;
    paid_amount?: string;
    by_category?: any[];
  };
  isLoading?: boolean;
}

export default function ExpenseStatsCards({
  stats,
  isLoading,
}: ExpenseStatsCardsProps) {
  if (isLoading)
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 animate-pulse h-28" />
      </div>
    );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
        <p className="text-sm text-blue-600">Total Expenses</p>
        <p className="text-2xl font-bold text-blue-700">
          {stats?.total_expenses || 0}
        </p>
        <p className="text-xs text-blue-500 mt-1">Total transactions</p>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
        <p className="text-sm text-green-600">Total Amount</p>
        <p className="text-2xl font-bold text-green-700">
          KWD {stats?.total_amount || "0.000"}
        </p>
        <p className="text-xs text-green-500 mt-1">All expenses combined</p>
      </div>
      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border border-yellow-200">
        <p className="text-sm text-yellow-600">Pending Approval</p>
        <p className="text-2xl font-bold text-yellow-700">
          KWD {stats?.pending_amount || "0.000"}
        </p>
        <p className="text-xs text-yellow-500 mt-1">Awaiting review</p>
      </div>
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-5 border border-emerald-200">
        <p className="text-sm text-emerald-600">Paid Expenses</p>
        <p className="text-2xl font-bold text-emerald-700">
          KWD {stats?.paid_amount || "0.000"}
        </p>
        <p className="text-xs text-emerald-500 mt-1">Completed payments</p>
      </div>
    </div>
  );
}
