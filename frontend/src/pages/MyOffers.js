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
    IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Autocomplete, LoadScript } from '@react-google-maps/api';

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
        images: [],
    });
    const [imagePreviews, setImagePreviews] = useState([]);
    const [autocomplete, setAutocomplete] = useState(null);

    useEffect(() => {
        const fetchMyOffers = async () => {
            if (!loading) return;
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
    }, []);

    const handleEditOpen = (offer) => {
        setCurrentOffer(offer);
        setFormData({
            serviceType: offer.serviceType,
            location: offer.location,
            description: offer.description,
            price: offer.price,
            images: [],
        });
        setImagePreviews(offer.images || []);
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
            images: [],
        });
        setImagePreviews([]);
    };

    const onLoad = (autoC) => {
        setAutocomplete(autoC);
    };

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            if (place.geometry) {
                setFormData({
                    ...formData,
                    location: place.formatted_address,
                });
            }
        }
    };

    const handleEditChange = (e) => {
        if (e.target.name === 'images') {
            const files = Array.from(e.target.files);
            const newImages = [...formData.images, ...files];
            setFormData({ ...formData, images: newImages });

            const previews = files.map(file => URL.createObjectURL(file));
            setImagePreviews([...imagePreviews, ...previews]);
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleImageDelete = (index) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        setFormData({ ...formData, images: newImages });
        setImagePreviews(newPreviews);
    };

    const handleImageEdit = (index) => (e) => {
        const newImage = e.target.files[0];
        if (newImage) {
            const newImages = [...formData.images];
            newImages[index] = newImage;
            setFormData({ ...formData, images: newImages });

            const newPreviews = [...imagePreviews];
            newPreviews[index] = URL.createObjectURL(newImage);
            setImagePreviews(newPreviews);
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
            formData.images.forEach((image) => {
                data.append('images', image);
            });

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

    const handleToggleStatus = async (offerId, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            const res = await axios.put(
                `http://localhost:5001/api/services/offers/${offerId}`,
                { status: newStatus },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setOffers(offers.map((offer) =>
                offer._id === offerId ? { ...offer, status: newStatus } : offer
            ));
            setMessage(t('status_updated'));
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
                                        <strong>{t('provider')}:</strong> {offer.providerId?.name || 'Unknown'}
                                    </Typography>
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
                                    <Typography variant="body1">
                                        <strong>{t('status')}:</strong> {t(offer.status)}
                                    </Typography>
                                    {offer.images && offer.images.length > 0 && (
                                        <Box sx={{ marginTop: 2 }}>
                                            <Typography variant="body1">
                                                <strong>{t('images')}:</strong>
                                            </Typography>
                                            <Grid container spacing={1}>
                                                {offer.images.map((image, index) => (
                                                    <Grid item xs={4} key={index}>
                                                        <img
                                                            src={image}
                                                            alt={`Offer ${index}`}
                                                            style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                                                        />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Box>
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
                                            sx={{ marginRight: 1 }}
                                        >
                                            {t('delete')}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color={offer.status === 'active' ? 'error' : 'success'}
                                            onClick={() => handleToggleStatus(offer._id, offer.status)}
                                        >
                                            {offer.status === 'active' ? t('deactivate') : t('activate')}
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
                    <LoadScript
                        googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
                        libraries={['places']}
                    >
                        <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                            <TextField
                                label={t('location')}
                                name="location"
                                value={formData.location}
                                onChange={handleEditChange}
                                fullWidth
                                required
                                sx={{ marginBottom: 2 }}
                            />
                        </Autocomplete>
                    </LoadScript>
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
                    <Box sx={{ marginBottom: 2 }}>
                        <Button variant="contained" component="label">
                            {t('upload_images')}
                            <input
                                type="file"
                                hidden
                                multiple
                                accept="image/*"
                                name="images"
                                onChange={handleEditChange}
                            />
                        </Button>
                    </Box>
                    {imagePreviews.length > 0 && (
                        <Grid container spacing={2} sx={{ marginBottom: 2 }}>
                            {imagePreviews.map((preview, index) => (
                                <Grid item xs={4} key={index}>
                                    <Box sx={{ position: 'relative' }}>
                                        <img
                                            src={preview}
                                            alt={`Preview ${index}`}
                                            style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                                        />
                                        <IconButton
                                            sx={{ position: 'absolute', top: 0, right: 0 }}
                                            onClick={() => handleImageDelete(index)}
                                        >
                                            <DeleteIcon color="error" />
                                        </IconButton>
                                        <IconButton
                                            sx={{ position: 'absolute', top: 0, left: 0 }}
                                            component="label"
                                        >
                                            <EditIcon />
                                            <input
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                onChange={handleImageEdit(index)}
                                            />
                                        </IconButton>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    )}
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