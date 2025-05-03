import BaseService from "./BaseService";
import api from "./api";

class ChatServiceClass extends BaseService {
  constructor() {
    super("/services"); // Используем /services как базовый путь для совместимости с BaseService
  }

  /**
   * Получение сообщений для указанного requestId
   * @param {string} requestId - ID запроса
   * @returns {Promise<Array>} - Массив сообщений
   */
  async getMessages(requestId) {
    if (!requestId) {
      console.error("[ChatService] No requestId provided for getMessages");
      return [];
    }
    try {
      // Удаляю кэш: всегда только с сервера
      const response = await api.get(`/messages/request/${requestId}`);
      const messages = response.data;
      return messages;
    } catch (error) {
      console.error(
        `[ChatService] Error retrieving messages from API:`,
        error.response?.data || error.message || error
      );
      return [];
    }
  }

  /**
   * Получение списка чатов текущего пользователя
   * @returns {Promise<Array>} - Массив чатов пользователя
   */
  async getMyChats() {
    try {
      const response = await api.get("/services/my-chats");
      const chats = response.data;
      return chats;
    } catch (error) {
      console.error("Error retrieving user chats:", error);
      return [];
    }
  }

  /**
   * Получение списка чатов для провайдера услуг
   * @returns {Promise<Array>} - Массив чатов провайдера
   */
  async getProviderChats() {
    try {
      const response = await api.get("/services/provider-chats");
      const chats = response.data;
      return chats;
    } catch (error) {
      console.error("Error retrieving provider chats:", error);
      return [];
    }
  }

  /**
   * Отправка сообщения
   * @param {string} requestId - ID запроса
   * @param {string} message - Текст сообщения
   * @param {string} recipientId - ID получателя
   * @returns {Promise<object>} - Отправленное сообщение
   */
  async sendMessage(requestId, message, recipientId) {
    try {
      const messageData = {
        requestId,
        message,
        recipientId,
      };
      const response = await api.post("/messages", messageData);
      const sentMessage = response.data;
      return sentMessage;
    } catch (error) {
      console.error("[ChatService] Error sending message:", error);
      return null;
    }
  }

  /**
   * Отметить сообщения как прочитанные
   * @param {string} requestId - ID запроса
   * @param {Array<string>} messageIds - Массив ID сообщений
   * @returns {Promise<boolean>} - Результат операции
   */
  async markMessagesAsRead(requestId, messageIds) {
    if (!messageIds || !messageIds.length) {
      console.error(
        "[ChatService] No message IDs provided for markMessagesAsRead"
      );
      return false;
    }
    try {
      const response = await api.post("/messages/mark-read", { messageIds });
      const result = response.data;
      return result.success;
    } catch (error) {
      console.error(
        "[ChatService] Error marking messages as read:",
        error.response?.data || error.message || error
      );
      return false;
    }
  }
}

const ChatService = new ChatServiceClass();
export default ChatService;
