// Activity Logs
export interface ActivityLog {
  id: number;
  log_name: string;
  action: string;
  description: string;
  subject_type?: string;
  subject_id?: number;
  subject_data?: any;
  changes_summary?: Record<string, { old: any; new: any }>;
  user_id?: number;
  user_name?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface ActivityLogFilters {
  user_id?: number;
  log_name?: string;
  action?: string;
  subject_type?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  ip_address?: string;
  page?: number;
  per_page?: number;
}

export interface ActivityLogStatistics {
  total_activities: number;
  by_action: Array<{ action: string; count: number }>;
  by_module: Array<{ log_name: string; count: number }>;
  top_users: Array<{ user_id: number; user_name: string; activity_count: number }>;
  recent_activities: ActivityLog[];
}

// Login History
export interface LoginHistory {
  id: number;
  user_id: number;
  user?: { id: number; name: string; email: string };
  login_at: string;
  logout_at?: string;
  ip_address: string;
  user_agent: string;
  device_type?: string;
  browser?: string;
  platform?: string;
  location?: string;
  login_status: 'success' | 'failed';
  failure_reason?: string;
  is_suspicious: boolean;
}

export interface LoginHistoryFilters {
  user_id?: number;
  login_status?: string;
  is_suspicious?: boolean;
  start_date?: string;
  end_date?: string;
  ip_address?: string;
  page?: number;
  per_page?: number;
}

// Security Alerts
export interface SecurityAlert {
  id: number;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  user_id?: number;
  user?: { id: number; name: string; email: string };
  ip_address?: string;
  metadata?: any;
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
  resolved_at?: string;
  resolved_by?: number;
  resolved_by_user?: { id: number; name: string };
  resolution_notes?: string;
  created_at: string;
}

export interface SecurityAlertFilters {
  alert_type?: string;
  severity?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

// User Sessions
export interface UserSession {
  id: number;
  user_id: number;
  user?: { id: number; name: string; email: string };
  session_id: string;
  ip_address: string;
  user_agent: string;
  device_type?: string;
  browser?: string;
  platform?: string;
  location?: string;
  login_at: string;
  last_activity_at: string;
  expires_at: string;
  status: 'active' | 'expired' | 'terminated';
}

// Change History
export interface ChangeHistory {
  id: number;
  model_type: string;
  model_id: number;
  field_name: string;
  old_value?: any;
  new_value?: any;
  change_type: 'create' | 'update' | 'delete';
  changed_by?: number;
  changed_by_user?: { id: number; name: string; email: string };
  created_at: string;
}

export interface ChangeHistoryFilters {
  model_type?: string;
  model_id?: number;
  field_name?: string;
  changed_by?: number;
  change_type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

// Deleted Records
export interface DeletedRecord {
  id: number;
  model_type: string;
  model_id: number;
  record_identifier: string;
  record_data: any;
  deleted_by?: number;
  deleted_by_name?: string;
  deleted_by_user?: { id: number; name: string };
  deleted_at: string;
  is_restored: boolean;
  restored_at?: string;
  restored_by?: number;
  restored_by_user?: { id: number; name: string };
}

export interface DeletedRecordFilters {
  model_type?: string;
  deleted_by?: number;
  is_restored?: boolean;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface DeletedRecordStatistics {
  total_deleted: number;
  total_restored: number;
  by_model_type: Array<{ model_type: string; count: number }>;
  by_user: Array<{ deleted_by: number; deleted_by_name: string; count: number }>;
  recent_deletions: DeletedRecord[];
}

// Security Statistics (from /security/statistics)
export interface SecurityStats {
  total_logins: number;
  successful_logins: number;
  failed_logins: number;
  suspicious_logins: number;
  total_alerts: number;
  critical_alerts: number;
  unresolved_alerts: number;
  active_sessions: number;
  logins_by_device: Array<{ device_type: string; count: number }>;
  recent_suspicious: LoginHistory[];
}