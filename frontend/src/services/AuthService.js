import api from "../middleware/api";
import TokenManager from "../utils/TokenManager";

export const AuthService = {
  login: async (email, password) => {
    console.log("login", email, password);
    const response = await api.post("/users/login", {
      email,
      password,
    });
    const { token, user } = response.data;
    TokenManager.setTokens(token);
    return { user, accessToken: token };
  },

  logout: async () => {
    try {
      await api.post("/users/logout");
    } finally {
      TokenManager.clearTokens();
    }
  },

  getCurrentUser: async () => {
    const response = await api.get("/users/me");
    return response.data;
  },
};

export default AuthService;
