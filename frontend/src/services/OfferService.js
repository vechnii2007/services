import BaseService from "./BaseService";

class OfferService extends BaseService {
  constructor() {
    super("/services");
  }

  async getAll({
    page = 1,
    limit = 10,
    minPrice,
    maxPrice,
    location,
    category,
  } = {}) {
    return this.get("/offers", {
      page,
      limit,
      minPrice,
      maxPrice,
      location,
      category,
    });
  }

  async getMyOffers() {
    try {
      console.log("Fetching my offers...");
      const response = await this.get("/my-offers");
      console.log("My offers response:", response);
      return response;
    } catch (error) {
      console.error("Error fetching my offers:", error);
      throw error;
    }
  }

  async getById(id) {
    return this.get(`/offers/${id}`);
  }

  async create(offerData) {
    return this.post("/offers", offerData);
  }

  async update(id, offerData) {
    return this.put(`/offers/${id}`, offerData);
  }

  async delete(id) {
    return this.delete(`/offers/${id}`);
  }

  async uploadImage(id, imageFile) {
    const formData = new FormData();
    formData.append("image", imageFile);
    return this.upload(`/offers/${id}/image`, formData);
  }

  async getByCategory(categoryId, params = {}) {
    return this.get(`/offers/category/${categoryId}`, params);
  }

  async getByUser(userId, params = {}) {
    return this.get(`/offers/user/${userId}`, params);
  }

  async fetchCategories() {
    const response = await this.get("/categories");
    return response;
  }

  async fetchCategoryCounts() {
    try {
      const response = await this.get("/categories/counts");
      return response;
    } catch (error) {
      throw error;
    }
  }

