import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
// import { aiContentApi } from '../services/aiContentApi';

interface AIContentState {
  filters: {
    content_type: string;
    status: string;
    user_id: number | null;
    start_date: string;
    end_date: string;
    page: number;
  };
  statsView: 'daily' | 'weekly' | 'monthly';
}

const initialState: AIContentState = {
  filters: {
    content_type: '',
    status: '',
    user_id: null,
    start_date: '',
    end_date: '',
    page: 1,
  },
  statsView: 'daily',
};

const aiContentSlice = createSlice({
  name: 'aiContent',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<AIContentState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    setStatsView: (state, action: PayloadAction<'daily' | 'weekly' | 'monthly'>) => {
      state.statsView = action.payload;
    },
  },
});

export const { setFilters, resetFilters, setStatsView } = aiContentSlice.actions;
export default aiContentSlice.reducer;