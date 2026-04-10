// src/features/purchase/components/CurrencyModal.tsx
import { useState, useEffect } from 'react';
import { useCreateCurrencyMutation, useUpdateCurrencyMutation } from '../../../../services/purchaseApi';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface CurrencyModalProps {
  currency: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Predefined list of common currencies for search
const COMMON_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب' },
  { code: 'OMR', name: 'Omani Rial', symbol: '﷼' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD' },
];

export default function CurrencyModal({ currency, onClose, onSuccess }: CurrencyModalProps) {
  const [formData, setFormData] = useState({
    currency_code: '',
    currency_name: '',
    currency_symbol: '',
    exchange_rate: 1.000000,
    is_active: true,
    is_base_currency: false,
  });

  const [createCurrency, { isLoading: isCreating }] = useCreateCurrencyMutation();
  const [updateCurrency, { isLoading: isUpdating }] = useUpdateCurrencyMutation();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [liveRate, setLiveRate] = useState<number | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState(COMMON_CURRENCIES);

  // Filter currencies based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults(COMMON_CURRENCIES);
    } else {
      const filtered = COMMON_CURRENCIES.filter(
        c =>
          c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    }
  }, [searchQuery]);

  const fetchLiveRate = async (currencyCode: string) => {
    if (!currencyCode || currencyCode === 'KWD' || currencyCode.length !== 3) {
      setLiveRate(null);
      return;
    }

    setIsLoadingRate(true);
    setRateError(null);
    console.log(`🔍 Fetching live rate for: ${currencyCode}`);

    try {
      // Using ExchangeRate-API - completely free, no key required
      const url = `https://open.er-api.com/v6/latest/KWD`;
      console.log(`📡 API URL: ${url}`);

      const response = await fetch(url);
      const data = await response.json();

      console.log(`📊 API Response:`, data);

      if (data.rates && data.rates[currencyCode]) {
        const rate = data.rates[currencyCode];
        console.log(`✅ Live rate for ${currencyCode}:`, rate);
        setLiveRate(rate);
        setFormData(prev => ({
          ...prev,
          exchange_rate: rate
        }));
      } else {
        console.error(`❌ No rate found for ${currencyCode}`);
        setRateError(`No exchange rate found for ${currencyCode}`);
        setLiveRate(null);
      }
    } catch (error) {
      console.error('❌ Failed to fetch live rate:', error);
      setRateError('Failed to fetch live rate. Please check your internet connection.');
      setLiveRate(null);
    } finally {
      setIsLoadingRate(false);
    }
  };

  // Handle currency selection from search
  const handleSelectCurrency = (selected: typeof COMMON_CURRENCIES[0]) => {
    console.log(`🔘 Selected currency:`, selected);
    setFormData(prev => ({
      ...prev,
      currency_code: selected.code,
      currency_name: selected.name,
      currency_symbol: selected.symbol,
    }));
    setSearchQuery('');
    setShowSearchResults(false);
    fetchLiveRate(selected.code);
  };

  // Fetch rate when currency code changes manually
  useEffect(() => {
    if (formData.currency_code && formData.currency_code.length === 3 && !currency) {
      const timer = setTimeout(() => {
        fetchLiveRate(formData.currency_code);
      }, 500); // Debounce to avoid too many API calls

      return () => clearTimeout(timer);
    }
  }, [formData.currency_code]);

  useEffect(() => {
    if (currency) {
      console.log(`✏️ Editing currency:`, currency);
      setFormData({
        currency_code: currency.currency_code,
        currency_name: currency.currency_name,
        currency_symbol: currency.currency_symbol,
        exchange_rate: currency.exchange_rate,
        is_active: currency.is_active,
        is_base_currency: currency.is_base_currency,
      });
    }
  }, [currency]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`💾 Submitting form data:`, formData);

    try {
      if (currency) {
        await updateCurrency({ id: currency.id, data: formData }).unwrap();
        console.log(`✅ Currency updated successfully`);
      } else {
        await createCurrency(formData).unwrap();
        console.log(`✅ Currency created successfully`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(`❌ Failed to save currency:`, err);
      if (err.data?.errors) {
        setErrors(err.data.errors);
      } else {
        alert(err?.data?.message || 'Failed to save currency');
      }
    }
  };

 return (
  <div className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4 bg-black/50 overflow-y-auto">
    <div className="bg-white rounded-2xl w-full max-w-lg shadow-lg my-auto mx-3 sm:mx-4">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
          {currency ? 'Edit Currency' : 'Add New Currency'}
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        {/* Currency Search (only for new currencies) */}
        {!currency && (
          <div className="relative">
            <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
              Search Currency <span className="text-gray-400 text-xs">(Type to search)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Search by code or name..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 pl-8 sm:pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
              <MagnifyingGlassIcon className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((curr) => (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => handleSelectCurrency(curr)}
                    className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 focus:bg-gray-50 border-b last:border-b-0"
                  >
                    <div className="font-medium text-gray-900 text-sm sm:text-base">{curr.code} - {curr.name}</div>
                    <div className="text-xs text-gray-500">Symbol: {curr.symbol}</div>
                  </button>
                ))}
              </div>
            )}

            {showSearchResults && searchQuery && searchResults.length === 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 sm:p-4 text-center text-gray-500 text-xs sm:text-sm">
                No currencies found. You can enter manually below.
              </div>
            )}
          </div>
        )}

        {/* Currency Code */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
            Currency Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="currency_code"
            value={formData.currency_code}
            onChange={handleChange}
            maxLength={3}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase text-sm sm:text-base"
            placeholder="USD"
            required
            disabled={!!currency}
          />
          {errors.currency_code && (
            <p className="text-xs text-red-500 mt-1">{errors.currency_code[0]}</p>
          )}
        </div>

        {/* Live Rate Status */}
        {!currency && formData.currency_code && formData.currency_code.length === 3 && (
          <div className="mt-1">
            {isLoadingRate && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600">
                <div className="animate-spin rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 border-b-2 border-blue-600"></div>
                Fetching live rate for {formData.currency_code}...
              </div>
            )}
            {rateError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-2.5">
                <p className="text-xs text-red-600">{rateError}</p>
              </div>
            )}
            {liveRate && !isLoadingRate && !rateError && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 sm:p-3">
                <p className="text-xs text-green-700 font-medium">
                  ✅ Live rate fetched successfully
                </p>
                <p className="text-xs sm:text-sm text-green-800 mt-1">
                  1 KWD = {liveRate.toFixed(6)} {formData.currency_code}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  This rate will be saved. You can adjust it manually if needed.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Currency Name */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
            Currency Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="currency_name"
            value={formData.currency_name}
            onChange={handleChange}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            placeholder="US Dollar"
            required
          />
        </div>

        {/* Currency Symbol */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
            Symbol <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="currency_symbol"
            value={formData.currency_symbol}
            onChange={handleChange}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            placeholder="$"
            required
          />
        </div>

        {/* Exchange Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
            Exchange Rate (to KWD) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.000001"
            name="exchange_rate"
            value={formData.exchange_rate}
            onChange={handleChange}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            min="0"
            required
          />
          <p className="text-xs text-gray-500 mt-1 break-words">
            1 KWD = {formData.exchange_rate} {formData.currency_code}
          </p>
        </div>

        {/* Base Currency Checkbox */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_base_currency"
            id="is_base_currency"
            checked={formData.is_base_currency}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_base_currency" className="text-xs sm:text-sm text-gray-700">
            Set as base currency (KWD)
          </label>
        </div>

        {/* Active Checkbox */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_active"
            id="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="text-xs sm:text-sm text-gray-700">Active</label>
        </div>

        {/* Footer - Responsive Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="sm:flex-1 lg:flex-none px-4 sm:px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isCreating || isUpdating}
            className="sm:flex-1 lg:flex-none px-4 sm:px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
          >
            {isCreating || isUpdating ? 'Saving...' : (currency ? 'Update' : 'Create')}
          </button>
        </div>
      </form>
    </div>
  </div>
);
}