// src/features/crm/crmSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';


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

interface LoyaltyTransaction {
  id: number;
  customer_id: number;
  points: number;
  transaction_type: 'Earned' | 'Redeemed' | 'Bonus' | 'Adjusted' | 'Expired';
  description: string;
  reference_type?: 'Order' | 'Manual' | 'Promotion' | 'Refund';
  reference_id?: number;
  reference_number?: string;
  balance_after: number;
  expiry_date?: string;
  processed_by: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  customer?: Customer;
  processedBy?: any;
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
  
  // Relations
  customer1?: Customer;
  customer2?: Customer;
  reviewedBy?: any;
}

interface CrmState {
  // Customer Filters
  customerFilters: {
    search: string;
    status: string;
    tier: string;
    city: string;
    is_active: boolean | null;
    start_date: string | null;
    end_date: string | null;
    page: number;
    per_page: number;
    sort_by: string;
    sort_order: 'asc' | 'desc';
  };

  // Duplicate Filters
  duplicateFilters: {
    status: string;
    min_score: number;
    page: number;
    per_page: number;
  };

  // Loyalty Filters
  loyaltyFilters: {
    transaction_type: string;
    start_date: string | null;
    end_date: string | null;
    page: number;
    per_page: number;
  };

  // Merge History Filters
  mergeHistoryFilters: {
    page: number;
    per_page: number;
  };

  // Purchase History Filters
  purchaseHistoryFilters: {
    page: number;
    per_page: number;
  };

  // Interaction Filters
  interactionFilters: {
    interaction_type: string;
    status: string;
    page: number;
    per_page: number;
  };

  // Selected Items
  selectedCustomer: Customer | null;
  selectedDuplicate: CustomerDuplicate | null;
  selectedLoyaltyTransaction: LoyaltyTransaction | null;

  // UI State - Customer
  isCustomerModalOpen: boolean;
  customerModalMode: 'create' | 'edit' | 'view';

  // UI State - Duplicate
  isDuplicateModalOpen: boolean;

  // UI State - Loyalty
  isAdjustPointsModalOpen: boolean;
  adjustPointsMode: 'add' | 'redeem';

  // UI State - Interaction
  isInteractionModalOpen: boolean;

  // Active tab on CustomerProfilePage
  customerProfileTab: 'info' | 'orders' | 'interactions' | 'loyalty';

  // Statistics cache timestamps
  lastFetch: {
    customers: number | null;
    statistics: number | null;
    loyalty: number | null;
    duplicates: number | null;
    mergeHistory: number | null;
  };
}

const initialState: CrmState = {
  customerFilters: {
    search: '',
    status: '',
    tier: '',
    city: '',
    is_active: null,
    start_date: null,
    end_date: null,
    page: 1,
    per_page: 15,
    sort_by: 'created_at',
    sort_order: 'desc',
  },

  duplicateFilters: {
    status: '',
    min_score: 60,
    page: 1,
    per_page: 15,
  },

  loyaltyFilters: {
    transaction_type: '',
    start_date: null,
    end_date: null,
    page: 1,
    per_page: 15,
  },

  mergeHistoryFilters: {
    page: 1,
    per_page: 15,
  },

  purchaseHistoryFilters: {
    page: 1,
    per_page: 15,
  },

  interactionFilters: {
    interaction_type: '',
    status: '',
    page: 1,
    per_page: 15,
  },

  selectedCustomer: null,
  selectedDuplicate: null,
  selectedLoyaltyTransaction: null,

  isCustomerModalOpen: false,
  customerModalMode: 'view',

  isDuplicateModalOpen: false,

  isAdjustPointsModalOpen: false,
  adjustPointsMode: 'add',

  isInteractionModalOpen: false,

  customerProfileTab: 'info',

  lastFetch: {
    customers: null,
    statistics: null,
    loyalty: null,
    duplicates: null,
    mergeHistory: null,
  },
};

