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
import { ArrowLeft, Save, X, Calendar, Phone, Mail, MapPin, Building2, Settings, Clock } from 'lucide-react';

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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <button
            onClick={() => navigate(`${basePath}/branches`)}
            className="group inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-3 sm:mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm sm:text-base">Back to Branches</span>
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                {isEditMode ? 'Edit Branch' : 'Create New Branch'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isEditMode ? 'Update branch information' : 'Add a new branch to your organization'}
              </p>
            </div>
            {isEditMode && branchData?.data && (
              <div className="flex items-center gap-2 text-sm">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${branchData.data.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {branchData.data.is_active ? 'Active' : 'Inactive'}
                </div>
                {branchData.data.is_temporary && (
                  <div className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                    Temporary
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
              {/* Basic Information Section */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">Basic Information</h2>
                </div>
                
                <div className="space-y-4">
                  {/* Branch Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Branch Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('branch_name', { required: 'Branch name is required' })}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base ${
                        errors.branch_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter branch name"
                    />
                    {errors.branch_name && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                        <span>⚠</span> {errors.branch_name.message}
                      </p>
                    )}
                  </div>

                  {/* Branch Type and Temporary - Responsive Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Branch Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('branch_type', { required: 'Branch type is required' })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base bg-white"
                      >
                        <option value="">Select Type</option>
                        {branchTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      {errors.branch_type && (
                        <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.branch_type.message}</p>
                      )}
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('is_temporary')}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Temporary Branch (Expo/Event)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">Contact Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <MapPin className="inline w-4 h-4 mr-1" /> Address
                    </label>
                    <input
                      type="text"
                      {...register('address')}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      placeholder="Enter branch address"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Phone className="inline w-4 h-4 mr-1" /> Phone
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      placeholder="Enter phone number"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Mail className="inline w-4 h-4 mr-1" /> Email
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">Features & Capabilities</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <label className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      {...register('has_pos')}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">Has POS System</span>
                  </label>
                  <label className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      {...register('has_inventory')}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">Has Inventory Management</span>
                  </label>
                  <label className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      {...register('has_cash_bank')}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">Has Cash/Bank Management</span>
                  </label>
                </div>
              </div>

              {/* Temporary Branch Dates */}
              {watchIsTemporary && (
                <div>
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Temporary Branch Period</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <Calendar className="inline w-4 h-4 mr-1" /> Opening Date
                      </label>
                      <input
                        type="date"
                        {...register('opening_date')}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <Calendar className="inline w-4 h-4 mr-1" /> Closing Date
                      </label>
                      <input
                        type="date"
                        {...register('closing_date')}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Status Section */}
              <div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                      Active Status
                    </label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Inactive branches won't be available for operations
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = watch('is_active');
                      setValue('is_active', !currentValue);
                    }}
                    className={`
                      relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full 
                      border-2 border-transparent transition-colors duration-200 ease-in-out 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      ${watch('is_active') ? 'bg-blue-600' : 'bg-gray-200'}
                    `}
                  >
                    <span
                      className={`
                        pointer-events-none inline-block h-5 w-5 transform rounded-full 
                        bg-white shadow ring-0 transition duration-200 ease-in-out
                        ${watch('is_active') ? 'translate-x-5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Form Actions - Responsive Buttons */}
            <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`${basePath}/branches`)}
                  className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                >
                  <X className="inline w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isCreating || isUpdating ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Save className="w-4 h-4" />
                      {isEditMode ? 'Update Branch' : 'Create Branch'}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateNewBranch;