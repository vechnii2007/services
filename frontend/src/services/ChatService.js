import BaseService from "./BaseService";
import CacheService from "./CacheService";

class ChatServiceClass extends BaseService {
  constructor() {
    super("/services"); // Используем /services как базовый путь
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

      // API endpoint для сообщений - /api/messages/request/:requestId
      // Нужно использовать absolute path, так как здесь идет обращение к другому API
      const url = `/api/messages/request/${requestId}`;

      try {
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
      // Используем метод из serviceRoutes, поскольку отдельного API для чатов не установлено
      const url = "/api/services/my-chats";

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const chats = await response.json();

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
      const chats = await this.get("/chat/provider-chats");

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
      // Использую сервис уведомлений, так как отдельного API для непрочитанных сообщений нет
      const url = "/api/notifications/unread/count";

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
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
      // Endpoint для отправки сообщений - /api/messages
      const url = "/api/messages";

      const messageData = {
        requestId,
        text: message,
        recipientId,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const sentMessage = await response.json();

      // Кешируем отправленное сообщение
      await CacheService.cacheMessages([sentMessage]);

      return sentMessage;
    } catch (error) {
      console.error("[ChatService] Error sending message:", error);

      // Если сообщение не удалось отправить, сохраняем для offline sync
      try {
        const offlineMessage = {
          requestId,
          text: message,
          recipientId,
          pending: true,
          createdAt: new Date().toISOString(),
          _id: `pending_${Date.now()}`, // Временный ID для отслеживания
        };

        // Сохраняем сообщение локально для синхронизации позже
        await CacheService.savePendingMessage(offlineMessage);

        return offlineMessage;
      } catch (cacheError) {
        console.error(
          "[ChatService] Error caching offline message:",
          cacheError
        );
        throw error; // Пробрасываем исходную ошибку
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
      const url = "/api/messages/mark-read";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messageIds }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();

      // Обновляем статус в кэше
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

      // Обрабатываем каждое сообщение отдельно
      for (const message of pendingMessages) {
        try {
          // Отправляем сообщение
          const sentMessage = await this.sendMessage(
            message.requestId,
            message.text,
            message.recipientId
          );

          if (sentMessage && !sentMessage.pending) {
            // Удаляем pending-сообщение из кэша
            await CacheService.removePendingMessage(message._id);
            syncedCount++;
          }
        } catch (error) {
          console.error(
            `[ChatService] Error syncing offline message ${message._id}:`,
            error
          );
          // Продолжаем с другими сообщениями
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
