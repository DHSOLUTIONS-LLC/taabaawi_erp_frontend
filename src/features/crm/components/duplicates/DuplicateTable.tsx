import { useDispatch } from 'react-redux';
import { GitMerge, CheckCircle, MinusCircle } from 'lucide-react';
import { openDuplicateModal, setDuplicateFilters } from '../../../../features/crm/crmSlice';
import { useReviewDuplicateMutation } from '../../../../services/crmApi';

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

export interface CustomerDuplicate {
  id: number;
  customer_1_id: number;
  customer_2_id: number;
  similarity_score: number;
  matching_fields: string[];
  status: 'Pending' | 'Confirmed Duplicate' | 'Not Duplicate' | 'Ignored' | 'Merged';
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  customer1?: Customer;
  customer2?: Customer;
  reviewedBy?: any;
}

interface Props {
  duplicates: CustomerDuplicate[];
  meta?: any;
  isLoading: boolean;
  currentPage: number;
  perPage: number;
}

const statusColor: Record<CustomerDuplicate['status'], string> = {
  'Pending': 'bg-yellow-100 text-yellow-700',
  'Confirmed Duplicate': 'bg-red-100 text-red-700',
  'Not Duplicate': 'bg-green-100 text-green-700',
  'Ignored': 'bg-gray-100 text-gray-500',
  'Merged': 'bg-blue-100 text-blue-700',
};

export const DuplicateTable = ({ duplicates, meta, isLoading, currentPage, perPage }: Props) => {
  const dispatch = useDispatch();
  const [review] = useReviewDuplicateMutation();

  const totalPages = meta ? Math.ceil(meta.total / perPage) : 1;

  return (

    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
      <div className="xl:col-span-4 overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Customer 1', 'Customer 2', 'Match Score', 'Matched Fields', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-3 sm:px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading
              ? Array.from({ length: perPage }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-3 sm:px-4 py-3"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>
                  ))}
                </tr>
              ))
              : duplicates.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-3 sm:px-4 py-10 text-center text-gray-400">
                      No duplicates found
                    </td>
                  </tr>
                )
                : duplicates.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="font-medium text-gray-800 text-sm">{d.customer1?.full_name}</div>
                      <div className="text-xs text-gray-400">{d.customer1?.email}</div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="font-medium text-gray-800 text-sm">{d.customer2?.full_name}</div>
                      <div className="text-xs text-gray-400">{d.customer2?.email}</div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-12 sm:w-16 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${d.similarity_score >= 80 ? 'bg-red-500' : d.similarity_score >= 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${d.similarity_score}%` }}
                          />
                        </div>
                        <span className="font-medium text-gray-700 text-xs sm:text-sm">{d.similarity_score}%</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {d.matching_fields?.slice(0, 2).map(f => (
                          <span key={f} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{f}</span>
                        ))}
                        {d.matching_fields?.length > 2 && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">+{d.matching_fields.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[d.status]}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      {d.status === 'Pending' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => dispatch(openDuplicateModal({ duplicate: d }))}
                            className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded"
                            title="Merge"
                          >
                            <GitMerge className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => review({ id: d.id, status: 'Not Duplicate' })}
                            className="p-1.5 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded"
                            title="Not a duplicate"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => review({ id: d.id, status: 'Ignored' })}
                            className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded"
                            title="Ignore"
                          >
                            <MinusCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {meta && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span className="text-xs sm:text-sm">Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, meta.total)} of {meta.total}</span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => dispatch(setDuplicateFilters({ page: currentPage - 1 }))}
              className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 text-sm"
            >
              Prev
            </button>
            <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-sm">{currentPage} / {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => dispatch(setDuplicateFilters({ page: currentPage + 1 }))}
              className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};