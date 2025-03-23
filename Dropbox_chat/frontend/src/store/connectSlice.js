import { createSlice } from '@reduxjs/toolkit';

const connectSlice = createSlice({
  name: 'sync',
  initialState: {
    message: {},
    showAlert: false
  },
  reducers: {
    setMessage: (state, action) => {
      state.message = action.payload;
    },
        setShowAlert: (state, action) => {
      state.showAlert = action.payload;
    },
  }
});

export const { setMessage, setShowAlert } = connectSlice.actions;
export default connectSlice.reducer;