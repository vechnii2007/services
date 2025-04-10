import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Menu, MenuItem, Box, IconButton, Drawer, List, ListItem, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useTranslation } from 'react-i18next';
import axios from './utils/axiosConfig';
import ServiceRequestForm from './pages/ServiceRequestForm';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import MyRequests from './pages/MyRequests';
import ProviderRequests from './pages/ProviderRequests';
import Chat from './pages/Chat';
import ChatList from './pages/ChatList';
import Offers from './pages/Offers';
import AdminPanel from './pages/AdminPanel';
import OfferDetails from './pages/OfferDetails';
import CreateOffer from './pages/CreateOffer';
import MyOffers from './pages/MyOffers';
import Favorites from './pages/Favorites';
import PaymentDashboard from './pages/PaymentDashboard';
import Notifications from './pages/Notifications'; // Импортируем новый компонент
import RouteGuard from './utils/RouteGuard';

const App = () => {
    const { t, i18n } = useTranslation();
    const [anchorEl, setAnchorEl] = useState(null);
    const [user, setUser] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]); // Состояние для уведомлений
    const isFetchingUser = useRef(false); // Флаг для предотвращения дубликатов
    const isFetchingNotifications = useRef(false); // Флаг для уведомлений

    const handleLanguageMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleLanguageMenuClose = () => {
        setAnchorEl(null);
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        handleLanguageMenuClose();
    };

    const fetchUser = async () => {
        if (isFetchingUser.current) {
            console.log('Fetch user already in progress, skipping...');
            return;
        }

        isFetchingUser.current = true;
        try {
            console.log('Fetching user...');
            setLoading(true);
            const token = localStorage.getItem('token');
            console.log('Token found in localStorage:', token);
            if (!token) {
                console.log('No token found, setting user to null');
                setUser(null);
                return;
            }
            const res = await axios.get('/users/me');
            console.log('User fetched successfully:', res.data);
            setUser(res.data);
        } catch (error) {
            console.error('Error fetching user:', error.response?.data || error.message);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            console.log('Fetch user completed, setting loading to false');
            setLoading(false);
            isFetchingUser.current = false;
        }
    };

    const fetchNotifications = async () => {
        if (isFetchingNotifications.current) {
            console.log('Fetch notifications already in progress, skipping...');
            return;
        }

        isFetchingNotifications.current = true;
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setNotifications([]);
                return;
            }
            const res = await axios.get('/services/notifications', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setNotifications(res.data);
        } catch (error) {
            console.error('Error fetching notifications:', error.response?.data || error.message);
            setNotifications([]);
        } finally {
            isFetchingNotifications.current = false;
        }
    };

    const markNotificationAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            await axios.put(`/services/notifications/${notificationId}/read`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setNotifications((prev) =>
                prev.map((n) =>
                    n._id === notificationId ? { ...n, read: true } : n
                )
            );
        } catch (error) {
            console.error('Error marking notification as read:', error.response?.data || error.message);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []); // Пустой массив зависимостей

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Настраиваем интервал для периодического обновления уведомлений
            const interval = setInterval(fetchNotifications, 30000); // Каждые 30 секунд
            return () => clearInterval(interval); // Очищаем интервал при размонтировании
        } else {
            setNotifications([]);
        }
    }, [user]); // Зависимость от user

    const handleLogout = () => {
        console.log('Logging out...');
        localStorage.removeItem('token');
        setUser(null);
        setNotifications([]); // Очищаем уведомления при выходе
        window.location.href = '/login';
    };

    const toggleDrawer = (open) => () => {
        setDrawerOpen(open);
    };

    const renderMenuForRole = () => {
        if (!user) {
            return [
                { label: t('offers'), path: '/offers' },
            ];
        }

        if (user.role === 'user') {
            return [
                { label: t('offers'), path: '/offers' },
                { label: t('create_request'), path: '/create-request' },
                { label: t('my_requests'), path: '/my-requests' },
                { label: t('favorites'), path: '/favorites' },
                { label: t('chat_list'), path: '/chat-list' },
                { label: t('payment_dashboard'), path: '/payment-dashboard' },
                { label: t('profile'), path: '/profile' },
            ];
        }

        if (user.role === 'provider') {
            return [
                { label: t('offers'), path: '/offers' },
                { label: t('create_offer'), path: '/create-offer' },
                { label: t('my_offers'), path: '/my-offers' },
                { label: t('available_requests'), path: '/provider-requests' },
                { label: t('favorites'), path: '/favorites' },
                { label: t('chat_list'), path: '/chat-list' },
                { label: t('payment_dashboard'), path: '/payment-dashboard' },
                { label: t('profile'), path: '/profile' },
            ];
        }

        if (user.role === 'admin') {
            return [
                { label: t('offers'), path: '/offers' },
                { label: t('create_offer'), path: '/create-offer' },
                { label: t('my_offers'), path: '/my-offers' },
                { label: t('admin_panel'), path: '/admin-panel' },
                { label: t('favorites'), path: '/favorites' },
                { label: t('payment_dashboard'), path: '/payment-dashboard' },
                { label: t('profile'), path: '/profile' },
            ];
        }
    };

    const drawerList = () => (
        <Box
            sx={{ width: 250 }}
            role="presentation"
            onClick={toggleDrawer(false)}
            onKeyDown={toggleDrawer(false)}
        >
            <List>
                {renderMenuForRole().map((item, index) => (
                    <ListItem button key={index} component={Link} to={item.path}>
                        <ListItemText primary={item.label} />
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    if (loading) {
        return <Typography>{t('loading')}</Typography>;
    }

    return (
        <Router>
            <AppBar position="static">
                <Toolbar>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            onClick={toggleDrawer(true)}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Button color="inherit" onClick={handleLanguageMenuOpen}>
                            {t('language')}
                        </Button>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleLanguageMenuClose}
                        >
                            <MenuItem onClick={() => changeLanguage('ru')}>{t('russian')}</MenuItem>
                            <MenuItem onClick={() => changeLanguage('ua')}>{t('ukrainian')}</MenuItem>
                            <MenuItem onClick={() => changeLanguage('es')}>{t('spanish')}</MenuItem>
                        </Menu>
                        {user && (
                            <Notifications
                                notifications={notifications}
                                onMarkAsRead={markNotificationAsRead}
                            />
                        )}
                        {user ? (
                            <Button color="inherit" onClick={handleLogout}>
                                {t('logout')}
                            </Button>
                        ) : (
                            <>
                                <Button color="inherit" component={Link} to="/register">
                                    {t('register')}
                                </Button>
                                <Button color="inherit" component={Link} to="/login">
                                    {t('login')}
                                </Button>
                            </>
                        )}
                    </Box>
                    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                        <Typography variant="h6">
                            {user ? `${t('welcome')}, ${user.name}!` : t('welcome_to_service_portal')}
                        </Typography>
                    </Box>
                </Toolbar>
            </AppBar>
            <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
                {drawerList()}
            </Drawer>
            <Box sx={{ padding: 2 }}>
                <Routes>
                    <Route path="/" element={<Typography>{t('welcome_message')}</Typography>} />
                    <Route path="/offers" element={<Offers />} />
                    <Route path="/offers/:id" element={<OfferDetails />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login onLogin={fetchUser} />} />
                    <Route
                        path="/create-offer"
                        element={
                            <RouteGuard user={user} requiredRole={['provider', 'admin']}>
                                <CreateOffer />
                            </RouteGuard>
                        }
                    />
                    <Route
                        path="/my-offers"
                        element={
                            <RouteGuard user={user} requiredRole={['provider', 'admin']}>
                                <MyOffers />
                            </RouteGuard>
                        }
                    />
                    <Route
                        path="/create-request"
                        element={
                            <RouteGuard user={user} requiredRole="user">
                                <ServiceRequestForm />
                            </RouteGuard>
                        }
                    />
                    <Route
                        path="/my-requests"
                        element={
                            <RouteGuard user={user} requiredRole="user">
                                <MyRequests />
                            </RouteGuard>
                        }
                    />
                    <Route
                        path="/provider-requests"
                        element={
                            <RouteGuard user={user} requiredRole="provider">
                                <ProviderRequests />
                            </RouteGuard>
                        }
                    />
                    <Route
                        path="/chat-list"
                        element={
                            <RouteGuard user={user} requiredRole={['user', 'provider']}>
                                <ChatList />
                            </RouteGuard>
                        }
                    />
                    <Route
                        path="/chat/:requestId"
                        element={
                            <RouteGuard user={user} requiredRole={['user', 'provider']}>
                                <Chat />
                            </RouteGuard>
                        }
                    />
                    <Route
                        path="/favorites"
                        element={
                            <RouteGuard user={user} requiredRole={['user', 'provider', 'admin']}>
                                <Favorites />
                            </RouteGuard>
                        }
                    />
                    <Route
                        path="/payment-dashboard"
                        element={
                            <RouteGuard user={user} requiredRole={['user', 'provider', 'admin']}>
                                <PaymentDashboard />
                            </RouteGuard>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <RouteGuard user={user} requiredRole={['user', 'provider', 'admin']}>
                                <Profile />
                            </RouteGuard>
                        }
                    />
                    <Route
                        path="/admin-panel"
                        element={
                            <RouteGuard user={user} requiredRole="admin">
                                <AdminPanel />
                            </RouteGuard>
                        }
                    />
                </Routes>
            </Box>
        </Router>
    );
};

export default App;