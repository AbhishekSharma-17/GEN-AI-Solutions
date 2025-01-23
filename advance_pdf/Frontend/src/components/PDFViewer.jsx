import React, { useState } from 'react'
import { Document, Page } from 'react-pdf'
import { Box, Typography, IconButton, Paper, LinearProgress, Tooltip, Divider } from '@mui/material'
import { 
  ChevronLeft, 
  ChevronRight, 
  CloudUpload,
  FindInPage,
  Fullscreen,
  RotateLeft,
  RotateRight
} from '@mui/icons-material'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'

const PDFViewer = ({ file }) => {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [loading, setLoading] = useState(false)

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages)
    setPageNumber(1)
    setLoading(false)
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
    <Paper 
      elevation={3} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {loading && (
        <LinearProgress 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0,
            zIndex: 1,
          }} 
        />
      )}

      {file ? (
        <>
          <Box sx={{ 
            p: 2, 
            borderBottom: 1, 
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'background.paper',
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {file.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Search in document">
                <IconButton size="small" color="primary">
                  <FindInPage />
                </IconButton>
              </Tooltip>
              <Tooltip title="Rotate left">
                <IconButton size="small" color="primary">
                  <RotateLeft />
                </IconButton>
              </Tooltip>
              <Tooltip title="Rotate right">
                <IconButton size="small" color="primary">
                  <RotateRight />
                </IconButton>
              </Tooltip>
              <Tooltip title="Fullscreen">
                <IconButton size="small" color="primary">
                  <Fullscreen />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box sx={{ 
            flexGrow: 1, 
            overflow: 'auto', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'flex-start', 
            p: 3,
            bgcolor: 'grey.50',
          }}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 2,
                bgcolor: 'background.paper',
                '& canvas': {
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<LinearProgress />}
                onLoadProgress={() => setLoading(true)}
              >
                <Page pageNumber={pageNumber} />
              </Document>
            </Paper>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            p: 1.5,
            borderTop: 1, 
            borderColor: 'divider',
            bgcolor: 'background.paper',
            gap: 2,
          }}>
            <IconButton 
              onClick={previousPage} 
              disabled={pageNumber <= 1} 
              size="small"
              sx={{ 
                bgcolor: 'grey.100',
                '&:hover': { bgcolor: 'grey.200' },
              }}
            >
              <ChevronLeft />
            </IconButton>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Page {pageNumber} of {numPages}
            </Typography>
            <IconButton 
              onClick={nextPage} 
              disabled={pageNumber >= numPages} 
              size="small"
              sx={{ 
                bgcolor: 'grey.100',
                '&:hover': { bgcolor: 'grey.200' },
              }}
            >
              <ChevronRight />
            </IconButton>
          </Box>
        </>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          gap: 2,
          p: 4,
          textAlign: 'center',
        }}>
          <CloudUpload sx={{ fontSize: 64, color: 'primary.light' }} />
          <Typography variant="h6" color="text.secondary">
            No PDF file uploaded yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload a PDF file to preview its contents
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

export default PDFViewer
