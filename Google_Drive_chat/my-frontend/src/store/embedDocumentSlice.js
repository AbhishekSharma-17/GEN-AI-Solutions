import { createSlice } from '@reduxjs/toolkit';

const embedDocumentSlice = createSlice({
  name: 'embedDocument',
  initialState: {
    embedDocumentLoader: false,
    embedDocument: null,
    embedDocumentStatus: null
  },
  reducers: {
    setEmbedDocumentLoader: (state, action) => {
      state.embedDocumentLoader = action.payload;
    },
    setEmbedDocument: (state, action) => {
      state.embedDocument = action.payload;
    },
    setEmbedDocumentStatus: (state, action) => {
      state.embedDocumentStatus = action.payload;
    }
  }
});

export const { setEmbedDocumentLoader, setEmbedDocument, setEmbedDocumentStatus } = embedDocumentSlice.actions;
export default embedDocumentSlice.reducer;