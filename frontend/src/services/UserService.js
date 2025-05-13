import api from "../middleware/api";

export const UserService = {
  getCurrentUser: async () => {
    const response = await api.get("/users/me");
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put("/users/profile", profileData);
    return response.data;
  },

  updateStatus: async (status) => {
    const response = await api.put("/users/status", { status });
    return response.data;
  },

  getPayments: async () => {
    const response = await api.get("/users/payments");
    return response.data;
  },

  deposit: async (amount) => {
    const response = await api.post("/users/payments/deposit", { amount });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Получить предложения пользователя
  getOffersByUserId: async (userId) => {
    const response = await api.get(`/services/offers`, {
      params: { providerId: userId },
    });
    return response.data;
  },

  // Получить отзывы пользователя
  getReviewsByUserId: async (userId) => {
    const response = await api.get(`/reviews`, { params: { userId } });
    return response.data;
  },

  // Получить отзывы, оставленные пользователем
  getReviewsLeftByUser: async (userId) => {
    const response = await api.get(`/reviews/user/${userId}`);
    return response.data;
  },

  // Добавить пользователя в избранное
  addToFavorites: async (userId) => {
    const response = await api.post(`/users/favorites`, { userId });
    return response.data;
  },

  // Удалить пользователя из избранного
  removeFromFavorites: async (userId) => {
    const response = await api.delete(`/users/favorites/${userId}`);
    return response.data;
  },

  // Пожаловаться на пользователя
  reportUser: async (userId, reason) => {
    const response = await api.post(`/users/report`, { userId, reason });
    return response.data;
  },

  // Получить отзывы о провайдере
  getReviewsByProviderId: async (providerId) => {
    const response = await api.get(`/reviews/provider/${providerId}`);
    return response.data;
  },
};

export default UserService;
