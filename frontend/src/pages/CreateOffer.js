import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    TextField,
    Select,
    MenuItem,
    Button,
    FormControl,
    InputLabel,
    Card,
    CardContent,
} from '@mui/material';

const CreateOffer = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        serviceType: '',
        location: '',
        description: '',
        price: '',
        image: null,
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        setFormData({ ...formData, image: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMessage(t('please_login'));
                navigate('/login');
                return;
            }

            const data = new FormData();
            data.append('serviceType', formData.serviceType);
            data.append('location', formData.location);
            data.append('description', formData.description);
            data.append('price', formData.price);
            if (formData.image) {
                data.append('image', formData.image);
            }

            const res = await axios.post(
                'http://localhost:5001/api/services/offers',
                data,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            setMessage(t('offer_created'));
            setFormData({
                serviceType: '',
                location: '',
                description: '',
                price: '',
                image: null,
            });
            setTimeout(() => navigate('/offers'), 2000);
        } catch (error) {
            if (error.response) {
                setMessage('Error: ' + (error.response.data.error || t('something_went_wrong')));
                if (error.response.status === 401 || error.response.status === 403) {
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            } else if (error.request) {
                setMessage(t('no_response_from_server'));
            } else {
                setMessage('Error: ' + error.message);
            }
        }
    };

    return (
        <Box sx={{ paddingY: 4 }}>
            <Typography variant="h5" gutterBottom>
                {t('create_offer')}
            </Typography>
            {message && (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ marginBottom: 2 }}>
                    {message}
                </Typography>
            )}
            <Card>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <FormControl fullWidth sx={{ marginBottom: 2 }}>
                            <InputLabel>{t('service_type')}</InputLabel>
                            <Select
                                name="serviceType"
                                value={formData.serviceType}
                                onChange={handleChange}
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
                            </Select>
                        </FormControl>
                        <TextField
                            label={t('location')}
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            fullWidth
                            required
                            sx={{ marginBottom: 2 }}
                        />
                        <TextField
                            label={t('description')}
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
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
                            onChange={handleChange}
                            fullWidth
                            required
                            sx={{ marginBottom: 2 }}
                        />
                        <TextField
                            label={t('image')}
                            type="file"
                            name="image"
                            onChange={handleImageChange}
                            fullWidth
                            sx={{ marginBottom: 2 }}
                            InputLabelProps={{ shrink: true }}
                        />
                        <Button type="submit" variant="contained" color="primary">
                            {t('create_offer')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default CreateOffer;