import { 
    // useEffect не используется, удаляем
    // useEffect, 
    useContext 
} from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AppContent = () => {
    // Удаляем неиспользуемые переменные
    // const navigate = useNavigate();
    const { user /*, logout, isAuthenticated */ } = useContext(AuthContext);

    return (
        // ... existing code ...
    );
};

export default AppContent; 