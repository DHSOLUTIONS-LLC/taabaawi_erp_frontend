// src/features/sales/pages/CreateInvoice.tsx
import DashboardLayout from '../../../layouts/DashboardLayout';
// import dropdown_arrow_icon from '../../../assets/icons/dropdown_arrow_icon.svg';
import arrow_back_icon from '../../../assets/icons/arrow_back_icon.svg';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
    useGetPermissionsQuery,
    useCreateRoleMutation,
} from '../../../services/superAdminApi';
import { useAppSelector } from '../../../app/hooks';
import type { RootState } from '../../../app/store';

// interface Permission {
//     id: number;
//     permission_name: string;
// }

export default function CreateRole() { // Changed from CreateInvoice to CreateRole
    const { user } = useAppSelector((state: RootState) => state.auth);

    const [roleName, setRoleName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

    // Fetch permissions
    const {
        data: permissionsByModule = {},
        isLoading: permissionsLoading,
        error: permissionsError,
    } = useGetPermissionsQuery();

    // Create role mutation
    const [createRole, { isLoading: creating }] = useCreateRoleMutation();

    const handleCreateRole = async () => {
        // Validation
        if (!roleName.trim()) {
            alert('Please enter a role name');
            return;
        }

        if (!description.trim()) {
            alert('Please enter a description');
            return;
        }

        if (selectedPermissions.length === 0) {
            const confirm = window.confirm('No permissions selected. Are you sure you want to create a role without permissions?');
            if (!confirm) return;
        }

        try {
            const payload = {
                role_name: roleName.trim(),
                description: description.trim(), // Fixed typo: was "desciption" in your original
                is_active: true, // You might want to make this configurable
                permissions: selectedPermissions,
            };

            console.log('Creating role with:', payload);
            const result = await createRole(payload).unwrap();

            console.log('Role created successfully:', result);
            alert('New Role Created Successfully!');

            // Reset form
            setRoleName('');
            setDescription('');
            setSelectedPermissions([]);

            // Redirect to roles list or stay on page
            // window.location.href = '/roles'; // Uncomment if you want to redirect

        } catch (error: any) {
            console.error('Create role error:', error);
            const errorMessage = error?.data?.message ||
                error?.error ||
                error?.data?.error ||
                'Please try again';
            alert(`Failed to create role: ${errorMessage}`);
        }
    };

    // Toggle all permissions in a module
    const toggleModulePermissions = (moduleName: string) => {
        const modulePermissions = permissionsByModule[moduleName];
        if (!modulePermissions) return;

        const modulePermissionIds = modulePermissions.map(p => p.id);

        // Check if all permissions in module are selected
        const allSelected = modulePermissionIds.every(id =>
            selectedPermissions.includes(id)
        );

        if (allSelected) {
            // Remove all module permissions
            setSelectedPermissions(prev =>
                prev.filter(id => !modulePermissionIds.includes(id))
            );
        } else {
            // Add all module permissions
            setSelectedPermissions(prev => {
                const newPermissions = [...prev];
                modulePermissionIds.forEach(id => {
                    if (!newPermissions.includes(id)) {
                        newPermissions.push(id);
                    }
                });
                return newPermissions;
            });
        }
    };

    // Toggle all permissions across all modules
    const toggleAllPermissions = () => {
        const allPermissionIds: number[] = [];

        Object.values(permissionsByModule).forEach(modulePermissions => {
            modulePermissions.forEach(permission => {
                allPermissionIds.push(permission.id);
            });
        });

        if (selectedPermissions.length === allPermissionIds.length) {
            // Deselect all
            setSelectedPermissions([]);
        } else {
            // Select all
            setSelectedPermissions(allPermissionIds);
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



    // Loading state
    if (permissionsLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6155F5] mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading permissions...</p>
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
                        <span className="px-2 font-semibold text-sm md:text-base">Create Role</span>
                    </Link>
                </div>

                {/* Debug Info (Remove in production) */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
                    <p className="font-semibold text-blue-800">Debug Info:</p>
                    <p>Permissions loaded: {Object.keys(permissionsByModule).length} modules</p>
                    <p>Selected permissions: {selectedPermissions.length}</p>
                </div>

                <div className="bg-white rounded-xl p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Role Name */}
                        <div>
                            <label className="block text-md font-medium text-gray-400 mb-2">Role Name *</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={roleName}
                                    onChange={(e) => setRoleName(e.target.value)}
                                    placeholder="e.g., Super Admin"
                                    className='w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10'
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-md font-medium text-gray-400 mb-2">Description *</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="e.g., Full System Access"
                                    className='w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10'
                                />
                            </div>
                        </div>
                    </div>

                    {/* Permissions Section */}
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                            <label className="block text-lg font-medium text-gray-700">
                                Permissions {permissionsLoading && '(Loading...)'}
                            </label>

                            <button
                                type="button"
                                onClick={toggleAllPermissions}
                                className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                {selectedPermissions.length ===
                                    Object.values(permissionsByModule).flat().length
                                    ? 'Deselect All'
                                    : 'Select All'}
                            </button>
                        </div>

                        {permissionsError ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-600">Failed to load permissions. Please try again.</p>
                            </div>
                        ) : Object.keys(permissionsByModule).length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No permissions available</p>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
                                    <div key={moduleName} className="border border-gray-200 rounded-lg p-4">
                                        {/* Module Header with Select All for Module */}
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="font-semibold text-gray-800 text-lg">
                                                {moduleName}
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => toggleModulePermissions(moduleName)}
                                                className="text-sm px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                                            >
                                                {perms.every(p => selectedPermissions.includes(p.id))
                                                    ? 'Deselect All'
                                                    : 'Select All'}
                                            </button>
                                        </div>

                                        {/* Module Permissions */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-2">
                                            {perms.map((p) => (
                                                <label
                                                    key={p.id}
                                                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPermissions.includes(p.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedPermissions([...selectedPermissions, p.id]);
                                                            } else {
                                                                setSelectedPermissions(
                                                                    selectedPermissions.filter((id) => id !== p.id)
                                                                );
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700">
                                                        {p.permission_name}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={handleCreateRole}
                        disabled={
                            creating ||
                            !roleName.trim() ||
                            !description.trim()
                        }
                        className="w-full px-6 py-3 text-black hover:text-white border border-[#6155F5] font-medium rounded-lg hover:bg-[#6155F5] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black"
                    >
                        {creating ? 'Creating Role...' : 'Create Role'}
                    </button>
                    <button
                        onClick={() => window.history.back()}
                        className="w-full px-6 py-3 text-black hover:text-white border border-[#6155F5] font-medium rounded-lg hover:bg-[#6155F5] transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>

                {/* Selected Permissions Summary */}
                {selectedPermissions.length > 0 && (
                    <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="font-medium text-green-800 mb-2">
                            {selectedPermissions.length} permission(s) selected
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {Object.values(permissionsByModule)
                                .flat()
                                .filter(p => selectedPermissions.includes(p.id))
                                .map(p => (
                                    <span
                                        key={p.id}
                                        className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                                    >
                                        {p.permission_name}
                                    </span>
                                ))
                            }
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}