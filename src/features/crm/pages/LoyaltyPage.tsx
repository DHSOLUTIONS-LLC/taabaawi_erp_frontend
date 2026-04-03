import { useDispatch, useSelector } from 'react-redux';
import { Star, TrendingUp, Gift, Users, RefreshCw } from 'lucide-react';
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
    Bronze:   'bg-orange-500',
    Silver:   'bg-slate-400',
    Gold:     'bg-yellow-500',
    Platinum: 'bg-purple-500',
  };


  //  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  //   const basePath = isSuperAdmin ? '/admin' : '';


  return (
   <DashboardLayout>
     <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Loyalty Program</h1>
          <p className="text-sm text-gray-500 mt-0.5">Points, tiers, and member overview</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range */}
          <input
            type="date"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={loyaltyFilters.start_date ?? ''}
            onChange={e => dispatch(setLoyaltyFilters({ start_date: e.target.value || null }))}
          />
          <input
            type="date"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={loyaltyFilters.end_date ?? ''}
            onChange={e => dispatch(setLoyaltyFilters({ end_date: e.target.value || null }))}
          />
          <button
            onClick={refetch}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tier breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-medium text-gray-800">Members by Tier</h2>
          {statsLoading
            ? <div className="space-y-3 animate-pulse">{Array.from({length:4}).map((_,i)=>(
                <div key={i} className="h-10 bg-gray-100 rounded"/>
              ))}</div>
            : (stats?.by_tier ?? []).map(tier => {
                const total = stats?.total_members || 1;
                const pct = Math.round((tier.count / total) * 100);
                return (
                  <div key={tier.loyalty_tier} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <TierBadge tier={tier.loyalty_tier} />
                        <span className="text-gray-600">{tier.count?.toLocaleString()} members</span>
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

        {/* Top members */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-medium text-gray-800">Top Members by Points</h2>
          {topLoading
            ? <div className="space-y-2 animate-pulse">{Array.from({length:8}).map((_,i)=>(
                <div key={i} className="h-10 bg-gray-100 rounded"/>
              ))}</div>
            : topMembers.length === 0
            ? <p className="text-sm text-gray-400 text-center py-6">No members yet</p>
            : (
              <div className="divide-y divide-gray-50">
                {topMembers.map((m: any, idx: number) => (
                  <div key={m.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-300 w-5 text-center">
                        {idx + 1}
                      </span>
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-600">
                          {m.first_name?.[0]}{m.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{m.full_name}</p>
                        <p className="text-xs text-gray-400">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {m.loyalty_points?.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">points</p>
                      </div>
                      <TierBadge tier={m.loyalty_tier} />
                      <button
                        onClick={() => dispatch(openAdjustPointsModal({ mode: 'add', customer: m }))}
                        className="p-1.5 hover:bg-green-50 text-gray-300 hover:text-green-600 rounded text-xs"
                        title="Add points"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>

      <AdjustPointsModal />
    </div>
   </DashboardLayout>
  );
};