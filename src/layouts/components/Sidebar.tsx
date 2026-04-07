// src/layouts/components/Sidebar.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import erp_logo from '../../assets/icons/erp_logo.png'
import dashboard from '../../assets/icons/dashboard.png'
import inventory from '../../assets/icons/inventory.png'
import pos from '../../assets/icons/pos.png'
import purchases from '../../assets/icons/purchases.png'
import sales from '../../assets/icons/sales.png'
import crm from '../../assets/icons/crm.png'
import accounting from '../../assets/icons/accounting.png'
import hr_icon from '../../assets/icons/hr_icon.svg'
import type { RootState } from '../../app/store';

interface SidebarProps {
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

export default function Sidebar({ onMenuSelect, mobileMenuOpen, closeMobileMenu }: SidebarProps) {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  const [isPosOpen, setIsPosOpen] = useState(false);
  const [isSalesOpen, setIsSalesOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isAccountingOpen, setIsAccountingOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isSystemOpen, setIsSystemOpen] = useState(false);
  const [isBlogOpen, setIsBlogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const hasPermission = (permissionName: string) => {
    if (!user || !user.role || !user.role.permissions) return false;
    if (isSuperAdmin) return true;
    return user.role.permissions.some(
      (permission: any) => permission.permission_name === permissionName
    );
  };

  const hasAnyPermission = (permissions: string[]) => {
    if (isSuperAdmin) return true;
    return permissions.some(permission => hasPermission(permission));
  };

  const menuItems: MenuItem[] = isSuperAdmin ? [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: dashboard,
      path: `${basePath}/dashboard`
    },
  ] : [];

  const posSubmenus: SubMenuItem[] = [
    hasPermission('access_pos') && { id: 'pos-terminal', label: 'Open Terminal', path: `${basePath}/pos/terminal` },
    hasPermission('access_pos') && { id: 'pos-open', label: 'Open POS', path: `${basePath}/pos` },
    hasPermission('access_pos') && { id: 'pos-orders', label: 'POS Orders', path: `${basePath}/pos/orders` },
    hasPermission('access_pos') && { id: 'pos-cashbox', label: 'Cash Box', path: `${basePath}/pos/cashbox` },
    hasPermission('access_pos') && { id: 'pos-shift-reports', label: 'Shift Reports', path: `${basePath}/pos/shift_reports` },
    hasPermission('access_pos') && { id: 'pos-returns', label: 'Returns', path: `${basePath}/pos/returns` },
  ].filter(Boolean) as SubMenuItem[];

  const operationMenus: MenuItem[] = [
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
      path: `${basePath}/pos`,
      submenu: posSubmenus
    },
    hasAnyPermission(['process_sale', 'create_invoice']) && {
      id: 'sales',
      label: 'Sales',
      icon: sales,
      path: `${basePath}/sales`,
      submenu: [
        { id: 'sales-dashboard', label: 'Sales Dashboard', path: `${basePath}/sales` },
        { id: 'sales-orders', label: 'Orders', path: `${basePath}/sales/orders` },
        { id: 'sales-shipping', label: 'Shipping Methods', path: `${basePath}/sales/shipping-methods` },
        { id: 'sales-invoices', label: 'Invoices', path: `${basePath}/sales/invoices` },
      ],
    },
    hasPermission('view_purchase') && {
      id: 'purchase',
      label: 'Purchase',
      icon: purchases,
      path: `${basePath}/purchase`,
      submenu: [
        { id: 'purchase-dashboard', label: 'Dashboard', path: `${basePath}/purchase` },
        { id: 'purchase-suppliers', label: 'Suppliers', path: `${basePath}/purchase/suppliers` },
        { id: 'purchase-currencies', label: 'Currencies', path: `${basePath}/purchase/currencies` },
        { id: 'purchase-orders', label: 'Purchase Orders', path: `${basePath}/purchase/orders` },
        { id: 'purchase-pending-approvals', label: 'Pending Approvals', path: `${basePath}/purchase/pending-approvals` },
        { id: 'purchase-goods-receipts', label: 'Goods Receipts', path: `${basePath}/purchase/goods-receipts` },
        { id: 'purchase-returns', label: 'Purchase Returns', path: `${basePath}/purchase/returns` },
        { id: 'purchase-payments', label: 'Supplier Payments', path: `${basePath}/purchase/payments` },
      ],
    },
  ].filter(Boolean) as MenuItem[];

