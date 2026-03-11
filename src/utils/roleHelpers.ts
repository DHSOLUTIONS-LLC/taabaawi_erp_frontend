// src/utils/roleHelpers.ts

/**
 * Roles that can view and switch between all branches
 */
const BRANCH_SWITCHING_ROLES = ['Super Admin', 'Accountant'];

/**
 * Roles that require branch assignment during user creation
 */
const BRANCH_REQUIRED_ROLES = ['Sales Staff', 'Branch Manager', 'Cashier'];

/**
 * Check if user role can switch branches (view all branches)
 */
export const canSwitchBranch = (roleName?: string): boolean => {
  if (!roleName) return false;
  return BRANCH_SWITCHING_ROLES.includes(roleName);
};

/**
 * Check if role requires branch assignment
 */
export const requiresBranchAssignment = (roleName?: string): boolean => {
  if (!roleName) return false;
  return BRANCH_REQUIRED_ROLES.some(
    role => roleName.toLowerCase() === role.toLowerCase()
  );
};

/**
 * Check if user is Super Admin
 */
export const isSuperAdmin = (roleName?: string): boolean => {
  return roleName === 'Super Admin';
};

/**
 * Check if user is HR
 */
export const isHR = (roleName?: string): boolean => {
  return roleName === 'HR' || roleName === 'HR Manager';
};

/**
 * Get base path for navigation based on role
 */
export const getBasePath = (roleName?: string): string => {
  if (isSuperAdmin(roleName)) return '/admin';
  if (isHR(roleName)) return '/hr';
  return '';
};