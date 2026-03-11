// src/utils/PermissionManager.ts
import type { RootState } from '../app/store';
import { useSelector } from 'react-redux';

export const usePermissions = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const hasPermission = (permission: string): boolean => {
    if (isSuperAdmin) return true; // Super Admin has all permissions
    if (!user?.role?.permissions) return false;

    return user.role.permissions.some(
      (p) => p.permission_name === permission
    );
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(hasPermission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(hasPermission);
  };

  const isRole = (role: string): boolean => {
    return user?.role?.role_name === role;
  };

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isRole,
  };
};
