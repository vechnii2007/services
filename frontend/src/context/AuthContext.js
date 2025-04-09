import React, { createContext, useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Функция для проверки авторизации при загрузке приложения
    const checkAuth = async () => {
        try {
            const res = await axios.get('/users/me');
            setUser(res.data);
        } catch (error) {
            console.error('Error checking auth:', error);
            setUser(null);
            localStorage.removeItem('token'); // Удаляем токен, если он недействителен
        } finally {
            setLoading(false);
        }
    };

    // Проверяем авторизацию при монтировании компонента
    useEffect(() => {
        checkAuth();
    }, []);

    // Функция для выхода
    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};