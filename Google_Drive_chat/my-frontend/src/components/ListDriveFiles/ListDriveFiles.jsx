/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Typography, Button, CircularProgress, Box } from '@mui/material';
import './ListDriveFiles.css';
import { useDispatch, useSelector } from 'react-redux';
import documentIcon from '../../assets/documentIcon.png';
import { useNavigate } from 'react-router-dom';
import { setDriveFiles } from '../../store/driveSlice';
import Loader from '../commonComponents/Loader/Loader';

const ListDriveFiles = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filesData, setFilesData] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const driveFiles = useSelector((state) => state.drive.driveFiles);

  const fetchDriveFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/list_drive', {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch drive files');
      }
      const data = await response.json();
      dispatch(setDriveFiles(data.files || []));
      setFilesData(data);
    } catch (err) {
      setError('Error loading files from Drive.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (driveFiles.length === 0) {
      fetchDriveFiles();
    }
  }, [driveFiles]);

  const totalItems = driveFiles.length;
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
            Below files found in Drive
          </Typography>
          <div className="counters">
            <span className="counter-button" disabled>
              <Typography variant="body1">Total Items {totalItems}</Typography>
            </span>
            <span className="counter-button" disabled>
              <Typography variant="body1">Folders {folders}</Typography>
            </span>
            <span className="counter-button" disabled>
              <Typography variant="body1">Files {filesCount}</Typography>
            </span>
          </div>
          <div className="file-table">
            <div className="table-header">
              <Typography variant="subtitle1">File Name</Typography>
              <Typography variant="subtitle1" className="headerText">
                Link
              </Typography>
            </div>
            <div className="table-scroll-container">
              {driveFiles.map((file, index) => (
                <div key={index} className="file-row" style={{ padding: '5px 10px' }}>
                  <div className="file-info">
                    <img src={documentIcon} alt="File Icon" className="file-icon" />
                    <Typography variant="body1" className="file-title">
                      {file.name}
                    </Typography>
                  </div>
                  <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="text" className="view-button">
                      View
                    </Button>
                  </a>
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