import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from '../../utils/axiosConfig';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
} from '@mui/material';

const EditRequestDialog = ({ open, onClose, requestId, onRequestUpdated }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        serviceType: '',
        location: '',
        coordinates: { lat: '', lng: '' },
        description: '',
    });

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const res = await axios.get(`/admin/requests/${requestId}`);
                setFormData({
                    serviceType: res.data.serviceType,
                    location: res.data.location,
                    coordinates: res.data.coordinates || { lat: '', lng: '' },
                    description: res.data.description,
                });
            } catch (error) {
                console.error('Error fetching request:', error);
            }
        };
        if (requestId) fetchRequest();
    }, [requestId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'lat' || name === 'lng') {
            setFormData({
                ...formData,
                coordinates: { ...formData.coordinates, [name]: value },
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async () => {
        try {
            await axios.patch(`/admin/requests/${requestId}`, formData);
            onRequestUpdated();
            onClose();
        } catch (error) {
            console.error('Error updating request:', error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{t('edit_request')}</DialogTitle>
            <DialogContent>
                <TextField
                    label={t('service_type')}
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label={t('location')}
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        label={t('latitude')}
                        name="lat"
                        value={formData.coordinates.lat}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label={t('longitude')}
                        name="lng"
                        value={formData.coordinates.lng}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                    />
                </Box>
                <TextField
                    label={t('description')}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    multiline
                    rows={4}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">
                    {t('cancel')}
                </Button>
                <Button onClick={handleSubmit} color="primary">
                    {t('save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditRequestDialog;