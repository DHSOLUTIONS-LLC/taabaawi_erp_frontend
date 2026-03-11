export interface SystemSettings {
  // Company Information
  company_name?: string;
  company_legal_name?: string;
  tax_number?: string;
  registration_number?: string;
  company_address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  business_hours?: Record<string, { open: string; close: string; closed: boolean }>;
  
  
  // Localization
  timezone?: string;
  default_currency?: string;
  currency_symbol?: string;
  currency_position: 'left' | 'right' | 'left-space' | 'right-space' | 'after';
  decimal_places?: number;
  default_language?: string;
  enabled_languages?: string[];
  date_format?: string;
  time_format?: string;
  datetime_format?: string;
  
  // Tax Settings
  enable_tax?: boolean;
  default_tax_rate?: number;
  tax_label?: string;
  tax_inclusive?: boolean;
  
  // Social Media
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  
  // Notification Settings
  enable_email_notifications?: boolean;
  enable_sms_notifications?: boolean;
  enable_push_notifications?: boolean;
  
  // System Settings
  logo?: string;
  logo_url?: string;
  favicon?: string;
  favicon_url?: string;
  maintenance_mode?: boolean;
  maintenance_message?: string;
  allow_registration?: boolean;
  enable_multi_branch?: boolean;
  
  // Email Settings
  mail_driver?: string;
  mail_host?: string;
  mail_port?: number;
  mail_username?: string;
  mail_password?: string;
  mail_encryption?: string;
  mail_from_address?: string;
  mail_from_name?: string;
}

export interface EmailSettings {
  mail_driver: string;
  mail_host: string;
  mail_port: number;
  mail_username: string;
  mail_password: string;
  mail_encryption: string;
  mail_from_address: string;
  mail_from_name: string;
}

export interface SystemSettingsResponse {
  success: boolean;
  data: SystemSettings;
  message?: string;
}

export interface LogoUploadResponse {
  success: boolean;
  message: string;
  data: {
    logo: string;
    logo_url: string;
  };
}

export interface TestEmailPayload {
  test_email: string;
}

export interface SettingValueResponse {
  success: boolean;
  data: {
    key: string;
    value: any;
  };
}

export interface UpdateSettingPayload {
  value: any;
}