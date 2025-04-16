import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardMedia, CardContent, Typography, Button, Box, IconButton } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Link } from 'react-router-dom';
import OfferService from '../services/OfferService';
import { OFFER_IMAGE_HEIGHT } from '../utils/constants';

const OfferCard = ({ offer, favorites, setFavorites }) => {
    const { t } = useTranslation();

    const isFavorite = favorites[offer._id];

    const toggleFavorite = async () => {
        try {
            if (isFavorite) {
                await OfferService.removeFromFavorites(offer._id);
                setFavorites((prev) => ({ ...prev, [offer._id]: false }));
            } else {
                await OfferService.addToFavorites(offer._id);
                setFavorites((prev) => ({ ...prev, [offer._id]: true }));
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    return (
        <Card
            sx={{
                height: '400px', // Фиксированная высота карточки
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: '12px', // Закругленные углы
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', // Мягкая тень
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'scale(1.03)', // Легкое увеличение при наведении
                    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                },
                position: 'relative',
            }}
        >
            <Box>
                <CardMedia
                    component="img"
                    height={OFFER_IMAGE_HEIGHT} // Фиксированная высота изображения
                    image={offer.image || 'https://placehold.co/150x150?text=card'}
                    alt={offer.title}
                    sx={{ objectFit: 'cover' }}
                    onError={(e) => {
                        e.target.onerror = null; // Предотвращаем зацикливание
                        e.target.src = `https://placehold.co/150x150?text=${t(offer.title)}`;
                    }}
                />
                <CardContent sx={{ padding: 2, flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography
                            variant="subtitle1"
                            fontWeight="bold"
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 1, // Ограничение заголовка до 1 строки
                                WebkitBoxOrient: 'vertical',
                            }}
                        >
                            {t(offer.title)}
                        </Typography>
                        <IconButton onClick={toggleFavorite} size="small">
                            {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                        </IconButton>
                    </Box>
                    <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2, // Ограничение описания до 2 строк
                            WebkitBoxOrient: 'vertical',
                            mb: 1,
                        }}
                    >
                        {t(offer.description)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {offer.price} {t('currency')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {offer.location}
                    </Typography>
                </CardContent>
            </Box>
            <Box sx={{ p: 2, pt: 0 }}>
                <Button
                    component={Link}
                    to={`/offers/${offer._id}`}
                    variant="contained"
                    fullWidth
                    sx={{
                        textTransform: 'none',
                        borderRadius: '8px',
                    }}
                >
                    {t('view_offer')}
                </Button>
            </Box>
        </Card>
    );
};

export default OfferCard;