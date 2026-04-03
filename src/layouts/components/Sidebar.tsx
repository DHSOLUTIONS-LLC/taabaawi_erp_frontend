// src/layouts/components/Sidebar.tsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import erp_logo from '../../assets/icons/erp_logo.png';
import dashboard from '../../assets/icons/dashboard.png';
import inventory from '../../assets/icons/inventory.png';
import pos from '../../assets/icons/pos.png';
import purchases from '../../assets/icons/purchases.png';
import sales from '../../assets/icons/sales.png';
import crm from '../../assets/icons/crm.png';
import accounting from '../../assets/icons/accounting.png';
import hr_icon from '../../assets/icons/hr_icon.svg';
import type { RootState } from '../../app/store';

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
  onMenuSelect?: (pageTitle: string) => void;
  mobileMenuOpen: boolean;
  closeMobileMenu: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  submenu?: SubMenuItem[];
}

interface SubMenuItem {
  id: string;
  label: string;
  path: string;
}

// Dropdown state interface
interface DropdownState {
  pos: boolean;
  sales: boolean;
  purchase: boolean;
  accounting: boolean;
  reports: boolean;
  system: boolean;
  blog: boolean;
  crm: boolean;
  hr: boolean;
  help: boolean;
  security: boolean;
  aiContent: boolean;
}

