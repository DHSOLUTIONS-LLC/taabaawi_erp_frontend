import React from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { SystemSettings } from '../../../../types/system';

interface Props {
  register: UseFormRegister<SystemSettings>;
  errors: FieldErrors<SystemSettings>;
}

const EmailSettings: React.FC<Props> = ({ register }) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Email Settings</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label htmlFor="mail_driver" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Mail Driver
          </label>
          <select
            id="mail_driver"
            {...register('mail_driver')}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white"
          >
            <option value="smtp">SMTP</option>
            <option value="sendmail">Sendmail</option>
            <option value="mailgun">Mailgun</option>
          </select>
        </div>

        <div>
          <label htmlFor="mail_host" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Mail Host
          </label>
          <input
            id="mail_host"
            type="text"
            {...register('mail_host')}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            placeholder="smtp.gmail.com"
          />
        </div>

        <div>
          <label htmlFor="mail_port" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Mail Port
          </label>
          <input
            id="mail_port"
            type="number"
            {...register('mail_port')}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            placeholder="587"
          />
        </div>

        <div>
          <label htmlFor="mail_username" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Username
          </label>
          <input
            id="mail_username"
            type="text"
            {...register('mail_username')}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            placeholder="Enter username"
          />
        </div>

        <div>
          <label htmlFor="mail_password" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Password
          </label>
          <input
            id="mail_password"
            type="password"
            {...register('mail_password')}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            placeholder="Enter password"
          />
        </div>

        <div>
          <label htmlFor="mail_encryption" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Encryption
          </label>
          <select
            id="mail_encryption"
            {...register('mail_encryption')}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white"
          >
            <option value="tls">TLS</option>
            <option value="ssl">SSL</option>
            <option value="">None</option>
          </select>
        </div>

        <div>
          <label htmlFor="mail_from_address" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            From Address
          </label>
          <input
            id="mail_from_address"
            type="email"
            {...register('mail_from_address')}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            placeholder="noreply@company.com"
          />
        </div>

        <div>
          <label htmlFor="mail_from_name" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            From Name
          </label>
          <input
            id="mail_from_name"
            type="text"
            {...register('mail_from_name')}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            placeholder="Company Name"
          />
        </div>
      </div>

      {/* Test Email Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          className="px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Send Test Email
        </button>
      </div>
    </div>
  );
};

export default EmailSettings;