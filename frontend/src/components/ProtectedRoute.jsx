import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="view"><div className="panel pad">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;