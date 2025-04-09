import React from 'react';
import { Navigate } from 'react-router-dom';

const RouteGuard = ({ children, user, requiredRole }) => {
    console.log('RouteGuard: Checking user:', user);
    console.log('RouteGuard: Required role:', requiredRole);

    if (!user) {
        console.log('RouteGuard: No user, redirecting to /login');
        return <Navigate to="/login" replace />;
    }

    if (requiredRole) {
        if (Array.isArray(requiredRole)) {
            if (!requiredRole.includes(user.role)) {
                console.log(`RouteGuard: User role ${user.role} does not match required roles ${requiredRole}, redirecting to /`);
                return <Navigate to="/" replace />;
            }
        } else {
            if (user.role !== requiredRole) {
                console.log(`RouteGuard: User role ${user.role} does not match required role ${requiredRole}, redirecting to /`);
                return <Navigate to="/" replace />;
            }
        }
    }

    console.log('RouteGuard: Access granted');
    return children;
};

export default RouteGuard;