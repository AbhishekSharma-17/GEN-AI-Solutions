import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice';
import connectSlice from './connectSlice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    connect: connectSlice
  }
});