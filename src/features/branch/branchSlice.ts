// src/features/branch/branchSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface BranchState {
  selectedBranchId: number | null; // null = "All Branches"
}

const initialState: BranchState = {
  selectedBranchId: null,
};

const branchSlice = createSlice({
  name: 'branch',
  initialState,
  reducers: {
    setSelectedBranch: (state, action: PayloadAction<number | null>) => {
      state.selectedBranchId = action.payload;
      // Persist to localStorage
      localStorage.setItem(
        'selected_branch',
        action.payload === null ? 'all' : String(action.payload)
      );
    },
    loadBranchFromStorage: (state) => {
      const saved = localStorage.getItem('selected_branch');
      if (saved) {
        state.selectedBranchId = saved === 'all' ? null : Number(saved);
      }
    },
    clearBranchSelection: (state) => {
      state.selectedBranchId = null;
      localStorage.removeItem('selected_branch');
    },
  },
});

export const { setSelectedBranch, loadBranchFromStorage, clearBranchSelection } =
  branchSlice.actions;

export default branchSlice.reducer;