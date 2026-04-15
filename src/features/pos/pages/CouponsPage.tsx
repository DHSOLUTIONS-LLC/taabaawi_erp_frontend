// src/features/pos/pages/CouponsPage.tsx
import { useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout';
import {
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} from '../../../services/posApi';
import { useAppSelector } from '../../../app/hooks';
import type { RootState } from '../../../app/store';
// import CouponDetailModal from '../components/CouponDetailModal';

import search_icon from '../../../assets/icons/search_icon.svg';
import export_excel from '../../../assets/icons/export_excel.svg';
import dropdown_arrow_icon from '../../../assets/icons/dropdown_arrow_icon.svg';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import CouponDetailModal from '../components/Coupondetailmodal';

type DiscountType = 'Percentage' | 'Fixed Amount';
type Channel = 'All' | 'POS' | 'Website' | 'Mobile App';

const EMPTY_FORM = {
  coupon_code: '',
  coupon_name: '',
  description: '',
  discount_type: 'Percentage' as DiscountType,
  discount_value: '',
  max_discount_amount: '',
  min_purchase_amount: '',
  usage_limit: '',
  usage_limit_per_user: '1',
  valid_from: '',
  valid_until: '',
  is_active: true,
  channel: 'POS' as Channel,
};

export default function CouponsPage() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';

  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewingCouponId, setViewingCouponId] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data: couponsResponse, isLoading } = useGetCouponsQuery({
    search: searchQuery || undefined,
    channel: channelFilter || undefined,
    is_active: activeFilter !== '' ? activeFilter === 'true' : undefined,
    page: currentPage,
    per_page: 10,
  });

  const [createCoupon, { isLoading: isCreating }] = useCreateCouponMutation();
  const [updateCoupon, { isLoading: isUpdating }] = useUpdateCouponMutation();
  const [deleteCoupon] = useDeleteCouponMutation();

  const coupons = couponsResponse?.data?.data || [];
  const pagination = couponsResponse?.data;

  const openCreate = () => {
    setEditingCoupon(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (coupon: any) => {
    setEditingCoupon(coupon);
    setForm({
      coupon_code: coupon.coupon_code,
      coupon_name: coupon.coupon_name,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      max_discount_amount: coupon.max_discount_amount?.toString() || '',
      min_purchase_amount: coupon.min_purchase_amount?.toString() || '',
      usage_limit: coupon.usage_limit?.toString() || '',
      usage_limit_per_user: coupon.usage_limit_per_user?.toString() || '1',
      valid_from: coupon.valid_from,
      valid_until: coupon.valid_until,
      is_active: coupon.is_active,
      channel: coupon.channel,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!form.coupon_name || !form.coupon_code || !form.discount_value || !form.valid_from || !form.valid_until) {
      setFormError('Please fill in all required fields');
      return;
    }

    const payload: any = {
      coupon_code: form.coupon_code.toUpperCase(),
      coupon_name: form.coupon_name,
      description: form.description,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_purchase_amount: form.min_purchase_amount ? parseFloat(form.min_purchase_amount) : undefined,
      max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : undefined,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : undefined,
      usage_limit_per_user: form.usage_limit_per_user ? parseInt(form.usage_limit_per_user) : 1,
      valid_from: form.valid_from,
      valid_until: form.valid_until,
      is_active: form.is_active,
      channel: form.channel,
    };

    try {
      if (editingCoupon) {
        await updateCoupon({ id: editingCoupon.id, data: payload }).unwrap();
      } else {
        await createCoupon(payload).unwrap();
      }
      setShowModal(false);
    } catch (err: any) {
      setFormError(err?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCoupon(id).unwrap();
      setDeletingId(null);
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to delete coupon');
      setDeletingId(null);
    }
  };

  const handleExport = () => {
    try {
      const data = coupons.map((c: any) => ({
        Code: c.coupon_code,
        Name: c.coupon_name,
        'Discount Type': c.discount_type,
        'Discount Value': c.discount_value,
        'Times Used': c.times_used,
        'Usage Limit': c.usage_limit || 'Unlimited',
        'Valid From': c.valid_from,
        'Valid Until': c.valid_until,
        Channel: c.channel,
        Status: c.is_active ? 'Active' : 'Inactive',
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Coupons');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([buf], { type: 'application/octet-stream' }), `coupons_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) { console.error(e); }
  };

  const isExpired = (date: string) => new Date(date) < new Date();
  const isExpiringSoon = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 7;
  };

  const F = (key: keyof typeof EMPTY_FORM, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-white px-8 py-5 rounded-lg mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage discount coupons and promo codes</p>
          </div>
          {isSuperAdmin && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-5 py-3 bg-[#1773CF] text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New Coupon
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl px-6 py-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <img src={search_icon} alt="" className="w-4 h-4" />
              </div>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by code or name..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md w-60 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div className="relative">
              <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Channels</option>
                <option value="POS">POS</option>
                <option value="Website">Website</option>
                <option value="Mobile App">Mobile App</option>
                <option value="All">All</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <img src={dropdown_arrow_icon} alt="" className="w-3 h-3" />
              </div>
            </div>
            <div className="relative">
              <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <img src={dropdown_arrow_icon} alt="" className="w-3 h-3" />
              </div>
            </div>
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
            <img src={export_excel} alt="" className="w-5 h-5" />
            Export
          </button>
        </div>

        {/* Coupons Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-xl py-16 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <p className="font-medium">No coupons found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {coupons.map((coupon: any) => (
              <div key={coupon.id} className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden ${!coupon.is_active ? 'border-gray-200 opacity-70' : isExpired(coupon.valid_until) ? 'border-red-200' : 'border-transparent'
                }`}>
                {/* Card Top */}
                <div className="bg-gradient-to-r from-[#1773CF] to-blue-400 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Coupon Code</p>
                      <p className="text-white text-xl font-bold tracking-widest mt-0.5">{coupon.coupon_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/70 text-xs">Discount</p>
                      <p className="text-white text-2xl font-bold">
                        {coupon.discount_type === 'Percentage' ? `${coupon.discount_value}%` : `KD ${coupon.discount_value}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{coupon.coupon_name}</p>
                      {coupon.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{coupon.description}</p>}
                    </div>
                    <div className="flex gap-1.5">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${coupon.is_active && !isExpired(coupon.valid_until)
                          ? 'bg-green-100 text-green-700'
                          : isExpired(coupon.valid_until)
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                        {isExpired(coupon.valid_until) ? 'Expired' : coupon.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {isExpiringSoon(coupon.valid_until) && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700">Expiring Soon</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-400">Valid</p>
                      <p className="font-medium text-gray-700">
                        {new Date(coupon.valid_from).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} –{' '}
                        {new Date(coupon.valid_until).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Usage</p>
                      <p className="font-medium text-gray-700">
                        {coupon.times_used} / {coupon.usage_limit || '∞'}
                      </p>
                    </div>
                    {coupon.min_purchase_amount > 0 && (
                      <div>
                        <p className="text-gray-400">Min Purchase</p>
                        <p className="font-medium text-gray-700">KD {parseFloat(coupon.min_purchase_amount).toFixed(3)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-400">Channel</p>
                      <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">{coupon.channel}</span>
                    </div>
                  </div>

                  {/* Usage Progress */}
                  {coupon.usage_limit && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Usage</span>
                        <span>{Math.round((coupon.times_used / coupon.usage_limit) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1773CF] rounded-full"
                          style={{ width: `${Math.min(100, (coupon.times_used / coupon.usage_limit) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 border-t">
                    <button onClick={() => { setViewingCouponId(coupon.id); setShowDetailModal(true); }}
                      className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                      Details
                    </button>
                  </div>
                  {isSuperAdmin && (
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(coupon)}
                        className="flex-1 py-2 text-sm text-[#1773CF] border border-[#1773CF] rounded-lg hover:bg-blue-50 font-medium transition-colors">
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingId(coupon.id)}
                        disabled={coupon.times_used > 0}
                        className="flex-1 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title={coupon.times_used > 0 ? 'Cannot delete used coupon' : ''}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination?.last_page > 1 && (
          <div className="mt-6 flex items-center justify-between bg-white rounded-xl px-6 py-4">
            <p className="text-sm text-gray-500">
              Showing {pagination.from}–{pagination.to} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50">Previous</button>
              <span className="px-3 py-1.5 bg-[#1773CF] text-white rounded-lg text-sm">{currentPage}</span>
              <button onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))} disabled={currentPage === pagination.last_page}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-center mb-2">Delete Coupon?</h3>
            <p className="text-gray-500 text-sm text-center mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-2.5 border rounded-xl font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deletingId)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Detail Modal */}
      <CouponDetailModal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setViewingCouponId(null); }}
        couponId={viewingCouponId}
      />

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#1773CF] px-6 py-5 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white">{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
                <p className="text-blue-100 text-sm">{editingCoupon ? 'Update coupon details' : 'Add a new discount coupon'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
                  <input type="text" value={form.coupon_code} onChange={(e) => F('coupon_code', e.target.value.toUpperCase())}
                    disabled={!!editingCoupon}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono disabled:bg-gray-50"
                    placeholder="SAVE10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Name *</label>
                  <input type="text" value={form.coupon_name} onChange={(e) => F('coupon_name', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Summer Sale 10%" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" value={form.description} onChange={(e) => F('description', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional description..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
                  <select value={form.discount_type} onChange={(e) => F('discount_type', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed Amount">Fixed Amount (KWD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value * {form.discount_type === 'Percentage' ? '(%)' : '(KD)'}
                  </label>
                  <input type="number" value={form.discount_value} onChange={(e) => F('discount_value', e.target.value)}
                    step="0.001" min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Purchase Amount (KWD)</label>
                  <input type="number" value={form.min_purchase_amount} onChange={(e) => F('min_purchase_amount', e.target.value)}
                    step="0.001" min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.000" />
                </div>
                {form.discount_type === 'Percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount Amount (KWD)</label>
                    <input type="number" value={form.max_discount_amount} onChange={(e) => F('max_discount_amount', e.target.value)}
                      step="0.001" min="0"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional cap" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Usage Limit</label>
                  <input type="number" value={form.usage_limit} onChange={(e) => F('usage_limit', e.target.value)}
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Unlimited" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Per User</label>
                  <input type="number" value={form.usage_limit_per_user} onChange={(e) => F('usage_limit_per_user', e.target.value)}
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid From *</label>
                  <input type="date" value={form.valid_from} onChange={(e) => F('valid_from', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label>
                  <input type="date" value={form.valid_until} onChange={(e) => F('valid_until', e.target.value)}
                    min={form.valid_from}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel *</label>
                  <select value={form.channel} onChange={(e) => F('channel', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                    <option value="All">All</option>
                    <option value="POS">POS</option>
                    <option value="Website">Website</option>
                    <option value="Mobile App">Mobile App</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => F('is_active', !form.is_active)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-[#1773CF]' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <label className="text-sm font-medium text-gray-700">Active</label>
                </div>
              </div>

              {formError && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{formError}</div>
              )}
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex gap-3 shrink-0">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-100">Cancel</button>
              <button onClick={handleSubmit} disabled={isCreating || isUpdating}
                className="flex-1 py-3 bg-[#1773CF] text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
                {(isCreating || isUpdating) ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}