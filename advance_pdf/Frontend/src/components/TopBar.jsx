import React from 'react'
import { AppBar, Toolbar, Button, IconButton, Typography, Box } from '@mui/material'
import { ZoomIn, ZoomOut } from '@mui/icons-material'

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
    <AppBar position="static" color="default" elevation={0}>
      <Toolbar>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="pdf-upload"
        />
        <label htmlFor="pdf-upload">
          <Button variant="contained" component="span">
            Upload PDF
          </Button>
        </label>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton>
          <ZoomOut />
        </IconButton>
        <Typography variant="body1" sx={{ mx: 2 }}>
          100%
        </Typography>
        <IconButton>
          <ZoomIn />
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}

export default TopBar
