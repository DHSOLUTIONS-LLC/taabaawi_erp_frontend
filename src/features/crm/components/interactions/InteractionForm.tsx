import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { closeInteractionModal } from '../../../../features/crm/crmSlice';
import { useAddCustomerInteractionMutation } from '../../../../services/crmApi';
import type { RootState } from '../../../../app/store';


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


interface CustomerInteraction {
  id: number;
  customer_id: number;
  interaction_type: 'Call' | 'Email' | 'Meeting' | 'Note' | 'Support' | 'Complaint' | 'Other';
  subject: string;
  description: string;
  status?: 'Scheduled' | 'Completed' | 'Cancelled';
  scheduled_at?: string;
  completed_at?: string;
  duration_minutes?: number;
  outcome?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  assigned_to?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  customer?: Customer;
  assignedTo?: any;
  createdBy?: any;
}


export const InteractionForm = () => {
  const dispatch = useDispatch();
  const customer = useSelector((s: RootState) => s.crm.selectedCustomer);
  const [add, { isLoading }] = useAddCustomerInteractionMutation();
  const { register, handleSubmit, formState: {  } } = useForm<Partial<CustomerInteraction>>();

  if (!customer) return null;

  const onSubmit = async (data: Partial<CustomerInteraction>) => {
    await add({ id: customer.id, data }).unwrap();
    dispatch(closeInteractionModal());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Log Interaction — {customer.full_name}</h2>
          <button onClick={() => dispatch(closeInteractionModal())} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                {...register('interaction_type', { required: true })}
              >
                {['Call','Email','Meeting','Note','Support','Complaint','Other'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                {...register('status')}
              >
                <option value="Completed">Completed</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Subject *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              {...register('subject', { required: true })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description </label>
            <textarea
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Outcome</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                {...register('outcome')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Follow-up Date</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                {...register('follow_up_date')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => dispatch(closeInteractionModal())}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
              className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {isLoading ? 'Saving...' : 'Log Interaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};