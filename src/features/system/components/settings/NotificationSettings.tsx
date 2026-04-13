import React from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { SystemSettings } from '../../../../types/system';

interface Props {
  register: UseFormRegister<SystemSettings>;
  errors: FieldErrors<SystemSettings>;
}

const NotificationSettings: React.FC<Props> = ({ register }) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Notification Settings</h2>

      <div className="space-y-3 sm:space-y-4">
        {/* Email Notifications */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-3">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
            <p className="text-xs sm:text-sm text-gray-500">Send notifications via email</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('enable_email_notifications')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* SMS Notifications */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-3">
          <div>
            <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
            <p className="text-xs sm:text-sm text-gray-500">Send notifications via SMS</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('enable_sms_notifications')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Push Notifications */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-3">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
            <p className="text-xs sm:text-sm text-gray-500">Send browser push notifications</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('enable_push_notifications')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 sm:pt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3 sm:mb-4">Notification Events</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {[
            'New Order',
            'Order Status Changed',
            'New Customer Registration',
            'Low Stock Alert',
            'Payment Received',
            'Invoice Created',
            'Employee Leave Request',
            'Payroll Generated',
          ].map((event) => (
            <div key={event} className="flex items-center p-2 hover:bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id={`event_${event}`}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={`event_${event}`} className="ml-2 block text-sm text-gray-900 cursor-pointer">
                {event}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;