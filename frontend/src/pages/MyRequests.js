import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Card, CardContent, Grid, Button } from '@mui/material';

const MyRequests = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [requests, setRequests] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError(t('please_login'));
                    navigate('/login');
                    return;
                }
                const res = await axios.get('http://localhost:5001/api/services/my-requests', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setRequests(res.data);
            } catch (error) {
                setError('Error fetching requests: ' + (error.response?.data?.error || error.message));
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, [t, navigate]);

    if (loading) {
        return <Typography>{t('loading')}</Typography>;
    }

    if (error) {
        return <Typography color="error">{error}</Typography>;
    }

    return (
        <Box sx={{ padding: 4 }}>
            <Typography variant="h5" gutterBottom>
                {t('my_requests')}
            </Typography>
            {requests.length > 0 ? (
                <Grid container spacing={3}>
                    {requests.map((request) => (
                        <Grid item xs={12} sm={6} md={4} key={request._id}>
                            <Card>
                                <CardContent>
                                    <Typography variant="body1">
                                        <strong>{t('service_type')}:</strong> {t(request.serviceType)}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>{t('location')}:</strong> {request.location}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>{t('description')}:</strong> {request.description}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>{t('status')}:</strong> {request.status}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>{t('created_at')}:</strong>{' '}
                                        {new Date(request.createdAt).toLocaleString()}
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        component={Link}
                                        to={`/chat/${request._id}`}
                                        sx={{ marginTop: 2 }}
                                    >
                                        {t('chat')}
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Typography variant="body1" align="center">
                    {t('no_requests')}
                </Typography>
            )}
        </Box>
    );
};

export default MyRequests;