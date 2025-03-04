import { createSlice } from '@reduxjs/toolkit';

const embedDocumentSlice = createSlice({
  name: 'embedDocument',
  initialState: {
    embedDocumentLoader: false,
    embedDocument: null
  },
  reducers: {
    setEmbedDocumentLoader: (state, action) => {
      state.embedDocumentLoader = action.payload;
    },
    setEmbedDocument: (state, action) => {
      state.embedDocument = action.payload;
    }
  }
});

export const { setEmbedDocumentLoader, setEmbedDocument } = embedDocumentSlice.actions;
export default embedDocumentSlice.reducer;