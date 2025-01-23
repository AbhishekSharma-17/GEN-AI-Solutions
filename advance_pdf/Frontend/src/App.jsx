import { useState } from 'react'
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material'
import './App.css'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import PDFViewer from './components/PDFViewer'
import ChatWindow from './components/ChatWindow'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // Bright blue
      light: '#60a5fa',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#7c3aed', // Purple
      light: '#a78bfa',
      dark: '#5b21b6',
    },
    success: {
      main: '#10b981', // Green
      light: '#34d399',
      dark: '#059669',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    divider: 'rgba(0,0,0,0.06)',
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0,0,0,0.1)',
    '0px 2px 4px rgba(0,0,0,0.1)',
    '0px 4px 8px rgba(0,0,0,0.1)',
    '0px 8px 16px rgba(0,0,0,0.1)',
    ...Array(20).fill('none'),
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
          },
        },
        contained: {
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
        },
        elevation3: {
          boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
})

function App() {
  const [pdfFile, setPdfFile] = useState(null)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        bgcolor: 'background.default',
        gap: 2,
        p: 2,
      }}>
        <TopBar onFileUpload={setPdfFile} />
        <Box sx={{ 
          display: 'flex', 
          flexGrow: 1, 
          gap: 2,
          height: 'calc(100vh - 100px)',
        }}>
          <Box sx={{ width: 280 }}>
            <Sidebar />
          </Box>
          <Box sx={{ flex: 1 }}>
            <PDFViewer file={pdfFile} />
          </Box>
          <Box sx={{ width: 320 }}>
            <ChatWindow />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default App
