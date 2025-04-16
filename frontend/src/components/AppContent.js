import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import SideMenu from '../components/SideMenu';
import Notifications from '../pages/Notifications';
import UserService from '../services/UserService';
import NotificationService from '../services/NotificationService';
import RouteGuard from '../utils/RouteGuard';
import { routesConfig } from '../utils/routesConfig';
import { NOTIFICATION_INTERVAL } from '../utils/constants';

const AppContent = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const isFetchingUser = useRef(false);

    useEffect(() => {
        const fetchUser = async () => {
            if (isFetchingUser.current) return;

            isFetchingUser.current = true;
            setLoading(true);

            try {
                const userData = await UserService.fetchUser();
                setUser(userData);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
                isFetchingUser.current = false;
            }
        };

        fetchUser();
    }, []);

    useEffect(() => {
        if (user) {
            NotificationService.fetchNotifications().then(setNotifications);
            const interval = setInterval(
                () => NotificationService.fetchNotifications().then(setNotifications),
                NOTIFICATION_INTERVAL
            );
            return () => clearInterval(interval);
        } else {
            setNotifications([]);
        }
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setNotifications([]);
        navigate('/login');
    };

    const toggleDrawer = (open) => () => {
        setDrawerOpen(open);
    };

    if (loading) {
        return <Typography>{t('loading')}</Typography>;
    }

    return (
        <>
            <Header
                user={user}
                notifications={notifications}
                onLogout={handleLogout}
                onToggleDrawer={toggleDrawer(true)}
                onMarkNotificationAsRead={(id) =>
                    NotificationService.markNotificationAsRead(id).then(() =>
                        setNotifications((prev) =>
                            prev.map((n) => (n._id === id ? { ...n, read: true } : n))
                        )
                    )
                }
            />
            <SideMenu
                open={drawerOpen}
                onClose={toggleDrawer(false)}
                user={user}
            />
            <Routes>
                <Route path="/" element={<Typography>{t('welcome_message')}</Typography>} />
                {routesConfig.map(({ path, element, requiredRole }) => (
                    <Route
                        key={path}
                        path={path}
                        element={
                            requiredRole ? (
                                <RouteGuard user={user} requiredRole={requiredRole}>
                                    {element}
                                </RouteGuard>
                            ) : (
                                element
                            )
                        }
                    />
                ))}
            </Routes>
        </>
    );
};

export default AppContent;