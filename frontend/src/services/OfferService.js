import axios from '../utils/axiosConfig';

const OfferService = {
    async fetchOffers(params) {
        const response = await axios.get('/services/offers', { params });
        return {
            offers: response.data.offers,
            totalPages: response.data.totalPages,
        };
    },

    async fetchCategories() {
        const response = await axios.get('/services/categories');
        return response.data;
    },

    async fetchFavorites() {
        const token = localStorage.getItem('token');
        if (!token) return {};
        const response = await axios.get('/services/favorites', {
            headers: { Authorization: `Bearer ${token}` },
        });
        const favoritesMap = {};
        response.data.forEach((offer) => {
            favoritesMap[offer._id] = true;
        });
        return favoritesMap;
    },

    async toggleFavorite(offerId, offerType) {
        const token = localStorage.getItem('token');
        const response = await axios.post(
            '/services/favorites',
            { offerId, offerType },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return { isFavorite: response.data.isFavorite };
    },
};

export default OfferService;