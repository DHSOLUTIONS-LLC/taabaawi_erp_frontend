// src/services/superAdminApi.ts
import { api } from './api';

/* ================= TYPES ================= */
export type Role = {
    id: number;
    role_name: string;
    description: string;
};

export type Branch = {
    id: number;
    branch_name: string;
    branch_type: string;
    has_pos: boolean;
    has_inventory: boolean;
};

export type Permission = {
    id: number;
    permission_name: string;
    module_name: string;
};
export type PermissionsByModule = Record<string, Permission[]>;

// In src/services/superAdminApi.ts
export type CreateStaffReq = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string; // Add this for Laravel
  phone: string;
  role_id: number;
  branch_id: number | null; // Always include (can be null)
  is_active: boolean;
};

export type CreateRoleReq = {
    role_name: string;
    description: string;
    permissions: number[];
};


export const superAdminApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // GET ROLES
        getRoles: builder.query<Role[], void>({
            query: () => '/roles',
            transformResponse: (response: any): any[] => {
                console.log('roles API Response:', response);

                // If response is already an array
                if (Array.isArray(response)) return response;

                // If response has a data property that is an array
                if (response?.data && Array.isArray(response.data)) return response.data;

                // If response has data.data structure (like branches)
                if (response?.data?.data && Array.isArray(response.data.data)) return response.data.data;

                // If response is empty or invalid
                return [];
            },
        }),

        // GET BRANCHES
        getBranches: builder.query<Branch[], void>({
            query: () => '/branches',
            transformResponse: (response: any): any[] => {
                console.log('branches API Response:', response);

                // If response is already an array
                if (Array.isArray(response)) return response;

                // If response has a data property that is an array
                if (response?.data && Array.isArray(response.data)) return response.data;

                // If response has data.data structure (like branches)
                if (response?.data?.data && Array.isArray(response.data.data)) return response.data.data;

                // If response is empty or invalid
                return [];
            },
        }),

        // GET PERMISSIONS
        getPermissions: builder.query<PermissionsByModule, void>({
            query: () => '/permissions',

            transformResponse: (response: any): PermissionsByModule => {
                console.log('permissions API Response:', response);

                // Your API: { data: { Accounting: [], POS: [] ... } }
                if (response?.data && typeof response.data === 'object') {
                    return response.data;
                }

                return {};
            },
        }),


        // CREATE STAFF
        createStaff: builder.mutation<any, CreateStaffReq>({
            query: (body) => ({
                url: '/users',
                method: 'POST',
                body,
            }),
        }),

        createRole: builder.mutation<any, CreateRoleReq>({
            query: (body) => ({
                url: '/roles',
                method: 'POST',
                body,
            }),
        }),


        getUsers: builder.query<any, {
      search?: string;
      role_id?: number;
      branch_id?: number;
      is_active?: boolean;
      page?: number;
      per_page?: number;
    }>({
      query: (params) => ({ url: '/users', params }),
      providesTags: ['Users'],
    }),
    
    getUserById: builder.query<{ success: boolean; data: any }, number>({
      query: (id) => `/users/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Users', id }],
    }),
  }),
    })
 

export const {
    useGetRolesQuery,
    useGetBranchesQuery,
    useGetPermissionsQuery,
    useCreateStaffMutation,
    useCreateRoleMutation,
      useGetUsersQuery,
  useGetUserByIdQuery,
} = superAdminApi;