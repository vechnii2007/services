import api from "../middleware/api";

export const AdminService = {
  // Users
  getUsers: async (params = {}) => {
    const response = await api.get("/admin/users", { params });
    return response.data;
  },

  getUser: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post("/admin/users", userData);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Requests
  getRequests: async (params = {}) => {
    const response = await api.get("/admin/requests", { params });
    return response.data;
  },

  getRequest: async (requestId) => {
    const response = await api.get(`/admin/requests/${requestId}`);
    return response.data;
  },

  createRequest: async (requestData) => {
    const response = await api.post("/admin/requests", requestData);
    return response.data;
  },

  updateRequest: async (requestId, requestData) => {
    const response = await api.put(`/admin/requests/${requestId}`, requestData);
    return response.data;
  },

  deleteRequest: async (requestId) => {
    const response = await api.delete(`/admin/requests/${requestId}`);
    return response.data;
  },

  // Offers
  getOffers: async (params = {}) => {
    const response = await api.get("/admin/offers", { params });
    return response.data;
  },

  getOffer: async (offerId) => {
    const response = await api.get(`/admin/offers/${offerId}`);
    return response.data;
  },

  createOffer: async (offerData) => {
    const response = await api.post("/admin/offers", offerData);
    return response.data;
  },

  updateOffer: async (offerId, offerData) => {
    const response = await api.put(`/admin/offers/${offerId}`, offerData);
    return response.data;
  },

  deleteOffer: async (offerId, type) => {
    const response = await api.delete(`/admin/offers/${offerId}`, {
      data: { type },
    });
    return response.data;
  },

  // Categories
  getCategories: async () => {
    const response = await api.get("/admin/categories");
    return response.data;
  },

  createCategory: async (categoryData) => {
    const response = await api.post("/admin/categories", categoryData);
    return response.data;
  },

  updateCategory: async (categoryId, categoryData) => {
    const response = await api.put(
      `/admin/categories/${categoryId}`,
      categoryData
    );
    return response.data;
  },

  deleteCategory: async (categoryId) => {
    const response = await api.delete(`/admin/categories/${categoryId}`);
    return response.data;
  },

  // Очистка кэша у всех пользователей
  clearCache: async () => {
    const response = await api.post("/admin/clear-cache");
    return response.data;
  },
};

export default AdminService;
