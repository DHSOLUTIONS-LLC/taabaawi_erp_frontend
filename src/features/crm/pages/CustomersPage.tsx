import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Users, UserCheck, UserPlus, TrendingUp, Plus, RefreshCw } from 'lucide-react';
import { CustomerFilters } from '../components/customers/CustomerFilters';
import { CustomerModal } from '../components/customers/CustomerModal';
import { StatCard } from '../components/customers/CustomerCard';
import { openCustomerModal } from '../crmSlice';
import { useGetCustomerStatisticsQuery, useGetLoyaltyStatisticsQuery } from '../../../services/crmApi';
import type { RootState } from '../../../app/store';
import DashboardLayout from '../../../layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../app/hooks';
import {  TierBadge } from '../components/customers/CustomerStatusBadge';



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


export const CustomersPage = () => {
      const { user } = useAppSelector((state: RootState) => state.auth);
  
  const dispatch = useDispatch();
  const { isCustomerModalOpen } = useSelector((s: RootState) => s.crm);
  const { data: statsData, isLoading: statsLoading, refetch } = useGetCustomerStatisticsQuery({});
  const stats = statsData?.data;
  console.log('stats:', stats)
  const navigate = useNavigate();

   const { data: loyaltyData, isLoading: loyaltyLoading } =
      useGetLoyaltyStatisticsQuery({});
       const loyalty = loyaltyData?.data;
  // Check user role
  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const isEmp = user?.role?.role_name;
  // console.log('is hr: ', isEmp)

  const basePath = isSuperAdmin ? "/admin" : isEmp ? "" : "";


  return (
    <DashboardLayout>
      <div className="p-6 space-y-5">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Customers</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your customer base and relationships</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refetch} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={() => dispatch(openCustomerModal({ mode: 'create' }))} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              <Plus className="h-4 w-4" /> New Customer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Customers"  value={stats?.total_customers?.toLocaleString() ?? '—'}                                         icon={Users}     color="blue"   loading={statsLoading} />
          <StatCard label="Active Customers" value={stats?.active_customers?.toLocaleString() ?? '—'}                                        icon={UserCheck} color="green"  loading={statsLoading} />
          <StatCard label="New This Month"   value={stats?.new_customers_this_month?.toLocaleString() ?? '—'}                                 icon={UserPlus}  color="purple" loading={statsLoading} />
          <StatCard label="Total Revenue"    value={stats?.total_spent_all ? `$${stats.total_spent_all.toLocaleString()}` : '—'} sub={`Avg order: $${stats?.average_order_value_all?.toLocaleString() ?? '—'}`} icon={TrendingUp} color="orange" loading={statsLoading} />
        </div>

        <CustomerFilters />

        <Card>
        <CardHeader
          title="Top Loyalty Members"
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
              {loyaltyLoading || statsLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                : (loyalty?.top_members ?? stats?.top_customers ?? []).slice(0, 5).map((m: any, i) => (
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
                            <p className="font-medium text-gray-800">
                              {m.full_name ?? `${m.first_name} ${m.last_name}`}
                            </p>
                            <p className="text-xs text-gray-400">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><TierBadge tier={m.loyalty_tier} /></td>
                      
                      <td className="px-4 py-3 text-gray-600">
                        {(m.lifetime_points ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{m.total_orders ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {m.total_spent ? `$${m.total_spent.toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </Card>

        {isCustomerModalOpen && <CustomerModal />}
      </div>
    </DashboardLayout>
  );
};