  async fetchFavorites() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        localStorage.removeItem("userFavorites");
        return {};
      }

      const response = await this.get("/favorites");
      const favoritesMap = {};
      response.forEach((offer) => {
        if (offer && offer._id) {
          favoritesMap[offer._id] = true;
        }
      });

      localStorage.setItem("userFavorites", JSON.stringify(favoritesMap));
      return favoritesMap;
    } catch (error) {
      try {
        const cachedFavorites = localStorage.getItem("userFavorites");
        if (cachedFavorites) {
          return JSON.parse(cachedFavorites);
        }
      } catch (e) {}
      return {};
    }
  }

  async toggleFavorite(offerId, offerType = "offer") {
    if (!offerId) {
      console.warn("[OfferService] toggleFavorite called without offerId");
      return {
        success: false,
        isFavorite: false,
        error: "No offer ID provided",
      };
    }

    try {
      console.log("[OfferService] Toggling favorite status:", {
        offerId,
        offerType,
      });

      const serverOfferType =
        offerType === "offer"
          ? "Offer"
          : offerType === "service_offer"
          ? "ServiceOffer"
          : offerType;

      const response = await this.post("/favorites", {
        offerId,
        offerType: serverOfferType,
      });

      console.log("[OfferService] Toggle favorite response:", response);

      const isFavorite = response?.message?.includes("Added to favorites");

      try {
        const cachedFavorites = localStorage.getItem("userFavorites");
        let favorites = cachedFavorites ? JSON.parse(cachedFavorites) : {};

        if (isFavorite) {
          favorites[offerId] = true;
        } else {
          delete favorites[offerId];
        }

        localStorage.setItem("userFavorites", JSON.stringify(favorites));
        console.log("[OfferService] Updated localStorage favorites:", {
          isFavorite,
          offerId,
        });
      } catch (e) {
        console.error("[OfferService] Error updating localStorage:", e);
      }

      return {
        success: true,
        isFavorite: isFavorite,
        message: response?.message || "",
      };
    } catch (error) {
      console.error("[OfferService] Error in toggleFavorite:", error);
      return {
        success: false,
        isFavorite: false,
        error: error.message || "Error toggling favorite status",
      };
    }
  }

  async getCategoryStats() {
    try {
      const response = await this.get("/categories/stats");
      console.log("[OfferService] Category stats:", response);
      return response;
    } catch (error) {
      console.error("[OfferService] Error getting category stats:", error);
      return {
        stats: [],
        totalOffers: 0,
        totalCategories: 0,
      };
    }
  }

  async promoteOffer(offerId, promotionType) {
    return this.post(`/offers/${offerId}/promote`, { promotionType });
  }

  async getPromotionStatus(offerId) {
    if (!offerId) {
      console.warn("[OfferService] getPromotionStatus called without offerId");
      return { isPromoted: false };
    }

    try {
      console.log(
        `[OfferService] Checking promotion status for offer: ${offerId}`
      );
      const response = await this.get(`/offers/${offerId}/promotion-status`);
      return response || { isPromoted: false };
    } catch (error) {
      console.error("[OfferService] Error checking promotion status:", {
        offerId,
        error: error.message,
        status: error.response?.status,
      });

      // Возвращаем базовый объект, чтобы не ломать UI
      return {
        isPromoted: false,
        error: error.message,
      };
    }
  }

  async getPromotedOffers(limit = 10, skip = 0) {
    const retryAttempts = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        console.log(
          `[OfferService] Getting promoted offers (attempt ${attempt + 1}/${
            retryAttempts + 1
          }):`,
          { limit, skip }
        );
        const response = await this.get("/offers/promoted", { limit, skip });
        console.log("[OfferService] Promoted offers received:", {
          count: response?.offers?.length || 0,
          total: response?.total || 0,
        });
        return response;
      } catch (error) {
        lastError = error;
        console.error(
          `[OfferService] Error getting promoted offers (attempt ${
            attempt + 1
          }/${retryAttempts + 1}):`,
          {
            error: error.message,
            status: error.response?.status,
            data: error.response?.data,
          }
        );

        if (attempt < retryAttempts) {
          // Пауза перед повторной попыткой
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    console.error(
      "[OfferService] All attempts to fetch promoted offers failed"
    );
    throw lastError;
  }

  /**
   * Получает информацию о провайдере по ID
   * @param {string} providerId - ID провайдера
   * @returns {Promise<Object>} - Информация о провайдере
   */
  async getProviderInfo(providerId) {
    if (!providerId) {
      console.warn("[OfferService] getProviderInfo called without providerId");
      return null;
    }

    try {
      console.log(`[OfferService] Getting provider info for ID: ${providerId}`);
      const response = await this.get(`/users/${providerId}`);
      return response;
    } catch (error) {
      console.error("[OfferService] Error getting provider info:", {
        providerId,
        error: error.message,
        status: error.response?.status,
      });
      return null;
    }
  }

  // Получение списка категорий
  static async fetchCategories() {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || ""}/api/services/categories`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("[OfferService] Error fetching categories:", error);
      return [];
    }
  }

  // Получение статистики категорий
  static async getCategoryStats() {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || ""}/api/services/categories/stats`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("[OfferService] Error fetching category stats:", error);
      return { stats: [] };
    }
  }

  // Получение топ-категорий
  static async getTopCategories(limit = 5) {
    try {
      console.log(`[OfferService] Fetching top ${limit} categories`);
      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || ""
        }/api/services/categories/top?limit=${limit}`
      );
      const data = await response.json();
      console.log("[OfferService] Top categories response:", data);
      return data;
    } catch (error) {
      console.error("[OfferService] Error fetching top categories:", error);
      console.log("[OfferService] Returning mock data for top categories");
      return {
        categories: [
          {
            id: "1",
            name: "healthcare",
            label: "Медицина",
            count: 12,
            hasImage: true,
            imageUrl: "/uploads/images/healthcare.jpg",
          },
          {
            id: "2",
            name: "household",
            label: "Бытовые услуги",
            count: 8,
            hasImage: true,
            imageUrl: "/uploads/images/household.jpg",
          },
          {
            id: "3",
            name: "finance",
            label: "Финансы",
            count: 6,
            hasImage: true,
            imageUrl: "/uploads/images/finance.jpg",
          },
          {
            id: "4",
            name: "education",
            label: "Образование",
            count: 5,
            hasImage: true,
            imageUrl: "/uploads/images/education.jpg",
          },
          {
            id: "5",
            name: "transport",
            label: "Транспорт",
            count: 3,
            hasImage: true,
            imageUrl: "/uploads/images/transport.jpg",
          },
        ],
        totalCategories: 10,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export default new OfferService();
