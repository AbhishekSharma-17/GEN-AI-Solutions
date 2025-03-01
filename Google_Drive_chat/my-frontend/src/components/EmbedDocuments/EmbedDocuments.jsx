import React, { useState } from 'react';
import { Typography, Button, CircularProgress, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import './EmbedDocuments.css';
import documentIcon from '../../assets/documentIcon.png';
import { useNavigate } from 'react-router-dom';
import Header from '../Header/Header';

const EmbedDocuments = () => {
  const [embeddingData, setEmbeddingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSkippedTableCollapsed, setIsSkippedTableCollapsed] = useState(false);
  const [isEmbeddedTableCollapsed, setIsEmbeddedTableCollapsed] = useState(false);
const navigate = useNavigate(); 
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
    setLoading(true);
    setError(null);
    setEmbeddingData(null);

    try {
      const response = await fetch("http://localhost:8000/embed", {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setEmbeddingData({ ...data, isEmbedResponse: true, embedData: data, statusData: null });

        fetchEmbeddingStatus();
      } else {
        alert("Error embedding documents.");
      }
    } catch (err) {
      console.error("Error embedding documents", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    try {
      await fetchEmbeddingStatus();
    } catch (err) {
      console.error("Error refreshing embedding status", err);
      setError("Error refreshing embedding status.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/chat');
  };

  const fetchEmbeddingStatus = async () => {
    try {
      const response = await fetch("http://localhost:8000/embedding-status", {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setEmbeddingData(prevData => ({
          ...prevData,
          ...data,
          isEmbedResponse: false,
          statusData: data,
        }));
      } else {
        console.error("Error fetching embedding status");
      }
    } catch (err) {
      console.error("Error fetching embedding status", err);
    }
  };

  const toggleSkippedTableCollapse = () => {
    setIsSkippedTableCollapsed(!isSkippedTableCollapsed);
  };

  const toggleEmbeddedTableCollapse = () => {
    setIsEmbeddedTableCollapsed(!isEmbeddedTableCollapsed);
  };

  return (
    <div className="embed-documents-container">
      <Header width='100%' />
      <div className='upper-section'>  
        <Typography variant="h5" className="section-title" gutterBottom>
          Embed Documents
        </Typography>
        {embeddingData &&
          (<Button 
          variant="contained" 
          className="refresh-button"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} style={{ color: '#fff' }} /> : 'Refresh'}
        </Button>)}
        <Button 
          variant="contained" 
          className="embed-button"
          onClick={handleEmbed}
          disabled={loading}
          sx={{ ml: 2 }}
        >
          {loading ? <CircularProgress size={24} style={{ color: '#fff' }} /> : 'Embed'}
        </Button>
      </div>
      {!embeddingData && !loading && !error && (
        <Typography variant="body1" className="no-data-message">
          No Embedded Data Found. Please click on "<span className='bold-text'>Embed</span>" button.
        </Typography>
      )}
      {loading && (
        <Box className="loader">
          <CircularProgress style={{ color: '#101010' }}/>
        </Box>
      )}
      {error && (
        <Typography variant="body1" className="error-message">
          {error}
        </Typography>
      )}
      {embeddingData && !loading && !error && (
        <div className="documents-section">
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
                  {embeddingData.embedData.skipped_files.map((file, index) => (
                    <div key={index} className="file-row">
                      <div className="file-info">
                        <img src={documentIcon} alt="Document Icon" className="document-icon" />
                        <Typography variant="body1">{file}</Typography>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {embeddingData.statusData && (
            <>
              <div className="status-header">
                <Typography variant="body1" className="status-message" gutterBottom style={{ marginTop: '0', padding: '0 8px'}}>
                  Found {embeddingData.total_embedded_files} embedded files with {embeddingData.total_chunks} total chunks
                </Typography>
              </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={toggleEmbeddedTableCollapse}>
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
                      <TableRow className='section-subtitle'>
                        <TableCell>File Name</TableCell>
                        <TableCell>Last Embedded</TableCell>
                        <TableCell>Chunks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(embeddingData.status).map(([fileName, details], index) => <TableRow key={index}><TableCell style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}> <img src={documentIcon} alt="Document Icon" className="document-icon" />{fileName}</TableCell><TableCell>{formatDate(details.last_embedded)}</TableCell><TableCell>{details.chunks}</TableCell></TableRow>)}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
          {(embeddingData.embedData?.skipped_files?.length > 0 || embeddingData.statusData) && (
            <Button 
              variant="contained" 
              className="continue-button"
              onClick={handleContinue}
              sx={{ mt: 4, mx: 'auto', display: 'block' }}
            >
              Continue
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmbedDocuments;