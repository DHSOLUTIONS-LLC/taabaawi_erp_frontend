// src/features/purchase/pages/suppliers/SupplierDetailPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGetSupplierByIdQuery, useGetSupplierStatisticsQuery } from '../../../../services/purchaseApi';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import EditSupplierModal from './EditSupplierPage';
import type { Supplier } from '../../../../types/purchase'

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';
import edit_icon from '../../../../assets/icons/edit_icon.svg';

const RATING_COLORS: Record<string, string> = {
    Excellent: 'bg-green-100 text-green-700',
    Good: 'bg-blue-100 text-blue-700',
    Average: 'bg-yellow-100 text-yellow-700',
    Poor: 'bg-red-100 text-red-700',
};

export default function SupplierDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAppSelector((state: RootState) => state.auth);
    const [showEditModal, setShowEditModal] = useState(false);

    const isSuperAdmin = user?.role?.role_name === 'Super Admin';
    const basePath = isSuperAdmin ? '/admin' : '';

    const supplierId = id ? parseInt(id, 10) : 0;
    const { data, isLoading } = useGetSupplierByIdQuery(supplierId);
    const { data: statsData } = useGetSupplierStatisticsQuery(supplierId);

    const supplier = data?.data as Supplier;
    console.log('supplier details:', supplier)
    const stats = statsData?.data;


    const recentOrders = stats?.recent_orders || [];


    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center py-40">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
            </DashboardLayout>
        );
    }

    if (!supplier) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-40">
                    <p className="text-red-500">Supplier not found</p>
                    <button onClick={() => navigate(`${basePath}/purchase/suppliers`)} className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg">
                        Back to Suppliers
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(`${basePath}/purchase/suppliers`)}>
                            <img src={arrow_back_icon} alt="" className="w-8 h-8" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900">{supplier.supplier_name}</h1>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${supplier.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {supplier.is_active ? 'Active' : 'Inactive'}
                                </span>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${RATING_COLORS[supplier.rating]}`}>
                                    {supplier.rating}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Code: {supplier.supplier_code}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50"
                    >
                        <img src={edit_icon} alt="" className="w-4 h-4" />
                        Edit Supplier
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-5 shadow-sm">
                        <p className="text-sm text-gray-500">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total_purchase_orders || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm">
                        <p className="text-sm text-gray-500">Total Purchases</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">KWD {Number(stats?.total_purchase_amount || 0).toFixed(3)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm">
                        <p className="text-sm text-gray-500">Total Payments</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">KWD {Number(stats?.total_payments || 0).toFixed(3)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm">
                        <p className="text-sm text-gray-500">Outstanding</p>
                        <p className="text-2xl font-bold text-orange-600 mt-1">KWD {Number(stats?.outstanding_balance || 0).toFixed(3)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {/* Left Column - 2/3 width */}
                    <div className="col-span-2 space-y-6">
                        {/* Purchase Orders */}
                        <div className="bg-white rounded-xl p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Purchase Orders</h2>
                            {recentOrders.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-y border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PO Number</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {recentOrders.map((order: any) => (
                                                <tr key={order.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm font-medium text-blue-600">{order.po_number}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{new Date(order.order_date).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                                        {order.currency} {order.total_amount ? parseFloat(order.total_amount).toFixed(3) : '0.000'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button className="text-xs text-blue-600 hover:underline">View</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No purchase orders yet</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column - 1/3 width */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Basic Details</h2>
                            <div className="space-y-3">

                                <div className="grid grid-cols-2 gap-3">
                                    {supplier.supplier_name && (
                                        <div>
                                            <p className="text-xs text-gray-500">Supplier name</p>
                                            <p className="text-sm font-medium text-gray-900">{supplier.supplier_name}</p>
                                        </div>
                                    )}
                                    {supplier.company_name && (
                                        <div>
                                            <p className="text-xs text-gray-500">Company name</p>
                                            <p className="text-sm font-medium text-gray-900">{supplier.company_name}</p>
                                        </div>
                                    )}
                                    {supplier.contact_person_email && (
                                        <div>
                                            <p className="text-xs text-gray-500">Email</p>
                                            <p className="text-sm font-medium text-gray-900">{supplier.contact_person_email}</p>
                                        </div>
                                    )}
                                    {supplier.mobile && (
                                        <div>
                                            <p className="text-xs text-gray-500">Mobile</p>
                                            <p className="text-sm font-medium text-gray-900">{supplier.mobile}</p>
                                        </div>
                                    )}
                                    
                                </div>
                            </div>
                        </div>
                        {/* Contact Info */}
                        <div className="bg-white rounded-xl p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Contact Information</h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="text-sm font-medium text-gray-900">{supplier.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <p className="text-sm font-medium text-gray-900">{supplier.phone}</p>
                                </div>
                                {supplier.mobile && (
                                    <div>
                                        <p className="text-xs text-gray-500">Mobile</p>
                                        <p className="text-sm font-medium text-gray-900">{supplier.mobile}</p>
                                    </div>
                                )}
                                {supplier.website && (
                                    <div>
                                        <p className="text-xs text-gray-500">Website</p>
                                        <p className="text-sm font-medium text-blue-600">{supplier.website}</p>
                                    </div>
                                )}


                            </div>
                        </div>

                        {/* Contact Person */}
                        {(supplier.contact_person_name || supplier.contact_person_phone || supplier.contact_person_email) && (
                            <div className="bg-white rounded-xl p-6">
                                <h2 className="text-base font-semibold text-gray-900 mb-4">Contact Person</h2>
                                <div className="space-y-3">
                                    {supplier.contact_person_name && (
                                        <div>
                                            <p className="text-xs text-gray-500">Name</p>
                                            <p className="text-sm font-medium text-gray-900">{supplier.contact_person_name}</p>
                                        </div>
                                    )}
                                    {supplier.contact_person_phone && (
                                        <div>
                                            <p className="text-xs text-gray-500">Phone</p>
                                            <p className="text-sm font-medium text-gray-900">{supplier.contact_person_phone}</p>
                                        </div>
                                    )}
                                    {supplier.contact_person_email && (
                                        <div>
                                            <p className="text-xs text-gray-500">Email</p>
                                            <p className="text-sm font-medium text-blue-600">{supplier.contact_person_email}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* Address */}
                        <div className="bg-white rounded-xl p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Address</h2>
                            <div className="space-y-3">
                                {supplier.address && (
                                    <div>
                                        <p className="text-xs text-gray-500">Address</p>
                                        <p className="text-sm font-medium text-gray-900">{supplier.address}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    {supplier.city && (
                                        <div>
                                            <p className="text-xs text-gray-500">City</p>
                                            <p className="text-sm font-medium text-gray-900">{supplier.city}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-gray-500">Country</p>
                                        <p className="text-sm font-medium text-gray-900">{supplier.country}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white rounded-xl p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Payment Information</h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-gray-500">Payment Terms</p>
                                    <p className="text-sm font-medium text-gray-900">Net {supplier.payment_terms_days}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Credit Limit</p>
                                    <p className="text-sm font-medium text-gray-900">KWD {Number(supplier.credit_limit).toFixed(3)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Default Currency</p>
                                    <p className="text-sm font-medium text-gray-900">{supplier.default_currency}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Payment Terms</p>
                                    <p className="text-sm font-medium text-gray-900">Net {supplier.payment_terms_days}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Credit Limit</p>
                                    <p className="text-sm font-medium text-gray-900">KWD {Number(supplier.credit_limit).toFixed(3)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Default Currency</p>
                                    <p className="text-sm font-medium text-gray-900">{supplier.default_currency}</p>
                                </div>
                                {supplier.tax_number && (
                                    <div>
                                        <p className="text-xs text-gray-500">Tax Number</p>
                                        <p className="text-sm font-medium text-gray-900">{supplier.tax_number}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bank Info */}
                        {(supplier.bank_name || supplier.bank_account_number) && (
                            <div className="bg-white rounded-xl p-6">
                                <h2 className="text-base font-semibold text-gray-900 mb-4">Bank Details</h2>
                                <div className="space-y-3">
                                    {supplier.bank_name && (
                                        <div>
                                            <p className="text-xs text-gray-500">Bank Name</p>
                                            <p className="text-sm font-medium text-gray-900">{supplier.bank_name}</p>
                                        </div>
                                    )}
                                    {supplier.bank_account_number && (
                                        <div>
                                            <p className="text-xs text-gray-500">Account Number</p>
                                            <p className="text-sm font-medium text-gray-900">{supplier.bank_account_number}</p>
                                        </div>
                                    )}
                                    {supplier.iban && (
                                        <div>
                                            <p className="text-xs text-gray-500">IBAN</p>
                                            <p className="text-sm font-medium text-gray-900">{supplier.iban}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {supplier.notes && (
                            <div className="bg-white rounded-xl p-6">
                                <h2 className="text-base font-semibold text-gray-900 mb-4">Notes</h2>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{supplier.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && supplier && (
                <EditSupplierModal
                    supplier={supplier}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => {
                        setShowEditModal(false);
                        window.location.reload();
                    }}
                />
            )}
        </DashboardLayout>
    );
}