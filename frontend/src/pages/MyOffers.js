import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';

const MyOffers = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [currentOffer, setCurrentOffer] = useState(null);
    const [formData, setFormData] = useState({
        serviceType: '',
        location: '',
        description: '',
        price: '',
        image: null,
    });

    useEffect(() => {
        const fetchMyOffers = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setMessage(t('please_login'));
                    navigate('/login');
                    return;
                }

                const res = await axios.get('http://localhost:5001/api/services/my-offers', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setOffers(res.data);
                setMessage(t('offers_loaded'));
            } catch (error) {
                setMessage('Error: ' + (error.response?.data?.error || t('something_went_wrong')));
                if (error.response?.status === 401 || error.response?.status === 403) {
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchMyOffers();
    }, [t, navigate]);

    const handleEditOpen = (offer) => {
        setCurrentOffer(offer);
        setFormData({
            serviceType: offer.serviceType,
            location: offer.location,
            description: offer.description,
            price: offer.price,
            image: null,
        });
        setEditDialogOpen(true);
    };

    const handleEditClose = () => {
        setEditDialogOpen(false);
        setCurrentOffer(null);
        setFormData({
            serviceType: '',
            location: '',
            description: '',
            price: '',
            image: null,
        });
    };

    const handleEditChange = (e) => {
        if (e.target.name === 'image') {
            setFormData({ ...formData, image: e.target.files[0] });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleEditSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            data.append('serviceType', formData.serviceType);
            data.append('location', formData.location);
            data.append('description', formData.description);
            data.append('price', formData.price);
            if (formData.image) {
                data.append('image', formData.image);
            }

            const res = await axios.put(
                `http://localhost:5001/api/services/offers/${currentOffer._id}`,
                data,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            setOffers(offers.map((offer) =>
                offer._id === currentOffer._id ? res.data : offer
            ));
            setMessage(t('offer_updated'));
            handleEditClose();
        } catch (error) {
            setMessage('Error: ' + (error.response?.data?.error || t('something_went_wrong')));
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        }
    };

    const handleDelete = async (offerId) => {
        if (!window.confirm(t('confirm_delete_offer'))) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5001/api/services/offers/${offerId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setOffers(offers.filter((offer) => offer._id !== offerId));
            setMessage(t('offer_deleted'));
        } catch (error) {
            setMessage('Error: ' + (error.response?.data?.error || t('something_went_wrong')));
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        }
    };

    if (loading) {
        return <Typography>{t('loading')}</Typography>;
    }

    return (
        <Box sx={{ paddingY: 4 }}>
            <Typography variant="h5" gutterBottom>
                {t('my_offers')}
            </Typography>
            {message && (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ marginBottom: 2 }}>
                    {message}
                </Typography>
            )}

            {offers.length > 0 ? (
                <Grid container spacing={3}>
                    {offers.map((offer) => (
                        <Grid item xs={12} sm={6} md={4} key={offer._id}>
                            <Card>
                                <CardContent>
                                    <Typography variant="body1">
                                        <strong>{t('service_type')}:</strong> {t(offer.serviceType)}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>{t('location')}:</strong> {offer.location}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>{t('description')}:</strong> {offer.description}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>{t('price')}:</strong> {offer.price}
                                    </Typography>
                                    {offer.image && (
                                        <Typography variant="body1">
                                            <strong>{t('image')}:</strong> <img src={offer.image} alt="Offer" style={{ width: '100px' }} />
                                        </Typography>
                                    )}
                                    <Box sx={{ marginTop: 2 }}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleEditOpen(offer)}
                                            sx={{ marginRight: 1 }}
                                        >
                                            {t('edit')}
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            onClick={() => handleDelete(offer._id)}
                                        >
                                            {t('delete')}
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Typography variant="body1" align="center">
                    {t('no_offers')}
                </Typography>
            )}

            {/* Диалог для редактирования */}
            <Dialog open={editDialogOpen} onClose={handleEditClose}>
                <DialogTitle>{t('edit_offer')}</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ marginBottom: 2, marginTop: 2 }}>
                        <InputLabel>{t('service_type')}</InputLabel>
                        <Select
                            name="serviceType"
                            value={formData.serviceType}
                            onChange={handleEditChange}
                            label={t('service_type')}
                            required
                        >
                            <MenuItem value="translation">{t('translation')}</MenuItem>
                            <MenuItem value="legal">{t('legal')}</MenuItem>
                            <MenuItem value="real_estate">{t('real_estate')}</MenuItem>
                            <MenuItem value="healthcare">{t('healthcare')}</MenuItem>
                            <MenuItem value="education">{t('education')}</MenuItem>
                            <MenuItem value="cultural_events">{t('cultural_events')}</MenuItem>
                            <MenuItem value="finance">{t('finance')}</MenuItem>
                            <MenuItem value="transport">{t('transport')}</MenuItem>
                            <MenuItem value="household">{t('household')}</MenuItem>
                            <MenuItem value="shopping">{t('shopping')}</MenuItem>
                            <MenuItem value="travel">{t('travel')}</MenuItem>
                            <MenuItem value="psychology">{t('psychology')}</MenuItem>
                            <MenuItem value="plumbing">{t('plumbing')}</MenuItem>
                            <MenuItem value="massage">{t('massage')}</MenuItem>
                            <MenuItem value="cleaning">{t('cleaning')}</MenuItem>
                            <MenuItem value="taro">{t('taro')}</MenuItem>
                            <MenuItem value="evacuation">{t('evacuation')}</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        label={t('location')}
                        name="location"
                        value={formData.location}
                        onChange={handleEditChange}
                        fullWidth
                        required
                        sx={{ marginBottom: 2 }}
                    />
                    <TextField
                        label={t('description')}
                        name="description"
                        value={formData.description}
                        onChange={handleEditChange}
                        fullWidth
                        multiline
                        rows={4}
                        required
                        sx={{ marginBottom: 2 }}
                    />
                    <TextField
                        label={t('price')}
                        name="price"
                        type="number"
                        value={formData.price}
                        onChange={handleEditChange}
                        fullWidth
                        required
                        sx={{ marginBottom: 2 }}
                    />
                    <TextField
                        label={t('image')}
                        name="image"
                        type="file"
                        onChange={handleEditChange}
                        fullWidth
                        sx={{ marginBottom: 2 }}
                        InputLabelProps={{ shrink: true }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleEditClose} color="secondary">
                        {t('cancel')}
                    </Button>
                    <Button onClick={handleEditSubmit} color="primary">
                        {t('save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MyOffers;