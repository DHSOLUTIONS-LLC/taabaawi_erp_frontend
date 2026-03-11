export interface Branch {
  id: number;
  branch_name: string;
  branch_type: 'Warehouse' | 'Retail' | 'B2B' | 'E-Commerce' | 'Repair' | 'Discard' | 'Marketing' | 'Expo';
  has_pos: boolean;
  has_inventory: boolean;
  has_cash_bank: boolean;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  is_temporary: boolean;
  opening_date?: string;
  closing_date?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  users_count?: number;
}

export interface BranchFilters {
  branch_type?: string;
  is_active?: boolean;
  is_temporary?: boolean;
  has_pos?: boolean;
  has_inventory?: boolean;
  has_cash_bank?: boolean;
  search?: string;
  with_users_count?: boolean;
  all?: boolean;
  page?: number;
  per_page?: number;
}

export interface BranchStatistics {
  total_branches: number;
  active_branches: number;
  inactive_branches: number;
  deleted_branches: number;
  temporary_branches: number;
  branches_by_type: Array<{ type: string; count: number }>;
  branches_with_pos: number;
  branches_with_inventory: number;
  branches_with_cash_bank: number;
}

export interface BranchResponse {
  success: boolean;
  data: Branch;
  message?: string;
}

export interface BranchesResponse {
  success: boolean;
  data: {
    data: Branch[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface BranchStatisticsResponse {
  success: boolean;
  data: BranchStatistics;
}

export interface BranchUsersResponse {
  success: boolean;
  data: {
    branch: Branch;
    users: any[];
    users_count: number;
  };
}