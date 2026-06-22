// src/layouts/components/Topbar.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";
import { setSelectedBranch } from "../../features/branch/branchSlice";
import { api } from "../../services/api";
import { ChevronDown } from "../../components/shared/icons";

import { useGetCurrentPOSQuery } from "../../services/posApi";

import { useGetBranchesQuery } from "../../services/superAdminApi";
import { canSwitchBranch } from "../../utils/roleHelpers";

import type { RootState } from "../../app/store";
import history_icon_2 from "../../assets/icons/history_icon_3.svg";
// import market_icon from "../../assets/icons/market_icon.svg";

import { useCreateCategoryMutation } from "../../services/inventoryApi";
import CategoryPopup from "../../features/inventory/components/CategoryPopup";
import CloseRegisterPage from "../../features/pos/components/CloseRegisterPage";

interface TopbarProps {
  pageTitle?: string;
  sidebarCollapsed?: boolean;
  toggleSidebar?: () => void;
  toggleMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
}

interface Branch {
  id: number;
  branch_name: string;
  branch_type?: string;
  has_pos?: boolean;
  has_inventory?: boolean;
}

export default function Topbar({
  pageTitle = "Dashboard Overview",
  toggleMobileMenu,
  mobileMenuOpen,
}: TopbarProps) {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const selectedBranchId = useAppSelector(
    (state: RootState) => state.branch?.selectedBranchId,
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftDuration, setShiftDuration] = useState("");
  const [isRegisterClosed, setIsRegisterClosed] = useState(false); // Add this state

  // Get current POS session for ALL users (including Super Admin)
  const {
    data: currentRegisterResponse,
    refetch: refetchCurrentRegister,
    isFetching: isFetchingRegister,
  } = useGetCurrentPOSQuery(undefined, {
    skip: !user?.id,
    pollingInterval: 60000,
  });

  const currentRegister = currentRegisterResponse?.data;
  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const isCashier = user?.role?.role_name === "Cashier" || user?.role?.role_name === "cashier";
  const isSalesStaff = user?.role?.role_name === "Sales Staff" || user?.role?.role_name === "sales staff";

  // Reset register closed state when a new register is opened
  useEffect(() => {
    if (currentRegister) {
      setIsRegisterClosed(false);
    }
  }, [currentRegister]);

  // Show shift button only when register is open
  const showShiftButton = (isCashier || isSuperAdmin || isSalesStaff) && currentRegister && !isRegisterClosed;

  // Show shift closed indicator when register is closed
  const showShiftClosed = (isCashier || isSuperAdmin || isSalesStaff) &&
    (isRegisterClosed || (!currentRegister && !isFetchingRegister));

  useEffect(() => {
    if (currentRegister?.opened_at) {
      const updateDuration = () => {
        const openedAt = new Date(currentRegister.opened_at);
        const now = new Date();
        const diffMs = now.getTime() - openedAt.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setShiftDuration(`${diffHrs}h ${diffMins}m`);
      };
      updateDuration();
      const interval = setInterval(updateDuration, 60000);
      return () => clearInterval(interval);
    }
  }, [currentRegister]);

  const handleCloseShift = () => setShowShiftModal(true);

  const handleShiftClosed = () => {
    // Set register as closed
    setIsRegisterClosed(true);
    // Refetch to update the state
    refetchCurrentRegister();
    setShowShiftModal(false);

    // Force a re-fetch after a short delay
    setTimeout(() => {
      refetchCurrentRegister();
    }, 500);
  };

  const [createCategory] = useCreateCategoryMutation();

  const {
    data: branchesData = [],
    isLoading: branchesLoading,
    error: branchesError,
  } = useGetBranchesQuery();

  const branches: Branch[] = Array.isArray(branchesData) ? branchesData : [];

  const userCanSwitchBranch = canSwitchBranch(user?.role?.role_name);

  const getCurrentBranchDisplay = () => {
    if (userCanSwitchBranch) {
      if (selectedBranchId === null || selectedBranchId === undefined) {
        return "All Branches";
      }
      const branch = branches.find((b) => b.id === selectedBranchId);
      return branch?.branch_name || "All Branches";
    } else {
      if (user?.branch_id) {
        const branch = branches.find((b) => b.id === user.branch_id);
        return branch?.branch_name || user.branch?.branch_name || "My Branch";
      }
      return "No Branch Assigned";
    }
  };

  const handleBranchSelect = (branchId: number | null) => {
    if (!userCanSwitchBranch) return;

    dispatch(setSelectedBranch(branchId));

    dispatch(
      api.util.invalidateTags([
        "Products",
        "Sales",
        "Orders",
        "Invoices",
        "Customers",
        "PurchaseOrders",
        "GoodsReceiptNotes",
        "PurchaseReturns",
        "SupplierPayments",
        "Suppliers",
        "Payroll",
        "Attendance",
        "Employee",
        "Staff",
        "JournalEntries",
        "BankAccounts",
        "BankTransactions",
        "ChartOfAccounts",
        "AccountsPayable",
        "AccountsReceivable",
        "Budgets",
        "Reports",
        "Dashboards",
        "KpiMetrics",
        "POS",
        "ShiftReports",
        "Returns",
        "Coupons",
        "Roles",
        "Users",
        "Branches",
        "Permissions",
        "Customers",
        "CustomerStatistics",
        "LoyaltyStatistics",
        "Loyalty",
        "ActivityLogs",
        "LoginHistory",
        "SecurityAlerts",
        "UserSessions",
        "DeletedRecords",
      ]),
    );

    setShowBranchDropdown(false);
  };

  const isHR =
    user?.role?.role_name === "HR" || user?.role?.role_name === "HR Manager";

  const hasCreateRolePermission = () => {
    if (!user || !user.role || !user.role.permissions) return false;
    if (isSuperAdmin) return true;
    return user.role.permissions.some(
      (p: any) =>
        p.permission_name === "create_user" || p.name === "create_user",
    );
  };

  const hasCreateUserPermission = () => {
    if (!user || !user.role || !user.role.permissions) return false;
    if (isSuperAdmin) return true;
    return user.role.permissions.some(
      (p: any) =>
        p.permission_name === "create_user" || p.name === "create_user",
    );
  };

  const canSeeAdminButtons = isSuperAdmin || isHR;
  const canCreateRole = hasCreateRolePermission();
  const canCreateUser = hasCreateUserPermission();

  const handleLogout = () => {
    dispatch(logout());
    navigate(isSuperAdmin ? "/admin_login" : "/login");
  };

  const handleMobileMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toggleMobileMenu) toggleMobileMenu();
  };

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowBranchDropdown(false);
      setShowProfileMenu(false);
      setShowNotifications(false);
      setShowCreateMenu(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 h-14 sm:h-16 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-2 xs:px-3 sm:px-4 md:px-6 gap-1 xs:gap-2 sm:gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-1 xs:gap-2 sm:gap-4 md:gap-6 min-w-0 flex-shrink">
          {/* Mobile Menu Button */}
          <button
            onClick={handleMobileMenuToggle}
            className="lg:hidden p-1.5 xs:p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Toggle menu"
          >
            <svg
              className="w-4 h-4 xs:w-5 xs:h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Page Title */}
          <h1 className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 max-w-[80px] xs:max-w-[120px] sm:max-w-[200px] md:max-w-none">
            {pageTitle}
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-3">
          {/* Create Menu - Mobile & Tablet */}
          <div className="relative block xl:hidden">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCreateMenu(!showCreateMenu);
              }}
              className="flex items-center gap-1 px-2 py-1.5 xs:px-2.5 xs:py-2 text-black border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-xs sm:text-sm"
            >
              <svg
                className="w-3.5 h-3.5 xs:w-4 xs:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="font-medium hidden xs:inline">Create</span>
            </button>

            {showCreateMenu && (
              <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-2">
                  {canSeeAdminButtons && canCreateRole && (
                    <Link
                      to={
                        isSuperAdmin
                          ? "/admin/hr/create_role"
                          : "/hr/create_role"
                      }
                      onClick={() => setShowCreateMenu(false)}
                    >
                      <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors text-sm">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        <span>Create Role</span>
                      </button>
                    </Link>
                  )}
                  {canSeeAdminButtons && canCreateUser && (
                    <Link
                      to={
                        isSuperAdmin ? "/admin/hr/add_employee" : "/hr/add_employee"
                      }
                      onClick={() => setShowCreateMenu(false)}
                    >
                      <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors text-sm">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        <span>Add Staff</span>
                      </button>
                    </Link>
                  )}
                  <Link
                    to={
                      isSuperAdmin
                        ? "/admin/sales/create_invoice"
                        : "/sales/create_invoice"
                    }
                    onClick={() => setShowCreateMenu(false)}
                  >
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors text-sm">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      <span>Create Invoice</span>
                    </button>
                  </Link>
                  <button
                    onClick={() => {
                      setShowCreateMenu(false);
                      setShowCategoryPopup(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors text-sm"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span>Create Category</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Create Buttons - Desktop */}
          <div className="hidden xl:flex items-center gap-2">
            {canSeeAdminButtons && canCreateRole && (
              <Link
                to={isSuperAdmin ? "/admin/hr/create_role" : "/hr/create_role"}
              >
                <button className="flex items-center gap-2 px-3 py-2 text-black border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer text-sm">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="font-medium">Role</span>
                </button>
              </Link>
            )}
            {canSeeAdminButtons && canCreateUser && (
              <Link to={isSuperAdmin ? "/admin/hr/add_employee" : "/hr/add_employee"}>
                <button className="flex items-center gap-2 px-3 py-2 text-black border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer text-sm">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="font-medium">Staff</span>
                </button>
              </Link>
            )}
            <Link
              to={
                isSuperAdmin
                  ? "/admin/sales/create_invoice"
                  : "/sales/create_invoice"
              }
            >
              <button className="flex items-center gap-2 px-3 py-2 text-black border border-blue-600 rounded-lg cursor-pointer transition-colors text-sm">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="font-medium">Invoice</span>
              </button>
            </Link>
            <button
              onClick={() => setShowCategoryPopup(true)}
              className="flex items-center gap-2 px-3 py-2 text-black border border-blue-600 rounded-lg cursor-pointer transition-colors hover:bg-blue-50 text-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="font-medium">Category</span>
            </button>
          </div>

          {/* Shift Close Button - Show when register is open */}
          {showShiftButton && (
            <button
              onClick={handleCloseShift}
              className="hidden sm:flex items-center gap-1 px-2 py-1.5 xs:px-2.5 xs:py-1.5 sm:px-3 sm:py-2 bg-[#FF5F57] text-white rounded-lg hover:bg-[#FF4A42] transition-colors text-xs sm:text-sm whitespace-nowrap animate-pulse"
            >
              <img
                src={history_icon_2}
                alt="Shift"
                className="w-3 h-3 sm:w-4 sm:h-4"
              />
              <span className="font-medium hidden xs:inline">
                Shift {shiftDuration && `(${shiftDuration})`}
              </span>
              <span className="font-medium xs:hidden">
                {shiftDuration || "Shift"}
              </span>
            </button>
          )}

          {/* Shift Closed Indicator - Show when register is closed */}
          {showShiftClosed && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1.5 xs:px-2.5 xs:py-1.5 sm:px-3 sm:py-2 bg-gray-300 text-gray-500 rounded-lg text-xs sm:text-sm cursor-not-allowed whitespace-nowrap">
              <img
                src={history_icon_2}
                alt="Shift Closed"
                className="w-3 h-3 sm:w-4 sm:h-4 opacity-50"
              />
              <span className="font-medium hidden xs:inline">Shift Closed</span>
              <span className="font-medium xs:hidden">Closed</span>
            </div>
          )}

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNotifications(!showNotifications);
              }}
              className="p-1.5 xs:p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors relative"
              aria-label="Notifications"
            >
              <svg
                className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 xs:w-2 xs:h-2 bg-red-500 rounded-full"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-64 xs:w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-3 xs:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 text-sm xs:text-base">
                      Notifications
                    </h3>
                    <button className="text-xs text-blue-600 hover:text-blue-800">
                      Mark all as read
                    </button>
                  </div>
                  <div className="space-y-2 xs:space-y-3">
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="text-xs xs:text-sm text-gray-700">
                        New invoice created
                      </p>
                      <p className="text-xs text-gray-500">2 mins ago</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs xs:text-sm text-gray-700">
                        Inventory stock low
                      </p>
                      <p className="text-xs text-gray-500">1 hour ago</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            className="hidden xs:flex p-1.5 xs:p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            aria-label="Settings"
          >
            <svg
              className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileMenu(!showProfileMenu);
              }}
              className="flex items-center gap-1 xs:gap-2 focus:outline-none"
            >
              <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white text-xs xs:text-sm font-semibold">
                  {user?.name?.charAt(0) || "U"}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs sm:text-sm font-medium text-gray-900 max-w-[80px] sm:max-w-[100px] truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500 max-w-[80px] sm:max-w-[100px] truncate">
                  {user?.role?.role_name || "Role"}
                </p>
              </div>
              <ChevronDown className="hidden md:block w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-2">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                    <p className="text-xs text-blue-600 font-medium mt-1">
                      {user?.role?.role_name}
                    </p>
                  </div>

                  {/* Show My Leaves and My Leaves Requests to all users except Super Admin */}
                  {!isSuperAdmin && (
                    <>
                      <Link to="/profile">
                        <button
                          onClick={() => setShowProfileMenu(false)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        >
                          My Profile
                        </button>
                      </Link>
                      <Link to="/my-leaves">
                        <button
                          onClick={() => setShowProfileMenu(false)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        >
                          My Leaves
                        </button>
                      </Link>
                      <Link to="/my-leaves/request">
                        <button
                          onClick={() => setShowProfileMenu(false)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        >
                          My Leaves Requests
                        </button>
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Popup */}
      {showCategoryPopup && (
        <CategoryPopup
          onClose={() => setShowCategoryPopup(false)}
          onSubmit={async (formData: FormData) => {
            try {
              await createCategory(formData).unwrap();
            } catch (error: any) {
              console.error("Category creation error:", error);
              throw error;
            }
          }}
        />
      )}

      {/* Shift Close Modal */}
      {showShiftModal && currentRegister && (
        <CloseRegisterPage
          register={currentRegister}
          onClose={() => setShowShiftModal(false)}
          onSuccess={handleShiftClosed}
          onRegisterClosed={() => {
            setIsRegisterClosed(true);
            refetchCurrentRegister();
          }}
        />
      )}
    </header>
  );
}