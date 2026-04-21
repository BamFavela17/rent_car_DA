import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ user, children, allowedRoles }) => {
  if (!user) {
    // Si no hay usuario, redirigir al login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.cargo)) {
    // Si el rol no está permitido, redirigir al catálogo
    return <Navigate to="/catalog" replace />;
  }

  return children;
};

export default ProtectedRoute;