import { createSlice } from '@reduxjs/toolkit';

const dropboxSlice = createSlice({
  name: 'drive',
  initialState: {
    showDropboxFiles: false,
    dropboxFiles: []
  },
  reducers: {
    setShowDropboxFiles: (state, action) => {
      state.showDropboxFiles = action.payload;
    },
    setDropboxFiles: (state, action) => {
      state.dropboxFiles = action.payload;
    }
  }
});

export const { setShowDropboxFiles, setDropboxFiles } = dropboxSlice.actions;
export default dropboxSlice.reducer;