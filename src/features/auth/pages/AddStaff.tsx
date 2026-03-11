// src/features/sales/pages/CreateInvoice.tsx
import DashboardLayout from '../../../layouts/DashboardLayout';
import dropdown_arrow_icon from '../../../assets/icons/dropdown_arrow_icon.svg';
import arrow_back_icon from '../../../assets/icons/arrow_back_icon.svg';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  useGetRolesQuery,
  useGetBranchesQuery,
  useCreateStaffMutation,
} from '../../../services/superAdminApi';
import { useAppSelector } from '../../../app/hooks';
import type { RootState } from '../../../app/store';

export default function CreateInvoice() {
  const { user } = useAppSelector((state: RootState) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState<number | null>(null);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Fetch all data independently
  const {
    data: rolesData = [],
    isLoading: rolesLoading,
    error: rolesError,
    refetch: refetchRoles
  } = useGetRolesQuery();

  const {
    data: branchesData = [],
    isLoading: branchesLoading,
    error: branchesError,
    refetch: refetchBranches
  } = useGetBranchesQuery();

  // Ensure arrays are always arrays
  const branches = Array.isArray(branchesData) ? branchesData : [];

  const roles = Array.isArray(rolesData) ? rolesData : [];

  // Check if selected role requires branch selection
  useEffect(() => {
    if (roleId) {
      const selectedRole = roles.find(role => role.id === roleId);
      const rolesRequiringBranch = ['sales staff', 'branch manager', 'cashier'];
      const shouldShowBranch = selectedRole &&
        rolesRequiringBranch.includes(selectedRole.role_name.toLowerCase());

      setShowBranchDropdown(!!shouldShowBranch);
    } else {
      setShowBranchDropdown(false);
    }
  }, [roleId, roles]);

  // Validate password match
  useEffect(() => {
    if (passwordConfirmation && password !== passwordConfirmation) {
      setPasswordError('Passwords do not match');
    } else {
      setPasswordError('');
    }
  }, [password, passwordConfirmation]);

  const [createStaff, { isLoading: creating }] = useCreateStaffMutation();

  const handleSaveAndCreateLogin = async () => {
    // Clear previous errors
    setPasswordError('');

    // Validation
    if (!name.trim()) {
      alert('Please enter full name');
      return;
    }

    if (!email.trim()) {
      alert('Please enter email');
      return;
    }

    if (!password.trim()) {
      alert('Please enter password');
      return;
    }

    if (!passwordConfirmation.trim()) {
      alert('Please confirm password');
      return;
    }

    if (password !== passwordConfirmation) {
      setPasswordError('Passwords do not match');
      alert('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      alert('Password must be at least 6 characters');
      return;
    }

    if (!phone.trim()) {
      alert('Please enter phone number');
      return;
    }

    if (!roleId) {
      alert('Please select a role');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        password_confirmation: passwordConfirmation.trim(),
        phone: phone.trim(),
        role_id: roleId,
        branch_id: branchId, // Always send branch_id (can be null)
        is_active: isActive,
      };

      console.log('Creating staff with:', payload);
      const result = await createStaff(payload).unwrap();

      console.log('Staff created successfully:', result);
      alert('New Staff Member Created Successfully!');

      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setPasswordConfirmation('');
      setPhone('');
      setRoleId(null);
      setBranchId(null);
      setIsActive(true);
      setShowBranchDropdown(false);

    } catch (error: any) {
      console.error('Create staff error:', error);

      // Check for validation errors from API
      if (error?.data?.errors) {
        const errors = error.data.errors;
        const errorMessages = Object.values(errors).flat().join(', ');
        alert(`Validation failed: ${errorMessages}`);
      } else {
        const errorMessage = error?.data?.message ||
          error?.error ||
          error?.data?.error ||
          'Please try again';
        alert(`Failed to create staff: ${errorMessage}`);
      }
    }
  };


  // Check user role
  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const isHR = user?.role?.role_name === 'HR';


  const basePath = isSuperAdmin
    ? '/admin'
    : isHR
      ? '/hr'
      : '';


  // Handle retry for failed API calls
  const handleRetryAPIs = () => {
    refetchRoles();
    refetchBranches();
  };

  // Loading state
  if (rolesLoading || branchesLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6155F5] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-row justify-between items-center">
          <Link to={`${basePath}/hr`} className="flex flex-row items-center">
            <img src={arrow_back_icon} alt="Back" className="w-6 h-6 md:w-8 md:h-8" />
            <span className="px-2 font-semibold text-sm md:text-base">Add New Employee</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Full Name */}
            <div>
              <label className="block text-md font-medium text-gray-400 mb-2">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Enter Full name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-md font-medium text-gray-400 mb-2">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="employee@company.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Password */}
            <div>
              <label className="block text-md font-medium text-gray-400 mb-2">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg ${passwordError ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Minimum 6 characters"
                required
              />
              {password && password.length < 6 && (
                <p className="text-red-500 text-xs mt-1">Password must be at least 6 characters</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-md font-medium text-gray-400 mb-2">Confirm Password *</label>
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg ${passwordError ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Re-enter password"
                required
              />
              {passwordError && (
                <p className="text-red-500 text-xs mt-1">{passwordError}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Phone */}
            <div>
              <label className="block text-md font-medium text-gray-400 mb-2">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="+965 11111111"
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-md font-medium text-gray-400 mb-2">Role *</label>
              <div className="relative">
                <select
                  value={roleId ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setRoleId(value ? Number(value) : null);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10"
                  disabled={!!rolesError}
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                </div>
              </div>
              {rolesError && <p className="text-red-500 text-sm mt-1">Failed to load roles</p>}
            </div>
          </div>

          {/* Branch Selection */}
          <div className="mb-4">
            <label className="block text-md font-medium text-gray-400 mb-2">
              Branch {showBranchDropdown ? '*' : ''}
            </label>
            <div className="relative">
              <select
                value={branchId ?? ''}
                onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10"
                disabled={!!branchesError || branchesLoading}
              >
                <option value="">Select Branch (Optional for some roles)</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
              </div>
            </div>
            {branchesLoading && <p className="text-gray-500 text-sm mt-1">Loading branches...</p>}
            {branchesError && <p className="text-red-500 text-sm mt-1">Failed to load branches</p>}
            {showBranchDropdown && (
              <p className="text-amber-600 text-sm mt-1">This role requires a branch selection</p>
            )}
          </div>

          {/* Active Status */}
          <div className="mt-4 mb-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Active User</span>
            </label>
            <p className="text-sm text-gray-500 mt-1">
              {isActive
                ? "User will be able to login immediately"
                : "User account will be inactive and cannot login"
              }
            </p>
          </div>

          {/* Error display for API failures */}
          {(rolesError || branchesError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600 font-medium mb-2">Failed to load required data</p>
              <p className="text-sm text-red-500 mb-3">
                {rolesError && "Roles failed to load. "}
                {branchesError && "Branches failed to load. "}
                Please retry or contact support.
              </p>
              <button
                onClick={handleRetryAPIs}
                className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm"
              >
                Retry Loading Data
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleSaveAndCreateLogin}
            disabled={
              creating ||
              !!rolesError ||
              !!branchesError ||
              !roleId ||
              !name.trim() ||
              !email.trim() ||
              !password.trim() ||
              !passwordConfirmation.trim() ||
              !phone.trim() ||
              !!passwordError ||
              password.length < 6 ||
              (showBranchDropdown && !branchId) // Only require branch if role needs it
            }
            className="w-full px-6 py-3 text-black hover:text-white border border-[#6155F5] font-medium rounded-lg hover:bg-[#6155F5] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black"
          >
            {creating ? 'Creating...' : 'Save & Create Login'}
          </button>
          <button
            onClick={() => window.history.back()}
            className="w-full px-6 py-3 text-black hover:text-white border border-[#6155F5] font-medium rounded-lg hover:bg-[#6155F5] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}