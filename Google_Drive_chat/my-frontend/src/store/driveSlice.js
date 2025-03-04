import { createSlice } from '@reduxjs/toolkit';

const driveSlice = createSlice({
  name: 'drive',
  initialState: {
    showDriveFiles: false,
    driveFiles: []
  },
  reducers: {
    setShowDriveFiles: (state, action) => {
      state.showDriveFiles = action.payload;
    },
    setDriveFiles: (state, action) => {
      state.driveFiles = action.payload;
    }
  }
});

export const { setShowDriveFiles, setDriveFiles } = driveSlice.actions;
export default driveSlice.reducer;