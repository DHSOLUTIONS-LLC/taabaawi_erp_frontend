import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Users, UserCheck, UserPlus, TrendingUp, Plus, RefreshCw, Filter, X } from 'lucide-react';
import { CustomerFilters } from '../components/customers/CustomerFilters';
import { CustomerModal } from '../components/customers/CustomerModal';
import { StatCard } from '../components/customers/CustomerCard';
import { openCustomerModal } from '../crmSlice';
import { useGetCustomerStatisticsQuery, useGetLoyaltyStatisticsQuery } from '../../../services/crmApi';
import type { RootState } from '../../../app/store';
import DashboardLayout from '../../../layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../app/hooks';
import { TierBadge } from '../components/customers/CustomerStatusBadge';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>{children}</div>
);

const CardHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
    <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{title}</h3>
    {action}
  </div>
);

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-100 rounded animate-pulse ${className}`} />
);

// Mobile Card View for Loyalty Members
const LoyaltyMemberCard = ({ member, index, onClick }: { member: any; index: number; onClick: () => void }) => (
  <div
    onClick={onClick}
    className="flex flex-col gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-gray-400 font-medium text-sm">#{index + 1}</span>
        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-yellow-700">
            {member.first_name?.[0]}{member.last_name?.[0]}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-800 text-sm">
            {member.full_name ?? `${member.first_name} ${member.last_name}`}
          </p>
          <p className="text-xs text-gray-400 truncate max-w-[150px]">{member.email}</p>
        </div>
      </div>
      <TierBadge tier={member.loyalty_tier} />
    </div>
    <div className="grid grid-cols-3 gap-2 pt-2">
      <div className="text-center">
        <p className="text-xs text-gray-400">Points</p>
        <p className="text-sm font-semibold text-gray-700">{(member.lifetime_points ?? 0).toLocaleString()}</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-400">Orders</p>
        <p className="text-sm font-semibold text-gray-700">{member.total_orders ?? '0'}</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-400">Spent</p>
        <p className="text-sm font-semibold text-gray-700">{member.total_spent ? `$${member.total_spent.toLocaleString()}` : '0'}</p>
      </div>
    </div>
  </div>
);

export const CustomersPage = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const dispatch = useDispatch();
  const { isCustomerModalOpen } = useSelector((s: RootState) => s.crm);
  const { data: statsData, isLoading: statsLoading, refetch } = useGetCustomerStatisticsQuery({});
  const stats = statsData?.data;
  const navigate = useNavigate();

  const { data: loyaltyData, isLoading: loyaltyLoading } = useGetLoyaltyStatisticsQuery({});
  const loyalty = loyaltyData?.data;

  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const isEmp = user?.role?.role_name;
  const basePath = isSuperAdmin ? "/admin" : isEmp ? "" : "";

  const hasActiveFilters = false; // This would come from your filter state

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto ">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customers</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage your customer base and relationships</p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={refetch}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={() => dispatch(openCustomerModal({ mode: 'create' }))}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" /> New Customer
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard
              label="Total Customers"
              value={stats?.total_customers?.toLocaleString() ?? '0'}
              icon={Users}
              color="blue"
              loading={statsLoading}
            />
            <StatCard
              label="Active Customers"
              value={stats?.active_customers?.toLocaleString() ?? '0'}
              icon={UserCheck}
              color="green"
              loading={statsLoading}
            />
            <StatCard
              label="New This Month"
              value={stats?.new_customers_this_month?.toLocaleString() ?? '0'}
              icon={UserPlus}
              color="purple"
              loading={statsLoading}
            />
            <StatCard
              label="Total Revenue"
              value={stats?.total_spent_all ? `$${stats.total_spent_all.toLocaleString()}` : '0'}
              sub={`Avg order: $${stats?.average_order_value_all?.toLocaleString() ?? '0'}`}
              icon={TrendingUp}
              color="orange"
              loading={statsLoading}
            />
          </div>

          {/* Filters */}
          <div className="mb-6">
            <CustomerFilters />
          </div>

          {/* Top Loyalty Members Section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800 text-sm sm:text-base">Top Loyalty Members</h2>
              <button
                onClick={() => navigate(`${basePath}/crm/loyalty`)}
                className="text-xs text-blue-600 hover:underline flex items-center gap-0.5 self-start sm:self-auto"
              >
                View all →
              </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
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
                      Lifetime Points
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loyaltyLoading || statsLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-3 sm:px-4 py-3"><div className="h-4 bg-gray-100 rounded w-6" /></td>
                        <td className="px-3 sm:px-4 py-3"><div className="flex items-center gap-2"><div className="h-8 w-8 bg-gray-100 rounded-full" /><div><div className="h-4 bg-gray-100 rounded w-24 mb-1" /><div className="h-3 bg-gray-100 rounded w-32" /></div></div></td>
                        <td className="px-3 sm:px-4 py-3"><div className="h-5 bg-gray-100 rounded w-16" /></td>
                        <td className="px-3 sm:px-4 py-3"><div className="h-4 bg-gray-100 rounded w-20 ml-auto" /></td>
                        <td className="px-3 sm:px-4 py-3"><div className="h-4 bg-gray-100 rounded w-12 mx-auto" /></td>
                        <td className="px-3 sm:px-4 py-3"><div className="h-4 bg-gray-100 rounded w-20 ml-auto" /></td>
                      </tr>
                    ))
                    : (loyalty?.top_members ?? stats?.top_customers ?? []).slice(0, 5).map((m: any, i: number) => (
                      <tr
                        key={m.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`${basePath}/crm/customers/${m.id}`)}
                      >
                        <td className="px-3 sm:px-4 py-3 text-gray-400 font-medium text-sm">
                          {i + 1}
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                              <span className="text-xs font-semibold text-yellow-700">
                                {m.first_name?.[0]}{m.last_name?.[0]}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 text-sm truncate max-w-[150px]">
                                {m.full_name ?? `${m.first_name} ${m.last_name}`}
                              </p>
                              <p className="text-xs text-gray-400 truncate max-w-[150px]">
                                {m.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <TierBadge tier={m.loyalty_tier} />
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-right text-gray-700 font-medium">
                          {(m.lifetime_points ?? 0).toLocaleString()}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-center text-gray-600">
                          {m.total_orders ?? '0'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-right text-gray-700 font-semibold">
                          ${m.total_spent ? m.total_spent.toLocaleString() : '0'}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-100">
              {loyaltyLoading || statsLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-32" />
                        <div className="h-3 bg-gray-100 rounded w-24" />
                      </div>
                      <div className="h-6 w-16 bg-gray-100 rounded-full" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-12 bg-gray-100 rounded" />
                      <div className="h-12 bg-gray-100 rounded" />
                      <div className="h-12 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))
                : (loyalty?.top_members ?? stats?.top_customers ?? []).slice(0, 5).map((m: any, i: number) => (
                  <div
                    key={m.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`${basePath}/crm/customers/${m.id}`)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-yellow-700">
                          {m.first_name?.[0]}{m.last_name?.[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">
                          {m.full_name ?? `${m.first_name} ${m.last_name}`}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{m.email}</p>
                      </div>
                      <TierBadge tier={m.loyalty_tier} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-400">Points</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {(m.lifetime_points ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-400">Orders</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {m.total_orders ?? '0'}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-400">Spent</p>
                        <p className="text-sm font-semibold text-gray-800">
                          ${m.total_spent ? m.total_spent.toLocaleString() : '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
          {isCustomerModalOpen && <CustomerModal />}
        </div>
      </div>
    </DashboardLayout>
  );
};