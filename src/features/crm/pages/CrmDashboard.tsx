import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Users, UserCheck, UserPlus, TrendingUp, Star,
  GitMerge, ArrowRight, Mail,
  Award, RefreshCw, Activity,
} from 'lucide-react';
import { openCustomerModal } from '../crmSlice';
import {
  useGetCustomerStatisticsQuery,
  useGetLoyaltyStatisticsQuery,
  useGetCustomerDuplicatesQuery,
  useGetCustomersQuery,
} from '../../../services/crmApi';
import { CustomerStatusBadge, TierBadge } from '../components/customers/CustomerStatusBadge';
import { CustomerModal } from '../components/customers/CustomerModal';
import DashboardLayout from '../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../app/hooks';
import type { RootState } from '../../../app/store';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>{children}</div>
);

const CardHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
    <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
    {action}
  </div>
);

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-100 rounded animate-pulse ${className}`} />
);

interface StatCardProps {
  label: string;
  value?: string | number;
  change?: string;
  changeUp?: boolean;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
  onClick?: () => void;
}

const StatCard = ({ label, value, change, changeUp, icon: Icon, color, loading, onClick }: StatCardProps) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 ${onClick ? 'cursor-pointer hover:border-blue-200 hover:shadow-sm transition-all' : ''}`}
  >
    <div className={`p-2.5 rounded-lg ${color} shrink-0`}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {loading
        ? <Skeleton className="h-7 w-24 mb-1" />
        : <p className="text-2xl font-bold text-gray-900 tracking-tight">{value ?? '0'}</p>
      }
      {change && !loading && (
        <p className={`text-xs font-medium ${changeUp ? 'text-green-600' : 'text-red-500'}`}>
          {changeUp ? '↑' : '↓'} {change}
        </p>
      )}
    </div>
  </div>
);

