import api from "../middleware/api";

const TariffService = {
  async getAll() {
    try {
      const res = await api.get("/tariffs");
      return res.data;
    } catch (error) {
      console.error(
        "Error getting tariffs:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
  async create(data) {
    try {
      console.log("Creating tariff with data:", data);
      const res = await api.post("/tariffs", data);
      return res.data;
    } catch (error) {
      console.error(
        "Error creating tariff:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
  async update(id, data) {
    try {
      const res = await api.put(`/tariffs/${id}`, data);
      return res.data;
    } catch (error) {
      console.error(
        "Error updating tariff:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
  async delete(id) {
    try {
      const res = await api.delete(`/tariffs/${id}`);
      return res.data;
    } catch (error) {
      console.error(
        "Error deleting tariff:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
  async toggleActive(id) {
    try {
      const res = await api.patch(`/tariffs/${id}/toggle`);
      return res.data;
    } catch (error) {
      console.error(
        "Error toggling tariff:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
  // Получить тарифы для продвижения
  async getPromotionTariffs() {
    const response = await api.get("/tariffs", {
      params: { type: "promotion" },
    });
    return response.data;
  },
  // Получить тарифы для подписки
  async getSubscriptionTariffs() {
    const response = await api.get("/tariffs", {
      params: { type: "subscription" },
    });
    return response.data;
  },
};

export default TariffService;
