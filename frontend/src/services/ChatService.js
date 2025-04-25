import { BaseService } from "./BaseService";

class ChatServiceClass extends BaseService {
  constructor() {
    super("/services"); // Используем тот же базовый путь, что и в OfferService
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
      console.log(`[ChatService] Requesting messages for request ${requestId}`);

      // API endpoint для сообщений - /api/messages/request/:requestId
      // Нужно использовать absolute path, так как здесь идет обращение к другому API
      const url = `/api/messages/request/${requestId}`;
      console.log(`[ChatService] Making GET request to absolute URL: ${url}`);

      // Используем axios напрямую для абсолютного пути
      const startTime = Date.now();
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const messages = await response.json();
      const endTime = Date.now();

      console.log(
        `[ChatService] Retrieved ${
          messages.length
        } messages for request ${requestId} in ${endTime - startTime}ms`
      );

      // Проверяем тип данных и структуру первого сообщения
      if (messages.length > 0) {
        const sampleMsg = messages[0];
        console.log(`[ChatService] Sample message structure:`, {
          id: sampleMsg._id,
          hasText: !!sampleMsg.text,
          hasMessage: !!sampleMsg.message,
          hasSenderId: !!sampleMsg.senderId,
          hasRecipientId: !!sampleMsg.recipientId,
          fullObject: sampleMsg,
        });
      } else {
        console.log(`[ChatService] No messages returned from API`);
      }

      return messages;
    } catch (error) {
      console.error(
        `[ChatService] Error retrieving messages for request ${requestId}:`,
        error.response?.data || error.message || error
      );

      // Логируем детали ошибки
      if (error.response) {
        console.error(
          `[ChatService] Server responded with status ${error.response.status}`
        );
        console.error(`[ChatService] Response data:`, error.response.data);
      } else if (error.request) {
        console.error(`[ChatService] No response received from server`);
        console.error(`[ChatService] Request details:`, error.request);
      }

      // Возвращаем пустой массив вместо ошибки для более надежной работы UI
      return [];
    }
  }

  /**
   * Получение списка чатов текущего пользователя
   * @returns {Promise<Array>} - Массив чатов пользователя
   */
  async getMyChats() {
    try {
      const chats = await this.get("/my-chats");
      console.log(`Retrieved ${chats.length} chats for current user`);
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
      const chats = await this.get("/provider-chats");
      console.log(`Retrieved ${chats.length} chats for provider`);
      return chats;
    } catch (error) {
      console.error("Error retrieving provider chats:", error);
      return [];
    }
  }

  /**
   * Отправка сообщения через REST API (не через сокеты)
   * Используется как запасной вариант, если сокеты недоступны
   * @param {string} requestId - ID запроса
   * @param {string} message - Текст сообщения
   * @param {string|object} recipientId - ID получателя
   * @returns {Promise<Object>} - Результат отправки сообщения
   */
  async sendMessage(requestId, message, recipientId) {
    if (!requestId || !message || !recipientId) {
      console.error(
        "[ChatService] Missing required parameters for sendMessage",
        {
          requestId,
          message,
          recipientId,
        }
      );
      throw new Error("Missing required parameters for sendMessage");
    }

    // Нормализуем recipientId, чтобы гарантировать, что это строка
    let normalizedRecipientId = recipientId;
    if (typeof recipientId === "object") {
      if (recipientId._id) {
        normalizedRecipientId = recipientId._id.toString();
      } else {
        console.error("[ChatService] Invalid recipientId format:", recipientId);
        throw new Error("Invalid recipientId format");
      }
    }

    try {
      console.log(
        `[ChatService] Sending message via API to recipient ${normalizedRecipientId} for request ${requestId}`
      );

      const result = await this.post(`/messages/${requestId}`, {
        message,
        recipientId: normalizedRecipientId,
      });

      console.log(
        `[ChatService] Message sent to ${normalizedRecipientId} for request ${requestId}`
      );
      return result;
    } catch (error) {
      console.error(
        `[ChatService] Error sending message to ${normalizedRecipientId} for request ${requestId}:`,
        error
      );
      throw error;
    }
  }
}

const ChatService = new ChatServiceClass();
export default ChatService;
