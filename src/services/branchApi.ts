import { api } from './api';
import type {
  Branch,
  BranchFilters,
  BranchResponse,
  BranchesResponse,
  BranchStatisticsResponse,
  BranchUsersResponse,
} from '../types/branch';

export const branchApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all branches with filters
    getBranches: builder.query<BranchesResponse, BranchFilters>({
      query: (params) => ({ url: '/branches', params }),
      providesTags: ['Branches'],
    }),

    // Get single branch
    getBranchById: builder.query<BranchResponse, number>({
      query: (id) => `/branches/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Branches', id }],
    }),

    // Create branch
    createBranch: builder.mutation<BranchResponse, Partial<Branch>>({
      query: (body) => ({
        url: '/branches',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Branches', 'BranchStatistics'],
    }),

    // Update branch
    updateBranch: builder.mutation<BranchResponse, { id: number; body: Partial<Branch> }>({
      query: ({ id, body }) => ({
        url: `/branches/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => ['Branches', { type: 'Branches', id }, 'BranchStatistics'],
    }),

    // Soft delete branch
    deleteBranch: builder.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({
        url: `/branches/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Branches', 'BranchStatistics', 'DeletedBranches'],
    }),

    // Restore branch
    restoreBranch: builder.mutation<BranchResponse, number>({
      query: (id) => ({
        url: `/branches/${id}/restore`,
        method: 'POST',
      }),
      invalidatesTags: ['Branches', 'BranchStatistics', 'DeletedBranches'],
    }),

    // Get deleted branches
    getDeletedBranches: builder.query<BranchesResponse, void>({
      query: () => '/branches/deleted',
      providesTags: ['DeletedBranches'],
    }),

    // Change branch status
    changeBranchStatus: builder.mutation<BranchResponse, { id: number; is_active: boolean }>({
      query: ({ id, is_active }) => ({
        url: `/branches/${id}/change-status`,
        method: 'POST',
        body: { is_active },
      }),
      invalidatesTags: (_r, _e, { id }) => ['Branches', { type: 'Branches', id }, 'BranchStatistics'],
    }),

    // Get branch statistics
    getBranchStatistics: builder.query<BranchStatisticsResponse, void>({
      query: () => '/branches/statistics',
      providesTags: ['BranchStatistics'],
    }),

    // Get branch types (for dropdown)
    getBranchTypes: builder.query<{ success: boolean; data: string[] }, void>({
      query: () => '/branches/types',
      providesTags: ['BranchTypes'],
    }),

    // Get warehouses only
    getWarehouses: builder.query<{ success: boolean; data: Branch[] }, void>({
      query: () => '/branches/warehouses',
      providesTags: ['Branches'],
    }),

    // Get retail branches only
    getRetailBranches: builder.query<{ success: boolean; data: Branch[] }, void>({
      query: () => '/branches/retail',
      providesTags: ['Branches'],
    }),

    // Get branches with POS
    getBranchesWithPOS: builder.query<{ success: boolean; data: Branch[] }, void>({
      query: () => '/branches/with-pos',
      providesTags: ['Branches'],
    }),

    // Get temporary branches
    getTemporaryBranches: builder.query<{ success: boolean; data: Branch[] }, void>({
      query: () => '/branches/temporary',
      providesTags: ['Branches'],
    }),

    // Get branches by type
    getBranchesByType: builder.query<{ success: boolean; data: Branch[] }, string>({
      query: (type) => `/branches/type/${type}`,
      providesTags: ['Branches'],
    }),

    // Get branch users
    getBranchUsers: builder.query<BranchUsersResponse, number>({
      query: (id) => `/branches/${id}/users`,
      providesTags: (_r, _e, id) => [{ type: 'BranchUsers', id }],
    }),
  }),
});

export const {
  useGetBranchesQuery,
  useGetBranchByIdQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
  useRestoreBranchMutation,
  useGetDeletedBranchesQuery,
  useChangeBranchStatusMutation,
  useGetBranchStatisticsQuery,
  useGetBranchTypesQuery,
  useGetWarehousesQuery,
  useGetRetailBranchesQuery,
  useGetBranchesWithPOSQuery,
  useGetTemporaryBranchesQuery,
  useGetBranchesByTypeQuery,
  useGetBranchUsersQuery,
} = branchApi;