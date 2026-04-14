import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import DashboardLayout from '../../../layouts/DashboardLayout';
import {
  useCreateBranchMutation,
  useGetBranchByIdQuery,
  useUpdateBranchMutation,
  useGetBranchTypesQuery,
} from '../../../services/branchApi';
import toast from 'react-hot-toast';
import { useAppSelector } from '../../../app/hooks';
import type { RootState } from '../../../app/store';

interface BranchFormData {
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
}

const CreateNewBranch: React.FC = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';


  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // Fetch branch types
  const { data: typesData } = useGetBranchTypesQuery();

  // Fetch branch data if in edit mode
  const { data: branchData, isLoading: isLoadingBranch } = useGetBranchByIdQuery(Number(id), {
    skip: !isEditMode,
  });

  // Mutations
  const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<BranchFormData>({
    defaultValues: {
      is_active: true,
      is_temporary: false,
      has_pos: false,
      has_inventory: true,
      has_cash_bank: false,
    },
  });

  const watchIsTemporary = watch('is_temporary');
  const branchTypes = typesData?.data || [];

  useEffect(() => {
    if (branchData?.data) {
      const branch = branchData.data;
      setValue('branch_name', branch.branch_name);
      setValue('branch_type', branch.branch_type);
      setValue('has_pos', branch.has_pos);
      setValue('has_inventory', branch.has_inventory);
      setValue('has_cash_bank', branch.has_cash_bank);
      setValue('address', branch.address || '');
      setValue('phone', branch.phone || '');
      setValue('email', branch.email || '');
      setValue('is_active', branch.is_active);
      setValue('is_temporary', branch.is_temporary);
      setValue('opening_date', branch.opening_date?.split('T')[0]);
      setValue('closing_date', branch.closing_date?.split('T')[0]);
    }
  }, [branchData, setValue]);

  const onSubmit = async (data: BranchFormData) => {
    try {
      if (isEditMode) {
        await updateBranch({ id: Number(id), body: data }).unwrap();
        toast.success('Branch updated successfully');
      } else {
        await createBranch(data).unwrap();
        toast.success('Branch created successfully');
      }
      navigate(`${basePath}/branches`);
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update branch' : 'Failed to create branch');
    }
  };




  if (isEditMode && isLoadingBranch) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-full">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`${basePath}/branches`)}
            className="text-black hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Branches
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Branch' : 'Create New Branch'}
          </h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Branch Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('branch_name', { required: 'Branch name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter branch name"
                />
                {errors.branch_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.branch_name.message}</p>
                )}
              </div>

              {/* Branch Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('branch_type', { required: 'Branch type is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Type</option>
                  {branchTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Temporary */}
              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  id="is_temporary"
                  {...register('is_temporary')}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="is_temporary" className="text-sm text-gray-700">
                  Temporary Branch (Expo/Event)
                </label>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  {...register('address')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter branch address"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  {...register('phone')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter email address"
                />
              </div>

              {/* Features */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                <div className="flex space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('has_pos')}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Has POS</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('has_inventory')}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Has Inventory</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('has_cash_bank')}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Has Cash/Bank</span>
                  </label>
                </div>
              </div>

              {/* Dates - only show for temporary branches */}
              {watchIsTemporary && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Opening Date</label>
                    <input
                      type="date"
                      {...register('opening_date')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Closing Date</label>
                    <input
                      type="date"
                      {...register('closing_date')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </>
              )}

              {/* Active Status */}
              <div className="md:col-span-2 flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  {...register('is_active')}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate(`${basePath}/branches`)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || isUpdating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isCreating || isUpdating ? 'Saving...' : (isEditMode ? 'Update Branch' : 'Create Branch')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateNewBranch;