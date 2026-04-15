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
    <div className="bg-white rounded-lg p-4">
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
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto">

          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Security Center</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
              Monitor system access, security alerts, and activity logs
            </p>
          </div>

          {/* Mobile Tab Selector */}
          <div className="sm:hidden mb-4">
            <select
              value={activeTab}
              onChange={(e) => {
                dispatch(setActiveTab(e.target.value as any));
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.icon} {tab.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden sm:block border-b border-gray-200 mb-6 overflow-x-auto">
            <nav className="flex -mb-px space-x-4 md:space-x-8 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    dispatch(setActiveTab(tab.id as any));
                    setCurrentPage(1);
                  }}
                  className={`py-2.5 md:py-3 px-1 border-b-2 font-medium text-sm md:text-base transition-colors whitespace-nowrap ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <span className="mr-2 text-base md:text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                <StatCard
                  title="Total Logins"
                  value={stats?.total_logins || 0}
                  icon="🔑"
                  color="bg-gray-100"
                  loading={statsLoading}
                />
                <StatCard
                  title="Failed Logins"
                  value={stats?.failed_logins || 0}
                  icon="❌"
                  color="bg-gray-100"
                  loading={statsLoading}
                />
                <StatCard
                  title="Suspicious"
                  value={stats?.suspicious_logins || 0}
                  icon="⚠️"
                  color="bg-gray-100"
                  loading={statsLoading}
                />
                <StatCard
                  title="Active Sessions"
                  value={stats?.active_sessions || 0}
                  icon="👤"
                  color="bg-gray-100"
                  loading={statsLoading}
                />
                <StatCard
                  title="Unresolved Alerts"
                  value={stats?.unresolved_alerts || 0}
                  icon="🚨"
                  color="bg-gray-100"
                  loading={statsLoading}
                />
              </div>
            </div>
          )}

          {/* Activity Logs Tab */}
          {activeTab === 'logs' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Activity Logs</h2>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
                <div className="xl:col-span-4 overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {logsLoading ? (
                        <TableLoader colSpan={5} />
                      ) : logs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                            No logs found
                          </td>
                        </tr>
                      ) : (
                        logs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-900 whitespace-nowrap">
                              {log.user_name || log.user?.name || 'System'}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 break-words max-w-xs">
                              {log.description}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                              {log.ip_address || 'Unknown'}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                              {log.created_at ? format(new Date(log.created_at), 'MMM dd, HH:mm') : 'Unknown'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Login History Tab */}
          {activeTab === 'logins' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Login History</h2>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
                <div className="xl:col-span-4 overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loginsLoading ? (
                        <TableLoader colSpan={5} />
                      ) : logins.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                            No login history found
                          </td>
                        </tr>
                      ) : (
                        logins.map((login: any) => (
                          <tr key={login.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-900 whitespace-nowrap">
                              {login.user?.name || 'Unknown User'}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${login.login_status === 'success'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}>
                                {login.login_status}
                                {login.is_suspicious && ' ⚠️'}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                              {login.ip_address || 'Unknown'}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                              {login.device_type || 'Unknown'}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                              {login.login_at ? format(new Date(login.login_at), 'MMM dd, HH:mm') : 'Unknown'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Security Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Security Alerts</h2>
                <select
                  className="w-full sm:w-auto border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Alerts</option>
                  <option value="new">New</option>
                  <option value="investigating">Investigating</option>
                </select>
              </div>
              <div className="divide-y divide-gray-100">
                {alertsLoading ? (
                  <div className="flex items-center justify-center py-12 gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-500">Loading alerts...</span>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="px-4 sm:px-6 py-12 text-center text-gray-500">
                    No alerts found
                  </div>
                ) : (
                  alerts.map((alert: any) => (
                    <div key={alert.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                              {alert.severity}
                            </span>
                            <span className="text-xs sm:text-sm text-gray-500">{alert.alert_type}</span>
                          </div>
                          <h3 className="font-medium text-sm sm:text-base text-gray-900">{alert.title}</h3>
                          {alert.user_name && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">User: {alert.user_name}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          className="w-full sm:w-auto px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Active Sessions</h2>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
                <div className="xl:col-span-4 overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Activity</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sessionsLoading ? (
                        <TableLoader colSpan={5} />
                      ) : sessions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                            No active sessions
                          </td>
                        </tr>
                      ) : (
                        sessions.map((session: any) => (
                          <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-900 whitespace-nowrap">
                              {session.user?.name || 'Unknown User'}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                              {session.ip_address || 'Unknown'}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                              {session.device_type || 'Unknown'}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                              {session.last_activity_at ? format(new Date(session.last_activity_at), 'MMM dd, HH:mm') : 'Unknown'}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleTerminateSession(session.id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
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

            </div>
          )}

          {/* Deleted Records Tab */}
          {activeTab === 'deleted' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Deleted Records</h2>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
                <div className="xl:col-span-4 overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Identifier</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deleted By</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deleted At</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {deletedLoading ? (
                        <TableLoader colSpan={6} />
                      ) : deleted.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                            No deleted records found
                          </td>
                        </tr>
                      ) : (
                        deleted.map((record: any) => (
                          <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 whitespace-nowrap">
                              {record.model_type}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-900 whitespace-nowrap">
                              {record.record_identifier}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                              {record.deleted_by_name || 'System'}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                              {record.deleted_at ? format(new Date(record.deleted_at), 'MMM dd, yyyy') : 'Unknown'}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              {record.is_restored ? (
                                <span className="inline-flex px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                  Restored
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                  Deleted
                                </span>
                              )}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              {!record.is_restored && (
                                <button
                                  onClick={() => handleRestoreRecord(record.id)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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

            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SecurityCenterPage;