  const financeMenus: MenuItem[] = [
    hasPermission('view_accounting') && {
      id: 'accounting',
      label: 'Accounting',
      icon: accounting,
      path: `${basePath}/accounting`,
      submenu: [
        { id: 'accounting-dashboard', label: 'Dashboard', path: `${basePath}/accounting` },
        { id: 'chart-of-accounts', label: 'Chart of Accounts', path: `${basePath}/accounting/chart-of-accounts` },
        { id: 'journal-entries', label: 'Journal Entries', path: `${basePath}/accounting/journal-entries` },
        { id: 'bank-accounts', label: 'Bank Accounts', path: `${basePath}/accounting/bank-accounts` },
        { id: 'accounts-payable', label: 'Accounts Payable', path: `${basePath}/accounting/accounts-payable` },
        { id: 'accounts-receivable', label: 'Accounts Receivable', path: `${basePath}/accounting/accounts-receivable` },
        { id: 'budgets', label: 'Budgets', path: `${basePath}/accounting/budgets` },
        { id: 'financial-reports', label: 'Financial Reports', path: `${basePath}/accounting/financial-reports` },
      ],
    },
    hasPermission('') && {
      id: 'system',
      label: 'System',
      icon: crm,
      submenu: [
        { id: 'system-settings', label: 'Settings', path: `${basePath}/system/settings` },
        { id: 'payment-methods', label: 'Payment Methods', path: `${basePath}/system/payment-methods` },
        { id: 'seo', label: 'SEO Manager', path: `${basePath}/system/seo` },
      ]
    },
    hasPermission('') && {
      id: 'blog',
      label: 'Blog',
      icon: crm,
      submenu: [
        { id: 'blog-all', label: 'All Posts', path: `${basePath}/blog` },
        { id: 'blog-create', label: 'Create Post', path: `${basePath}/blog/create` },
        { id: 'blog-categories', label: 'Categories', path: `${basePath}/blog/categories` },
      ]
    },
    hasPermission('view_reports') && {
      id: 'reports',
      label: 'Reports',
      icon: crm,
      path: `${basePath}/reports`
    },
    hasPermission('view_crm') && {
      id: 'crm',
      label: 'CRM',
      icon: crm,
      path: `${basePath}/crm`
    },
    hasAnyPermission(['view_users', 'create_user', 'edit_user', 'delete_user']) && {
      id: 'hr',
      label: 'HR & Users',
      icon: hr_icon,
      path: `${basePath}/hr`
    },
    hasAnyPermission(['view_users', 'create_user', 'edit_user', 'delete_user']) && {
      id: 'help',
      label: 'Help',
      icon: hr_icon,
      path: `${basePath}/help`
    },
    {
      id: 'ai-content',
      label: 'AI Content',
      icon: hr_icon,
      path: `${basePath}/ai-content`,
    },
    hasAnyPermission(['view_users', 'create_user', 'edit_user', 'delete_user']) && {
      id: 'System',
      label: 'Settings',
      icon: crm,
      path: `${basePath}/system/settings`
    },
    hasAnyPermission(['view_users', 'create_user', 'edit_user', 'delete_user']) && {
      id: 'security',
      label: 'Security Center',
      icon: crm,
      path: `${basePath}/security`
    },
  ].filter(Boolean) as MenuItem[];

  const filteredOperationMenus = operationMenus.filter(menu => {
    if (menu.id === 'pos') return hasPermission('access_pos') || isSuperAdmin;
    if (menu.id === 'inventory') return hasPermission('view_products') || isSuperAdmin;
    if (menu.id === 'sales') return hasPermission('process_sale') || isSuperAdmin;
    if (menu.id === 'purchase') return hasPermission('view_purchases') || isSuperAdmin;
    return false;
  });

  const filteredFinanceMenus = financeMenus.filter(menu => {
    if (menu.id === 'accounting') return hasPermission('view_accounting') || isSuperAdmin;
    if (menu.id === 'reports') return hasPermission('view_reports') || isSuperAdmin;
    if (menu.id === 'crm') return hasPermission('view_crm') || isSuperAdmin;
    if (menu.id === 'hr') return hasPermission('view_users') || isSuperAdmin;
    if (menu.id === 'help') return hasPermission('view_users') || isSuperAdmin;
    if (menu.id === 'system') return hasPermission('view_users') || isSuperAdmin;
    if (menu.id === 'blog') return hasPermission('view_users') || isSuperAdmin;
    if (menu.id === 'ai-content') return hasPermission('view_users') || isSuperAdmin;
    if (menu.id === 'security') return hasPermission('view_users') || isSuperAdmin;
    return false;
  });

  const isPosPathActive = location.pathname.startsWith(`${basePath}/pos`);
  const isPurchasePathActive = location.pathname.startsWith(`${basePath}/purchase`);
  const isAccountingPathActive = location.pathname.startsWith(`${basePath}/accounting`);
  const isReportsPathActive = location.pathname.startsWith(`${basePath}/reports`);
  const isSalesPathActive = location.pathname.startsWith(`${basePath}/sales`);

  useEffect(() => {
    if (isPurchasePathActive) setIsPurchaseOpen(true);
  }, [isPurchasePathActive]);

  useEffect(() => {
    if (isPosPathActive) setIsPosOpen(true);
  }, [isPosPathActive]);

  useEffect(() => {
    if (isAccountingPathActive) setIsAccountingOpen(true);
  }, [isAccountingPathActive]);

  useEffect(() => {
    if (isReportsPathActive) setIsReportsOpen(true);
  }, [isReportsPathActive]);

  useEffect(() => {
    if (isSalesPathActive) setIsSalesOpen(true);
  }, [isSalesPathActive]);

