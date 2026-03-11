import React from 'react';
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue  } from 'react-hook-form';
import type { SystemSettings } from '../../../../types/system';

interface Props {
  register: UseFormRegister<SystemSettings>;
  errors: FieldErrors<SystemSettings>;
  watch: UseFormWatch<SystemSettings>;
   setValue: UseFormSetValue<SystemSettings>
}

const SystemPreferences: React.FC<Props> = ({ register, watch, setValue }) => {
  const maintenanceMode = watch('maintenance_mode');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">System Preferences</h2>
      
      <div className="space-y-4">
        {/* Maintenance Mode */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Maintenance Mode</h3>
            <p className="text-sm text-gray-500">Put the system in maintenance mode</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('maintenance_mode')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {maintenanceMode && (
          <div className="ml-8 mt-2">
            <label htmlFor="maintenance_message" className="block text-sm font-medium text-gray-700 mb-2">
              Maintenance Message
            </label>
            <textarea
              id="maintenance_message"
              rows={3}
              {...register('maintenance_message')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="We are currently undergoing maintenance. Please check back soon."
            />
          </div>
        )}

        {/* Allow Registration */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Allow Registration</h3>
            <p className="text-sm text-gray-500">Allow new users to register</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('allow_registration')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Enable Multi-Branch */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Multi-Branch Support</h3>
            <p className="text-sm text-gray-500">Enable multiple branch management</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('enable_multi_branch')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Business Hours */}
       {/* Business Hours */}
<div className="border-t border-gray-200 pt-6">
  <h3 className="text-sm font-medium text-gray-900 mb-4">Business Hours</h3>
  <div className="space-y-3">
    {[
      { key: 'monday', label: 'Monday' },
      { key: 'tuesday', label: 'Tuesday' },
      { key: 'wednesday', label: 'Wednesday' },
      { key: 'thursday', label: 'Thursday' },
      { key: 'friday', label: 'Friday' },
      { key: 'saturday', label: 'Saturday' },
      { key: 'sunday', label: 'Sunday' }
    ].map((day) => {
      const isClosed = watch(`business_hours.${day.key}.open`) === 'closed';
      
      return (
        <div key={day.key} className="flex items-center space-x-4">
          <span className="w-24 text-sm text-gray-700">{day.label}</span>
          
          <input
            type="time"
            value={isClosed ? '' : watch(`business_hours.${day.key}.open`) || '09:00'}
            onChange={(e) => {
              setValue(`business_hours.${day.key}.open` as any, e.target.value);
              if (watch(`business_hours.${day.key}.close`) === 'closed') {
                setValue(`business_hours.${day.key}.close` as any, '17:00');
              }
            }}
            disabled={isClosed}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm disabled:bg-gray-100"
          />
          
          <span className="text-gray-500">to</span>
          
          <input
            type="time"
            value={isClosed ? '' : watch(`business_hours.${day.key}.close`) || '17:00'}
            onChange={(e) => setValue(`business_hours.${day.key}.close` as any, e.target.value)}
            disabled={isClosed}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm disabled:bg-gray-100"
          />
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isClosed}
              onChange={(e) => {
  if (e.target.checked) {
    setValue(`business_hours.${day.key}.open` as any, 'closed');
    setValue(`business_hours.${day.key}.close` as any, 'closed');
  } else {
    setValue(`business_hours.${day.key}.open` as any, '09:00');
    setValue(`business_hours.${day.key}.close` as any, '17:00');
  }
}}
              className="mr-2 rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">Closed</span>
          </label>
        </div>
      );
    })}
  </div>
</div>

{/* Notification Settings */}
<div className="border-t border-gray-200 pt-6 mt-6">
  <h3 className="text-sm font-medium text-gray-900 mb-4">Notification Settings</h3>
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-700">Email Notifications</p>
        <p className="text-xs text-gray-500">Send notifications via email</p>
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
    
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-700">SMS Notifications</p>
        <p className="text-xs text-gray-500">Send notifications via SMS</p>
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
  </div>
</div>
      </div>
    </div>
  );
};

export default SystemPreferences;