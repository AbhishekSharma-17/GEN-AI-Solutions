import { createSlice } from '@reduxjs/toolkit';

const syncSlice = createSlice({
  name: 'sync',
  initialState: {
    syncFiles: {},
    syncDocumentsLoader: false
  },
  reducers: {
    setSyncFiles: (state, action) => {
      state.syncFiles = action.payload;
    },
        setSyncDocumentsLoader: (state, action) => {
      state.syncDocumentsLoader = action.payload;
    },
  }
});

export const { setSyncFiles, setSyncDocumentsLoader } = syncSlice.actions;
export default syncSlice.reducer;