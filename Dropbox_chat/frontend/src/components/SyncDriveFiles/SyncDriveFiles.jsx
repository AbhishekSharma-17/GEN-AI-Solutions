import React, { useState, useEffect } from 'react';
import { Typography, Button, CircularProgress, Box, IconButton, Alert } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useDispatch, useSelector } from 'react-redux';
import './SyncDriveFiles.css';
import documentIcon from '../../assets/documentIcon.png';
import { useNavigate } from 'react-router-dom';
import { setSyncFiles, setSyncDocumentsLoader } from '../../store/syncSlice';
import Loader from '../commonComponents/Loader/Loader';

const SyncDriveFiles = () => {
  const [error, setError] = useState(null);
  const [isExistingCollapsed, setIsExistingCollapsed] = useState(false);
  const [isUnsupportedCollapsed, setIsUnsupportedCollapsed] = useState(true);
  const [isDownloadedCollapsed, setIsDownloadedCollapsed] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const syncFiles = useSelector((state) => state.sync.syncFiles);
  const syncDocumentsLoader = useSelector((state) => state.sync.syncDocumentsLoader);


  // Dynamically set collapse states based on syncFiles
  useEffect(() => {
    if (syncFiles && Object.keys(syncFiles).length !== 0) {
      setIsDownloadedCollapsed(syncFiles.downloaded_files?.length > 0);
      const hasSkippedExisting = syncFiles.skipped_existing_files?.length > 0;
      setIsUnsupportedCollapsed(hasSkippedExisting);
    }
  }, [syncFiles]);

  const handleSync = async () => {
    dispatch(setSyncDocumentsLoader(true));
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/sync", {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        dispatch(setSyncFiles(data));
      } else {
        throw new Error('Failed to sync files.');
      }
    } catch (err) {
      console.error("Error syncing files", err);
      setError(err.message || 'An error occurred while syncing files.');
    } finally {
      dispatch(setSyncDocumentsLoader(false));
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

  const toggleDownloadedCollapse = () => {
    setIsDownloadedCollapsed(!isDownloadedCollapsed);
  };

  return (
    <div className="sync-files-container">
      <div className="upper-section">
        <Typography variant="h5" className="section-title" gutterBottom>
          Sync New Files
        </Typography>
        <Button
          variant="contained"
          className="sync-button"
          onClick={handleSync}
          disabled={syncDocumentsLoader}
        >
          {syncDocumentsLoader ? <CircularProgress size={24} style={{ color: '#fff' }} /> : 'Sync'}
        </Button>
      </div>
      {(!syncFiles || (Object.keys(syncFiles).length === 0)) && !syncDocumentsLoader && !error && (
        <Typography variant="body1" className="no-data-message">
          No synced Data Found. Please click on "<span className="bold-text">Sync</span>" button.
        </Typography>
      )}
      {syncDocumentsLoader && (
        <Box className="loader">
          <Loader loadingText="Syncing..." showLoadingText/>
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
      {syncFiles && Object.keys(syncFiles).length !== 0 && !syncDocumentsLoader && !error && (
        <>
          <div className="counters">
            <span className="counter-button" disabled>
              <Typography variant="body1">Attempted {syncFiles.attempted_count || 0}</Typography>
            </span>
           <span className="counter-button" disabled>
                          <Typography variant="body1">Downloaded {syncFiles.downloaded_count || 0}</Typography>
            </span>
             <span className="counter-button" disabled>
                            <Typography variant="body1">Skipped (Existing) {syncFiles.skipped_existing_count || 0}</Typography>
            </span>
             <span className="counter-button" disabled>
                            <Typography variant="body1">Skipped (Unsupported) {syncFiles.skipped_unsupported_count || 0}</Typography>
            </span>
           <span className="counter-button" disabled>
                          <Typography variant="body1">Failed {syncFiles.failed_count || 0}</Typography>
            </span>
          </div>
          <div className="file-sections">
            {syncFiles.downloaded_files?.length > 0 && (
              <div className="file-section">
                <div
                  className="status-header"
                  onClick={toggleDownloadedCollapse}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Typography variant="subtitle1" className="section-subtitle" gutterBottom>
                    Downloaded Files
                  </Typography>
                  <IconButton size="small" aria-label="toggle downloaded files table">
                    {isDownloadedCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                  </IconButton>
                </div>
                {!isDownloadedCollapsed && (
                  <div className="file-table">
                    <div className="table-header">
                      <Typography variant="subtitle2">File Name</Typography>
                    </div>
                    <div className="table-scroll-container">
                      {syncFiles.downloaded_files?.length > 0 ? (
                        syncFiles.downloaded_files.map((file, index) => (
                          <div key={index} className="file-row">
                            <div className="file-info">
                              <img src={documentIcon} alt="File Icon" className="file-icon" />
                              <Typography variant="body1">{file}</Typography>
                            </div>
                          </div>
                        ))
                      ) : (
                        <Typography variant="body2" className="no-files">
                          No files downloaded.
                        </Typography>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {syncFiles.skipped_existing_files?.length > 0 && (
              <div className="file-section">
                <div
                  className="status-header"
                  onClick={toggleExistingCollapse}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
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
                    <div className="table-scroll-container">
                      {syncFiles.skipped_existing_files?.length > 0 ? (
                        syncFiles.skipped_existing_files.map((file, index) => (
                          <div key={index} className="file-row">
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
                  </div>
                )}
              </div>
            )}
            {syncFiles.skipped_unsupported_files?.length > 0 && (
              <div className="file-section" style={{ marginBottom: '0' }}>
                <div
                  className="status-header"
                  onClick={toggleUnsupportedCollapse}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
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
                    <div className="table-scroll-container">
                      {syncFiles.skipped_unsupported_files?.length > 0 ? (
                        syncFiles.skipped_unsupported_files.map((file, index) => (
                          <div key={index} className="file-row">
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
                  </div>
                )}
              </div>
            )}
          </div>
          <Button variant="contained" className="continue-button" onClick={handleContinue}>
            Continue
          </Button>
        </>
      )}
    </div>
  );
};

export default SyncDriveFiles;