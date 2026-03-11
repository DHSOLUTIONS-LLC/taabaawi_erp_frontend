// services/authApi.ts
import { api } from './api';

export type LoginReq = 
{ email: string; password: string };

export type Permission = {
  id: number;
  permission_name: string;
  module_name: string;
};

export type Role = {
  id: number;
  role_name: string;
  permissions: Permission[];
};

// MATCHES your authSlice AuthUser type
export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  isSuperAdmin?: boolean;
  branch_id?: number | null;
  branch?: {
    id: number;
    branch_name: string;
    branch_type: string;
  };
};

export type LoginRes = {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: AuthUser;
  };
};

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginRes, LoginReq>({
      query: (body) => ({ url: '/login', method: 'POST', body }),
    }),
  }),
});

export const { useLoginMutation } = authApi;