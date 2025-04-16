import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, TextField, Button } from '@mui/material';

const OfferFilters = ({
                          searchQuery,
                          setSearchQuery,
                          minPrice,
                          setMinPrice,
                          maxPrice,
                          setMaxPrice,
                          locationFilter,
                          setLocationFilter,
                      }) => {
    const { t } = useTranslation();

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: 4, gap: 2, flexWrap: 'wrap' }}>
            <TextField
                label={t('search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="outlined"
                sx={{ width: { xs: '100%', sm: '30%' } }}
            />
            <TextField
                label={t('min_price')}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                type="number"
                variant="outlined"
                sx={{ width: { xs: '100%', sm: '15%' } }}
            />
            <TextField
                label={t('max_price')}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                type="number"
                variant="outlined"
                sx={{ width: { xs: '100%', sm: '15%' } }}
            />
            <TextField
                label={t('location')}
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                variant="outlined"
                sx={{ width: { xs: '100%', sm: '20%' } }}
            />
            <Button variant="contained" color="primary" sx={{ backgroundColor: '#ff0000' }}>
                {t('search')}
            </Button>
        </Box>
    );
};

export default OfferFilters;