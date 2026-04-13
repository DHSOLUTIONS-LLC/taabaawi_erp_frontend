import React from 'react';
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import type { SystemSettings } from '../../../../types/system';

interface Props {
  register: UseFormRegister<SystemSettings>;
  errors: FieldErrors<SystemSettings>;
  watch: UseFormWatch<SystemSettings>;
  setValue: UseFormSetValue<SystemSettings>;
}

const LocalizationSettings: React.FC<Props> = ({ register, watch }) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Localization Settings</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Timezone */}
        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Timezone
          </label>
          <select
            id="timezone"
            {...register('timezone')}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Dubai">Dubai</option>
            <option value="Asia/Singapore">Singapore</option>
            <option value="Asia/Tokyo">Tokyo</option>
            <option value="Australia/Sydney">Sydney</option>
          </select>
        </div>

        {/* Default Currency */}
        <div>
          <label htmlFor="default_currency" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Default Currency
          </label>
          <select
            id="default_currency"
            {...register('default_currency')}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white"
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="AED">AED - UAE Dirham</option>
            <option value="SAR">SAR - Saudi Riyal</option>
            <option value="KWD">KWD - Kuwaiti Dinar</option>
          </select>
        </div>

        {/* Currency Symbol */}
        <div>
          <label htmlFor="currency_symbol" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Currency Symbol
          </label>
          <input
            id="currency_symbol"
            type="text"
            {...register('currency_symbol')}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            placeholder="$"
          />
        </div>

        {/* Currency Position */}
        <div>
          <label htmlFor="currency_position" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Currency Position
          </label>
          <select
            id="currency_position"
            {...register('currency_position')}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white"
          >
            <option value="before">Before Amount ($100)</option>
            <option value="after">After Amount (100$)</option>
          </select>
        </div>

        {/* Decimal Places */}
        <div>
          <label htmlFor="decimal_places" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Decimal Places
          </label>
          <input
            id="decimal_places"
            type="number"
            min="0"
            max="4"
            {...register('decimal_places')}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            placeholder="2"
          />
        </div>

        {/* Date Format */}
        <div>
          <label htmlFor="date_format" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Date Format
          </label>
          <select
            id="date_format"
            {...register('date_format')}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white"
          >
            <option value="Y-m-d">2024-03-15</option>
            <option value="d/m/Y">15/03/2024</option>
            <option value="m/d/Y">03/15/2024</option>
            <option value="d M Y">15 Mar 2024</option>
            <option value="M d, Y">Mar 15, 2024</option>
          </select>
        </div>

        {/* Time Format */}
        <div>
          <label htmlFor="time_format" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Time Format
          </label>
          <select
            id="time_format"
            {...register('time_format')}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white"
          >
            <option value="H:i">14:30 (24 hour)</option>
            <option value="h:i A">02:30 PM (12 hour)</option>
          </select>
        </div>
      </div>

      {/* Enabled Languages */}
      <div className="mt-4 sm:mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
          Enabled Languages
        </label>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {[
            { value: 'en', label: 'English' },
            { value: 'ar', label: 'Arabic' },
            { value: 'fr', label: 'French' },
            { value: 'es', label: 'Spanish' },
            { value: 'de', label: 'German' },
            { value: 'zh', label: 'Chinese' },
            { value: 'hi', label: 'Hindi' },
            { value: 'ru', label: 'Russian' },
          ].map((lang) => (
            <label key={lang.value} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                value={lang.value}
                {...register('enabled_languages')}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{lang.label}</span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">Select languages available in the system</p>
      </div>
    </div>
  );
};

export default LocalizationSettings;