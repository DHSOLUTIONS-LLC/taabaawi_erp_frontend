// src/features/help/helpSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface HelpState {
  activeTab: 'categories' | 'articles' | 'faqs' | 'saved';
  
  filters: {
    module: string;
    category_id: number | null;
    search: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | '';
    article_type: 'Guide' | 'Tutorial' | 'FAQ' | 'Video' | 'Troubleshooting' | 'How To' | 'Best Practices' | '';
    page: number;
    per_page: number;
  };

  currentItem: {
    id: number | null;
    type: 'article' | 'faq' | null;
  } | null;

  isFeedbackModalOpen: boolean;
  selectedFeedbackItem: {
    id: number;
    type: 'article' | 'faq';
    title: string;
  } | null;

  savedItems: Array<{
    id: number;
    type: 'article' | 'faq';
    title: string;
    saved_at: string;
  }>;

  searchQuery: string;
  searchResults: any[];
}

const initialState: HelpState = {
  activeTab: 'categories',
  
  filters: {
    module: '',
    category_id: null,
    search: '',
    difficulty: '',
    article_type: '',
    page: 1,
    per_page: 15,
  },

  currentItem: null,

  isFeedbackModalOpen: false,
  selectedFeedbackItem: null,

  savedItems: [],

  searchQuery: '',
  searchResults: [],
};

const helpSlice = createSlice({
  name: 'help',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<HelpState['activeTab']>) => {
      state.activeTab = action.payload;
    },

    setFilters: (state, action: PayloadAction<Partial<HelpState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      // Reset page when filters change
      if (action.payload.module !== undefined || 
          action.payload.category_id !== undefined ||
          action.payload.difficulty !== undefined ||
          action.payload.article_type !== undefined) {
        state.filters.page = 1;
      }
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },

    setCurrentItem: (state, action: PayloadAction<{ id: number; type: 'article' | 'faq' } | null>) => {
      state.currentItem = action.payload;
    },

    openFeedbackModal: (state, action: PayloadAction<{ id: number; type: 'article' | 'faq'; title: string }>) => {
      state.isFeedbackModalOpen = true;
      state.selectedFeedbackItem = action.payload;
    },
    closeFeedbackModal: (state) => {
      state.isFeedbackModalOpen = false;
      state.selectedFeedbackItem = null;
    },

    saveItem: (state, action: PayloadAction<{ id: number; type: 'article' | 'faq'; title: string }>) => {
      const exists = state.savedItems.some(
        item => item.id === action.payload.id && item.type === action.payload.type
      );
      if (!exists) {
        state.savedItems.push({
          ...action.payload,
          saved_at: new Date().toISOString()
        });
      }
    },
    unsaveItem: (state, action: PayloadAction<{ id: number; type: 'article' | 'faq' }>) => {
      state.savedItems = state.savedItems.filter(
        item => !(item.id === action.payload.id && item.type === action.payload.type)
      );
    },
    clearSavedItems: (state) => {
      state.savedItems = [];
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSearchResults: (state, action: PayloadAction<any[]>) => {
      state.searchResults = action.payload;
    },
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
    },
  },
});

export const {
  setActiveTab,
  setFilters, resetFilters,
  setCurrentItem,
  openFeedbackModal, closeFeedbackModal,
  saveItem, unsaveItem, clearSavedItems,
  setSearchQuery, setSearchResults, clearSearch,
} = helpSlice.actions;

export default helpSlice.reducer;