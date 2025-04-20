import React, { useEffect, useMemo } from 'react';

const OfferList = ({ offers, onFavoriteClick, favorites }) => {
    // Оборачиваем safeFavorites в useMemo
    const safeFavorites = useMemo(() => {
        return favorites || [];
    }, [favorites]);

    useEffect(() => {
        // ... existing code ...
    }, [safeFavorites]); // Теперь safeFavorites мемоизирован

    return (
        // ... existing code ...
    );
}; 