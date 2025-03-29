import React, { useState } from 'react';
import { Typography, Button, CircularProgress, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Alert } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import './EmbedDocuments.css';
import documentIcon from '../../assets/documentIcon.png';
import { useNavigate } from 'react-router-dom';
import { setEmbedDocument, setEmbedDocumentLoader, setEmbedDocumentStatus } from '../../store/embedDocumentSlice';
import Loader from '../commonComponents/Loader/Loader';

const EmbedDocuments = () => {
  const [error, setError] = useState(null);
  const [loadingText, setLoadingText] = useState('');
  const [isProcessedTableCollapsed, setIsProcessedTableCollapsed] = useState(true);
  const [isFailedTableCollapsed, setIsFailedTableCollapsed] = useState(true);
  const [isSkippedTableCollapsed, setIsSkippedTableCollapsed] = useState(false);
  const [isEmbeddedTableCollapsed, setIsEmbeddedTableCollapsed] = useState(false);
  const [isNotEmbeddedTableCollapsed, setIsNotEmbeddedTableCollapsed] = useState(false); // New state for not_embedded_files
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const embedDocumentLoader = useSelector((state) => state.embedDocument.embedDocumentLoader);
  const embeddingData = useSelector((state) => state.embedDocument.embedDocument);
  const embedDocumentStatus = useSelector((state) => state.embedDocument.embedDocumentStatus);

  const truncateFilename = (filename, maxLength = 38) => {
    if (filename.length <= maxLength) return filename;
    let truncated = filename.substring(0, maxLength - 3);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
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
    setLoadingText('Embedding...');
    try {
      const response = await fetch("http://localhost:8000/embed", { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        dispatch(setEmbedDocument({ ...data, isEmbedResponse: true, embedData: data, statusData: null }));
        fetchEmbeddingStatus();
      } else {
        throw new Error('Failed to embed documents. Please click on Disconnect and try again.');
      }
    } catch (err) {
      console.error("Error embedding documents", err);
      setError(err.message || 'An error occurred while embedding documents.');
    } finally {
      dispatch(setEmbedDocumentLoader(false));
    }
  };

  const handleRefresh = async () => {
    dispatch(setEmbedDocumentLoader(true));
    setError(null);
    setLoadingText('Refreshing...');
    try {
      await fetchEmbeddingStatus();
    } catch (err) {
      console.error("Error refreshing embedding status", err);
      setError("Error refreshing embedding status.");
    } finally {
      dispatch(setEmbedDocumentLoader(false));
    }
  };

  const handleContinue = () => {
    navigate('/chat');
  };

  const fetchEmbeddingStatus = async () => {
    try {
      const response = await fetch("http://localhost:8000/embedding-status", { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        dispatch(setEmbedDocumentStatus({ ...data, isEmbedResponse: false, statusData: data }));
      } else {
        throw new Error('Failed to fetch embedding status.');
      }
    } catch (err) {
      console.error("Error fetching embedding status", err);
      setError(err.message || 'An error occurred while fetching embedding status.');
    }
  };

  const toggleProcessedTableCollapse = () => setIsProcessedTableCollapsed(!isProcessedTableCollapsed);
  const toggleFailedTableCollapse = () => setIsFailedTableCollapsed(!isFailedTableCollapsed);
  const toggleSkippedTableCollapse = () => setIsSkippedTableCollapsed(!isSkippedTableCollapsed);
  const toggleEmbeddedTableCollapse = () => setIsEmbeddedTableCollapsed(!isEmbeddedTableCollapsed);
  const toggleNotEmbeddedTableCollapse = () => setIsNotEmbeddedTableCollapsed(!isNotEmbeddedTableCollapsed); // New toggle function

  return (
    <div className="embed-documents-container">
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ marginTop: 2, marginBottom: 2 }}>
          {error}
        </Alert>
      )}
      <div className="upper-section">
        <Typography variant="h5" className="section-title" gutterBottom>
          Embed Documents
        </Typography>
        {embeddingData && embeddingData.statusData === null && (
          <Button variant="contained" className="refresh-button" onClick={handleRefresh} disabled={embedDocumentLoader}>
            {embedDocumentLoader ? <CircularProgress size={24} style={{ color: '#fff' }} /> : 'Refresh'}
          </Button>
        )}
        <Button variant="contained" className="embed-button" onClick={handleEmbed} disabled={embedDocumentLoader} sx={{ ml: 2 }}>
          {embedDocumentLoader ? <CircularProgress size={24} style={{ color: '#fff' }} /> : 'Embed'}
        </Button>
      </div>
      {!embeddingData && !embedDocumentLoader && !error && (
        <Typography variant="body1" className="no-data-message">
          No Embedded Data Found. Please click on "<span className="bold-text">Embed</span>" button.
        </Typography>
      )}
      {embedDocumentLoader && (
        <Box className="loader">
          <Loader loadingText={loadingText} showLoadingText />
        </Box>
      )}
      {embeddingData && !embedDocumentLoader && !error && (
        <div className="documents-section">
          {/* Embed Response Message */}
          {embeddingData.embedData?.message && (
            <Typography variant="body1" className="status-message" gutterBottom style={{ textAlign: 'center', marginBottom: 16 }}>
              {embeddingData.embedData.message}
            </Typography>
          )}

          {/* Processed Files */}
          {embeddingData.embedData?.processed_files?.length > 0 && (
            <>
              <div className="status-header" onClick={toggleProcessedTableCollapse} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" className="section-subtitle" gutterBottom>
                  Processed Files ({embeddingData.embedData.processed_count})
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

          {/* Failed Files */}
          {embeddingData.embedData?.failed_files?.length > 0 && (
            <>
              <div className="status-header" onClick={toggleFailedTableCollapse} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
                <Typography variant="subtitle1" className="section-subtitle" gutterBottom>
                  Failed Files ({embeddingData.embedData.failed_count})
                </Typography>
                <IconButton size="small" aria-label="toggle failed table">
                  {isFailedTableCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                </IconButton>
              </div>
              {!isFailedTableCollapsed && (
                <div className="file-table">
                  <div className="table-header">
                    <Typography variant="subtitle2">File Name</Typography>
                  </div>
                  <div className="table-scroll-container">
                    {embeddingData.embedData.failed_files.map((file, index) => (
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

          {/* Skipped Files */}
          {embeddingData.embedData?.skipped_files?.length > 0 && (
            <>
              <div className="status-header" onClick={toggleSkippedTableCollapse} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',  }}>
                <Typography variant="subtitle1" className="section-subtitle" gutterBottom>
                  Skipped Files ({embeddingData.embedData.skipped_count})
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

          {/* Embedding Status */}
          {embedDocumentStatus?.statusData && (
            <>
              <Typography variant="body1" className="status-message" gutterBottom style={{ textAlign: 'center', marginTop: 16 }}>
                {embedDocumentStatus.statusData.message}
              </Typography>

              {/* Embedded Files */}
              {Object.keys(embedDocumentStatus.statusData.status).length > 0 && (
                <>
                  <div className="embeddedHeader" onClick={toggleEmbeddedTableCollapse} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                          {Object.entries(embedDocumentStatus.statusData.status).map(([fileName, details], index) => (
                            <TableRow key={index}>
                              <TableCell style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}>
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

              {/* Not Embedded Files */}
              {embedDocumentStatus.statusData?.not_embedded_files?.length > 0 && (
                <>
                  <div className="status-header" onClick={toggleNotEmbeddedTableCollapse} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                    <Typography variant="subtitle1" className="section-subtitle" gutterBottom>
                      Not Embedded Files ({embedDocumentStatus.statusData.not_embedded_count})
                    </Typography>
                    <IconButton size="small" aria-label="toggle not embedded table">
                      {isNotEmbeddedTableCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                    </IconButton>
                  </div>
                  {!isNotEmbeddedTableCollapsed && (
                    <div className="file-table">
                      <div className="table-header">
                        <Typography variant="subtitle2">File Name</Typography>
                      </div>
                      <div className="table-scroll-container">
                        {embedDocumentStatus.statusData.not_embedded_files.map((file, index) => (
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
            </>
          )}

          {/* Continue Button */}
          {(embeddingData.embedData?.processed_files?.length > 0 || embeddingData.embedData?.failed_files?.length > 0 || embeddingData.embedData?.skipped_files?.length > 0 || embedDocumentStatus?.statusData?.not_embedded_files?.length > 0) && (
            <Button variant="contained" className="continue-button" onClick={handleContinue} sx={{ mt: 4, mx: 'auto', display: 'block' }}>
              Continue
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmbedDocuments;