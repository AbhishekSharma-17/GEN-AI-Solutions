import { configureStore } from '@reduxjs/toolkit';
import driveReducer from './driveSlice';
import syncReducer from './syncSlice'
import embedDocumentReducer from './embedDocumentSlice';

export const store = configureStore({
  reducer: {
    drive: driveReducer,
    sync: syncReducer,
    embedDocument: embedDocumentReducer
  }
});