import { configureStore } from '@reduxjs/toolkit';
import dropboxReducer from './dropboxSlice';
import syncReducer from './syncSlice'
import embedDocumentReducer from './embedDocumentSlice';
import connectSlice from './connectSlice';

export const store = configureStore({
  reducer: {
    dropbox: dropboxReducer,
    sync: syncReducer,
    embedDocument: embedDocumentReducer,
    connect: connectSlice
  }
});