export default function Sidebar({ 
  collapsed, 
  toggleSidebar, 
  onMenuSelect, 
  mobileMenuOpen, 
  closeMobileMenu 
}: SidebarProps) {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Unified dropdown state
  const [dropdowns, setDropdowns] = useState<DropdownState>({
    pos: false,
    sales: false,
    purchase: false,
    accounting: false,
    reports: false,
    system: false,
    blog: false,
    crm: false,
    hr: false,
    help: false,
    security: false,
    aiContent: false,
  });

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const hasPermission = useCallback((permissionName: string) => {
    if (!user || !user.role || !user.role.permissions) return false;
    if (isSuperAdmin) return true;
    return user.role.permissions.some(
      (permission: any) => permission.permission_name === permissionName
    );
  }, [user, isSuperAdmin]);

  const hasAnyPermission = useCallback((permissions: string[]) => {
    if (isSuperAdmin) return true;
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission, isSuperAdmin]);

  // Toggle dropdown function
  const toggleDropdown = useCallback((id: keyof DropdownState) => {
    setDropdowns(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Close all dropdowns when sidebar collapses
  useEffect(() => {
    if (collapsed) {
      setDropdowns({
        pos: false,
        sales: false,
        purchase: false,
        accounting: false,
        reports: false,
        system: false,
        blog: false,
        crm: false,
        hr: false,
        help: false,
        security: false,
        aiContent: false,
      });
    }
  }, [collapsed]);

  // Auto-open dropdowns based on current path
  useEffect(() => {
    if (collapsed) return;
    
    const currentPath = location.pathname;
    
    if (currentPath.startsWith(`${basePath}/pos`)) {
      setDropdowns(prev => ({ ...prev, pos: true }));
    }
    if (currentPath.startsWith(`${basePath}/sales`)) {
      setDropdowns(prev => ({ ...prev, sales: true }));
    }
    if (currentPath.startsWith(`${basePath}/purchase`)) {
      setDropdowns(prev => ({ ...prev, purchase: true }));
    }
    if (currentPath.startsWith(`${basePath}/accounting`)) {
      setDropdowns(prev => ({ ...prev, accounting: true }));
    }
    if (currentPath.startsWith(`${basePath}/reports`)) {
      setDropdowns(prev => ({ ...prev, reports: true }));
    }
    if (currentPath.startsWith(`${basePath}/system`)) {
      setDropdowns(prev => ({ ...prev, system: true }));
    }
    if (currentPath.startsWith(`${basePath}/blog`)) {
      setDropdowns(prev => ({ ...prev, blog: true }));
    }
    if (currentPath.startsWith(`${basePath}/crm`)) {
      setDropdowns(prev => ({ ...prev, crm: true }));
    }
    if (currentPath.startsWith(`${basePath}/hr`)) {
      setDropdowns(prev => ({ ...prev, hr: true }));
    }
    if (currentPath.startsWith(`${basePath}/help`)) {
      setDropdowns(prev => ({ ...prev, help: true }));
    }
    if (currentPath.startsWith(`${basePath}/security`)) {
      setDropdowns(prev => ({ ...prev, security: true }));
    }
    if (currentPath.startsWith(`${basePath}/ai-content`)) {
      setDropdowns(prev => ({ ...prev, aiContent: true }));
    }
  }, [location.pathname, basePath, collapsed]);

  // Menu items definition
  const posSubmenus: SubMenuItem[] = useMemo(() => [
    hasPermission('access_pos') && { id: 'pos-terminal', label: 'Open Terminal', path: `${basePath}/pos/terminal` },
    hasPermission('access_pos') && { id: 'pos-open', label: 'Open POS', path: `${basePath}/pos` },
    hasPermission('access_pos') && { id: 'pos-orders', label: 'POS Orders', path: `${basePath}/pos/orders` },
    hasPermission('access_pos') && { id: 'pos-cashbox', label: 'Cash Box', path: `${basePath}/pos/cashbox` },
    hasPermission('access_pos') && { id: 'pos-shift-reports', label: 'Shift Reports', path: `${basePath}/pos/shift_reports` },
    hasPermission('access_pos') && { id: 'pos-returns', label: 'Returns', path: `${basePath}/pos/returns` },
  ].filter(Boolean) as SubMenuItem[], [hasPermission, basePath]);

  const salesSubmenus: SubMenuItem[] = useMemo(() => [
    { id: 'sales-dashboard', label: 'Sales Dashboard', path: `${basePath}/sales` },
    { id: 'sales-orders', label: 'Orders', path: `${basePath}/sales/orders` },
    { id: 'sales-shipping', label: 'Shipping Methods', path: `${basePath}/sales/shipping-methods` },
    { id: 'sales-invoices', label: 'Invoices', path: `${basePath}/sales/invoices` },
  ], [basePath]);

  const purchaseSubmenus: SubMenuItem[] = useMemo(() => [
    { id: 'purchase-dashboard', label: 'Dashboard', path: `${basePath}/purchase` },
    { id: 'purchase-suppliers', label: 'Suppliers', path: `${basePath}/purchase/suppliers` },
    { id: 'purchase-currencies', label: 'Currencies', path: `${basePath}/purchase/currencies` },
    { id: 'purchase-orders', label: 'Purchase Orders', path: `${basePath}/purchase/orders` },
    { id: 'purchase-pending-approvals', label: 'Pending Approvals', path: `${basePath}/purchase/pending-approvals` },
    { id: 'purchase-goods-receipts', label: 'Goods Receipts', path: `${basePath}/purchase/goods-receipts` },
    { id: 'purchase-returns', label: 'Purchase Returns', path: `${basePath}/purchase/returns` },
    { id: 'purchase-payments', label: 'Supplier Payments', path: `${basePath}/purchase/payments` },
  ], [basePath]);

  const accountingSubmenus: SubMenuItem[] = useMemo(() => [
    { id: 'accounting-dashboard', label: 'Dashboard', path: `${basePath}/accounting` },
    { id: 'chart-of-accounts', label: 'Chart of Accounts', path: `${basePath}/accounting/chart-of-accounts` },
    { id: 'journal-entries', label: 'Journal Entries', path: `${basePath}/accounting/journal-entries` },
    { id: 'bank-accounts', label: 'Bank Accounts', path: `${basePath}/accounting/bank-accounts` },
    { id: 'accounts-payable', label: 'Accounts Payable', path: `${basePath}/accounting/accounts-payable` },
    { id: 'accounts-receivable', label: 'Accounts Receivable', path: `${basePath}/accounting/accounts-receivable` },
    { id: 'budgets', label: 'Budgets', path: `${basePath}/accounting/budgets` },
    { id: 'financial-reports', label: 'Financial Reports', path: `${basePath}/accounting/financial-reports` },
  ], [basePath]);

  const systemSubmenus: SubMenuItem[] = useMemo(() => [
    { id: 'system-settings', label: 'Settings', path: `${basePath}/system/settings` },
    { id: 'payment-methods', label: 'Payment Methods', path: `${basePath}/system/payment-methods` },
    { id: 'seo', label: 'SEO Manager', path: `${basePath}/system/seo` },
  ], [basePath]);

  const blogSubmenus: SubMenuItem[] = useMemo(() => [
    { id: 'blog-all', label: 'All Posts', path: `${basePath}/blog` },
    { id: 'blog-create', label: 'Create Post', path: `${basePath}/blog/create` },
    { id: 'blog-categories', label: 'Categories', path: `${basePath}/blog/categories` },
  ], [basePath]);

  const menuItems: MenuItem[] = useMemo(() => isSuperAdmin ? [
    { id: 'dashboard', label: 'Dashboard', icon: dashboard, path: `${basePath}/dashboard` }
  ] : [], [isSuperAdmin, basePath]);

  const operationMenus: MenuItem[] = useMemo(() => [
    hasPermission('view_products') && {
      id: 'inventory',
      label: 'Inventory',
      icon: inventory,
      path: `${basePath}/inventory`
    },
    hasAnyPermission(['access_pos', 'open_pos', 'close_pos']) && {
      id: 'pos',
      label: 'POS',
      icon: pos,
      submenu: posSubmenus
    },
    hasAnyPermission(['process_sale', 'create_invoice']) && {
      id: 'sales',
      label: 'Sales',
      icon: sales,
      submenu: salesSubmenus
    },
    hasPermission('view_purchase') && {
      id: 'purchase',
      label: 'Purchase',
      icon: purchases,
      submenu: purchaseSubmenus
    },
  ].filter(Boolean) as MenuItem[], [hasPermission, hasAnyPermission, basePath, posSubmenus, salesSubmenus, purchaseSubmenus]);

  const financeMenus: MenuItem[] = useMemo(() => [
    hasPermission('view_accounting') && {
      id: 'accounting',
      label: 'Accounting',
      icon: accounting,
      submenu: accountingSubmenus
    },
    { id: 'system', label: 'System', icon: crm, submenu: systemSubmenus },
    { id: 'blog', label: 'Blog', icon: crm, submenu: blogSubmenus },
    { id: 'reports', label: 'Reports', icon: crm, path: `${basePath}/reports` },
    { id: 'crm', label: 'CRM', icon: crm, path: `${basePath}/crm` },
    { id: 'hr', label: 'HR & Users', icon: hr_icon, path: `${basePath}/hr` },
    { id: 'help', label: 'Help', icon: hr_icon, path: `${basePath}/help` },
    { id: 'aiContent', label: 'AI Content', icon: hr_icon, path: `${basePath}/ai-content` },
    { id: 'security', label: 'Security Center', icon: crm, path: `${basePath}/security` },
  ].filter(Boolean) as MenuItem[], [hasPermission, basePath, accountingSubmenus, systemSubmenus, blogSubmenus]);

  const filteredOperationMenus = useMemo(() => 
    operationMenus.filter(menu => {
      if (menu.id === 'pos') return hasPermission('access_pos') || isSuperAdmin;
      if (menu.id === 'inventory') return hasPermission('view_products') || isSuperAdmin;
      if (menu.id === 'sales') return hasPermission('process_sale') || isSuperAdmin;
      if (menu.id === 'purchase') return hasPermission('view_purchases') || isSuperAdmin;
      return false;
    }), [operationMenus, hasPermission, isSuperAdmin]);

  const filteredFinanceMenus = useMemo(() => 
    financeMenus.filter(menu => {
      if (menu.id === 'accounting') return hasPermission('view_accounting') || isSuperAdmin;
      return true;
    }), [financeMenus, hasPermission, isSuperAdmin]);

  const handleMenuClick = useCallback((menu: MenuItem) => {
    if (menu.submenu && !collapsed) {
      toggleDropdown(menu.id as keyof DropdownState);
      return;
    }
    if (onMenuSelect && menu.label) {
      onMenuSelect(menu.label);
    }
    if (menu.path) {
      navigate(menu.path);
    }
    if (window.innerWidth <= 991) {
      closeMobileMenu();
    }
  }, [collapsed, toggleDropdown, onMenuSelect, navigate, closeMobileMenu]);

  const handleSubmenuClick = useCallback((submenu: SubMenuItem, parentLabel: string) => {
    if (onMenuSelect) {
      onMenuSelect(submenu.label);
    }
    navigate(submenu.path);
    if (window.innerWidth <= 991) {
      closeMobileMenu();
    }
  }, [onMenuSelect, navigate, closeMobileMenu]);

  const findActiveMenuLabel = useCallback(() => {
    const currentPath = location.pathname;
    for (const menu of [...operationMenus, ...financeMenus]) {
      if (menu.submenu) {
        const activeSubmenu = menu.submenu.find(sub => sub.path === currentPath);
        if (activeSubmenu) return activeSubmenu.label;
      }
    }
    const allMenus = [...menuItems, ...operationMenus, ...financeMenus];
    const activeMenu = allMenus.find(menu => menu.path === currentPath);
    return activeMenu?.label || 'Dashboard Overview';
  }, [location.pathname, menuItems, operationMenus, financeMenus]);

  useEffect(() => {
    if (onMenuSelect) {
      const title = findActiveMenuLabel();
      onMenuSelect(title);
    }
  }, [location.pathname, onMenuSelect, findActiveMenuLabel]);

  const renderMenuSection = useCallback((title: string, menus: MenuItem[]) => (
    <div className="mb-6">
      {!collapsed && menus.length > 0 && (
        <h3 className="px-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <div className="space-y-1">
        {menus.map((menu) => {
          const isActive = location.pathname === menu.path;
          const hasSubmenu = menu.submenu && menu.submenu.length > 0;
          const isSubmenuOpen = dropdowns[menu.id as keyof DropdownState];
          const isParentActive = menu.submenu?.some(sub => sub.path === location.pathname);

          return (
            <div key={menu.id}>
              <button
                onClick={() => handleMenuClick(menu)}
                className={`w-full flex items-center rounded-lg transition-all duration-200 cursor-pointer ${
                  collapsed ? 'justify-center p-3' : 'px-4 py-3 space-x-3'
                } ${isActive || isParentActive
                  ? 'bg-gray-200 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                }`}
              >
                <div className={`shrink-0 ${isActive || isParentActive ? 'text-blue-500' : 'text-gray-500'}`}>
                  <img src={menu.icon} alt={menu.label} className="w-5 h-5 object-contain" />
                </div>
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium truncate flex-1 text-left">
                      {menu.label}
                    </span>
                    {hasSubmenu && (
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </>
                )}
              </button>

              {hasSubmenu && !collapsed && isSubmenuOpen && (
                <div className="mt-1 ml-4 space-y-1 border-l-2 border-gray-200 pl-4">
                  {menu.submenu!.map((submenu) => {
                    const isSubmenuActive = location.pathname === submenu.path;
                    return (
                      <button
                        key={submenu.id}
                        onClick={() => handleSubmenuClick(submenu, menu.label)}
                        className={`w-full flex items-center rounded-lg transition-all duration-200 px-4 py-2.5 cursor-pointer ${
                          isSubmenuActive
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                        }`}
                      >
                        <span className="text-sm truncate">{submenu.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  ), [collapsed, location.pathname, dropdowns, handleMenuClick, handleSubmenuClick]);

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 overflow-y-auto overflow-x-hidden ${
        collapsed ? 'w-20' : 'w-72'
      } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 z-50`}
      style={{ height: '100vh' }}
    >
      {/* Logo Section */}
      <div className={`py-4 h-18 border-b border-gray-200 ${collapsed ? 'px-2' : 'px-5'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed ? (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <img src={erp_logo} alt="ERP Logo" className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">ERP</h2>
                  <p className="text-xs text-gray-400">Enterprise Suite</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (window.innerWidth <= 991) {
                    closeMobileMenu();
                  } else {
                    toggleSidebar();
                  }
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close sidebar"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : (
            <button
              onClick={toggleSidebar}
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label="Expand sidebar"
            >
              <img src={erp_logo} alt="ERP Logo" className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className={`py-4 ${collapsed ? 'px-2' : 'px-4'}`}>
        {/* Dashboard Menu */}
        {menuItems.length > 0 && (
          <div className="mb-6">
            {menuItems.map((menu) => {
              const isActive = location.pathname === menu.path;
              return (
                <button
                  key={menu.id}
                  onClick={() => handleMenuClick(menu)}
                  className={`w-full flex items-center rounded-lg transition-all duration-200 ${
                    collapsed ? 'justify-center p-3' : 'px-4 py-3 space-x-3'
                  } ${isActive
                    ? 'bg-gray-200 text-blue-600 font-bold'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  }`}
                >
                  <div className={`shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-500'}`}>
                    <img src={menu.icon} alt={menu.label} className="w-5 h-5 object-contain" />
                  </div>
                  {!collapsed && <span className="text-sm font-medium">{menu.label}</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Operations Section */}
        {filteredOperationMenus.length > 0 && renderMenuSection('Operations', filteredOperationMenus)}
        
        {/* Finance & HR Section */}
        {filteredFinanceMenus.length > 0 && renderMenuSection('Finance & HR', filteredFinanceMenus)}
      </div>
    </aside>
  );
}