  const handleMenuClick = (menu: MenuItem) => {
    if (menu.submenu) {
      if (menu.id === 'pos') setIsPosOpen(prev => !prev);
      else if (menu.id === 'sales') setIsSalesOpen(prev => !prev);
      else if (menu.id === 'purchase') setIsPurchaseOpen(prev => !prev);
      else if (menu.id === 'accounting') setIsAccountingOpen(prev => !prev);
      else if (menu.id === 'reports') setIsReportsOpen(prev => !prev);
      else if (menu.id === 'blog') setIsBlogOpen(prev => !prev);
      else if (menu.id === 'system') setIsSystemOpen(prev => !prev);
      return;
    }

    if (onMenuSelect) onMenuSelect(menu.label);
    if (menu.path) navigate(menu.path);
    if (window.innerWidth <= 991) closeMobileMenu();
  };

  const handleSubmenuClick = (submenu: SubMenuItem, _parentLabel: string) => {
    if (onMenuSelect) onMenuSelect(submenu.label);
    navigate(submenu.path);
    if (window.innerWidth <= 991) closeMobileMenu();
  };

  const findActiveMenuLabel = () => {
    const currentPath = location.pathname;
    for (const menu of operationMenus) {
      if (menu.submenu) {
        const activeSubmenu = menu.submenu.find(sub => sub.path === currentPath);
        if (activeSubmenu) return activeSubmenu.label;
      }
    }
    const allMenus = [...menuItems, ...operationMenus, ...financeMenus];
    const activeMenu = allMenus.find(menu => menu.path === currentPath);
    return activeMenu?.label || 'Dashboard Overview';
  };

  useEffect(() => {
    if (onMenuSelect) {
      const title = findActiveMenuLabel();
      onMenuSelect(title);
    }
  }, [location.pathname]);

  const renderMenuSection = (title: string, menus: MenuItem[]) => (
    <div className="mb-6">
      {menus.length > 0 && (
        <h3 className="px-2 mb-2 text-lg font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <div className="space-y-1">
        {menus.map((menu) => {
          const isActive = location.pathname === menu.path;
          const hasSubmenu = menu.submenu && menu.submenu.length > 0;
          const isSubmenuOpen =
            (menu.id === 'pos' && isPosOpen) ||
            (menu.id === 'sales' && isSalesOpen) ||
            (menu.id === 'purchase' && isPurchaseOpen) ||
            (menu.id === 'accounting' && isAccountingOpen) ||
            (menu.id === 'reports' && isReportsOpen) ||
            (menu.id === 'blog' && isBlogOpen) ||
            (menu.id === 'system' && isSystemOpen);
          const isParentActive = menu.submenu?.some(sub => sub.path === location.pathname);

          return (
            <div key={menu.id}>
              <button
                onClick={() => handleMenuClick(menu)}
                className={`w-full flex items-center rounded-lg transition-all duration-200 cursor-pointer px-4 py-3 space-x-3 ${
                  isActive || isParentActive
                    ? 'bg-gray-200 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                }`}
              >
                <div className={`shrink-0 ${isActive || isParentActive ? 'text-blue-500' : 'text-gray-500'}`}>
                  <img src={menu.icon} alt={menu.label} className="w-5 h-5 object-contain" />
                </div>
                <span className="text-lg font-medium truncate flex-1 text-left">{menu.label}</span>
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
              </button>

              {hasSubmenu && isSubmenuOpen && (
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
                        <span className="text-base truncate">{submenu.label}</span>
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
  );

  return (
    <>
      {/* Backdrop overlay for mobile — closes sidebar when clicking outside */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200
          overflow-y-auto transition-transform duration-300 z-50
          ${isMobile ? 'w-full' : 'w-80'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:w-80 lg:z-0
        `}
        style={{ height: '100vh' }}
      >
        {/* Header */}
        <div className="py-3 h-18 border-b border-gray-200 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <img src={erp_logo} alt="ERP Logo" className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">ERP</h2>
                <p className="text-sm text-gray-400">Enterprise Suite</p>
              </div>
            </div>

            {/* Close button — visible only on mobile/tablet (<= 991px) */}
            <button
              onClick={closeMobileMenu}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-4 px-4">
          {menuItems.length > 0 && (
            <div className="mb-6">
              {menuItems.map((menu) => {
                const isActive = location.pathname === menu.path;
                return (
                  <button
                    key={menu.id}
                    onClick={() => handleMenuClick(menu)}
                    className={`w-full flex items-center rounded-lg transition-all duration-200 px-4 py-3 space-x-3 ${
                      isActive
                        ? 'bg-gray-200 text-blue-600 font-bold'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                    }`}
                  >
                    <div className={`shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-500'}`}>
                      <img src={menu.icon} alt={menu.label} className="w-6 h-6 object-contain" />
                    </div>
                    <span className="text-lg font-medium">{menu.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {filteredOperationMenus.length > 0 && renderMenuSection('Operations', filteredOperationMenus)}
          {filteredFinanceMenus.length > 0 && renderMenuSection('Finance & HR', filteredFinanceMenus)}
        </div>
      </aside>
    </>
  );
}