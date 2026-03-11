import { createSlice } from '@reduxjs/toolkit';

interface SecurityState {
  activeTab: 'dashboard' | 'logs' | 'logins' | 'alerts' | 'sessions' | 'deleted';
  filters: {
    dateRange: 'today' | 'week' | 'month' | 'all';
    status?: string;
  };
}

const initialState: SecurityState = {
  activeTab: 'dashboard',
  filters: {
    dateRange: 'week',
  },
};

const securitySlice = createSlice({
  name: 'security',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setDateRange: (state, action) => {
      state.filters.dateRange = action.payload;
    },
  },
});

export const { setActiveTab, setDateRange } = securitySlice.actions;
export default securitySlice.reducer;