import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Check if user is authenticated and has admin role
  if (!isAuthenticated || user?.role !== 'admin') {
    // Redirect to login if not authenticated, or to dashboard if not admin
    return <Navigate to={isAuthenticated ? '/' : '/admin/login'} state={{ from: location }} replace />;
  }

  return children;
};

export default AdminProtectedRoute;
