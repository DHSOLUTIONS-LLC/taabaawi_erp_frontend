import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
  useUpdateEmailSettingsMutation
} from '../../../services/systemApi';
import type { SystemSettings } from '../../../types/system';

// Import actual components
import GeneralSettings from '../components/settings/GeneralSettings';
import CompanyInfo from '../components/settings/CompanyInfo';
import LocalizationSettings from '../components/settings/LocalizationSettings';
import TaxSettings from '../components/settings/TaxSettings';
import EmailSettings from '../components/settings/EmailSettings';
import SocialMediaSettings from '../components/settings/SocialMediaSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import SystemPreferences from '../components/settings/SystemPreferences';
import LogoUploader from '../components/settings/LogoUploader';
import DashboardLayout from '../../../layouts/DashboardLayout';

type TabType =
  | 'general'
  | 'company'
  | 'localization'
  | 'tax'
  | 'email'
  | 'social'
  | 'notifications'
  | 'system';

interface Tab {
  id: TabType;
  label: string;
  icon: string;
}

const SystemSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Use RTK Query hooks directly
  const { data, isLoading } = useGetSystemSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateSystemSettingsMutation();
  const [updateEmailSettings, { isLoading: isUpdatingEmail }] = useUpdateEmailSettingsMutation();

  const settings = data?.data;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SystemSettings>({
    defaultValues: settings || {},
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      console.log('Email settings from API:', {
        mail_driver: settings.mail_driver,
        mail_host: settings.mail_host,
        mail_port: settings.mail_port,
        mail_username: settings.mail_username,
        mail_encryption: settings.mail_encryption,
        mail_from_address: settings.mail_from_address,
        mail_from_name: settings.mail_from_name
      });

      Object.entries(settings).forEach(([key, value]) => {
        setValue(key as keyof SystemSettings, value as any);
      });
    }
  }, [settings, setValue]);

  const onSubmit = async (data: SystemSettings) => {
    try {
      // Extract email settings
      const emailSettings = {
        mail_driver: data.mail_driver,
        mail_host: data.mail_host,
        mail_port: data.mail_port,
        mail_username: data.mail_username,
        mail_password: data.mail_password,
        mail_encryption: data.mail_encryption,
        mail_from_address: data.mail_from_address,
        mail_from_name: data.mail_from_name,
      };

      // Extract general settings (excluding email fields)
      const generalSettings = { ...data };
      delete generalSettings.mail_driver;
      delete generalSettings.mail_host;
      delete generalSettings.mail_port;
      delete generalSettings.mail_username;
      delete generalSettings.mail_password;
      delete generalSettings.mail_encryption;
      delete generalSettings.mail_from_address;
      delete generalSettings.mail_from_name;

      // Update both
      await Promise.all([
        updateSettings(generalSettings).unwrap(),
        updateEmailSettings(emailSettings).unwrap()
      ]);

      toast.success('System settings updated successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to update settings');
    }
  };

  const tabs: Tab[] = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'company', label: 'Company', icon: '🏢' },
    { id: 'localization', label: 'Localization', icon: '🌍' },
    { id: 'tax', label: 'Tax', icon: '💰' },
    { id: 'email', label: 'Email', icon: '📧' },
    { id: 'social', label: 'Social Media', icon: '🌐' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'system', label: 'System', icon: '🖥️' },
  ];

  if (isLoading && !settings) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto px-3 py-3">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            Configure your ERP system preferences and company information
          </p>
        </div>

        {/* Mobile Tab Selector */}
        <div className="lg:hidden mb-4">
          <div className="relative">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{tabs.find(t => t.id === activeTab)?.icon}</span>
                <span className="text-sm font-medium text-gray-900">
                  {tabs.find(t => t.id === activeTab)?.label}
                </span>
              </div>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${mobileMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {mobileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors
                        ${activeTab === tab.id
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      <span className="font-medium">{tab.label}</span>
                      {activeTab === tab.id && (
                        <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden lg:block border-b border-gray-200 mb-6">
          <nav className="flex -mb-px space-x-2 lg:space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2 text-base">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8">
            {activeTab === 'general' && (
              <GeneralSettings register={register} errors={errors} />
            )}

            {activeTab === 'company' && (
              <div className="space-y-6">
                <LogoUploader />
                <CompanyInfo register={register} errors={errors} />
              </div>
            )}

            {activeTab === 'localization' && (
              <LocalizationSettings
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
              />
            )}

            {activeTab === 'tax' && (
              <TaxSettings
                register={register}
                errors={errors}
                watch={watch}
              />
            )}

            {activeTab === 'email' && (
              <EmailSettings register={register} errors={errors} />
            )}

            {activeTab === 'social' && (
              <SocialMediaSettings register={register} errors={errors} />
            )}

            {activeTab === 'notifications' && (
              <NotificationSettings register={register} errors={errors} />
            )}

            {activeTab === 'system' && (
              <SystemPreferences
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
              />
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end sticky bottom-4 sm:static bg-white sm:bg-transparent p-3 sm:p-0 rounded-lg shadow sm:shadow-none">
            <button
              type="submit"
              disabled={isUpdating || isUpdatingEmail}
              className="
                w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-blue-600 text-white font-medium rounded-lg
                hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                flex items-center justify-center gap-2 text-sm sm:text-base
              "
            >
              {(isUpdating || isUpdatingEmail) ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default SystemSettingsPage;