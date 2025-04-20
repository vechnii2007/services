import React, { useState, useEffect, useRef, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Box } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import OfferFilters from '../components/OfferFilters';
import CategoryCard from '../components/CategoryCard';
import OfferList from '../components/OfferList';
import OfferService from '../services/OfferService';
import { filterOffers } from '../utils/filterOffers';
import { OFFERS_PER_PAGE } from '../utils/constants';
import { AuthContext } from '../context/AuthContext';

import 'swiper/css';
import 'swiper/css/navigation';

const Offers = () => {
    const { t } = useTranslation();
    const { isAuthenticated } = useContext(AuthContext);
    const [offers, setOffers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [favorites, setFavorites] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const isFetchingData = useRef(false);
    const favoritesTimeoutRef = useRef(null);

    // Эффект для загрузки предложений и категорий
    useEffect(() => {
        const fetchData = async () => {
            if (isFetchingData.current) return;
            isFetchingData.current = true;
            setLoading(true);

            try {
                const { offers, totalPages } = await OfferService.fetchOffers({
                    page,
                    limit: OFFERS_PER_PAGE,
                    minPrice: minPrice || undefined,
                    maxPrice: maxPrice || undefined,
                    location: locationFilter || undefined,
                });
                
                setOffers(Array.isArray(offers) ? offers : []);
                setTotalPages(totalPages || 1);

                const categories = await OfferService.fetchCategories();
                setCategories(Array.isArray(categories) ? categories : []);

                setMessage(t('offers_loaded'));
            } catch (error) {
                console.error('Error loading offers:', error);
                setOffers([]);
                setCategories([]);
                setMessage('Error: ' + (error.response?.data?.error || t('something_went_wrong')));
            } finally {
                setLoading(false);
                isFetchingData.current = false;
            }
        };

        fetchData();
    }, [page, minPrice, maxPrice, locationFilter, t]);

    // Отдельный эффект для загрузки избранного с дебаунсом
    useEffect(() => {
        const fetchFavorites = async () => {
            if (!isAuthenticated) {
                setFavorites({});
                return;
            }

            try {
                const favoritesData = await OfferService.fetchFavorites();
                setFavorites(favoritesData && typeof favoritesData === 'object' ? favoritesData : {});
            } catch (error) {
                console.error('Error fetching favorites:', error);
                setFavorites({});
            }
        };

        // Очищаем предыдущий таймаут
        if (favoritesTimeoutRef.current) {
            clearTimeout(favoritesTimeoutRef.current);
        }

        // Устанавливаем новый таймаут для дебаунса
        favoritesTimeoutRef.current = setTimeout(fetchFavorites, 300);

        // Очистка при размонтировании
        return () => {
            if (favoritesTimeoutRef.current) {
                clearTimeout(favoritesTimeoutRef.current);
            }
        };
    }, [isAuthenticated]);

    const handleCategoryClick = (category) => {
        setSelectedCategory(category === selectedCategory ? '' : category);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const filteredOffers = filterOffers(offers, { searchQuery, selectedCategory });

    if (loading && categories.length === 0) {
        // Если загружаются и предложения, и категории, показываем только сообщение о загрузке
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

            <OfferFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                minPrice={minPrice}
                setMinPrice={setMinPrice}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                locationFilter={locationFilter}
                setLocationFilter={setLocationFilter}
            />

            <Typography variant="h6" gutterBottom>
                {t('categories')}
            </Typography>
            <Box sx={{ marginBottom: 4 }}>
                <Swiper
                    modules={[Navigation]}
                    spaceBetween={16}
                    slidesPerView={1}
                    navigation
                    breakpoints={{
                        640: { slidesPerView: 2 },
                        768: { slidesPerView: 3 },
                        1024: { slidesPerView: 5 },
                    }}
                >
                    {categories.map((category) => (
                        <SwiperSlide key={category._id}>
                            <CategoryCard
                                category={category}
                                selected={selectedCategory === category.name}
                                onClick={handleCategoryClick}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </Box>

            <OfferList
                offers={filteredOffers || []}
                favorites={favorites || {}}
                setFavorites={setFavorites}
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                loading={loading}
            />
        </Box>
    );
};

export default Offers;