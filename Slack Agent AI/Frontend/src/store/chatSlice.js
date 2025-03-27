import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'sync',
  initialState: {
    messages: [],
    showAlert: false
  },
  reducers: {
    setChat: (state, action) => {
      state.messages = action.payload;
    },
        setShowAlert: (state, action) => {
      state.showAlert = action.payload;
    },
  }
});

export const { setChat, setShowAlert } = chatSlice.actions;
export default chatSlice.reducer;