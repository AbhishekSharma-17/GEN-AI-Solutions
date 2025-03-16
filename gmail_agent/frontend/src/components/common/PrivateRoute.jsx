import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * PrivateRoute component
 * Protects routes that require authentication
 * Redirects to login page if user is not authenticated
 */
const PrivateRoute = ({ children }) => {
  const { authenticated, loading } = useAuth();

  // Show loading spinner while checking auth status
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // Redirect to login if not authenticated
  if (!authenticated) {
    return <Navigate to="/" replace />;
  }

  // Render the protected component if authenticated
  return children;
};

export default PrivateRoute;
