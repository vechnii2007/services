import { TOKEN_CONFIG } from "../config";

class TokenManager {
  static getAccessToken() {
    return localStorage.getItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY);
  }

  static setTokens(token) {
    localStorage.setItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY, token);
  }

  static clearTokens() {
    localStorage.removeItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY);
  }

  static getAuthHeader(token = null) {
    const accessToken = token || this.getAccessToken();
    return accessToken ? `${TOKEN_CONFIG.TOKEN_TYPE} ${accessToken}` : "";
  }
}

export default TokenManager;
