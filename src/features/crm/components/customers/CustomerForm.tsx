import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useCreateCustomerMutation, useUpdateCustomerMutation } from '../../../../services/crmApi';

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
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  company_name?: string;
  company_vat?: string;
  job_title?: string;
  preferred_contact_method?: 'Email' | 'Phone' | 'SMS' | 'WhatsApp';
  preferred_language?: string;
  communication_preferences?: { email: boolean; sms: boolean; whatsapp: boolean };
  loyalty_points: number;
  lifetime_points: number;
  loyalty_tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  loyalty_enrolled_date?: string;
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  last_order_date?: string;
  status: 'Active' | 'Inactive' | 'Blocked' | 'Lead';
  is_active: boolean;
  is_verified: boolean;
  notes?: string;
  tags?: string[];
  created_by?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  createdBy?: any;
}

interface Props {
  mode: 'create' | 'edit';
  customer?: Customer | null;
  onClose: () => void;
}

const Input = ({ label, error, ...props }: any) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <input
      {...props}
      className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${error ? 'border-red-400' : 'border-gray-200'}`}
    />
    {error && <p className="text-xs text-red-500 mt-0.5">{error.message}</p>}
  </div>
);

const Select = ({ label, children, ...props }: any) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" {...props}>
      {children}
    </select>
  </div>
);

const TABS = ['Personal', 'Contact', 'Company', 'Preferences'] as const;

export const CustomerForm = ({ mode, customer, onClose }: Props) => {
  const [tab, setTab] = React.useState<typeof TABS[number]>('Personal');
  const [create, { isLoading: creating }] = useCreateCustomerMutation();
  const [update, { isLoading: updating }] = useUpdateCustomerMutation();
  const loading = creating || updating;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Partial<Customer>>();

  useEffect(() => {
    if (customer) reset(customer);
  }, [customer]);

  const onSubmit = async (data: Partial<Customer>) => {
    try {
      if (mode === 'create') await create(data).unwrap();
      else await update({ id: customer!.id, data }).unwrap();
      onClose();
    } catch { }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm sm:text-base">
            {mode === 'create' ? 'New Customer' : 'Edit Customer'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs - Responsive with horizontal scroll */}
        <div className="flex border-b border-gray-100 px-3 sm:px-5 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${tab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-4 sm:p-5">
          {tab === 'Personal' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input label="First Name *" {...register('first_name', { required: 'Required' })} error={errors.first_name} />
              <Input label="Last Name *" {...register('last_name', { required: 'Required' })} error={errors.last_name} />
              <Input label="Date of Birth" type="date" {...register('date_of_birth')} />
              <Select label="Gender" {...register('gender')}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
              <Input label="Nationality" {...register('nationality')} />
              <Select label="ID Type" {...register('id_type')}>
                <option value="">Select</option>
                <option value="National">National</option>
                <option value="Passport">Passport</option>
                <option value="Civil ID">Civil ID</option>
              </Select>
              <Input label="ID Number" {...register('id_number')} />
              <Select label="Status" {...register('status')}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Lead">Lead</option>
                <option value="Blocked">Blocked</option>
              </Select>
            </div>
          )}

          {tab === 'Contact' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input label="Email *" type="email" {...register('email', { required: 'Required' })} error={errors.email} />
              <Input label="Phone *" {...register('phone', { required: 'Required' })} error={errors.phone} />
              <Input label="Alternative Phone" {...register('alternative_phone')} />
              <Input label="City" {...register('city')} />
              <Input label="State" {...register('state')} />
              <Input label="Country" {...register('country')} />
              <Input label="Postal Code" {...register('postal_code')} />
              <div className="col-span-1 sm:col-span-2">
                <Input label="Address" {...register('address')} />
              </div>
            </div>
          )}

          {tab === 'Company' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input label="Company Name" {...register('company_name')} />
              <Input label="VAT Number" {...register('company_vat')} />
              <Input label="Job Title" {...register('job_title')} />
            </div>
          )}

          {tab === 'Preferences' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Select label="Preferred Contact" {...register('preferred_contact_method')}>
                <option value="">Select</option>
                <option value="Email">Email</option>
                <option value="Phone">Phone</option>
                <option value="SMS">SMS</option>
                <option value="WhatsApp">WhatsApp</option>
              </Select>
              <Input label="Preferred Language" {...register('preferred_language')} />
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  {...register('notes')}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Customer' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};