import React, { useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { setActiveTab } from '../securitySlice';
import {
  useGetSecurityStatsQuery,
  useGetActivityLogsQuery,
  useGetLoginHistoryQuery,
  useGetSecurityAlertsQuery,
  useResolveAlertMutation,
  useGetActiveSessionsQuery,
  useTerminateSessionMutation,
  useGetDeletedRecordsQuery,
  useRestoreDeletedRecordMutation,
} from '../../../services/securityApi';
import { format } from 'date-fns';

// Helper to extract array from various API response shapes
const extractData = (response: any): any[] => {
  if (!response) return [];
  if (Array.isArray(response.data)) return response.data;
  if (response.data && Array.isArray(response.data.data)) return response.data.data;
  if (Array.isArray(response)) return response;
  return [];
};

// Loader Component
const TableLoader = ({ colSpan }: { colSpan: number }) => (
  <tr>
    <td colSpan={colSpan} className="px-6 py-12 text-center">
      <div className="flex items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="text-gray-500">Loading...</span>
      </div>
    </td>
  </tr>
);

const SecurityCenterPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeTab, filters } = useAppSelector((state) => state.security);
  const [currentPage, setCurrentPage] = useState(1);

  // Stats
  const { data: statsData, isLoading: statsLoading } = useGetSecurityStatsQuery();

  // Activity Logs
  const { data: logsData, isLoading: logsLoading } = useGetActivityLogsQuery(
    { page: currentPage, per_page: 20 },
    { skip: activeTab !== 'logs' }
  );

  // Login History
  const { data: loginsData, isLoading: loginsLoading } = useGetLoginHistoryQuery(
    { page: currentPage, per_page: 20 },
    { skip: activeTab !== 'logins' }
  );

  // Security Alerts
  const { data: alertsData, isLoading: alertsLoading, refetch: refetchAlerts } = useGetSecurityAlertsQuery(
    { status: filters.status },
    { skip: activeTab !== 'alerts' }
  );

  const [resolveAlert] = useResolveAlertMutation();

  // Active Sessions
  const { data: sessionsData, isLoading: sessionsLoading, refetch: refetchSessions } = useGetActiveSessionsQuery(undefined, {
    skip: activeTab !== 'sessions',
  });

  const [terminateSession] = useTerminateSessionMutation();

  // Deleted Records
  const { data: deletedData, isLoading: deletedLoading, refetch: refetchDeleted } = useGetDeletedRecordsQuery(
    { page: currentPage, per_page: 20 },
    { skip: activeTab !== 'deleted' }
  );

  const [restoreRecord] = useRestoreDeletedRecordMutation();

  // Extract arrays using helper
  const logs = extractData(logsData);
  const logins = extractData(loginsData);
  const alerts = extractData(alertsData);
  const sessions = extractData(sessionsData);
  const deleted = extractData(deletedData);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'logs', label: 'Activity Logs', icon: '📋' },
    { id: 'logins', label: 'Login History', icon: '🔐' },
    { id: 'alerts', label: 'Security Alerts', icon: '⚠️' },
    { id: 'sessions', label: 'Active Sessions', icon: '👥' },
    { id: 'deleted', label: 'Deleted Records', icon: '🗑️' },
  ];

  const handleResolveAlert = async (id: number) => {
    try {
      await resolveAlert({ id }).unwrap();
      refetchAlerts();
    } catch (error) {
      console.error('Failed to resolve alert', error);
    }
  };

  const handleTerminateSession = async (id: number) => {
    if (confirm('Terminate this session?')) {
      try {
        await terminateSession(id).unwrap();
        refetchSessions();
      } catch (error) {
        console.error('Failed to terminate session', error);
      }
    }
  };

  const handleRestoreRecord = async (id: number) => {
    if (confirm('Restore this record?')) {
      try {
        await restoreRecord(id).unwrap();
        refetchDeleted();
      } catch (error) {
        console.error('Failed to restore record', error);
      }
    }
  };

  const StatCard = ({ title, value, icon, color, loading }: any) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mt-1"></div>
          ) : (
            <p className="text-2xl font-bold mt-1">{value}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <span className="text-white text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  const stats = statsData?.data;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Security Center</h1>
          <p className="text-gray-600 mt-2">Monitor system access, security alerts, and activity logs</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { dispatch(setActiveTab(tab.id as any)); setCurrentPage(1); }}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                title="Total Logins"
                value={stats?.total_logins || 0}
                icon="🔑"
                color="bg-blue-500"
                loading={statsLoading}
              />
              <StatCard
                title="Failed Logins"
                value={stats?.failed_logins || 0}
                icon="❌"
                color="bg-red-500"
                loading={statsLoading}
              />
              <StatCard
                title="Suspicious"
                value={stats?.suspicious_logins || 0}
                icon="⚠️"
                color="bg-yellow-500"
                loading={statsLoading}
              />
              <StatCard
                title="Active Sessions"
                value={stats?.active_sessions || 0}
                icon="👤"
                color="bg-green-500"
                loading={statsLoading}
              />
              <StatCard
                title="Unresolved Alerts"
                value={stats?.unresolved_alerts || 0}
                icon="🚨"
                color="bg-purple-500"
                loading={statsLoading}
              />
            </div>
          </div>
        )}

        {/* Activity Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Activity Logs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logsLoading ? (
                    <TableLoader colSpan={5} />
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No logs found</td></tr>
                  ) : (
                    logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">{log.user_name || log.user?.name || 'System'}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{log.action}</span>
                        </td>
                        <td className="px-6 py-4">{log.description}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{log.ip_address || 'Unknown'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {log.created_at ? format(new Date(log.created_at), 'MMM dd, HH:mm') : 'Unknown'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Login History Tab */}
        {activeTab === 'logins' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Login History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Device</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loginsLoading ? (
                    <TableLoader colSpan={5} />
                  ) : logins.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No login history found</td></tr>
                  ) : (
                    logins.map((login: any) => (
                      <tr key={login.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">{login.user?.name || 'Unknown User'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${login.login_status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            }`}>
                            {login.login_status}
                            {login.is_suspicious && ' ⚠️'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">{login.ip_address || 'Unknown'}</td>
                        <td className="px-6 py-4 text-sm">{login.device_type || 'Unknown'}</td>
                        <td className="px-6 py-4 text-sm">
                          {login.login_at ? format(new Date(login.login_at), 'MMM dd, HH:mm') : 'Unknown'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Security Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Security Alerts</h2>
              <select className="border rounded-md px-3 py-1 text-sm">
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="investigating">Investigating</option>
              </select>
            </div>
            <div className="divide-y">
              {alertsLoading ? (
                <div className="flex items-center justify-center py-12 gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-500">Loading alerts...</span>
                </div>
              ) : alerts.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">No alerts found</div>
              ) : (
                alerts.map((alert: any) => (
                  <div key={alert.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                            {alert.severity}
                          </span>
                          <span className="text-sm text-gray-500">{alert.alert_type}</span>
                        </div>
                        <h3 className="font-medium">{alert.title}</h3>
                        {alert.user_name && (
                          <p className="text-sm text-gray-600 mt-1">User: {alert.user_name}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Active Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Active Sessions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Device</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Last Activity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sessionsLoading ? (
                    <TableLoader colSpan={5} />
                  ) : sessions.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No active sessions</td></tr>
                  ) : (
                    sessions.map((session: any) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">{session.user?.name || 'Unknown User'}</td>
                        <td className="px-6 py-4 text-sm">{session.ip_address || 'Unknown'}</td>
                        <td className="px-6 py-4 text-sm">{session.device_type || 'Unknown'}</td>
                        <td className="px-6 py-4 text-sm">
                          {session.last_activity_at ? format(new Date(session.last_activity_at), 'MMM dd, HH:mm') : 'Unknown'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleTerminateSession(session.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Terminate
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Deleted Records Tab */}
        {/* Deleted Records Tab */}
        {activeTab === 'deleted' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Deleted Records</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Identifier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Deleted By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Deleted At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {deletedLoading ? (
                    <TableLoader colSpan={6} />
                  ) : deleted.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No deleted records found</td>
                    </tr>
                  ) : (
                    deleted.map((record: any) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">{record.model_type}</td>
                        <td className="px-6 py-4">{record.record_identifier}</td>
                        <td className="px-6 py-4 text-sm">{record.deleted_by_name || 'System'}</td>
                        <td className="px-6 py-4 text-sm">
                          {record.deleted_at ? format(new Date(record.deleted_at), 'MMM dd, yyyy') : 'Unknown'}
                        </td>
                        <td className="px-6 py-4">
                          {record.is_restored ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Restored</span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Deleted</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {!record.is_restored && (
                            <button
                              onClick={() => handleRestoreRecord(record.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Restore
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SecurityCenterPage;