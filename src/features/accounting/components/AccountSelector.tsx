// src/features/accounting/components/AccountSelector.tsx
import { useState, useEffect } from 'react';
import { useGetChartOfAccountsQuery } from '../../../services/accountingApi';
import dropdown_arrow_icon from '../../../assets/icons/dropdown_arrow_icon.svg';

interface AccountSelectorProps {
  value: string;
  onChange: (accountId: string, accountCode: string, accountName: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  filterByType?: string[];
  showBalance?: boolean;
}

export default function AccountSelector({
  value,
  onChange,
  label = 'Account',
  required = false,
  error,
  disabled = false,
  filterByType,
  showBalance = false,
}: AccountSelectorProps) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const { data, isLoading } = useGetChartOfAccountsQuery({
    is_active: true,
    per_page: 1000,
  });

  const accounts = (data as any)?.data?.data || (data as any)?.data || [];

  // Filter accounts by type if specified
  const filteredAccounts = filterByType
    ? accounts.filter((acc: any) => filterByType.includes(acc.account_type))
    : accounts;

  // Search filtering
  const searchedAccounts = filteredAccounts.filter((acc: any) =>
    acc.account_code.toLowerCase().includes(search.toLowerCase()) ||
    acc.account_name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (value && accounts.length > 0) {
      const account = accounts.find((a: any) => a.id.toString() === value);
      setSelectedAccount(account || null);
    }
  }, [value, accounts]);

  const handleSelect = (account: any) => {
    setSelectedAccount(account);
    onChange(account.id.toString(), account.account_code, account.account_name);
    setShowDropdown(false);
    setSearch('');
  };

  const num = (v: any) => parseFloat(v) || 0;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-600">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Selected Account Display / Input */}
        <div
          onClick={() => !disabled && setShowDropdown(!showDropdown)}
          className={`w-full px-4 py-3 border rounded-lg bg-white cursor-pointer flex items-center justify-between ${error ? 'border-red-500' : 'border-gray-300'
            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-blue-400'}`}
        >
          {selectedAccount ? (
            <div className="flex-1">
              <span className="text-sm font-mono font-semibold text-gray-700">
                {selectedAccount.account_code}
              </span>
              <span className="text-sm text-gray-900 ml-2">
                {selectedAccount.account_name}
              </span>
              {showBalance && (
                <span className="text-xs text-gray-500 ml-2">
                  (Balance: {num(selectedAccount.current_balance).toFixed(3)})
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400">Select an account...</span>
          )}
          <img
            src={dropdown_arrow_icon}
            alt=""
            className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
          />
        </div>

        {/* Dropdown */}
        {showDropdown && !disabled && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden flex flex-col">
            {/* Search */}
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code or name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* Account List */}
            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Loading accounts...
                </div>
              ) : searchedAccounts.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No accounts found
                </div>
              ) : (
                searchedAccounts.map((account: any) => (
                  <button
                    key={account.id}
                    onClick={() => handleSelect(account)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 border-b border-gray-300 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-mono font-semibold text-gray-700">
                          {account.account_code}
                        </span>
                        <span className="text-sm text-gray-900 ml-2">
                          {account.account_name}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {account.account_type}
                      </span>
                    </div>
                    {showBalance && (
                      <div className="text-xs text-gray-500 mt-1">
                        Balance: {account.currency} {num(account.current_balance).toFixed(3)}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}