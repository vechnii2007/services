import api from "./api";

const SubscriptionService = {
  async getUserSubscription() {
    const response = await api.get(`/subscriptions/me`);
    return response.data;
  },

  async getAllUserSubscriptions() {
    const response = await api.get(`/subscriptions/my-all`);
    return response.data;
  },
};

export default SubscriptionService;
