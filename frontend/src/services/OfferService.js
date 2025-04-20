import api from "../middleware/api";

export const OfferService = {
  // Новый метод для обратной совместимости
  fetchOffers: async (params = {}) => {
    const response = await api.get("/services/offers", { params });
    return {
      offers: response.data.offers || [],
      totalPages: response.data.totalPages || 1,
    };
  },

  getAll: async (params = {}) => {
    const response = await api.get("/services/offers", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/services/offers/${id}`);
    return response.data;
  },

  create: async (offerData) => {
    const response = await api.post("/services/offers", offerData);
    return response.data;
  },

  update: async (id, offerData) => {
    const response = await api.put(`/services/offers/${id}`, offerData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/services/offers/${id}`);
    return response.data;
  },

  uploadImage: async (id, imageFile) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    const response = await api.post(`/services/offers/${id}/image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getByCategory: async (categoryId, params = {}) => {
    const response = await api.get(`/services/offers/category/${categoryId}`, {
      params,
    });
    return response.data;
  },

  getByUser: async (userId, params = {}) => {
    const response = await api.get(`/services/offers/user/${userId}`, {
      params,
    });
    return response.data;
  },

  fetchCategories: async () => {
    const response = await api.get("/services/categories");
    return response.data;
  },

  fetchFavorites: async () => {
    try {
      const response = await api.get("/services/favorites");

      // Убедимся, что ответ правильный и data является массивом
      if (response && response.data && Array.isArray(response.data)) {
        const favoritesMap = {};
        response.data.forEach((offer) => {
          if (offer && offer._id) {
            favoritesMap[offer._id] = true;
          }
        });
        return favoritesMap;
      }

      console.warn("Invalid response from fetchFavorites:", response);
      return {}; // Вернем пустой объект, если что-то пошло не так
    } catch (error) {
      console.error("Error fetching favorites:", error);
      return {}; // Вернем пустой объект в случае ошибки
    }
  },

  toggleFavorite: async (offerId, offerType) => {
    if (!offerId) {
      console.error("Missing offerId for toggleFavorite");
      return { isFavorite: false };
    }

    try {
      const response = await api.post("/services/favorites", {
        offerId,
        offerType: offerType || "offer",
      });

      // Убедимся, что ответ правильный
      if (response && response.data) {
        return {
          isFavorite: !!response.data.isFavorite,
        };
      }

      return { isFavorite: false };
    } catch (error) {
      console.error("Error toggling favorite:", error);
      return { isFavorite: false }; // Вернем объект вместо выброса исключения
    }
  },
};

export default OfferService;
