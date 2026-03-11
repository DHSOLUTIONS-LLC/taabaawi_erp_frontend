// src/features/purchase/pages/PurchaseDashboard.tsx
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../app/hooks';
import type { RootState } from '../../../app/store';
import DashboardLayout from '../../../layouts/DashboardLayout';
import {
  useGetPurchaseOrderStatisticsQuery,
  useGetPurchaseOrdersQuery,
  useGetPendingApprovalsQuery,
} from '../../../services/purchaseApi';

import add_icon from '../../../assets/icons/add.svg';

// ── Helpers ──────────────────────────────────────────────────────
const num = (v: unknown) =>
  v !== null && v !== undefined ? parseFloat(String(v)) || 0 : 0;

/** Safely extract array from any paginated or flat API response shape */
function extractList(raw: unknown): any[] {
  if (!raw) return [];
  const r = raw as any;
  // data.data.data (nested pagination)
  if (r?.data?.data && Array.isArray(r.data.data)) return r.data.data;
  // data.data (one level)
  if (r?.data && Array.isArray(r.data)) return r.data;
  // data itself is array
  if (Array.isArray(r)) return r;
  // If the response is wrapped in a data property
  if (r?.data && typeof r.data === 'object' && !Array.isArray(r.data)) {
    return [];
  }
  return [];
}

