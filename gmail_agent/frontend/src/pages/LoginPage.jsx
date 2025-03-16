import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: var(--secondary-color);
`;

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  padding: 2rem;
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 2rem;

  h1 {
    color: var(--primary-color);
    margin: 0.5rem 0;
    font-size: 2.5rem;
  }

  svg {
    width: 50px;
    height: 50px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Title = styled.h2`
  color: var(--text-color);
  margin: 0;
  margin-bottom: 1rem;
  text-align: center;
`;

const FileUploadBox = styled.div`
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary-color);
  }

  input {
    display: none;
  }

  p {
    margin: 0.5rem 0;
    color: var(--light-text);
  }
`;

const Button = styled.button`
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #0256b4;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #d32f2f;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const EnvelopeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0366D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 7l-10 7-10-7" />
  </svg>
);

const LoginPage = () => {
  const { authenticated, uploadCredentials } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (authenticated) {
      navigate('/dashboard');
    }
  }, [authenticated, navigate]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a client secret JSON file.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      const success = await uploadCredentials(file);
      
      if (!success) {
        setError('Failed to authenticate with the provided credentials. Please check your client secret file.');
      }
    } catch (err) {
      console.error('Error uploading credentials:', err);
      setError('An error occurred while uploading credentials. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <LoginContainer>
      <Card>
        <Logo>
          <EnvelopeIcon />
          <h1>Gmail Agent</h1>
        </Logo>
        
        <Form onSubmit={handleSubmit}>
          <Title>Upload Gmail Credentials</Title>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <FileUploadBox
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <input 
              id="fileInput"
              type="file"
              onChange={handleFileChange}
              accept=".json"
            />
            <UploadIcon />
            <h3>
              {file ? file.name : 'Click or drag to upload client secret'}
            </h3>
            <p>Please upload your Gmail client_secret.json file</p>
          </FileUploadBox>
          
          <Button 
            type="submit" 
            disabled={!file || isUploading}
          >
            {isUploading ? 'Authenticating...' : 'Authenticate'}
          </Button>
          
          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--light-text)' }}>
            Need help? <a href="https://developers.google.com/gmail/api/quickstart/js" target="_blank" rel="noopener noreferrer">Learn how to get your client secret</a>
          </p>
        </Form>
      </Card>
    </LoginContainer>
  );
};

export default LoginPage;
