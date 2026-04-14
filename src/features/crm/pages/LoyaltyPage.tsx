import { useDispatch, useSelector } from 'react-redux';
import { Star, TrendingUp, Gift, Users, RefreshCw, Filter } from 'lucide-react';
import { useState } from 'react';
import { StatCard } from '../components/customers/CustomerCard';
import { TierBadge } from '../components/customers/CustomerStatusBadge';
import { AdjustPointsModal } from '../components/loyalty/LoyaltyComponent';
import { setLoyaltyFilters, openAdjustPointsModal } from '../crmSlice';
import { useGetLoyaltyStatisticsQuery, useGetCustomersQuery } from '../../../services/crmApi';
import type { RootState } from '../../../app/store';
import DashboardLayout from '../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../app/hooks';

export const LoyaltyPage = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const dispatch = useDispatch();
  const loyaltyFilters = useSelector((s: RootState) => s.crm.loyaltyFilters);

  const { data: statsData, isLoading: statsLoading, refetch } = useGetLoyaltyStatisticsQuery({
    start_date: loyaltyFilters.start_date ?? undefined,
    end_date: loyaltyFilters.end_date ?? undefined,
  });

  // Top loyalty members
  const { data: topData, isLoading: topLoading } = useGetCustomersQuery({
    sort_by: 'loyalty_points',
    sort_order: 'desc',
    per_page: 10,
    status: 'Active',
  });

  const stats = statsData?.data;
  const topMembers = Array.isArray(topData?.data) ? topData.data : [];

  const tierColors: Record<string, string> = {
    Bronze: 'bg-orange-500',
    Silver: 'bg-slate-400',
    Gold: 'bg-yellow-500',
    Platinum: 'bg-purple-500',
  };

  const hasActiveFilters = loyaltyFilters.start_date || loyaltyFilters.end_date;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto ">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Loyalty Program</h1>
              <p className="text-sm text-gray-500 mt-0.5">Points, tiers, and member overview</p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={refetch}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filters Section */}
          <div className="mb-6">
            {/* Mobile Filter Toggle */}
            <div className="sm:hidden mb-3">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Date Range</span>
                  {hasActiveFilters && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">
                      Active
                    </span>
                  )}
                </div>
                <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showMobileFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Date Filters */}
            <div className={`${showMobileFilters ? 'block' : 'hidden'} sm:block`}>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <input
                  type="date"
                  className="w-full sm:w-auto border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={loyaltyFilters.start_date ?? ''}
                  onChange={e => dispatch(setLoyaltyFilters({ start_date: e.target.value || null }))}
                />
                <span className="hidden sm:inline text-gray-400 self-center">to</span>
                <input
                  type="date"
                  className="w-full sm:w-auto border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={loyaltyFilters.end_date ?? ''}
                  onChange={e => dispatch(setLoyaltyFilters({ end_date: e.target.value || null }))}
                />
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      dispatch(setLoyaltyFilters({ start_date: null, end_date: null }));
                      setShowMobileFilters(false);
                    }}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Clear dates
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard
              label="Total Members"
              value={stats?.total_members?.toLocaleString() ?? '0'}
              icon={Users}
              color="blue"
              loading={statsLoading}
            />
            <StatCard
              label="Points Earned"
              value={stats?.total_points_earned?.toLocaleString() ?? '0'}
              icon={Star}
              color="orange"
              loading={statsLoading}
            />
            <StatCard
              label="Points Redeemed"
              value={stats?.total_points_redeemed?.toLocaleString() ?? '0'}
              icon={Gift}
              color="purple"
              loading={statsLoading}
            />
            <StatCard
              label="Redemption Rate"
              value={stats?.redemption_rate ? `${stats.redemption_rate.toFixed(1)}%` : '0'}
              sub={`Avg ${stats?.average_points_per_customer?.toLocaleString() ?? '0'} pts/member`}
              icon={TrendingUp}
              color="green"
              loading={statsLoading}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Tier breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-4">
              <h2 className="font-medium text-gray-800 text-sm sm:text-base">Members by Tier</h2>
              {statsLoading
                ? <div className="space-y-3 animate-pulse">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded" />
                  ))}
                </div>
                : (stats?.by_tier ?? []).map(tier => {
                  const total = stats?.total_members || 1;
                  const pct = Math.round((tier.count / total) * 100);
                  return (
                    <div key={tier.loyalty_tier} className="space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm">
                        <div className="flex items-center gap-2 flex-wrap">
                          <TierBadge tier={tier.loyalty_tier} />
                          <span className="text-gray-600 text-xs sm:text-sm">{tier.count?.toLocaleString()} members</span>
                        </div>
                        <span className="text-gray-400 text-xs">{tier.total_points?.toLocaleString()} pts</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${tierColors[tier.loyalty_tier] ?? 'bg-gray-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              }
            </div>

            {/* Top members - Card based layout for better mobile display */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-200">
                <h2 className="font-medium text-gray-800 text-sm sm:text-base">Top Members by Points</h2>
              </div>
              {topLoading
                ? <div className="p-4 space-y-3 animate-pulse">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded" />
                  ))}
                </div>
                : topMembers.length === 0
                  ? <div className="p-8 text-center text-sm text-gray-400">No members yet</div>
                  : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              #
                            </th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tier
                            </th>
                            <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Points
                            </th>
                            <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {topMembers.map((m: any, idx: number) => (
                            <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-3 sm:px-4 py-3 text-gray-400 font-medium">
                                #{idx + 1}
                              </td>
                              <td className="px-3 sm:px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-semibold text-blue-600">
                                      {m.first_name?.[0]}{m.last_name?.[0]}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-800 truncate max-w-[150px] sm:max-w-[200px]">
                                      {m.full_name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-[200px]">
                                      {m.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 py-3">
                                <TierBadge tier={m.loyalty_tier} />
                              </td>
                              <td className="px-3 sm:px-4 py-3 text-right font-semibold text-gray-900">
                                {m.loyalty_points?.toLocaleString() || 0}
                              </td>
                              <td className="px-3 sm:px-4 py-3 text-center">
                                <button
                                  onClick={() => dispatch(openAdjustPointsModal({ mode: 'add', customer: m }))}
                                  className="p-1.5 hover:bg-green-100 text-gray-400 hover:text-green-600 rounded-lg transition-colors"
                                  title="Add points"
                                >
                                  <Star className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
              }
            </div>
          </div>

          <AdjustPointsModal />
        </div>
      </div>
    </DashboardLayout>
  );
};