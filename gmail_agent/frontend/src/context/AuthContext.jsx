import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Create the Authentication Context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);
  const navigate = useNavigate();

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await api.get('/auth/status');
        setAuthenticated(response.data.authenticated);
        
        if (response.data.authenticated) {
          const sessionResponse = await api.get('/auth/session');
          setUserEmail(sessionResponse.data.user_email);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setAuthenticated(false);
        setUserEmail(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Function to upload credentials
  const uploadCredentials = async (credentialsFile) => {
    try {
      setLoading(true);
      const fileData = await readFileAsJson(credentialsFile);
      
      const response = await api.post('/auth/upload-credentials', {
        client_secret: fileData
      });
      
      if (response.data.authenticated) {
        setAuthenticated(true);
        const sessionResponse = await api.get('/auth/session');
        setUserEmail(sessionResponse.data.user_email);
        navigate('/dashboard');
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error uploading credentials:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function to read file as JSON
  const readFileAsJson = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          resolve(json);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  };

  // Function to logout
  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setAuthenticated(false);
      setUserEmail(null);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const value = {
    authenticated,
    loading,
    userEmail,
    uploadCredentials,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
