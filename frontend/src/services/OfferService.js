import { BaseService } from "./BaseService";

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
    console.log("[OfferService] Fetching offers with params:", {
      page,
      limit,
      minPrice,
      maxPrice,
      location,
      category,
    });
    return this.get("/offers", {
      page,
      limit,
      minPrice,
      maxPrice,
      location,
      category,
    });
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
    console.log("[OfferService] Fetching categories with counts");
    const response = await this.get("/categories");
    console.log("[OfferService] Categories response:", response);
    return response;
  }

  async fetchCategoryCounts() {
    try {
      console.log("[OfferService] Fetching category counts");
      const response = await this.get("/categories/counts");
      console.log("[OfferService] Category counts received:", response.data);
      return response.data;
    } catch (error) {
      console.error("[OfferService] Error fetching category counts:", error);
      throw error;
    }
  }

  async fetchFavorites() {
    console.log("[OfferService] Fetching favorites");
    try {
      // Проверим, есть ли токен аутентификации
      const token = localStorage.getItem("token");
      if (!token) {
        console.log(
          "[OfferService] No authentication token, returning empty favorites"
        );
        localStorage.removeItem("userFavorites");
        return {};
      }

      const response = await this.get("/favorites");
      console.log("[OfferService] Favorites fetched successfully:", response);

      const favoritesMap = {};
      response.forEach((offer) => {
        if (offer && offer._id) {
          favoritesMap[offer._id] = true;
        }
      });

      // Сохраняем в localStorage для восстановления после перезагрузки
      localStorage.setItem("userFavorites", JSON.stringify(favoritesMap));

      return favoritesMap;
    } catch (error) {
      console.error("[OfferService] Error fetching favorites:", error);

      // В случае ошибки, пробуем восстановить из localStorage
      try {
        const cachedFavorites = localStorage.getItem("userFavorites");
        if (cachedFavorites) {
          const parsed = JSON.parse(cachedFavorites);
          console.log(
            "[OfferService] Using cached favorites from localStorage:",
            parsed
          );
          return parsed;
        }
      } catch (e) {
        console.error("[OfferService] Error parsing cached favorites:", e);
      }

      return {};
    }
  }

  async toggleFavorite(offerId, offerType = "offer") {
    console.log("[OfferService] Toggling favorite for offer:", offerId);
    if (!offerId) {
      console.error("Missing offerId for toggleFavorite");
      return { isFavorite: false };
    }

    try {
      const serverOfferType =
        offerType === "offer"
          ? "Offer"
          : offerType === "service_offer"
          ? "ServiceOffer"
          : offerType;

      console.log(
        `[OfferService] Using server offerType: '${serverOfferType}' (original: '${offerType}')`
      );

      const response = await this.post("/favorites", {
        offerId,
        offerType: serverOfferType,
      });

      // Убедимся, что у нас всегда есть поле isFavorite в ответе
      const isFavorite =
        response && typeof response.isFavorite === "boolean"
          ? response.isFavorite
          : response &&
            response.message &&
            response.message.includes("Added to favorites");

      console.log("[OfferService] Favorite toggled successfully:", {
        response,
        explicitIsFavorite: isFavorite,
      });

      // Обновляем localStorage после каждого изменения
      try {
        const cachedFavorites = localStorage.getItem("userFavorites");
        let favorites = {};

        if (cachedFavorites) {
          favorites = JSON.parse(cachedFavorites);
        }

        if (isFavorite) {
          favorites[offerId] = true;
        } else {
          delete favorites[offerId];
        }

        localStorage.setItem("userFavorites", JSON.stringify(favorites));
      } catch (e) {
        console.error(
          "[OfferService] Error updating favorites in localStorage:",
          e
        );
      }

      return {
        isFavorite: isFavorite,
        message: response.message || "",
      };
    } catch (error) {
      console.error("[OfferService] Error toggling favorite:", error);
      return { isFavorite: false, error: error.message };
    }
  }
}

export default new OfferService();
