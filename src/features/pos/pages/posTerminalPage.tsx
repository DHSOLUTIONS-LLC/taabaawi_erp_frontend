// src/features/pos/POSTerminalPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../layouts/DashboardLayout';
import { useAppSelector} from '../../../app/hooks';
import type { RootState } from '../../../app/store';
import { useGetBranchesQuery } from '../../../services/superAdminApi';
import { 
  useOpenPOSMutation,
  useGetCurrentPOSQuery,
  useGetPOSsQuery 
} from '../../../services/posApi';
import { canSwitchBranch } from '../../../utils/roleHelpers';

import desktop_icon from '../../../assets/icons/desktop_icon.svg';
import market_icon from '../../../assets/icons/market_icon.svg';
import dropdown_arrow_icon from '../../../assets/icons/dropdown_arrow_icon.svg';

export default function POSTerminalPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  
  const [selectedTerminal, setSelectedTerminal] = useState('POS-01 (Front Desk)');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [openingCash, setOpeningCash] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const isEmp = user?.role?.role_name;
  const basePath = isSuperAdmin ? '/admin' : isEmp ? '/' : '';

  const { data: currentRegisterResponse, isLoading: checkingRegister, error: currentRegisterError } = useGetCurrentPOSQuery(undefined, {
    skip: !user?.id
  });

  const { data: branchRegistersResponse } = useGetPOSsQuery(
    { branch_id: selectedBranchId || undefined, status: 'Open' },
    { skip: !selectedBranchId }
  );

  const { data: branchesData, isLoading: branchesLoading, error: branchesError } = useGetBranchesQuery();
  const [openCashRegister, { isLoading: isOpening }] = useOpenPOSMutation();

  const branches = Array.isArray(branchesData) ? branchesData : [];
  const userCanSwitchBranch = canSwitchBranch(user?.role?.role_name);

  // Redirect only for non-super-admin users with open register
  useEffect(() => {
    if (redirectAttempted || checkingRegister || isSuperAdmin) return;
    
    if (currentRegisterResponse?.success === true && currentRegisterResponse?.data) {
      setRedirectAttempted(true);
      navigate(`${basePath}/pos`, { 
        replace: true,
        state: { existingRegister: true, register: currentRegisterResponse.data }
      });
    }
  }, [currentRegisterResponse, checkingRegister, navigate, basePath, redirectAttempted, isSuperAdmin]);

  useEffect(() => {
    if (branches.length > 0) {
      if (userCanSwitchBranch) {
        const defaultBranchId = branches[0]?.id || null;
        setSelectedBranchId(defaultBranchId);
        setSelectedBranch(branches[0]?.branch_name || '');
      } else if (user?.branch_id) {
        const userBranch = branches.find(b => b.id === user.branch_id);
        setSelectedBranchId(user.branch_id);
        setSelectedBranch(userBranch?.branch_name || '');
      }
    }
  }, [branches, userCanSwitchBranch, user?.branch_id]);

  const getCurrentBranchDisplay = () => {
    if (userCanSwitchBranch) {
      if (selectedBranchId === null || selectedBranchId === undefined) return 'All Branches';
      const branch = branches.find(b => b.id === selectedBranchId);
      return branch?.branch_name || 'All Branches';
    } else {
      if (user?.branch_id) {
        const branch = branches.find(b => b.id === user.branch_id);
        return branch?.branch_name || user.branch?.branch_name || 'My Branch';
      }
      return 'No Branch Assigned';
    }
  };

  const handleBranchSelect = (branchId: number | null) => {
    if (userCanSwitchBranch) {
      setSelectedBranchId(branchId);
      if (branchId === null) {
        setSelectedBranch('All Branches');
      } else {
        const branch = branches.find(b => b.id === branchId);
        setSelectedBranch(branch?.branch_name || '');
      }
      setShowBranchDropdown(false);
    }
  };

  const handleStartPOS = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!selectedBranchId || !openingCash.trim()) {
      alert(!selectedBranchId ? 'Please select a branch' : 'Please enter opening cash amount');
      return;
    }

    const cashAmount = parseFloat(openingCash);
    if (isNaN(cashAmount) || cashAmount < 0) {
      alert('Please enter a valid opening cash amount');
      return;
    }

    if (branchRegistersResponse?.data?.data?.length > 0) {
      const confirmOpen = window.confirm(
        `This branch already has ${branchRegistersResponse.data.data.length} open register(s). Are you sure you want to open another?`
      );
      if (!confirmOpen) return;
    }
    
    try {
      const response = await openCashRegister({
        branch_id: selectedBranchId,
        opening_balance: cashAmount,
        opening_notes: `Morning shift - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      }).unwrap();

      localStorage.setItem('pos_session', JSON.stringify({
        registerId: response.data.id,
        branchId: selectedBranchId,
        branchName: selectedBranch,
        terminal: selectedTerminal,
        openingBalance: cashAmount,
        openedAt: new Date().toISOString()
      }));

      setRedirectAttempted(true);
      navigate(`${basePath}/pos`, { 
        replace: true,
        state: { register: response.data }
      });
      
    } catch (error: any) {
      console.error('Failed to open cash register:', error);
      
      if (error.data?.message?.includes('already have an open cash register')) {
        alert('You already have an open cash register. Please close it first.');
        setRedirectAttempted(true);
        navigate(`${basePath}/pos`, { replace: true });
      } else {
        alert(error?.data?.message || 'Failed to open cash register. Please try again.');
      }
    }
  };

  if (checkingRegister) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3">Checking existing sessions...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        <div className="bg-white px-8 py-4 rounded-lg grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="relative">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <img src={desktop_icon} alt="" />
              </div>
              <select
                value={selectedTerminal}
                onChange={(e) => setSelectedTerminal(e.target.value)}
                className="w-full py-3.5 bg-white text-center border border-gray-200 rounded-sm text-gray-900 font-medium text-base appearance-none cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>POS-01 (Front Desk)</option>
                <option>POS-02 (Back Counter)</option>
                <option>POS-03 (Drive-Thru)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <img src={dropdown_arrow_icon} alt="" />
              </div>
            </div>
          </div>
          <div className="relative"></div>

          <div className="relative">
            {userCanSwitchBranch ? (
              <>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <img src={market_icon} alt="" />
                  </div>
                  <button
                    onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                    className="w-full pl-12 pr-10 py-3.5 bg-white text-left border border-gray-200 rounded-sm text-gray-900 font-medium text-base cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={branchesLoading || !!branchesError}
                  >
                    <span className="block truncate">
                      {branchesLoading ? 'Loading...' : branchesError ? 'Error loading branches' : getCurrentBranchDisplay()}
                    </span>
                  </button>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <img src={dropdown_arrow_icon} alt="" />
                  </div>
                </div>

                {showBranchDropdown && !branchesLoading && !branchesError && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowBranchDropdown(false)} />
                    <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Select Branch
                        </div>
                        <button
                          onClick={() => handleBranchSelect(null)}
                          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                            selectedBranchId === null || selectedBranchId === undefined
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          All Branches
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
                        {branches.map((branch) => (
                          <button
                            key={branch.id}
                            onClick={() => handleBranchSelect(branch.id)}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                              selectedBranchId === branch.id
                                ? 'bg-blue-50 text-blue-600 font-medium'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {branch.branch_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <img src={market_icon} alt="" />
                </div>
                <div className="w-full pl-12 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 font-medium text-base">
                  <span className="block truncate">{getCurrentBranchDisplay()}</span>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <img src={dropdown_arrow_icon} alt="" />
                </div>
              </div>
            )}
            
            {branchesLoading && <p className="text-xs text-blue-600 mt-1 text-center">Loading branches...</p>}
            {branchesError && <p className="text-xs text-red-600 mt-1 text-center">Failed to load branches</p>}
            {!branchesLoading && !branchesError && branches.length === 0 && (
              <p className="text-xs text-yellow-600 mt-1 text-center">No branches found</p>
            )}
            {branchRegistersResponse?.data?.data?.length > 0 && (
              <p className="text-xs text-orange-600 mt-1 text-center">
                ⚠️ {branchRegistersResponse.data.data.length} open register(s) in this branch
              </p>
            )}
          </div>
        </div>

        <div className="bg-white mt-3 p-6 sm:p-8 lg:p-8">
          <div className="max-w-8xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-end">
              <div className="lg:col-span-7">
                <input
                  type="number"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  placeholder="Opening Cash Amount (KWD)"
                  className="w-full px-5 py-4 bg-white border border-[#00000080] rounded-xl text-[#00000080] font-semibold text-center placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.001"
                />
              </div>
              <div className="hidden lg:block lg:col-span-2" />
              <div className="lg:col-span-3">
                <button
                  onClick={handleStartPOS}
                  disabled={isOpening || checkingRegister || !selectedBranchId || !openingCash.trim()}
                  className={`w-full px-8 sm:px-12 py-4 bg-[#1773CF] hover:bg-blue-700 text-white font-semibold text-lg rounded-lg transition-all duration-200 cursor-pointer ${
                    (isOpening || checkingRegister || !selectedBranchId || !openingCash.trim()) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isOpening ? 'Opening...' : checkingRegister ? 'Checking...' : 'Start POS'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}