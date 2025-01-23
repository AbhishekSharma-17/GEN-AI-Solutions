import React, { useState } from 'react'
import { Document, Page } from 'react-pdf'
import { Box, Typography, IconButton } from '@mui/material'
import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'

const PDFViewer = ({ file }) => {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages)
    setPageNumber(1)
  }

  function changePage(offset) {
    setPageNumber(prevPageNumber => prevPageNumber + offset)
  }

  function previousPage() {
    changePage(-1)
  }

  function nextPage() {
    changePage(1)
  }

  return (
    <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
      {file ? (
        <>
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
          >
            <Page pageNumber={pageNumber} />
          </Document>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <IconButton onClick={previousPage} disabled={pageNumber <= 1}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="body1" sx={{ mx: 2 }}>
              Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
            </Typography>
            <IconButton onClick={nextPage} disabled={pageNumber >= numPages}>
              <ChevronRight />
            </IconButton>
          </Box>
        </>
      ) : (
        <Typography variant="h6">No PDF file uploaded yet.</Typography>
      )}
    </Box>
  )
}

export default PDFViewer
