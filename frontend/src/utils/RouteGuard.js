import React from 'react';
import { Navigate } from 'react-router-dom';

const RouteGuard = ({ children, user, requiredRole }) => {
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole) {
        if (Array.isArray(requiredRole)) {
            if (!requiredRole.includes(user.role)) {
                return <Navigate to="/" replace />;
            }
        } else {
            if (user.role !== requiredRole) {
                return <Navigate to="/" replace />;
            }
        }
    }

    return children;
};

export default RouteGuard;