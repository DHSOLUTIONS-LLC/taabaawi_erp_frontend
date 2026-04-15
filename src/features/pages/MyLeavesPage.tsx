// src/features/employee/pages/MyLeavesPage.tsx
import DashboardLayout from '../../layouts/DashboardLayout';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import type { RootState } from '../../app/store';
import { useGetLeaveRequestsQuery, useGetLeaveBalanceQuery, useCancelLeaveRequestMutation } from '../../services/hrApi';

interface LeaveRequest {
    id: number;
    leave_type: { name: string } | null;
    start_date: string;
    end_date: string;
    reason: string;
    status: 'Pending' | 'Approved' | 'Cancelled' | 'Rejected';
    created_at: string;
    notes: string | null;
}

interface LeaveBalance {
    leave_type: string;
    total: number;
    used: number;
    remaining: number;
}

export default function MyLeavesPage() {
    const { user } = useAppSelector((state: RootState) => state.auth);
    const [activeTab, setActiveTab] = useState<'all' | 'Pending' | 'Approved' | 'Cancelled' | 'Rejected'>('all');
    const [cancellingId, setCancellingId] = useState<number | null>(null);

    const { data: leaveRequestsResponse, isLoading: leavesLoading, refetch } = useGetLeaveRequestsQuery();
    const { data: balanceResponse, isLoading: balanceLoading } = useGetLeaveBalanceQuery(Number(user?.id), {
        skip: !user?.id,
    });

    const [cancelLeave] = useCancelLeaveRequestMutation();

    const allLeaves: LeaveRequest[] = (leaveRequestsResponse?.data?.data ?? leaveRequestsResponse?.data ?? []).filter((leave: any) => leave.user_id === user?.id);;
    const leaveBalances: LeaveBalance[] = balanceResponse?.data ?? [];

    const filteredLeaves = allLeaves.filter(leave => {
        if (activeTab === 'all') return true;
        return leave.status === activeTab;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const getDaysDiff = (start: string, end: string) => {
        const diff = new Date(end).getTime() - new Date(start).getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Approved': return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Approved' };
            case 'Rejected': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Rejected' };
            case 'Cancelled': return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', label: 'Cancelled' };
            default: return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Pending' };
        }
    };

    const handleCancel = async (id: number) => {
        if (!confirm('Are you sure you want to cancel this leave request?')) return;
        try {
            setCancellingId(id);
            await cancelLeave(id).unwrap();
            refetch();
        } catch (err) {
            alert('Failed to cancel leave request. Please try again.');
        } finally {
            setCancellingId(null);
        }
    };

    const PendingCount = allLeaves.filter(l => l.status === 'Pending').length;
    const approvedCount = allLeaves.filter(l => l.status === 'Approved').length;
    const CancelledCount = allLeaves.filter(l => l.status === 'Cancelled').length;
    const RejectedCount = allLeaves.filter(l => l.status === 'Rejected').length;

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Leaves</h1>
                            <p className="text-sm text-gray-500 mt-1">Manage your leave requests and balances</p>
                        </div>
                        <Link to="/my-leaves/request">
                            <button className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm w-full sm:w-auto">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Request Leave</span>
                            </button>
                        </Link>
                    </div>

                    {/* Leave Balance Cards */}
                    {balanceLoading ? (
                        <div className="flex justify-center py-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : leaveBalances.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                            {leaveBalances.map((balance, index) => (
                                <div key={index} className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 sm:mb-3">{balance.leave_type}</p>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-xl sm:text-2xl font-bold text-gray-900">{balance.remaining}</p>
                                            <p className="text-xs text-gray-400">remaining</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">{balance.used}/{balance.total}</p>
                                            <p className="text-xs text-gray-400">used/total</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${balance.total > 0 ? (balance.used / balance.total) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Summary stats if no balance API */
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                            <div className="bg-white rounded-xl p-4 sm:p-5 text-center">
                                <p className="text-xl sm:text-2xl font-bold text-yellow-500">{PendingCount}</p>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">Pending</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 sm:p-5 text-center">
                                <p className="text-xl sm:text-2xl font-bold text-green-600">{approvedCount}</p>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">Approved</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 sm:p-5 text-center">
                                <p className="text-xl sm:text-2xl font-bold text-gray-500">{CancelledCount}</p>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">Cancelled</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 sm:p-5 text-center">
                                <p className="text-xl sm:text-2xl font-bold text-red-500">{RejectedCount}</p>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">Rejected</p>
                            </div>
                        </div>
                    )}

                  {/* Leave Requests Table */}
<div className="bg-white rounded-2xl shadow-sm overflow-hidden">
    {/* Tabs - Responsive */}
    <div className="border-b border-gray-100">
        {/* Mobile Dropdown Selector */}
        <div className="sm:hidden p-3">
            <div className="relative">
                <select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value as any)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 text-sm"
                >
                    {(['all', 'Pending', 'Approved', 'Cancelled', 'Rejected'] as const).map(tab => (
                        <option key={tab} value={tab}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)} 
                            {tab !== 'all' && ` (${allLeaves.filter(l => l.status === tab).length})`}
                        </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>

        {/* Desktop Tabs - Horizontal Scroll */}
        <div className="hidden sm:block overflow-x-auto">
            <div className="flex px-4 sm:px-6 pt-3 sm:pt-4 min-w-max">
                {(['all', 'Pending', 'Approved', 'Cancelled', 'Rejected'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`mr-4 sm:mr-6 pb-2 sm:pb-4 text-xs sm:text-sm font-medium capitalize transition-colors border-b-2 whitespace-nowrap ${
                            activeTab === tab
                                ? 'text-blue-600 border-blue-600'
                                : 'text-gray-400 border-transparent hover:text-gray-600'
                        }`}
                    >
                        {tab}
                        {tab !== 'all' && (
                            <span className={`ml-1 sm:ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                                activeTab === tab ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                                {allLeaves.filter(l => l.status === tab).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    </div>

    {/* Content - Table View */}
    {leavesLoading ? (
        <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
    ) : filteredLeaves.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">No leave requests found</p>
            <Link to="/my-leaves/request" className="mt-3 text-sm text-blue-600 hover:underline">
                Request your first leave
            </Link>
        </div>
    ) : (
         <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
  <div className="xl:col-span-4 overflow-x-auto">
            <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Leave Type
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Duration
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Days
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Reason
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Status
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Requested On
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLeaves.map(leave => {
                        const style = getStatusStyle(leave.status);
                        const days = getDaysDiff(leave.start_date, leave.end_date);
                        return (
                            <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {leave.leave_type?.name ?? 'Leave Request'}
                                    </div>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-600">
                                        {formatDate(leave.start_date)} → {formatDate(leave.end_date)}
                                    </div>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-600">
                                        {days} day{days !== 1 ? 's' : ''}
                                    </div>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                    <div className="text-sm text-gray-600 max-w-xs truncate" title={leave.reason}>
                                        {leave.reason}
                                    </div>
                                    {leave.notes && (
                                        <div className="text-xs text-gray-400 mt-1 truncate" title={leave.notes}>
                                            Note: {leave.notes}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
                                        {style.label}
                                    </span>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                        {formatDate(leave.created_at)}
                                    </div>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                    {leave.status === 'Pending' && (
                                        <button
                                            onClick={() => handleCancel(leave.id)}
                                            disabled={cancellingId === leave.id}
                                            className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                        >
                                            {cancellingId === leave.id ? 'Cancelling...' : 'Cancel'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
         </div>
      
    )}
</div>
                </div>
            </div>
        </DashboardLayout>
    );
}