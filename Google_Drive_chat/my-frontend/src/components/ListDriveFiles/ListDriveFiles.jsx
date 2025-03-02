import React, { useState, useEffect } from 'react';
import { Typography, Button, CircularProgress, Box } from '@mui/material';
import './ListDriveFiles.css';
import documentIcon from '../../assets/documentIcon.png';
import { useNavigate } from 'react-router-dom';
import Header from '../Header/Header';

const ListDriveFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filesData, setFilesData] = useState(null);
const navigate = useNavigate(); 

  const fetchDriveFiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/list_drive', {
          method: 'GET',
          credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch drive files');
      }
      const data = await response.json();
        setFiles(data.files || []);
        setFilesData(data);
    } catch (err) {
      setError('Error loading files from Drive.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriveFiles();
  }, []);

  const totalItems = files.length;
  const folders = filesData?.folders_count;
  const filesCount = filesData?.files_count;

  const handleContinue = () => {
    navigate('/sync-files');
  };

  return (
    <div className="drive-files-container">
      <Header width='100%' />
      {loading ? (
        <Box className="loader">
          <CircularProgress />
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
            <Button variant="outlined" className="counter-button" disabled>
              Total Items {totalItems}
            </Button>
            <Button variant="outlined" className="counter-button" disabled>
              Folders {folders}
            </Button>
            <Button variant="outlined" className="counter-button" disabled>
              Files {filesCount}
            </Button>
          </div>
          <div className="file-table">
            <div className="table-header">
              <Typography variant="subtitle1">File Name</Typography>
              <Typography variant="subtitle1" style={{ textAlign: 'right', marginRight: '28px'}}>Link</Typography>
            </div>
            {files.map((file, index) => (
              <div key={index} className="file-row" style={{ padding: '5px 10px' }}>
                <div className="file-info">
                  <img src={documentIcon} alt="File Icon" className="file-icon" />
                  <Typography variant="body1">{file.name}</Typography>
                </div>
                <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
                  <Button variant="text" className="view-button">
                    View
                  </Button>
                </a>
              </div>
            ))}
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

export default ListDriveFiles;