const crmSlice = createSlice({
  name: 'crm',
  initialState,
  reducers: {
    // ── Customer Filters ──────────────────────────────────────────────
    setCustomerFilters: (state, action: PayloadAction<Partial<CrmState['customerFilters']>>) => {
      state.customerFilters = { ...state.customerFilters, ...action.payload };
    },
    resetCustomerFilters: (state) => {
      state.customerFilters = initialState.customerFilters;
    },

    // ── Duplicate Filters ─────────────────────────────────────────────
    setDuplicateFilters: (state, action: PayloadAction<Partial<CrmState['duplicateFilters']>>) => {
      state.duplicateFilters = { ...state.duplicateFilters, ...action.payload };
    },
    resetDuplicateFilters: (state) => {
      state.duplicateFilters = initialState.duplicateFilters;
    },

    // ── Loyalty Filters ───────────────────────────────────────────────
    setLoyaltyFilters: (state, action: PayloadAction<Partial<CrmState['loyaltyFilters']>>) => {
      state.loyaltyFilters = { ...state.loyaltyFilters, ...action.payload };
    },
    resetLoyaltyFilters: (state) => {
      state.loyaltyFilters = initialState.loyaltyFilters;
    },

    // ── Merge History Filters ─────────────────────────────────────────
    setMergeHistoryFilters: (state, action: PayloadAction<Partial<CrmState['mergeHistoryFilters']>>) => {
      state.mergeHistoryFilters = { ...state.mergeHistoryFilters, ...action.payload };
    },

    // ── Purchase History Filters ──────────────────────────────────────
    setPurchaseHistoryFilters: (state, action: PayloadAction<Partial<CrmState['purchaseHistoryFilters']>>) => {
      state.purchaseHistoryFilters = { ...state.purchaseHistoryFilters, ...action.payload };
    },

    // ── Interaction Filters ───────────────────────────────────────────
    setInteractionFilters: (state, action: PayloadAction<Partial<CrmState['interactionFilters']>>) => {
      state.interactionFilters = { ...state.interactionFilters, ...action.payload };
    },
    resetInteractionFilters: (state) => {
      state.interactionFilters = initialState.interactionFilters;
    },

    // ── Selected Items ────────────────────────────────────────────────
    setSelectedCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.selectedCustomer = action.payload;
    },
    setSelectedDuplicate: (state, action: PayloadAction<CustomerDuplicate | null>) => {
      state.selectedDuplicate = action.payload;
    },
    setSelectedLoyaltyTransaction: (state, action: PayloadAction<LoyaltyTransaction | null>) => {
      state.selectedLoyaltyTransaction = action.payload;
    },

    // ── Customer Modal ────────────────────────────────────────────────
    openCustomerModal: (
      state,
      action: PayloadAction<{ mode: 'create' | 'edit' | 'view'; customer?: Customer }>
    ) => {
      state.isCustomerModalOpen = true;
      state.customerModalMode = action.payload.mode;
      if (action.payload.customer) {
        state.selectedCustomer = action.payload.customer;
      }
    },
    closeCustomerModal: (state) => {
      state.isCustomerModalOpen = false;
      state.customerModalMode = 'view';
      state.selectedCustomer = null;
    },

    // ── Duplicate Modal ───────────────────────────────────────────────
    openDuplicateModal: (state, action: PayloadAction<{ duplicate: CustomerDuplicate }>) => {
      state.isDuplicateModalOpen = true;
      state.selectedDuplicate = action.payload.duplicate;
    },
    closeDuplicateModal: (state) => {
      state.isDuplicateModalOpen = false;
      state.selectedDuplicate = null;
    },

    // ── Adjust Points Modal ───────────────────────────────────────────
    openAdjustPointsModal: (
      state,
      action: PayloadAction<{ mode: 'add' | 'redeem'; customer: Customer }>
    ) => {
      state.isAdjustPointsModalOpen = true;
      state.adjustPointsMode = action.payload.mode;
      state.selectedCustomer = action.payload.customer;
    },
    closeAdjustPointsModal: (state) => {
      state.isAdjustPointsModalOpen = false;
      state.adjustPointsMode = 'add';
    },

    // ── Interaction Modal ─────────────────────────────────────────────
    openInteractionModal: (state, action: PayloadAction<Customer>) => {
      state.isInteractionModalOpen = true;
      state.selectedCustomer = action.payload;
    },
    closeInteractionModal: (state) => {
      state.isInteractionModalOpen = false;
    },

    // ── Profile Tab ───────────────────────────────────────────────────
    setCustomerProfileTab: (
      state,
      action: PayloadAction<CrmState['customerProfileTab']>
    ) => {
      state.customerProfileTab = action.payload;
    },

    // ── Last Fetch Timestamps ─────────────────────────────────────────
    updateLastFetch: (
      state,
      action: PayloadAction<{ type: keyof CrmState['lastFetch']; timestamp: number }>
    ) => {
      state.lastFetch[action.payload.type] = action.payload.timestamp;
    },

    // ── Clear State ───────────────────────────────────────────────────
    clearCrmState: () => initialState,
  },
});

export const {
  // Customer Filters
  setCustomerFilters,
  resetCustomerFilters,
  // Duplicate Filters
  setDuplicateFilters,
  resetDuplicateFilters,
  // Loyalty Filters
  setLoyaltyFilters,
  resetLoyaltyFilters,
  // Merge / Purchase / Interaction Filters
  setMergeHistoryFilters,
  setPurchaseHistoryFilters,
  setInteractionFilters,
  resetInteractionFilters,
  // Selected Items
  setSelectedCustomer,
  setSelectedDuplicate,
  setSelectedLoyaltyTransaction,
  // Modals
  openCustomerModal,
  closeCustomerModal,
  openDuplicateModal,
  closeDuplicateModal,
  openAdjustPointsModal,
  closeAdjustPointsModal,
  openInteractionModal,
  closeInteractionModal,
  // Profile Tab
  setCustomerProfileTab,
  // Timestamps & Reset
  updateLastFetch,
  clearCrmState,
} = crmSlice.actions;

export default crmSlice.reducer;