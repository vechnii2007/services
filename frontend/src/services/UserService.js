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
};

export default UserService;
