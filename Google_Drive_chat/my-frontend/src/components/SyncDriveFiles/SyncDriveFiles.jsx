import React, { useState } from 'react';
import { Typography, Button, CircularProgress, Box, IconButton, Alert } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import './SyncDriveFiles.css';
import documentIcon from '../../assets/documentIcon.png';
import { useNavigate } from 'react-router-dom';
import Header from '../Header/Header';

const SyncDriveFiles = () => {
  const [syncSummary, setSyncSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExistingCollapsed, setIsExistingCollapsed] = useState(true);
  const [isUnsupportedCollapsed, setIsUnsupportedCollapsed] = useState(true);
  const navigate = useNavigate();

  const handleSync = async () => {
    setLoading(true);
    setError(null);
    setSyncSummary(null);

    try {
      const response = await fetch("http://localhost:8000/sync", {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSyncSummary(data);
      } else {
        throw new Error('Failed to sync files.');
      }
    } catch (err) {
      console.error("Error syncing files", err);
      setError(err.message || 'An error occurred while syncing files.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/embed-documents');
  };

  const toggleExistingCollapse = () => {
    setIsExistingCollapsed(!isExistingCollapsed);
  };

  const toggleUnsupportedCollapse = () => {
    setIsUnsupportedCollapsed(!isUnsupportedCollapsed);
  };

  return (
    <div className="sync-files-container">
      <Header width='100%'/>
      <div className='upper-section'>
        <Typography variant="h5" className="section-title" gutterBottom>
          Sync New Files
        </Typography>
        <Button 
          variant="contained" 
          className="sync-button"
          onClick={handleSync}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} style={{ color: '#fff' }} /> : 'Sync'}
        </Button>
      </div>
      {!syncSummary && !loading && !error && (
        <Typography variant="body1" className="no-data-message">
          No synced Data Found. Please click on "Sync" button
        </Typography>
      )}
      {loading && (
        <Box className="loader">
          <CircularProgress style={{ color: '#101010' }}/>
        </Box>
      )}
      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)} 
          sx={{ marginTop: 2, marginBottom: 2 }}
        >
          {error}
        </Alert>
      )}
      {syncSummary && !loading && !error && (
        <>
          <div className="counters">
            <Button variant="outlined" className="counter-button" disabled>
              Attempted {syncSummary.attempted_count || 0}
            </Button>
            <Button variant="outlined" className="counter-button" disabled>
              Downloaded {syncSummary.downloaded_count || 0}
            </Button>
            <Button variant="outlined" className="counter-button" disabled>
              Skipped (Existing) {syncSummary.skipped_existing_count || 0}
            </Button>
            <Button variant="outlined" className="counter-button" disabled>
              Skipped (Unsupported) {syncSummary.skipped_unsupported_count || 0}
            </Button>
            <Button variant="outlined" className="counter-button" disabled>
              Failed {syncSummary.failed_count || 0}
            </Button>
          </div>
          <div className="file-sections">
            {syncSummary.skipped_existing_files?.length > 0 && (
              <div className="file-section">
                <div className="status-header" onClick={toggleExistingCollapse} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" className="section-subtitle" gutterBottom>
                    Skipped (Existing) Files
                  </Typography>
                  <IconButton size="small" aria-label="toggle existing files table">
                    {isExistingCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                  </IconButton>
                </div>
                {!isExistingCollapsed && (
                  <div className="file-table">
                    <div className="table-header">
                      <Typography variant="subtitle2">File Name</Typography>
                    </div>
                    {syncSummary.skipped_existing_files?.length > 0 ? (
                      syncSummary.skipped_existing_files.map((file, index) => (
                        <div key={index} className="file-row" style={{ padding: '5px' }}>
                          <div className="file-info">
                            <img src={documentIcon} alt="File Icon" className="file-icon" />
                            <Typography variant="body1">{file}</Typography>
                          </div>
                        </div>
                      ))
                    ) : (
                      <Typography variant="body2" className="no-files">
                        No files skipped (existing).
                      </Typography>
                    )}
                  </div>
                )}
              </div>
            )}
            {syncSummary.skipped_unsupported_files?.length > 0 && (
              <div className="file-section">
                <div className="status-header" onClick={toggleUnsupportedCollapse} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" className="section-subtitle" gutterBottom>
                    Skipped (Unsupported) Files
                  </Typography>
                  <IconButton size="small" aria-label="toggle unsupported files table">
                    {isUnsupportedCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                  </IconButton>
                </div>
                {!isUnsupportedCollapsed && (
                  <div className="file-table">
                    <div className="table-header">
                      <Typography variant="subtitle2">File Name</Typography>
                    </div>
                    {syncSummary.skipped_unsupported_files?.length > 0 ? (
                      syncSummary.skipped_unsupported_files.map((file, index) => (
                        <div key={index} className="file-row" style={{ padding: '5px' }}>
                          <div className="file-info">
                            <img src={documentIcon} alt="File Icon" className="file-icon" />
                            <Typography variant="body1">{file}</Typography>
                          </div>
                        </div>
                      ))
                    ) : (
                      <Typography variant="body2" className="no-files">
                        No files skipped (unsupported).
                      </Typography>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <Button 
            variant="contained" 
            className="continue-button"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </>
      )}
    </div>
  );
};

export default SyncDriveFiles;