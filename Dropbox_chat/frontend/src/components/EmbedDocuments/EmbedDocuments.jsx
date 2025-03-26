import React, { useState } from 'react';
import { Typography, Button, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, IconButton, Alert } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import './EmbedDocuments.css';
import documentIcon from '../../assets/documentIcon.png';
import { useNavigate } from 'react-router-dom';
import { setEmbedDocument, setEmbedDocumentLoader } from '../../store/embedDocumentSlice';
import Loader from '../commonComponents/Loader/Loader';

const EmbedDocuments = () => {
  const [error, setError] = useState(null);
  const [loadingText, setLoadingText] = useState(''); // New state for loader text
  const [isSkippedTableCollapsed, setIsSkippedTableCollapsed] = useState(false);
  const [isProcessedTableCollapsed, setIsProcessedTableCollapsed] = useState(false);
  const [isEmbeddedTableCollapsed, setIsEmbeddedTableCollapsed] = useState(false);
  const [continueLoading, setContinueLoading] = useState(false); // State for Continue button loader
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const embedDocumentLoader = useSelector((state) => state.embedDocument.embedDocumentLoader);
  const embeddingData = useSelector((state) => state.embedDocument.embedDocument);

  // Helper function to truncate filename to 38 characters and append "..."
  const truncateFilename = (filename, maxLength = 38) => {
    if (filename.length <= maxLength) return filename;

    // Find the last space within the maxLength to avoid cutting words
    let truncated = filename.substring(0, maxLength - 3); // Leave space for "..."
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    // If there's a space, truncate there to avoid cutting a word
    if (lastSpaceIndex !== -1 && lastSpaceIndex > maxLength / 2) {
      truncated = truncated.substring(0, lastSpaceIndex);
    }

    return `${truncated}...`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en', { month: 'short' });
    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const period = date.getHours() >= 12 ? 'PM' : 'AM';

    const getOrdinal = (num) => {
      if (num > 3 && num < 21) return 'th';
      switch (num % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };

    return `${day}${getOrdinal(day)} ${month} ${hours}:${minutes} ${period}`;
  };

  const handleEmbed = async () => {
    dispatch(setEmbedDocumentLoader(true));
    setError(null);
    setLoadingText('Embedding...'); // Set loading text for embed action

    try {
      const response = await fetch("http://localhost:8000/embed", {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        dispatch(setEmbedDocument({ ...data, isEmbedResponse: true, embedData: data, statusData: null }));
      } else {
        throw new Error('Failed to embed documents. Please click on Disconnect and try again.');
      }
    } catch (err) {
      console.error("Error embedding documents please click on Disconnect and try again", err);
      setError(err.message || 'An error occurred while embedding documents. Please click on Disconnect and try again.');
    } finally {
      dispatch(setEmbedDocumentLoader(false));
    }
  };

  const handleContinue = () => {
    setContinueLoading(true);
    setTimeout(() => {
      navigate('/chat');
    }, 1000); // Simulate a 1-second delay for the loader
  };

  const toggleSkippedTableCollapse = () => {
    setIsSkippedTableCollapsed(!isSkippedTableCollapsed);
  };

  const toggleProcessedTableCollapse = () => {
    setIsProcessedTableCollapsed(!isProcessedTableCollapsed);
  };

  const toggleEmbeddedTableCollapse = () => {
    setIsEmbeddedTableCollapsed(!isEmbeddedTableCollapsed);
  };

  return (
    <div className="embed-documents-container">
      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ marginTop: 2, marginBottom: 2 }}
        >
          {error}
        </Alert>
      )}
      <div className="upper-section">
        <Typography variant="h5" className="section-title" gutterBottom>
          Embed Documents
        </Typography>
        <Button
          variant="contained"
          className="embed-button"
          onClick={handleEmbed}
          disabled={embedDocumentLoader}
          sx={{ ml: 2 }}
        >
          {embedDocumentLoader ? (
            <CircularProgress size={24} style={{ color: '#fff' }} />
          ) : (
            'Embed'
          )}
        </Button>
      </div>
      {!embeddingData && !embedDocumentLoader && !error && (
        <Typography variant="body1" className="no-data-message">
          No Embedded Data Found. Please click on "<span className="bold-text">Embed</span>" button.
        </Typography>
      )}
      {embedDocumentLoader && (
        <Box className="loader">
          <Loader loadingText='Embedding...' showLoadingText/>
        </Box>
      )}
      {embeddingData && !embedDocumentLoader && !error && (
        <div className="documents-section">
          {embeddingData.embedData && embeddingData.embedData.processed_files && embeddingData.embedData.processed_files.length > 0 && (
            <>
              <div className="status-header" onClick={toggleProcessedTableCollapse} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" className="section-subtitle" gutterBottom>
                  Processed Files
                </Typography>
                <IconButton size="small" aria-label="toggle processed table">
                  {isProcessedTableCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                </IconButton>
              </div>
              {!isProcessedTableCollapsed && (
                <div className="file-table">
                  <div className="table-header">
                    <Typography variant="subtitle2">File Name</Typography>
                  </div>
                  <div className="table-scroll-container">
                    {embeddingData.embedData.processed_files.map((file, index) => (
                      <div key={index} className="file-row">
                        <div className="file-info">
                          <img src={documentIcon} alt="Document Icon" className="document-icon" />
                          <Typography variant="body1">{truncateFilename(file)}</Typography>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          {embeddingData.embedData && embeddingData.embedData.skipped_files && embeddingData.embedData.skipped_files.length > 0 && (
            <>
              <div className="status-header" onClick={toggleSkippedTableCollapse} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" className="section-subtitle" gutterBottom>
                  Skipped Files
                </Typography>
                <IconButton size="small" aria-label="toggle skipped table">
                  {isSkippedTableCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                </IconButton>
              </div>
              {!isSkippedTableCollapsed && (
                <div className="file-table">
                  <div className="table-header">
                    <Typography variant="subtitle2">File Name</Typography>
                  </div>
                  <div className="table-scroll-container">
                    {embeddingData.embedData.skipped_files.map((file, index) => (
                      <div key={index} className="file-row">
                        <div className="file-info">
                          <img src={documentIcon} alt="Document Icon" className="document-icon" />
                          <Typography variant="body1">{truncateFilename(file)}</Typography>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          {embeddingData.embedData && (embeddingData.embedData.processed_files?.length > 0 || embeddingData.embedData.skipped_files?.length > 0) && (
            <div className="status-header" style={{ background: 'none' }}>
              <Typography variant="body1" className="status-message" gutterBottom style={{ marginTop: (embeddingData.embedData?.processed_files?.length > 0 || embeddingData.embedData?.skipped_files?.length > 0) ? '16px !important' : '0 !important', padding: '0 8px', width: '100%', textAlign: 'center' }}>
                Processed {embeddingData.embedData.processed_count} files, Skipped {embeddingData.embedData.skipped_count} files, Total Chunks: {embeddingData.embedData.total_chunks}
              </Typography>
            </div>
          )}
          {embeddingData.statusData && (
            <>
              <div className="status-header" style={{ background: 'none' }}>
                <Typography variant="body1" className="status-message" gutterBottom style={{ marginTop: (embeddingData.embedData?.processed_files?.length > 0 || embeddingData.embedData?.skipped_files?.length > 0) ? '16px !important' : '0 !important', padding: '0 8px', width: '100%', textAlign: 'center' }}>
                  Found {embeddingData.total_embedded_files} embedded files with {embeddingData.total_chunks} total chunks
                </Typography>
              </div>
              <div className="embeddedHeader" onClick={toggleEmbeddedTableCollapse}>
                <Typography variant="subtitle1" className="section-subtitle" gutterBottom>
                  Embedded Files Details
                </Typography>
                <IconButton size="small" aria-label="toggle embedded table">
                  {isEmbeddedTableCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                </IconButton>
              </div>
              {!isEmbeddedTableCollapsed && (
                <TableContainer component={Paper} className="embed-table">
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow className="section-subtitle">
                        <TableCell>File Name</TableCell>
                        <TableCell>Last Embedded</TableCell>
                        <TableCell>Chunks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(embeddingData.status).map(([fileName, details], index) => (
                        <TableRow key={index}>
                          <TableCell style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }} className='file-title-container'>
                            <img src={documentIcon} alt="Document Icon" className="document-icon" />
                            {truncateFilename(fileName)}
                          </TableCell>
                          <TableCell>{formatDate(details.last_embedded)}</TableCell>
                          <TableCell>{details.chunks}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
          {(embeddingData.embedData?.processed_files?.length > 0 || embeddingData.embedData?.skipped_files?.length > 0 || embeddingData.statusData) && (
            <Button
              variant="contained"
              className="continue-button"
              onClick={handleContinue}
              disabled={continueLoading}
              sx={{ mt: 4, mx: 'auto', display: 'block' }}
            >
              {continueLoading ? (
                <CircularProgress size={24} style={{ color: '#fff' }} />
              ) : (
                'Continue'
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmbedDocuments;