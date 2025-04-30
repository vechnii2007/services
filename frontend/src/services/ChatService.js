import BaseService from "./BaseService";
import CacheService from "./CacheService";
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
      // Сначала пытаемся получить сообщения из кеша
      const cachedMessages = await CacheService.getCachedMessages(requestId);

      try {
        const response = await api.get(`/messages/request/${requestId}`);
        const messages = response.data;

        // Кешируем полученные сообщения
        await CacheService.cacheMessages(messages);

        return messages;
      } catch (error) {
        console.error(
          `[ChatService] Error retrieving messages from API, using cache:`,
          error.response?.data || error.message || error
        );

        // Если API-запрос не удался, возвращаем кешированные данные
        if (cachedMessages.length > 0) {
          return cachedMessages;
        }

        throw error; // Пробрасываем ошибку, если нет кешированных данных
      }
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
      const response = await api.get("/services/my-chats");
      const chats = response.data;

      // Кешируем полученные чаты
      if (chats.length > 0) {
        await CacheService.cacheChats(chats);
      }

      return chats;
    } catch (error) {
      console.error("Error retrieving user chats:", error);

      // Пытаемся получить чаты из кеша
      try {
        const cachedChats = await CacheService.getCachedChats();
        if (cachedChats.length > 0) {
          return cachedChats;
        }
      } catch (cacheError) {
        console.error(
          "[ChatService] Error retrieving cached chats:",
          cacheError
        );
      }

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

      // Кешируем полученные чаты провайдера
      if (chats.length > 0) {
        await CacheService.cacheChats(chats);
      }

      return chats;
    } catch (error) {
      console.error("Error retrieving provider chats:", error);

      // Пытаемся получить чаты из кеша
      try {
        const cachedChats = await CacheService.getCachedChats();
        if (cachedChats.length > 0) {
          return cachedChats;
        }
      } catch (cacheError) {
        console.error(
          "[ChatService] Error retrieving cached provider chats:",
          cacheError
        );
      }

      return [];
    }
  }

  /**
   * Получение общего количества непрочитанных сообщений
   * @returns {Promise<number>} - Количество непрочитанных сообщений
   */
  async getUnreadMessagesCount() {
    try {
      const response = await api.get("/notifications/unread/count");
      const data = response.data;
      return data.count || 0;
    } catch (error) {
      console.error(
        "[ChatService] Error getting unread messages count:",
        error
      );

      // Если запрос не удался, считаем локально по кэшированным чатам
      try {
        const chats = await this.getMyChats();
        let count = 0;

        if (Array.isArray(chats)) {
          chats.forEach((chat) => {
            if (chat.unreadCount) {
              count += chat.unreadCount;
            }
          });
        }

        return count;
      } catch (countError) {
        console.error(
          "[ChatService] Error counting cached unread messages:",
          countError
        );
        return 0;
      }
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
      await CacheService.cacheMessages([sentMessage]);
      return sentMessage;
    } catch (error) {
      console.error("[ChatService] Error sending message:", error);
      // Если сообщение не удалось отправить, сохраняем для offline sync
      try {
        const offlineMessage = {
          requestId,
          message,
          recipientId,
          pending: true,
          createdAt: new Date().toISOString(),
          _id: `pending_${Date.now()}`,
        };
        await CacheService.savePendingMessage(offlineMessage);
        return offlineMessage;
      } catch (cacheError) {
        console.error(
          "[ChatService] Error caching offline message:",
          cacheError
        );
        throw error;
      }
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
      try {
        await CacheService.updateMessagesReadStatus(messageIds);
      } catch (cacheError) {
        console.error(
          "[ChatService] Error updating cached messages read status:",
          cacheError
        );
      }
      return result.success;
    } catch (error) {
      console.error(
        "[ChatService] Error marking messages as read:",
        error.response?.data || error.message || error
      );
      return false;
    }
  }

  /**
   * Синхронизация оффлайн-сообщений с сервером
   * @returns {Promise<number>} - Количество синхронизированных сообщений
   */
  async syncOfflineMessages() {
    try {
      const pendingMessages = await CacheService.getPendingMessages();
      if (!pendingMessages.length) {
        return 0;
      }
      let syncedCount = 0;
      for (const message of pendingMessages) {
        try {
          const sentMessage = await this.sendMessage(
            message.requestId,
            message.message,
            message.recipientId
          );
          if (sentMessage && !sentMessage.pending) {
            await CacheService.removePendingMessage(message._id);
            syncedCount++;
          }
        } catch (error) {
          console.error(
            `[ChatService] Error syncing offline message ${message._id}:`,
            error
          );
        }
      }
      return syncedCount;
    } catch (error) {
      console.error("[ChatService] Error syncing offline messages:", error);
      return 0;
    }
  }
}

const ChatService = new ChatServiceClass();
export default ChatService;
