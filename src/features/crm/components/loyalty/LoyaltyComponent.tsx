import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { Star, Plus, Minus, X } from 'lucide-react';
import {
  openAdjustPointsModal,
  closeAdjustPointsModal,
} from '../../../../features/crm/crmSlice';
import {
  useGetLoyaltyBalanceQuery,
  useGetLoyaltyTransactionsQuery,
  useAddLoyaltyPointsMutation,
  useRedeemLoyaltyPointsMutation,
} from '../../../../services/crmApi';
import { TierBadge } from '../customers/CustomerStatusBadge';
import type { RootState } from '../../../../app/store';

const tierProgress: Record<string, { next: string; max: number }> = {
  Bronze: { next: 'Silver', max: 1000 },
  Silver: { next: 'Gold', max: 5000 },
  Gold: { next: 'Platinum', max: 15000 },
  Platinum: { next: 'Max', max: 15000 },
};



interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  alternative_phone?: string;
  date_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  nationality?: string;
  id_number?: string;
  id_type?: 'National' | 'Passport' | 'Civil ID';

  // Address
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;

  // Company info
  company_name?: string;
  company_vat?: string;
  job_title?: string;

  // Preferences
  preferred_contact_method?: 'Email' | 'Phone' | 'SMS' | 'WhatsApp';
  preferred_language?: string;
  communication_preferences?: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };

  // Loyalty
  loyalty_points: number;
  lifetime_points: number;
  loyalty_tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  loyalty_enrolled_date?: string;

  // Statistics
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  last_order_date?: string;

  // Status
  status: 'Active' | 'Inactive' | 'Blocked' | 'Lead';
  is_active: boolean;
  is_verified: boolean;

  // Metadata
  notes?: string;
  tags?: string[];
  created_by?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relations
  createdBy?: any;
}

// ── Loyalty Card ─────────────────────────────────────────────────────────────
export const LoyaltyCard = ({ customer }: { customer: Customer }) => {
  const dispatch = useDispatch();
  const { data } = useGetLoyaltyBalanceQuery(customer.id);
  const balance = data?.data;
  const progress = tierProgress[customer.loyalty_tier ?? 'Bronze'];
  const pct = Math.min((customer.lifetime_points / progress.max) * 100, 100);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="font-medium text-gray-800">Loyalty</span>
          <TierBadge tier={customer.loyalty_tier} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => dispatch(openAdjustPointsModal({ mode: 'add', customer }))}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
          <button
            onClick={() => dispatch(openAdjustPointsModal({ mode: 'redeem', customer }))}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100"
          >
            <Minus className="h-3 w-3" /> Redeem
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xl font-semibold text-gray-800">{customer.loyalty_points?.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Available</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xl font-semibold text-gray-800">{customer.lifetime_points?.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Lifetime</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xl font-semibold text-gray-800">{balance?.points_expiring_soon ?? '0'}</p>
          <p className="text-xs text-gray-400">Expiring Soon</p>
        </div>
      </div>

      {/* Tier progress */}
      {progress.next !== 'Max' && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress to {progress.next}</span>
            <span>{customer.lifetime_points?.toLocaleString()} / {progress.max.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ── Loyalty Transaction Table ─────────────────────────────────────────────────
export const LoyaltyTransactionTable = ({ customerId }: { customerId: number }) => {
  const { data, isLoading } = useGetLoyaltyTransactionsQuery({ customerId, per_page: 10 });
  const transactions = data?.data?.data;
  // const transactions = Array.isArray(data?.data) ? data.data : 
  //                     Array.isArray(data) ? data : [];

  // console.log('transaction logs:', transactions)

  const typeColor: Record<string, string> = {
    Earned: 'text-green-600',
    Redeemed: 'text-red-600',
    Bonus: 'text-purple-600',
    Adjusted: 'text-blue-600',
    Expired: 'text-gray-400',
  };

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-gray-800 text-sm">Point History</h3>
      {isLoading
        ? <div className="animate-pulse space-y-2">{Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-50 rounded" />
        ))}</div>
        : transactions.length === 0
          ? <p className="text-sm text-gray-400 text-center py-6">No transactions yet</p>
          : (
            <div className="divide-y divide-gray-50">
              {transactions.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm text-gray-700">{t.description}</p>
                    <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${typeColor[t.transaction_type] ?? ''}`}>
                      {t.points > 0 ? '+' : ''}{t.points.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">Balance: {t.balance_after.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )
      }
    </div>
  );
};

// ── Adjust Points Modal ───────────────────────────────────────────────────────
export const AdjustPointsModal = () => {
  const dispatch = useDispatch();
  const { isAdjustPointsModalOpen, adjustPointsMode, selectedCustomer } = useSelector(
    (s: RootState) => s.crm
  );
  const [addPoints, { isLoading: adding }] = useAddLoyaltyPointsMutation();
  const [redeemPoints, { isLoading: redeeming }] = useRedeemLoyaltyPointsMutation();
  const { register, handleSubmit, reset } = useForm<{ points: number; description: string }>();

  if (!isAdjustPointsModalOpen || !selectedCustomer) return null;

  const isAdd = adjustPointsMode === 'add';
  const loading = adding || redeeming;

  const onSubmit = async (data: { points: number; description: string }) => {
    const payload = { customerId: selectedCustomer.id, ...data, points: Number(data.points) };
    if (isAdd) await addPoints(payload).unwrap();
    else await redeemPoints(payload).unwrap();
    reset();
    dispatch(closeAdjustPointsModal());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            {isAdd ? 'Add Points' : 'Redeem Points'} — {selectedCustomer.full_name}
          </h2>
          <button onClick={() => dispatch(closeAdjustPointsModal())} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Points *</label>
            <input
              type="number"
              min={1}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              {...register('points', { required: true, min: 1 })}
            />
            {!isAdd && (
              <p className="text-xs text-gray-400 mt-1">Available: {selectedCustomer.loyalty_points?.toLocaleString()}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              {...register('description', { required: true })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => dispatch(closeAdjustPointsModal())}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className={`px-5 py-2 text-sm text-white rounded-lg disabled:opacity-50 ${isAdd ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
              {loading ? 'Saving...' : isAdd ? 'Add Points' : 'Redeem Points'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};