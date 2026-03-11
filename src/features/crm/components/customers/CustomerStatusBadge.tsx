interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  alternative_phone?: string;
  date_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  nationality?: string;
  id_number?: string;
  id_type?: 'National' | 'Passport' | 'Civil ID';
  
  // Address
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  
  // Company info
  company_name?: string;
  company_vat?: string;
  job_title?: string;
  
  // Preferences
  preferred_contact_method?: 'Email' | 'Phone' | 'SMS' | 'WhatsApp';
  preferred_language?: string;
  communication_preferences?: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  
  // Loyalty
  loyalty_points: number;
  lifetime_points: number;
  loyalty_tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  loyalty_enrolled_date?: string;
  
  // Statistics
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  last_order_date?: string;
  
  // Status
  status: 'Active' | 'Inactive' | 'Blocked' | 'Lead';
  is_active: boolean;
  is_verified: boolean;
  
  // Metadata
  notes?: string;
  tags?: string[];
  created_by?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Relations
  createdBy?: any;
}

const config: Record<Customer['status'], { label: string; className: string }> = {
  Active:   { label: 'Active',   className: 'bg-green-100 text-green-700' },
  Inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-600' },
  Blocked:  { label: 'Blocked',  className: 'bg-red-100 text-red-700' },
  Lead:     { label: 'Lead',     className: 'bg-blue-100 text-blue-700' },
};

const tierConfig: Record<string, string> = {
  Bronze:   'bg-orange-100 text-orange-700',
  Silver:   'bg-slate-100 text-slate-600',
  Gold:     'bg-yellow-100 text-yellow-700',
  Platinum: 'bg-purple-100 text-purple-700',
};

export const CustomerStatusBadge = ({ status }: { status: Customer['status'] }) => {
  const { label, className } = config[status] ?? config.Active;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
};

export const TierBadge = ({ tier }: { tier?: string }) => {
  if (!tier) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tierConfig[tier] ?? 'bg-gray-100 text-gray-600'}`}>
      {tier}
    </span>
  );
};