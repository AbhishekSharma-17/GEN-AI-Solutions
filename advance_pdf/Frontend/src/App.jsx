import { useState } from 'react'
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material'
import './App.css'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import PDFViewer from './components/PDFViewer'
import ChatWindow from './components/ChatWindow'

const theme = createTheme()

function App() {
  const [pdfFile, setPdfFile] = useState(null)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <Sidebar />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <TopBar onFileUpload={setPdfFile} />
          <Box sx={{ display: 'flex', flexGrow: 1 }}>
            <PDFViewer file={pdfFile} />
            <ChatWindow />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default App
