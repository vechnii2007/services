import React from 'react';
import { Grid, Box, Pagination } from '@mui/material';
import OfferCard from './OfferCard';

const OfferList = ({ offers, favorites, setFavorites, page, totalPages, onPageChange }) => {
    return (
        <Box>
            <Grid container spacing={3}>
                {offers.map((offer) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={offer._id}>
                        <OfferCard
                            offer={offer}
                            favorites={favorites}
                            setFavorites={setFavorites}
                        />
                    </Grid>
                ))}
            </Grid>
            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={onPageChange}
                        color="primary"
                    />
                </Box>
            )}
        </Box>
    );
};

export default OfferList;