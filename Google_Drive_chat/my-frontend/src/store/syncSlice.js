import { createSlice } from '@reduxjs/toolkit';

const syncSlice = createSlice({
  name: 'sync',
  initialState: {
    syncFiles: {}
  },
  reducers: {
    setSyncFiles: (state, action) => {
      state.syncFiles = action.payload;
    }
  }
});

export const { setSyncFiles } = syncSlice.actions;
export default syncSlice.reducer;