// by_status from backend: [{ customer_status: 'Active', count: 3 }]
const StatusDistribution = ({ data, loading }: { data?: any[]; loading: boolean }) => {
  const total = data?.reduce((s, d) => s + Number(d.count), 0) ?? 0;
  const colors: Record<string, string> = {
    Active:   'bg-green-500',
    Inactive: 'bg-gray-300',
    Blocked:  'bg-red-500',
    Lead:     'bg-blue-500',
  };
  return (
    <div className="space-y-3">
      {loading
        ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8" />)
        : !data?.length
        ? <p className="text-sm text-gray-400 text-center py-4">No data</p>
        : data.map(d => {
            // backend returns customer_status key
            const status = d.customer_status ?? d.status ?? 'Unknown';
            const count  = Number(d.count);
            const pct    = total ? Math.round((count / total) * 100) : 0;
            return (
              <div key={status}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${colors[status] ?? 'bg-gray-300'}`} />
                    <span className="text-gray-600">{status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{count.toLocaleString()}</span>
                    <span className="text-gray-400 text-xs w-8 text-right">{pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${colors[status] ?? 'bg-gray-300'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
      }
    </div>
  );
};

// by_tier from loyalty: [{ loyalty_tier: 'Silver', count: 1, total_points: 4605 }]
const TierDistribution = ({ data, loading }: { data?: any[]; loading: boolean }) => {
  const tierColor: Record<string, string> = {
    Bronze:   'bg-orange-400',
    Silver:   'bg-slate-400',
    Gold:     'bg-yellow-400',
    Platinum: 'bg-purple-500',
  };
  const total = data?.reduce((s, d) => s + Number(d.count), 0) ?? 0;
  return (
    <div className="grid grid-cols-2 gap-3">
      {loading
        ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        : !data?.length
        ? <p className="text-sm text-gray-400 text-center py-4 col-span-2">No tier data</p>
        : data.map(d => {
            const name = d.loyalty_tier ?? d.tier ?? 'Unknown';
            const count = Number(d.count);
            const pct   = total ? Math.round((count / total) * 100) : 0;
            return (
              <div key={name} className="bg-gray-50 rounded-lg p-3 space-y-1">
                <TierBadge tier={name} />
                <p className="text-xl font-bold text-gray-800">{count.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{pct}% of members</p>
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${tierColor[name] ?? 'bg-gray-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
      }
    </div>
  );
};

export const CrmDashboard = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const navigate  = useNavigate();
  const dispatch  = useDispatch();

  const { data: statsData,   isLoading: statsLoading,   refetch: refetchStats } = useGetCustomerStatisticsQuery({});
  const { data: loyaltyData, isLoading: loyaltyLoading }                        = useGetLoyaltyStatisticsQuery({});
  const { data: dupData,     isLoading: dupLoading }                            = useGetCustomerDuplicatesQuery({ status: 'Pending', per_page: 5 });
  const { data: recentData,  isLoading: recentLoading }                         = useGetCustomersQuery({ sort_by: 'created_at', sort_order: 'desc', per_page: 5 });

  const stats   = statsData?.data;
  console.log('stats dash:',stats)
  const loyalty = loyaltyData?.data;
  console.log('loyalty:', loyalty)
  const dupes   = Array.isArray(dupData?.data)    ? dupData.data    : [];
  const recent  = Array.isArray(recentData?.data) ? recentData.data : [];

  // ── field mapping (backend → frontend) ──────────────────────────────────
  // stats.new_customers          (not new_customers_this_month)
  // stats.by_status              (not customers_by_status)
  // stats.top_spenders           (not top_customers)
  // loyalty.by_tier[].loyalty_tier (not tier)
  // loyalty.redemption_rate      → calculate: redeemed / earned * 100
  const redemptionRate = loyalty?.total_points_earned
    ? ((loyalty.total_points_redeemed / loyalty.total_points_earned) * 100).toFixed(1)
    : null;

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath     = isSuperAdmin ? '/admin' : '';

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">CRM Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Customer relationships at a glance</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetchStats()} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={() => dispatch(openCustomerModal({ mode: 'create' }))} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
              <UserPlus className="h-4 w-4" /> New Customer
            </button>
          </div>
        </div>

        {/* Customer KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Customers"
            value={stats?.total_customers?.toLocaleString()}
            icon={Users}
            color="bg-blue-50 text-blue-600"
            loading={statsLoading}
            onClick={() => navigate(`${basePath}/crm/customers`)}
          />
          <StatCard
            label="Active Customers"
            value={stats?.active_customers?.toLocaleString()}
            change={`${stats?.total_customers ? Math.round((stats.active_customers / stats.total_customers) * 100) : 0}% of total`}
            changeUp
            icon={UserCheck}
            color="bg-green-50 text-green-600"
            loading={statsLoading}
            onClick={() => navigate(`${basePath}/crm/customers`)}
          />
          <StatCard
            label="New This Month"
            value={stats?.new_customers?.toLocaleString()}   
            icon={UserPlus}
            color="bg-purple-50 text-purple-600"
            loading={statsLoading}
          />
          <StatCard
            label="Verified Customers"
            value={stats?.verified_customers?.toLocaleString()}
            icon={TrendingUp}
            color="bg-orange-50 text-orange-600"
            loading={statsLoading}
          />
        </div>

        {/* Loyalty KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Loyalty Members"
            value={loyalty?.total_members?.toLocaleString()}
            icon={Star}
            color="bg-yellow-50 text-yellow-600"
            loading={loyaltyLoading}
            onClick={() => navigate(`${basePath}/crm/loyalty`)}
          />
          <StatCard
            label="Points Earned"
            value={loyalty?.total_points_earned ? `${(loyalty.total_points_earned / 1000).toFixed(0)}k` : '0'}
            icon={Award}
            color="bg-amber-50 text-amber-600"
            loading={loyaltyLoading}
          />
          <StatCard
            label="Redemption Rate"
            value={redemptionRate ? `${redemptionRate}%` : '0'}   // ✅ calculated
            icon={Activity}
            color="bg-teal-50 text-teal-600"
            loading={loyaltyLoading}
          />
          <StatCard
            label="Pending Duplicates"
            value={dupData?.meta?.total ?? dupes.length}
            icon={GitMerge}
            color={(dupData?.meta?.total ?? 0) > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}
            loading={dupLoading}
            onClick={() => navigate(`${basePath}/crm/duplicates`)}
          />
        </div>

        {/* Middle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Status distribution */}
          <Card>
            <CardHeader title="Customers by Status" />
            <div className="p-5">
              <StatusDistribution
                data={stats?.by_status}   // ✅ was customers_by_status
                loading={statsLoading}
              />
            </div>
          </Card>

          {/* Tier distribution */}
          <Card>
            <CardHeader
              title="Loyalty Tiers"
              action={
                <button onClick={() => navigate(`${basePath}/crm/loyalty`)} className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                  View all <ArrowRight className="h-3 w-3" />
                </button>
              }
            />
            <div className="p-5">
              <TierDistribution
                data={loyalty?.by_tier}   // ✅ loyalty_tier key handled inside component
                loading={loyaltyLoading}
              />
            </div>
          </Card>

          {/* Top customers */}
          <Card>
            <CardHeader
              title="Top Customers"
              action={
                <button onClick={() => navigate(`${basePath}/crm/customers`)} className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                  View all <ArrowRight className="h-3 w-3" />
                </button>
              }
            />
            <div className="divide-y divide-gray-50">
              {statsLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-4 w-14" />
                    </div>
                  ))
                : !(stats?.top_spenders ?? []).length    // ✅ was top_customers
                ? <p className="text-sm text-gray-400 text-center py-8">No data</p>
                : (stats?.top_spenders ?? []).slice(0, 5).map((c: any) => (   // ✅ was top_customers
                    <div
                      key={c.id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`${basePath}/crm/customers/${c.id}`)}
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-blue-600">
                          {c.first_name?.[0]}{c.last_name?.[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {c.full_name ?? `${c.first_name} ${c.last_name}`}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{c.email}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-gray-700">${Number(c.total_spent || 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{c.total_orders} orders</p>
                      </div>
                    </div>
                  ))
              }
            </div>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recently Added */}
          <Card>
            <CardHeader
              title="Recently Added"
              action={
                <button onClick={() => navigate(`${basePath}/crm/customers`)} className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                  View all <ArrowRight className="h-3 w-3" />
                </button>
              }
            />
            <div className="divide-y divide-gray-50">
              {recentLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                  ))
                : !recent.length
                ? <p className="text-sm text-gray-400 text-center py-8">No customers yet</p>
                : recent.map((c: any) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`${basePath}/crm/customers/${c.id}`)}
                    >
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-purple-600">
                          {c.first_name?.[0]}{c.last_name?.[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {c.first_name} {c.last_name}
                        </p>
                        {c.email && (
                          <span className="flex items-center gap-0.5 text-xs text-gray-400">
                            <Mail className="h-3 w-3" />{c.email}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <CustomerStatusBadge status={c.customer_status ?? c.status} /> 
                        <span className="text-xs text-gray-400">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
              }
            </div>
          </Card>

          {/* Pending Duplicates */}
          <Card>
            <CardHeader
              title="Pending Duplicates"
              action={
                <button onClick={() => navigate(`${basePath}/crm/duplicates`)} className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                  Manage <ArrowRight className="h-3 w-3" />
                </button>
              }
            />
            {dupLoading
              ? (
                <div className="divide-y divide-gray-50">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-5 w-12 rounded-full" />
                    </div>
                  ))}
                </div>
              )
              : dupes.length === 0
              ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-5">
                  <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
                    <UserCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">No pending duplicates</p>
                  <p className="text-xs text-gray-400 mt-1">Your customer records look clean</p>
                </div>
              )
              : (
                <div className="divide-y divide-gray-50">
                  {dupes.map((d: any) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`${basePath}/crm/duplicates`)}
                    >
                      <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                        <GitMerge className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {d.customer1?.full_name} &amp; {d.customer2?.full_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          Matched: {d.matching_fields?.join(', ')}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${
                        d.similarity_score >= 80 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {d.similarity_score}%
                      </span>
                    </div>
                  ))}
                  {(dupData?.meta?.total ?? 0) > 5 && (
                    <div
                      className="flex items-center justify-center px-5 py-3 text-sm text-blue-600 hover:bg-blue-50 cursor-pointer"
                      onClick={() => navigate(`${basePath}/crm/duplicates`)}
                    >
                      +{(dupData?.meta?.total ?? 0) - 5} more pending
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </div>
                  )}
                </div>
              )
            }
          </Card>
        </div>

        {/* Top Loyalty Members */}
        <Card>
          <CardHeader
            title="Top Loyalty Members"
            action={
              <button onClick={() => navigate(`${basePath}/crm/loyalty`)} className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                Full program <ArrowRight className="h-3 w-3" />
              </button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['#', 'Customer', 'Tier', 'Lifetime Points', 'Orders', 'Total Spent'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loyaltyLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-3/4" /></td>
                        ))}
                      </tr>
                    ))
                  : !(loyalty?.top_members ?? []).length
                  ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No loyalty members yet</td></tr>
                  : (loyalty?.top_members ?? []).slice(0, 5).map((m: any, i: number) => (  
                      <tr
                        key={m.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`${basePath}/crm/customers/${m.id}`)}
                      >
                        <td className="px-4 py-3 text-gray-400 font-medium">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                              <span className="text-xs font-semibold text-yellow-700">
                                {m.first_name?.[0]}{m.last_name?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{m.full_name ?? `${m.first_name} ${m.last_name}`}</p>
                              <p className="text-xs text-gray-400">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><TierBadge tier={m.loyalty_tier || 'Basic'} /></td>
                        <td className="px-4 py-3 text-gray-600">{(m.lifetime_points ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600">{m.total_orders ?? '0'}</td>
                        <td className="px-4 py-3 text-gray-600">{m.total_spent ? `$${Number(m.total_spent).toLocaleString()}` : '0'}</td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </Card>

        <CustomerModal />
      </div>
    </DashboardLayout>
  );
};