/** Normalize by_status: handles both array [{status,count}] and object {status: count} */
function normalizeByStatus(raw: unknown): Array<{ label: string; count: number }> {
  if (!raw) return [];
  
  // Handle array format
  if (Array.isArray(raw)) {
    return (raw as any[]).map((item) => ({
      label: String(item.status ?? item.order_status ?? ''),
      count: Number(item.count ?? 0),
    }));
  }
  
  // Handle object format
  if (typeof raw === 'object') {
    return Object.entries(raw as Record<string, unknown>).map(([label, count]) => ({
      label,
      count: Number(count),
    }));
  }
  
  return [];
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

const PAYMENT_COLORS: Record<string, string> = {
  Unpaid: 'bg-red-100 text-red-700',
  Partial: 'bg-yellow-100 text-yellow-700',
  Paid: 'bg-green-100 text-green-700',
};

// ── Sub-components ────────────────────────────────────────────────
const StatCard = ({
  title,
  value,
  sub,
  color,
  icon,
}: {
  title: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl p-6 flex items-start justify-between">
    <div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
    <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
  </div>
);

const Spinner = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

// ── Main Component ────────────────────────────────────────────────
export default function PurchaseDashboard() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const {
    data: statsData,
    isLoading: statsLoading,
  } = useGetPurchaseOrderStatisticsQuery({});

  const {
    data: pendingData,
    isLoading: pendingLoading,
  } = useGetPendingApprovalsQuery({ per_page: 5 });

  const {
    data: recentData,
    isLoading: recentLoading,
  } = useGetPurchaseOrdersQuery({ per_page: 5, page: 1 });

  const stats     = (statsData as any)?.data ?? (statsData as any);
  const pendingPOs = extractList(pendingData);
  const recentPOs  = extractList(recentData);
  const statusItems = normalizeByStatus(stats?.by_status);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Overview of your purchasing activity</p>
          </div>
          <button
            onClick={() => navigate(`${basePath}/purchase/orders/create`)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <img src={add_icon} alt="" className="w-4 h-4 " />
            Create PO
          </button>
        </div>

        {/* ── Stat Cards ── */}
        {statsLoading ? (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
        <div className="h-8 bg-gray-200 rounded w-16" />
      </div>
    ))}
  </div>
) : (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard
      title="Total Orders"
      value={Number(stats?.total_purchase_orders ?? stats?.total_orders ?? 0)}
      sub="All time"
      color="bg-blue-50"
      icon={
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      }
    />
    <StatCard
      title="Total Value (KWD)"
      value={`KWD ${num(stats?.total_purchase_value ?? stats?.total_value_kwd ?? 0).toFixed(3)}`}
      sub="All purchase orders"
      color="bg-green-50"
      icon={
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    />
    <StatCard
      title="Pending Approval"
      value={Number(stats?.pending_approval ?? pendingPOs.length)}
      sub="Awaiting review"
      color="bg-yellow-50"
      icon={
        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    />
    <StatCard
      title="This Month"
      value={Number(stats?.this_month_orders ?? 0)}
      sub={`KWD ${num(stats?.this_month_value ?? stats?.this_month_value_kwd ?? 0).toFixed(3)}`}
      color="bg-purple-50"
      icon={
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      }
    />
  </div>
)}

        {/* ── Status Breakdown ── */}
        {statusItems.length > 0 && (
  <div className="bg-white rounded-xl p-6">
    <h2 className="text-base font-semibold text-gray-900 mb-4">Orders by Status</h2>
    <div className="flex flex-wrap gap-3">
      {statusItems.map(({ label, count }) => (
        <button
          key={label}
          onClick={() =>
            navigate(`${basePath}/purchase/orders?status=${encodeURIComponent(label)}`)
          }
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-80 transition-opacity ${
            STATUS_COLORS[label] ?? 'bg-gray-100 text-gray-700'
          }`}
        >
          <span>{label}</span>
          <span className="font-bold">{count}</span>
        </button>
      ))}
    </div>
  </div>
)}

        {/* ── Pending + Recent ── */}
        <div className="grid grid-cols-2 gap-6">

          {/* Pending Approvals */}
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Pending Approvals</h2>
              <button
                onClick={() => navigate(`${basePath}/purchase/pending-approvals`)}
                className="text-sm text-blue-600 hover:underline"
              >
                View all
              </button>
            </div>
            {pendingLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : pendingPOs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPOs.slice(0, 5).map((po: any) => (
                  <div
                    key={po.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`${basePath}/purchase/orders/${po.id}`)}
                  >
                    <div>
                      <p className="text-sm font-semibold text-blue-600">
                        {String(po.po_number ?? '')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {String(po.supplier?.supplier_name ?? '')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {String(po.currency ?? 'KWD')} {num(po.total_amount).toFixed(3)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {po.order_date
                          ? new Date(po.order_date).toLocaleDateString()
                          : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
              <button
                onClick={() => navigate(`${basePath}/purchase/orders`)}
                className="text-sm text-blue-600 hover:underline"
              >
                View all
              </button>
            </div>
            {recentLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : recentPOs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPOs.slice(0, 5).map((po: any) => (
                  <div
                    key={po.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`${basePath}/purchase/orders/${po.id}`)}
                  >
                    <div>
                      <p className="text-sm font-semibold text-blue-600">
                        {String(po.po_number ?? '')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {String(po.supplier?.supplier_name ?? '')}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[po.status] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {String(po.status ?? '')}
                      </span>
                      {po.payment_status && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_COLORS[po.payment_status] ?? 'bg-gray-100 text-gray-700'}`}
                        >
                          {String(po.payment_status)}
                        </span>
                      )}
                      <p className="text-xs text-gray-400">
                        {po.order_date
                          ? new Date(po.order_date).toLocaleDateString()
                          : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Quick Links ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'All Orders',        path: `${basePath}/purchase/orders`,     color: 'border-blue-200   hover:bg-blue-50'   },
            { label: 'Pending Approvals', path: `${basePath}/purchase/approvals`,  color: 'border-yellow-200 hover:bg-yellow-50' },
            { label: 'Suppliers',         path: `${basePath}/purchase/suppliers`,  color: 'border-green-200  hover:bg-green-50'  },
            { label: 'Currencies',        path: `${basePath}/purchase/currencies`, color: 'border-purple-200 hover:bg-purple-50' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`p-4 border rounded-xl text-sm font-medium text-gray-700 text-left transition-colors ${item.color}`}
            >
              {item.label} →
            </button>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}