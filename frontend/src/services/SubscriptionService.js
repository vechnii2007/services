import api from "./api";

const SubscriptionService = {
  async getUserSubscription() {
    console.log("123123, getUserSubscription");
    const response = await api.get(`/subscriptions/me`);
    return response.data;
  },
};

export default SubscriptionService;
