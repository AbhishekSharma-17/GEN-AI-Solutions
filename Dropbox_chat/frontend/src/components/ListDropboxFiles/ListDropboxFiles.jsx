/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Typography, Button, CircularProgress, Box } from '@mui/material';
import './ListDropboxFiles.css'
import { useDispatch, useSelector } from 'react-redux';
import documentIcon from '../../assets/documentIcon.png';
import { useNavigate } from 'react-router-dom';
import { setShowDropboxFiles, setDropboxFiles } from '../../store/dropboxSlice';
import Loader from '../commonComponents/Loader/Loader';

const ListDriveFiles = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filesData, setFilesData] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dropboxFiles = useSelector((state) => state.dropbox.dropboxFiles);

  const fetchDropboxFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/list_files', {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch drive files');
      }
      const data = await response.json();
      dispatch(setShowDropboxFiles(data || []));
      dispatch(setDropboxFiles(data.entries || []));
      setFilesData(data);
    } catch (err) {
      setError('Error loading files from Drive.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dropboxFiles.length === 0) {
      fetchDropboxFiles();
    }
  }, [dropboxFiles]);

  const totalItems = dropboxFiles.length;
  const folders = filesData?.folders_count;
  const filesCount = filesData?.files_count;

  const handleContinue = () => {
    navigate('/sync-files');
  };

  return (
    <div className="drive-files-container">
      {loading ? (
        <Box className="loader">
          <Loader loadingText='Loading...' showLoadingText/>
        </Box>
      ) : error ? (
        <Typography variant="body1" className="error-message">
          {error}
        </Typography>
      ) : (
        <>
          <Typography variant="h5" className="section-title" gutterBottom>
            Below files found in Dropbox
          </Typography>
          <div className="counters">
            <span className="counter-button" disabled>
              <Typography variant="body1">Total Items {totalItems}</Typography>
            </span>
          </div>
          <div className="file-table">
            <div className="table-header">
              <Typography variant="subtitle1">File Name</Typography>
            </div>
            <div className="table-scroll-container">
              {dropboxFiles.map((file, index) => (
                <div key={index} className="file-row" style={{ padding: '10px' }}>
                  <div className="file-info">
                    <img src={documentIcon} alt="File Icon" className="file-icon" />
                    <Typography variant="body1" className="file-title">
                      {file.name}
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Button variant="contained" className="continue-button" onClick={handleContinue}>
            Continue
          </Button>
        </>
      )}
    </div>
  );
};

export default ListDriveFiles;