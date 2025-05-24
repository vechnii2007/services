// Сервис для работы с админским профилем пользователя
// TODO: заменить на реальные запросы к API

import axios from "../utils/axiosConfig";

const AdminUserService = {
  async getFullProfile(userId) {
    // Получаем профиль пользователя и summary (summary можно собрать на фронте из других запросов)
    const { data: user } = await axios.get(`/admin/users/${userId}`);
    // Для summary можно сделать параллельные запросы и посчитать длины массивов
    const [requests, offers, payments, subscriptions, reviews] =
      await Promise.all([
        this.getUserRequests(userId),
        this.getUserOffers(userId),
        this.getUserPayments(userId),
        this.getUserSubscriptions(userId),
        this.getUserReviews(userId),
      ]);
    return {
      user,
      summary: {
        requests: requests.length,
        offers: offers.length,
        payments: payments.length,
        subscriptions: subscriptions.length,
        reviews: reviews.length,
      },
    };
  },

  async getUserRequests(userId, params = {}) {
    const { data } = await axios.get("/admin/requests", {
      params: { userId, ...params },
    });
    return Array.isArray(data.requests) ? data.requests : [];
  },

  async getUserOffers(userId, params = {}) {
    const { data } = await axios.get("/admin/offers", {
      params: { userId, ...params },
    });
    return Array.isArray(data.offers) ? data.offers : [];
  },

  async getUserPayments(userId, params = {}) {
    const { data } = await axios.get("/admin/payments", {
      params: { userId, ...params },
    });
    return Array.isArray(data.payments) ? data.payments : [];
  },

  async getUserSubscriptions(userId, params = {}) {
    const { data } = await axios.get("/admin/subscriptions", {
      params: { userId, ...params },
    });
    return Array.isArray(data.subscriptions) ? data.subscriptions : [];
  },

  async getUserReviews(userId, params = {}) {
    const { data } = await axios.get("/admin/reviews", {
      params: { userId, ...params },
    });
    return Array.isArray(data.reviews) ? data.reviews : [];
  },

  async updateOfferStatus(offerId, status, type = "Offer") {
    const { data } = await axios.patch(`/admin/offers/${offerId}/status`, {
      status,
      type,
    });
    return data;
  },
};

export default AdminUserService;
