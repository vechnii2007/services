import api from "./api";
import OfferService from "./OfferService";

export const searchService = {
  // Получить популярные поисковые запросы
  async getPopularSearches(limit = 5, timeframe = "7d") {
    try {
      const response = await api.get("/api/search/popular", {
        params: { limit, timeframe },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching popular searches:", error);
      return [];
    }
  },

  // Сохранить поисковый запрос
  async saveSearchQuery(query, category = null) {
    try {
      const response = await api.post("/api/search", { query, category });
      return response.data;
    } catch (error) {
      console.error("Error saving search query:", error);
      throw error;
    }
  },

  // Получить результаты поиска
  async searchOffers(query, filters = {}) {
    try {
      console.log(
        "[searchService] Searching offers with query:",
        query,
        "and filters:",
        filters
      );

      // Используем новый API эндпоинт для поиска
      const response = await api.get("/api/search/offers", {
        params: {
          query,
          ...filters,
        },
      });

      console.log("[searchService] Search response:", response.data);

      // Возвращаем результаты поиска в том же формате, что и OfferService.getAll
      return response.data;
    } catch (error) {
      console.error("[searchService] Error searching offers:", error);
      throw error;
    }
  },

  // Получить все локации
  async getLocations() {
    try {
      const response = await api.get("/api/services/locations");
      return response.data;
    } catch (error) {
      console.error("Error fetching locations:", error);
      return [];
    }
  },
};
