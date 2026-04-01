import { useDispatch } from 'react-redux';
import { Phone, Mail, Users, FileText, Headphones, AlertCircle, MoreHorizontal, Plus } from 'lucide-react';
import { openInteractionModal } from '../../../../features/crm/crmSlice';

interface CustomerInteraction {
  id: number;
  customer_id: number;
  interaction_type: 'Call' | 'Email' | 'Meeting' | 'Note' | 'Support' | 'Complaint' | 'Other';
  subject: string;
  description?: string;
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
  interaction_date?: string;
  outcome?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

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

const typeIcon: Record<CustomerInteraction['interaction_type'], any> = {
  Call:      Phone,
  Email:     Mail,
  Meeting:   Users,
  Note:      FileText,
  Support:   Headphones,
  Complaint: AlertCircle,
  Other:     MoreHorizontal,
};

const typeColor: Record<CustomerInteraction['interaction_type'], string> = {
  Call:      'bg-blue-50 text-blue-600',
  Email:     'bg-purple-50 text-purple-600',
  Meeting:   'bg-green-50 text-green-600',
  Note:      'bg-gray-50 text-gray-600',
  Support:   'bg-orange-50 text-orange-600',
  Complaint: 'bg-red-50 text-red-600',
  Other:     'bg-gray-50 text-gray-500',
};


interface InteractionTimelineProps {
  customer: Customer;
  interactions?: CustomerInteraction[];
  isLoading?: boolean;
}


export const InteractionTimeline = ({ customer, interactions: propInteractions, isLoading }: InteractionTimelineProps) => {
  const dispatch = useDispatch();
  const interactions = propInteractions ?? (customer as any).interactions ?? [];

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400">Loading interactions...</div>;
  }


  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-800">
          Interactions
          {interactions.length > 0 && (
            <span className="ml-2 text-xs text-gray-400 font-normal">({interactions.length})</span>
          )}
        </h3>
        <button
          onClick={() => dispatch(openInteractionModal(customer))}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" /> Log
        </button>
      </div>

      {/* Table */}
      {interactions.length === 0
        ? (
          <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-lg">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No interactions yet</p>
          </div>
        )
        : (
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500">Type</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500">Subject</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500">Description</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500">Sentiment</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {interactions.map((interaction: any) => {
                  const Icon = typeIcon[interaction.interaction_type as keyof typeof typeIcon] ?? MoreHorizontal;
                  return (
                    <tr key={interaction.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${typeColor[interaction.interaction_type as keyof typeof typeColor] ?? 'bg-gray-50 text-gray-500'}`}>
                          <Icon className="h-3 w-3" />
                          {interaction.interaction_type}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-800">{interaction.subject}</td>
                      <td className="px-3 py-2.5 text-gray-500 max-w-xs truncate" title={interaction.description}>
                        {interaction.description ?? '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        {interaction.sentiment ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            interaction.sentiment === 'Positive' ? 'bg-green-100 text-green-700' :
                            interaction.sentiment === 'Negative' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {interaction.sentiment}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(interaction.interaction_date ?? interaction.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
};