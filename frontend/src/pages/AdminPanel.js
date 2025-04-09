import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    TextField,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
} from '@mui/material';

const AdminPanel = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [tabValue, setTabValue] = useState(0);
    const [users, setUsers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [offers, setOffers] = useState([]);
    const [userFilter, setUserFilter] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('');
    const [requestStatusFilter, setRequestStatusFilter] = useState('');
    const [offerStatusFilter, setOfferStatusFilter] = useState('');

    // Получение данных
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Получение пользователей
                const usersRes = await axios.get('/admin/users');
                setUsers(usersRes.data);

                // Получение запросов
                const requestsRes = await axios.get('/admin/requests');
                setRequests(requestsRes.data);

                // Получение предложений
                const offersRes = await axios.get('/admin/offers');
                setOffers(offersRes.data);
            } catch (error) {
                console.error('Error fetching admin data:', error);
            }
        };
        fetchData();
    }, []);

    // Переключение вкладок
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Управление пользователями
    const handleBlockUser = async (userId) => {
        if (window.confirm(t('confirm_block_user'))) {
            try {
                const res = await axios.patch(`/admin/users/${userId}/status`);
                setUsers(users.map(user => (user._id === userId ? res.data : user)));
            } catch (error) {
                console.error('Error blocking user:', error);
            }
        }
    };

    const handleChangeRole = async (userId, newRole) => {
        try {
            const res = await axios.patch(`/admin/users/${userId}/role`, { role: newRole });
            setUsers(users.map(user => (user._id === userId ? res.data : user)));
        } catch (error) {
            console.error('Error changing role:', error);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm(t('confirm_delete_user'))) {
            try {
                await axios.delete(`/admin/users/${userId}`);
                setUsers(users.filter(user => user._id !== userId));
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    // Управление запросами
    const handleChangeRequestStatus = async (requestId, newStatus) => {
        try {
            const res = await axios.patch(`/admin/requests/${requestId}/status`, { status: newStatus });
            setRequests(requests.map(request => (request._id === requestId ? res.data : request)));
        } catch (error) {
            console.error('Error changing request status:', error);
        }
    };

    const handleDeleteRequest = async (requestId) => {
        if (window.confirm(t('confirm_delete_request'))) {
            try {
                await axios.delete(`/admin/requests/${requestId}`);
                setRequests(requests.filter(request => request._id !== requestId));
            } catch (error) {
                console.error('Error deleting request:', error);
            }
        }
    };

    // Управление предложениями
    const handleChangeOfferStatus = async (offerId, newStatus, type) => {
        try {
            const res = await axios.patch(`/admin/offers/${offerId}/status`, { status: newStatus, type });
            setOffers(offers.map(offer => (offer._id === offerId ? res.data : offer)));
        } catch (error) {
            console.error('Error changing offer status:', error);
        }
    };

    const handleDeleteOffer = async (offerId, type) => {
        if (window.confirm(t('confirm_delete_offer'))) {
            try {
                await axios.delete(`/admin/offers/${offerId}`, { data: { type } });
                setOffers(offers.filter(offer => offer._id !== offerId));
            } catch (error) {
                console.error('Error deleting offer:', error);
            }
        }
    };

    // Фильтрация пользователей
    const filteredUsers = users.filter(user => {
        const matchesSearch = userFilter
            ? user.name.toLowerCase().includes(userFilter.toLowerCase()) ||
            user.email.toLowerCase().includes(userFilter.toLowerCase())
            : true;
        const matchesRole = userRoleFilter ? user.role === userRoleFilter : true;
        return matchesSearch && matchesRole;
    });

    // Фильтрация запросов
    const filteredRequests = requests.filter(request => {
        return requestStatusFilter ? request.status === requestStatusFilter : true;
    });

    // Фильтрация предложений
    const filteredOffers = offers.filter(offer => {
        return offerStatusFilter ? offer.status === offerStatusFilter : true;
    });

    return (
        <Box sx={{ padding: 4 }}>
            <Typography variant="h4" gutterBottom>
                {t('admin_panel')}
            </Typography>

            {/* Вкладки */}
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ marginBottom: 4 }}>
                <Tab label={t('users')} />
                <Tab label={t('requests')} />
                <Tab label={t('offers')} />
            </Tabs>

            {/* Вкладка: Пользователи */}
            {tabValue === 0 && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        {t('users')}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                        <TextField
                            label={t('search_by_name_or_email')}
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value)}
                            variant="outlined"
                            sx={{ width: 300 }}
                        />
                        <FormControl sx={{ width: 200 }}>
                            <InputLabel>{t('role')}</InputLabel>
                            <Select
                                value={userRoleFilter}
                                onChange={(e) => setUserRoleFilter(e.target.value)}
                                label={t('role')}
                            >
                                <MenuItem value="">{t('all')}</MenuItem>
                                <MenuItem value="user">{t('user')}</MenuItem>
                                <MenuItem value="provider">{t('provider')}</MenuItem>
                                <MenuItem value="admin">{t('admin')}</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>{t('name')}</TableCell>
                                    <TableCell>{t('email')}</TableCell>
                                    <TableCell>{t('role')}</TableCell>
                                    <TableCell>{t('status')}</TableCell>
                                    <TableCell>{t('created_at')}</TableCell>
                                    <TableCell>{t('actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredUsers.map(user => (
                                    <TableRow key={user._id}>
                                        <TableCell>{user._id}</TableCell>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Select
                                                value={user.role}
                                                onChange={(e) => handleChangeRole(user._id, e.target.value)}
                                            >
                                                <MenuItem value="user">{t('user')}</MenuItem>
                                                <MenuItem value="provider">{t('provider')}</MenuItem>
                                                <MenuItem value="admin">{t('admin')}</MenuItem>
                                            </Select>
                                        </TableCell>
                                        <TableCell>{user.status}</TableCell>
                                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                color={user.status === 'active' ? 'error' : 'success'}
                                                onClick={() => handleBlockUser(user._id)}
                                                sx={{ marginRight: 1 }}
                                            >
                                                {user.status === 'active' ? t('block') : t('unblock')}
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="error"
                                                onClick={() => handleDeleteUser(user._id)}
                                            >
                                                {t('delete')}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* Вкладка: Запросы */}
            {tabValue === 1 && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        {t('requests')}
                    </Typography>
                    <Box sx={{ marginBottom: 2 }}>
                        <FormControl sx={{ width: 200 }}>
                            <InputLabel>{t('status')}</InputLabel>
                            <Select
                                value={requestStatusFilter}
                                onChange={(e) => setRequestStatusFilter(e.target.value)}
                                label={t('status')}
                            >
                                <MenuItem value="">{t('all')}</MenuItem>
                                <MenuItem value="pending">{t('pending')}</MenuItem>
                                <MenuItem value="accepted">{t('accepted')}</MenuItem>
                                <MenuItem value="completed">{t('completed')}</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>{t('user')}</TableCell>
                                    <TableCell>{t('service_type')}</TableCell>
                                    <TableCell>{t('description')}</TableCell>
                                    <TableCell>{t('status')}</TableCell>
                                    <TableCell>{t('created_at')}</TableCell>
                                    <TableCell>{t('actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRequests.map(request => (
                                    <TableRow key={request._id}>
                                        <TableCell>{request._id}</TableCell>
                                        <TableCell>{request.userId?.name || 'Unknown'}</TableCell>
                                        <TableCell>{t(request.serviceType)}</TableCell>
                                        <TableCell>{request.description}</TableCell>
                                        <TableCell>
                                            <Select
                                                value={request.status}
                                                onChange={(e) => handleChangeRequestStatus(request._id, e.target.value)}
                                            >
                                                <MenuItem value="pending">{t('pending')}</MenuItem>
                                                <MenuItem value="accepted">{t('accepted')}</MenuItem>
                                                <MenuItem value="completed">{t('completed')}</MenuItem>
                                            </Select>
                                        </TableCell>
                                        <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                color="error"
                                                onClick={() => handleDeleteRequest(request._id)}
                                            >
                                                {t('delete')}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* Вкладка: Предложения */}
            {tabValue === 2 && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        {t('offers')}
                    </Typography>
                    <Box sx={{ marginBottom: 2 }}>
                        <FormControl sx={{ width: 200 }}>
                            <InputLabel>{t('status')}</InputLabel>
                            <Select
                                value={offerStatusFilter}
                                onChange={(e) => setOfferStatusFilter(e.target.value)}
                                label={t('status')}
                            >
                                <MenuItem value="">{t('all')}</MenuItem>
                                <MenuItem value="active">{t('active')}</MenuItem>
                                <MenuItem value="inactive">{t('inactive')}</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>{t('service_type')}</TableCell>
                                    <TableCell>{t('description')}</TableCell>
                                    <TableCell>{t('price')}</TableCell>
                                    <TableCell>{t('location')}</TableCell>
                                    <TableCell>{t('status')}</TableCell>
                                    <TableCell>{t('created_at')}</TableCell>
                                    <TableCell>{t('actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredOffers.map(offer => (
                                    <TableRow key={offer._id}>
                                        <TableCell>{offer._id}</TableCell>
                                        <TableCell>{t(offer.serviceType)}</TableCell>
                                        <TableCell>{offer.description}</TableCell>
                                        <TableCell>{offer.price}</TableCell>
                                        <TableCell>{offer.location}</TableCell>
                                        <TableCell>
                                            <Select
                                                value={offer.status}
                                                onChange={(e) => handleChangeOfferStatus(offer._id, e.target.value, offer.type || (offer.providerId ? 'Offer' : 'Service'))}
                                            >
                                                <MenuItem value="active">{t('active')}</MenuItem>
                                                <MenuItem value="inactive">{t('inactive')}</MenuItem>
                                            </Select>
                                        </TableCell>
                                        <TableCell>{new Date(offer.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                color="error"
                                                onClick={() => handleDeleteOffer(offer._id, offer.type || (offer.providerId ? 'Offer' : 'Service'))}
                                            >
                                                {t('delete')}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
        </Box>
    );
};

export default AdminPanel;