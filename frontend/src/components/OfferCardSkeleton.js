import React from 'react';
import { Card, CardContent, Box, Skeleton } from '@mui/material';
import { OFFER_IMAGE_HEIGHT } from '../utils/constants';

const OfferCardSkeleton = () => {
    return (
        <Card
            sx={{
                height: '400px',
                minWidth: '250px', // Растягиваем карточку на всю ширину Grid item
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
        >
            <Box>
                <Skeleton
                    variant="rectangular"
                    height={OFFER_IMAGE_HEIGHT}
                    width="100%" // Изображение на всю ширину карточки
                    animation="wave"
                />
                <CardContent sx={{ padding: 2, flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Skeleton variant="text" width="70%" height={24} animation="wave" />
                        <Skeleton variant="circular" width={24} height={24} animation="wave" />
                    </Box>
                    <Skeleton variant="text" width="90%" height={16} animation="wave" />
                    <Skeleton variant="text" width="70%" height={16} animation="wave" />
                    <Skeleton variant="text" width="40%" height={16} animation="wave" sx={{ mt: 1 }} />
                    <Skeleton variant="text" width="50%" height={16} animation="wave" />
                </CardContent>
            </Box>
            <Box sx={{ p: 2, pt: 0 }}>
                <Skeleton
                    variant="rectangular"
                    height={36}
                    width="100%" // Кнопка на всю ширину
                    animation="wave"
                    sx={{ borderRadius: '8px' }}
                />
            </Box>
        </Card>
    );
};

export default OfferCardSkeleton;