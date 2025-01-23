import React from 'react'
import { Paper, Button, IconButton, Typography, Box, Tooltip, Badge } from '@mui/material'
import { 
  CloudUpload, 
  ZoomIn, 
  ZoomOut, 
  Search, 
  Download, 
  Share, 
  Print,
  Notifications,
  Settings,
  AccountCircle
} from '@mui/icons-material'

const TopBar = ({ onFileUpload }) => {
  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'application/pdf') {
      onFileUpload(file)
    } else {
      alert('Please upload a PDF file')
    }
  }

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
        PDF Viewer
      </Typography>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="pdf-upload"
        />
        <label htmlFor="pdf-upload">
          <Button
            variant="contained"
            component="span"
            startIcon={<CloudUpload />}
            sx={{ 
              background: 'linear-gradient(45deg, #2563eb 30%, #3b82f6 90%)',
              color: 'white',
            }}
          >
            Upload PDF
          </Button>
        </label>

        <Tooltip title="Search in PDF">
          <IconButton color="primary" size="small" sx={{ bgcolor: 'primary.50' }}>
            <Search />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        bgcolor: 'grey.50',
        borderRadius: 2,
        px: 1,
      }}>
        <IconButton size="small">
          <ZoomOut />
        </IconButton>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          100%
        </Typography>
        <IconButton size="small">
          <ZoomIn />
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Download">
          <IconButton color="primary" size="small">
            <Download />
          </IconButton>
        </Tooltip>
        <Tooltip title="Share">
          <IconButton color="primary" size="small">
            <Share />
          </IconButton>
        </Tooltip>
        <Tooltip title="Print">
          <IconButton color="primary" size="small">
            <Print />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, ml: 2, borderLeft: 1, borderColor: 'divider', pl: 2 }}>
        <Tooltip title="Notifications">
          <IconButton color="primary" size="small">
            <Badge color="error" variant="dot">
              <Notifications />
            </Badge>
          </IconButton>
        </Tooltip>
        <Tooltip title="Settings">
          <IconButton color="primary" size="small">
            <Settings />
          </IconButton>
        </Tooltip>
        <Tooltip title="Profile">
          <IconButton color="primary" size="small">
            <AccountCircle />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  )
}

export default TopBar
