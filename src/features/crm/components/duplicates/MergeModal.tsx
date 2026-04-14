import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, ArrowRight, GitMerge } from 'lucide-react';
import { closeDuplicateModal } from '../../../../features/crm/crmSlice';
import { useMergeCustomersMutation } from '../../../../services/crmApi';
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

const COMPARE_FIELDS: { label: string; key: keyof Customer }[] = [
  { label: 'Full Name', key: 'full_name' },
  { label: 'Email', key: 'email' },
  { label: 'Phone', key: 'phone' },
  { label: 'Alt Phone', key: 'alternative_phone' },
  { label: 'DOB', key: 'date_of_birth' },
  { label: 'Gender', key: 'gender' },
  { label: 'Nationality', key: 'nationality' },
  { label: 'City', key: 'city' },
  { label: 'Country', key: 'country' },
  { label: 'Company', key: 'company_name' },
  { label: 'Status', key: 'status' },
  { label: 'Tier', key: 'loyalty_tier' },
  { label: 'Points', key: 'loyalty_points' },
  { label: 'Total Orders', key: 'total_orders' },
  { label: 'Total Spent', key: 'total_spent' },
];

export const MergeModal = () => {
  const dispatch = useDispatch();
  const { isDuplicateModalOpen, selectedDuplicate } = useSelector((s: RootState) => s.crm);
  const [primaryId, setPrimaryId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [merge, { isLoading }] = useMergeCustomersMutation();

  if (!isDuplicateModalOpen || !selectedDuplicate) return null;

  const c1 = selectedDuplicate.customer1!;
  const c2 = selectedDuplicate.customer2!;
  const primary = primaryId === c1.id ? c1 : primaryId === c2.id ? c2 : null;

  const handleMerge = async () => {
    if (!primaryId) return;
    await merge({ id: selectedDuplicate.id, primary_customer_id: primaryId, notes }).unwrap();
    dispatch(closeDuplicateModal());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <GitMerge className="h-4 w-4 text-blue-600" />
            <h2 className="font-semibold text-gray-800 text-sm sm:text-base">Merge Customers</h2>
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
              {selectedDuplicate.similarity_score}% match
            </span>
          </div>
          <button onClick={() => dispatch(closeDuplicateModal())} className="p-1 hover:bg-gray-100 rounded self-end sm:self-auto">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Primary customer picker */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-blue-50 rounded-lg text-sm">
            <span className="text-blue-700 font-medium shrink-0">Keep as primary:</span>
            <div className="flex flex-1 gap-2">
              <button
                onClick={() => setPrimaryId(c1.id)}
                className={`flex-1 px-3 py-1.5 rounded-lg border text-center transition-colors ${primaryId === c1.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}
              >
                {c1.full_name}
              </button>
              <ArrowRight className="h-4 w-4 text-gray-400 shrink-0 self-center" />
              <button
                onClick={() => setPrimaryId(c2.id)}
                className={`flex-1 px-3 py-1.5 rounded-lg border text-center transition-colors ${primaryId === c2.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}
              >
                {c2.full_name}
              </button>
            </div>
          </div>

          {/* Side-by-side comparison */}
          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <div className="min-w-[500px]">
              <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500">
                <div className="px-3 py-2">Field</div>
                <div className="px-3 py-2 border-l border-gray-200">{c1.full_name}</div>
                <div className="px-3 py-2 border-l border-gray-200">{c2.full_name}</div>
              </div>
              <div className="divide-y divide-gray-100">
                {COMPARE_FIELDS.map(({ label, key }) => {
                  const v1 = String(c1[key] ?? '-');
                  const v2 = String(c2[key] ?? '-');
                  const differs = v1 !== v2 && v1 !== '-' && v2 !== '-';
                  return (
                    <div key={key} className={`grid grid-cols-3 text-sm ${differs ? 'bg-yellow-50' : ''}`}>
                      <div className="px-3 py-2 text-gray-400">{label}</div>
                      <div className={`px-3 py-2 border-l border-gray-200 ${primaryId === c1.id && differs ? 'font-medium text-blue-700' : 'text-gray-700'} break-words`}>
                        {v1}
                      </div>
                      <div className={`px-3 py-2 border-l border-gray-200 ${primaryId === c2.id && differs ? 'font-medium text-blue-700' : 'text-gray-700'} break-words`}>
                        {v2}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
            <textarea
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Reason for merge..."
            />
          </div>

          {primary && (
            <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
              <strong>{primary.full_name}</strong> will be kept. All orders, interactions and points from the other customer will be merged into this record.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 px-4 sm:px-5 py-3 sm:py-4 border-t border-gray-100">
          <button
            onClick={() => dispatch(closeDuplicateModal())}
            className="w-full sm:w-auto px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleMerge}
            disabled={!primaryId || isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
          >
            <GitMerge className="h-4 w-4" />
            {isLoading ? 'Merging...' : 'Merge Customers'}
          </button>
        </div>
      </div>
    </div>
  );
};