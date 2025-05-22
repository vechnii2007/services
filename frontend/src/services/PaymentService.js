import api from "../config/api";

class PaymentService {
  // Создание платежа
  static async create(paymentData) {
    const response = await api.post("/payments", paymentData);
    return response.data;
  }

  // Получение всех платежей (для админа)
  static async getAll(params) {
    try {
      const response = await api.get("/payments", { params });
      return response.data;
    } catch (error) {
      console.error(
        "Error getting payments:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Получение платежа по ID
  static async getPaymentById(paymentId) {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  }

  // Получение платежей пользователя
  static async getUserPayments(userId, params = {}) {
    const response = await api.get(`/payments/user/${userId}`, { params });
    return response.data;
  }

  // Обновление статуса платежа (для админа)
  static async updateStatus(id, status) {
    try {
      const response = await api.patch(`/payments/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(
        "Error updating payment status:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Получение статистики (для админа)
  static async getStats(params) {
    try {
      const response = await api.get("/payments/stats", { params });
      return response.data;
    } catch (error) {
      console.error(
        "Error getting payment stats:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Форматирование суммы
  static formatAmount(amount) {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  }

  // Форматирование даты
  static formatDate(date) {
    return new Intl.DateTimeFormat("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  // Получение статуса платежа для отображения
  static getStatusColor(status) {
    switch (status) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "error";
      case "refunded":
        return "info";
      default:
        return "default";
    }
  }

  static async checkPaymentStatus(paymentId) {
    const response = await api.get(`/payments/${paymentId}/status`);
    return response.data;
  }
}

export default PaymentService;
