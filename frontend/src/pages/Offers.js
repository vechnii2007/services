import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { useTranslation } from 'react-i18next';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Box,
    Grid,
    TextField,
    Button,
    IconButton,
    Pagination,
} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';

const Offers = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [offers, setOffers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [favorites, setFavorites] = useState({});
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const isFetchingData = useRef(false);

    const serviceTypeMap = {
        [t('translation')]: 'translation',
        [t('legal')]: 'legal',
        [t('real_estate')]: 'real_estate',
        [t('healthcare')]: 'healthcare',
        [t('education')]: 'education',
        [t('cultural_events')]: 'cultural_events',
        [t('finance')]: 'finance',
        [t('transport')]: 'transport',
        [t('household')]: 'household',
        [t('shopping')]: 'shopping',
        [t('travel')]: 'travel',
        [t('psychology')]: 'psychology',
        [t('plumbing')]: 'plumbing',
        [t('massage')]: 'massage',
        [t('cleaning')]: 'cleaning',
        [t('taro')]: 'taro',
        [t('evacuation')]: 'evacuation',
    };

    useEffect(() => {
        const fetchData = async () => {
            if (isFetchingData.current) {
                console.log('Fetch data already in progress, skipping...');
                return;
            }

            isFetchingData.current = true;
            try {
                const offersRes = await axios.get('/services/offers', {
                    params: {
                        page,
                        limit: 10,
                        minPrice: minPrice || undefined,
                        maxPrice: maxPrice || undefined,
                        location: locationFilter || undefined,
                    },
                });
                console.log('Fetched offers:', offersRes.data);
                setOffers(offersRes.data.offers);
                setTotalPages(offersRes.data.totalPages);

                const categoriesRes = await axios.get('/services/categories');
                console.log('Fetched categories:', categoriesRes.data);
                setCategories(categoriesRes.data);

                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        const favoritesRes = await axios.get('/services/favorites', {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        const favoritesMap = {};
                        favoritesRes.data.forEach(offer => {
                            favoritesMap[offer._id] = true; // Используем _id вместо id
                        });
                        setFavorites(favoritesMap);
                    } catch (error) {
                        console.error('Error fetching favorites:', error);
                    }
                }

                setMessage(t('offers_loaded'));
            } catch (error) {
                setMessage('Error: ' + (error.response?.data?.error || t('something_went_wrong')));
            } finally {
                setLoading(false);
                isFetchingData.current = false;
            }
        };
        fetchData();
    }, [page, minPrice, maxPrice, locationFilter]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleCategoryClick = (category) => {
        setSelectedCategory(category === selectedCategory ? '' : category);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const toggleFavorite = async (offerId, offerType) => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const res = await axios.post(
                '/services/favorites',
                { offerId, offerType },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setFavorites(prev => ({
                ...prev,
                [offerId]: res.data.isFavorite,
            }));
        } catch (error) {
            console.error('Error toggling favorite:', error);
            setMessage('Error: ' + (error.response?.data?.error || t('something_went_wrong')));
        }
    };

    const filteredOffers = offers.filter((offer) => {
        const translatedServiceType = t(offer.serviceType);
        const searchLower = searchQuery.toLowerCase();

        const matchesServiceType = translatedServiceType.toLowerCase().includes(searchLower);
        const matchesDescription = offer.description?.toLowerCase().includes(searchLower) || false;
        const matchesSearch = searchQuery ? (matchesServiceType || matchesDescription) : true;

        const matchesCategory = selectedCategory ? offer.serviceType === selectedCategory : true;

        return matchesSearch && matchesCategory;
    });

    console.log('Filtered offers:', filteredOffers);

    if (loading) {
        return <Typography>{t('loading')}</Typography>;
    }

    return (
        <Box sx={{ paddingY: 4 }}>
            <Typography variant="h4" gutterBottom>
                {t('offers')}
            </Typography>
            {message && (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ marginBottom: 2 }}>
                    {message}
                </Typography>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: 4, gap: 2 }}>
                <TextField
                    label={t('search_placeholder')}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    variant="outlined"
                    sx={{ width: '30%' }}
                />
                <TextField
                    label={t('min_price')}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    type="number"
                    variant="outlined"
                    sx={{ width: '15%' }}
                />
                <TextField
                    label={t('max_price')}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    type="number"
                    variant="outlined"
                    sx={{ width: '15%' }}
                />
                <TextField
                    label={t('location')}
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    variant="outlined"
                    sx={{ width: '20%' }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    sx={{ backgroundColor: '#ff0000' }}
                >
                    {t('search')}
                </Button>
            </Box>

            <Typography variant="h6" gutterBottom>
                {t('categories')}
            </Typography>
            <Grid container spacing={2} sx={{ marginBottom: 4 }}>
                {categories.map((category) => (
                    <Grid item xs={6} sm={4} md={2} key={category._id}>
                        <Card
                            onClick={() => handleCategoryClick(category.name)}
                            sx={{
                                cursor: 'pointer',
                                backgroundColor: selectedCategory === category.name ? '#e0e0e0' : 'inherit',
                            }}
                        >
                            <CardMedia
                                component="img"
                                height="100"
                                image={category.image || 'https://via.placeholder.com/150?text=Category'}
                                alt={category.label}
                            />
                            <CardContent>
                                <Typography variant="body2" align="center">
                                    {t(category.name)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {filteredOffers.length > 0 ? (
                <>
                    <Grid container spacing={3}>
                        {filteredOffers.map((offer) => (
                            <Grid item xs={12} sm={6} md={3} key={offer._id}> {/* Используем _id вместо id */}
                                <Card>
                                    {offer.image && (
                                        <CardMedia
                                            component="img"
                                            height="140"
                                            image={offer.image}
                                            alt={offer.serviceType}
                                        />
                                    )}
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="h6">
                                                {t(offer.serviceType).toUpperCase()}
                                            </Typography>
                                            <IconButton onClick={() => toggleFavorite(offer._id, offer.type === 'independent' ? 'Offer' : 'ServiceOffer')}>
                                                {favorites[offer._id] ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                                            </IconButton>
                                        </Box>
                                        <Typography variant="body2" color="textSecondary">
                                            {offer.description}
                                        </Typography>
                                        <Typography variant="h6" sx={{ marginTop: 1 }}>
                                            {offer.price} {t('currency')}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
                                            <Typography variant="body2">
                                                {offer.location}
                                            </Typography>
                                            <Typography variant="body2">
                                                {t(offer.serviceType)}
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            component={Link}
                                            to={`/offers/${offer._id}`} // Используем _id вместо id
                                            sx={{ marginTop: 2, width: '100%' }}
                                        >
                                            {t('view_offer')}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                    <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={handlePageChange}
                            color="primary"
                        />
                    </Box>
                </>
            ) : (
                <Typography variant="body1" align="center">
                    {t('no_offers')}
                </Typography>
            )}
        </Box>
    );
};

export default Offers;