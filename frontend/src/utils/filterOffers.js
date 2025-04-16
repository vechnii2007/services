export const filterOffers = (offers, { searchQuery, selectedCategory }) => {
    return offers.filter((offer) => {
        const searchLower = searchQuery.toLowerCase();
        const matchesServiceType = offer.serviceType?.toLowerCase().includes(searchLower);
        const matchesDescription = offer.description?.toLowerCase().includes(searchLower) || false;
        const matchesSearch = searchQuery ? matchesServiceType || matchesDescription : true;
        const matchesCategory = selectedCategory ? offer.serviceType === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });
};