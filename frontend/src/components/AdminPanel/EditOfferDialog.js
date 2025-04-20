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
    CircularProgress,
    MenuItem,
    Select,
    Box,
    IconButton,
    Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const EditOfferDialog = ({ open, onClose, offerId, onOfferUpdated }) => {
    const { t } = useTranslation();
    const [offer, setOffer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Состояние для редактируемых полей
    const [type, setType] = useState('');
    const [serviceType, setServiceType] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [location, setLocation] = useState('');
    const [images, setImages] = useState([]); // Текущие изображения
    const [newImages, setNewImages] = useState([]); // Новые загружаемые изображения

    useEffect(() => {
        if (open && offerId) {
            const fetchOffer = async () => {
                try {
                    setLoading(true);
                    const res = await axios.get(`/admin/offers/${offerId}`);
                    const offerData = res.data;
                    if (!offerData) {
                        throw new Error('Offer not found');
                    }
                    setOffer(offerData);
                    setType(offerData.type || '');
                    setServiceType(offerData.serviceType || '');
                    setDescription(offerData.description || '');
                    setPrice(offerData.price || '');
                    setLocation(offerData.location || '');
                    console.log(123123, offerData)
                    // Проверяем наличие images или image и устанавливаем в состояние
                    if (offerData.images.length && Array.isArray(offerData.images)) {
                        setImages(offerData.images);
                    } else if (offerData.image) {
                        console.log(777)
                        setImages([offerData.image]);
                    } else {
                        setImages([]);
                    }
                    console.log('Images set:', offerData.images || offerData.image); // Отладка
                } catch (err) {
                    if (err.response?.status === 404) {
                        setError(t('offer_not_found'));
                    } else if (err.response?.status === 403) {
                        setError(t('access_denied'));
                    } else if (err.response?.status === 500) {
                        setError(t('server_error'));
                    } else {
                        setError(t('error_fetching_offer'));
                    }
                    console.error('Error fetching offer:', err);
                } finally {
                    setLoading(false);
                }
            };
            fetchOffer();
        }
    }, [offerId, open, t]);

    // Обработка выбора новых изображений
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setNewImages([...newImages, ...files]);
    };

    // Удаление существующего изображения
    const handleDeleteImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    // Удаление нового загруженного изображения
    const handleDeleteNewImage = (index) => {
        setNewImages(newImages.filter((_, i) => i !== index));
    };

    // Обработка ошибки загрузки изображения
    const handleImageError = (index) => {
        console.error(`Failed to load image at index ${index}: ${images[index]}`);
    };

    const handleSave = async () => {
        try {
            const formData = new FormData();
            formData.append('type', type);
            formData.append('serviceType', serviceType);
            formData.append('description', description);
            formData.append('price', price ? Number(price) : '');
            formData.append('location', location);

            // Добавляем существующие изображения (пути) в formData
            images.forEach((image, index) => {
                formData.append(`existingImages[${index}]`, image);
            });

            // Добавляем новые изображения в formData
            newImages.forEach((image) => {
                formData.append('images', image);
            });

            await axios.patch(`/admin/offers/${offerId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            onOfferUpdated();
            onClose();
        } catch (err) {
            if (err.response?.status === 404) {
                setError(t('offer_not_found'));
            } else if (err.response?.status === 403) {
                setError(t('access_denied'));
            } else if (err.response?.status === 500) {
                setError(t('server_error'));
            } else {
                setError(t('error_updating_offer'));
            }
            console.error('Error updating offer:', err);
        }
    };

    if (loading) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>{t('edit_offer')}</DialogTitle>
                <DialogContent>
                    <CircularProgress />
                </DialogContent>
            </Dialog>
        );
    }

    if (error) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>{t('edit_offer')}</DialogTitle>
                <DialogContent>
                    <p>{error}</p>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>{t('close')}</Button>
                </DialogActions>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{t('edit_offer')}</DialogTitle>
            <DialogContent>
                <Select
                    fullWidth
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    label={t('type')}
                    sx={{ marginBottom: 2 }}
                >
                    <MenuItem value="ServiceOffer">{t('service_offer')}</MenuItem>
                    <MenuItem value="ServiceRequest">{t('service_request')}</MenuItem>
                </Select>
                <TextField
                    fullWidth
                    label={t('service_type')}
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    sx={{ marginBottom: 2 }}
                />
                <TextField
                    fullWidth
                    label={t('description')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    multiline
                    rows={4}
                    sx={{ marginBottom: 2 }}
                />
                <TextField
                    fullWidth
                    label={t('price')}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    type="number"
                    sx={{ marginBottom: 2 }}
                />
                <TextField
                    fullWidth
                    label={t('location')}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    sx={{ marginBottom: 2 }}
                />

                {/* Отображение текущих изображений */}
                {['ServiceOffer', 'Offer'].includes(type) && (
                    <>
                        <Typography variant="subtitle1" sx={{ marginBottom: 1 }}>
                            {t('current_images')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 2 }}>
                            {images && images.length > 0 ? (
                                images.map((image, index) => (
                                    <Box key={index} sx={{ position: 'relative' }}>
                                        <img
                                            src={`http://localhost:5001${image}`}
                                            alt={`Offer ${index}`}
                                            style={{ width: 100, height: 100, objectFit: 'cover' }}
                                            onError={() => handleImageError(index)}
                                        />
                                        <IconButton
                                            sx={{ position: 'absolute', top: 0, right: 0 }}
                                            onClick={() => handleDeleteImage(index)}
                                        >
                                            <DeleteIcon color="error" />
                                        </IconButton>
                                    </Box>
                                ))
                            ) : (
                                <Typography>{t('no_images')}</Typography>
                            )}
                        </Box>

                        {/* Отображение новых загруженных изображений */}
                        {newImages.length > 0 && (
                            <>
                                <Typography variant="subtitle1" sx={{ marginBottom: 1 }}>
                                    {t('new_images')}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 2 }}>
                                    {newImages.map((image, index) => (
                                        <Box key={index} sx={{ position: 'relative' }}>
                                            <img
                                                src={URL.createObjectURL(image)}
                                                alt={`New ${index}`}
                                                style={{ width: 100, height: 100, objectFit: 'cover' }}
                                            />
                                            <IconButton
                                                sx={{ position: 'absolute', top: 0, right: 0 }}
                                                onClick={() => handleDeleteNewImage(index)}
                                            >
                                                <DeleteIcon color="error" />
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Box>
                            </>
                        )}

                        {/* Поле для загрузки новых изображений */}
                        <Box sx={{ marginBottom: 2 }}>
                            <Button variant="contained" component="label">
                                {t('upload_images')}
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    hidden
                                    onChange={handleImageChange}
                                />
                            </Button>
                        </Box>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('cancel')}</Button>
                <Button onClick={handleSave} color="primary">
                    {t('save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditOfferDialog;