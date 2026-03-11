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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
   <DashboardLayout>
     <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-2">Configure your ERP system preferences and company information</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'general' && (
            <GeneralSettings register={register} errors={errors} />
          )}
          
          {activeTab === 'company' && (
            <>
              <LogoUploader />
              <CompanyInfo register={register} errors={errors} />
            </>
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
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUpdating}
            className="
              px-6 py-2 bg-blue-600 text-white font-medium rounded-lg
              hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isUpdating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
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