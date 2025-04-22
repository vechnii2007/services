import { useState, useCallback } from "react";
import api from "../middleware/api";

export const usePromotions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Получение списка доступных опций продвижения
  const getPromotionOptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Getting promotion options...");
      const response = await api.get("options");
      console.log("Promotion options response:", response.data);
      return response.data;
    } catch (err) {
      console.error("Error getting promotion options:", err);
      setError(
        err.response?.data?.message || "Ошибка при получении опций продвижения"
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Получение статуса продвижений для объявления
  const getPromotionStatus = useCallback(async (offerId) => {
    try {
      setLoading(true);
      setError(null);
      console.log("Getting promotion status for offer:", offerId);
      const response = await api.get(`offers/${offerId}/promotions/status`);
      console.log("Promotion status response:", response.data);
      return response.data;
    } catch (err) {
      console.error("Error getting promotion status:", err);
      setError(
        err.response?.data?.message ||
          "Ошибка при получении статуса продвижений"
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Создание нового продвижения
  const createPromotion = useCallback(async (offerId, type) => {
    try {
      setLoading(true);
      setError(null);
      console.log("Creating promotion for offer:", { offerId, type });
      const url = `offers/${offerId}/promotions`;
      console.log("Request URL:", url);
      const response = await api.post(url, { type });
      console.log("Create promotion response:", response.data);
      return response.data;
    } catch (err) {
      console.error("Error creating promotion:", err);
      console.error("Error details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      setError(
        err.response?.data?.message || "Ошибка при создании продвижения"
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Отмена продвижения
  const cancelPromotion = useCallback(async (offerId, type) => {
    try {
      setLoading(true);
      setError(null);
      console.log("Canceling promotion:", { offerId, type });
      const response = await api.delete(`offers/${offerId}/promotions/${type}`);
      console.log("Cancel promotion response:", response.data);
      return response.data;
    } catch (err) {
      console.error("Error canceling promotion:", err);
      setError(err.response?.data?.message || "Ошибка при отмене продвижения");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getPromotionOptions,
    getPromotionStatus,
    createPromotion,
    cancelPromotion,
  };
};
