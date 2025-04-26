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
      console.log(`[ChatService] Requesting messages for request ${requestId}`);

      // Сначала пытаемся получить сообщения из кеша
      const cachedMessages = await CacheService.getCachedMessages(requestId);
      console.log(
        `[ChatService] Retrieved ${cachedMessages.length} cached messages for request ${requestId}`
      );

      // API endpoint для сообщений - /api/messages/request/:requestId
      // Нужно использовать absolute path, так как здесь идет обращение к другому API
      const url = `/api/messages/request/${requestId}`;
      console.log(`[ChatService] Making GET request to absolute URL: ${url}`);

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
          console.log(
            `[ChatService] Using ${cachedMessages.length} cached messages for request ${requestId}`
          );
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
      console.log(
        `[ChatService] Making direct fetch request for my chats to: ${url}`
      );

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
      console.log(
        `[ChatService] Retrieved ${chats.length} chats for current user`
      );

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
          console.log(`[ChatService] Using ${cachedChats.length} cached chats`);
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
      console.log(`Retrieved ${chats.length} chats for provider`);

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
          console.log(
            `[ChatService] Using ${cachedChats.length} cached provider chats`
          );
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
      console.log(`[ChatService] Making direct fetch request to: ${url}`);

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
      console.log(`[ChatService] Unread notifications count: ${data.count}`);
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
      } catch (cacheError) {
        console.error(
          "[ChatService] Error counting from cached chats:",
          cacheError
        );
        return 0;
      }
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

      const result = await this.post(`/chat/messages/${requestId}`, {
        message,
        recipientId: normalizedRecipientId,
      });

      console.log(
        `[ChatService] Message sent to ${normalizedRecipientId} for request ${requestId}`
      );

      // Кешируем отправленное сообщение
      if (result && result._id) {
        await CacheService.cacheMessages([result]);
      }

      return result;
    } catch (error) {
      console.error(
        `[ChatService] Error sending message to ${normalizedRecipientId} for request ${requestId}:`,
        error
      );

      // Сохраняем сообщение локально для последующей синхронизации
      try {
        const pendingMessage = {
          _id: `pending-${Date.now()}`,
          requestId,
          message,
          recipientId: normalizedRecipientId,
          senderId: localStorage.getItem("userId"),
          timestamp: new Date().toISOString(),
          pending: true,
        };

        // Сохраняем во временное хранилище
        await CacheService.cacheMessages([pendingMessage]);
        console.log(`[ChatService] Message saved for offline sync`);
      } catch (cacheError) {
        console.error(
          "[ChatService] Error saving pending message:",
          cacheError
        );
      }

      throw error;
    }
  }

  /**
   * Отметка сообщений как прочитанных
   * @param {string} requestId - ID запроса
   * @param {Array<string>} messageIds - Массив ID сообщений для отметки
   * @returns {Promise<Object>} - Результат операции
   */
  async markMessagesAsRead(requestId, messageIds) {
    if (!requestId || !messageIds || !messageIds.length) {
      console.error(
        "[ChatService] Missing required parameters for markMessagesAsRead",
        {
          requestId,
          messageIds,
        }
      );
      throw new Error("Missing required parameters for markMessagesAsRead");
    }

    try {
      console.log(
        `[ChatService] Marking ${messageIds.length} messages as read for request ${requestId}`
      );

      // Используем API endpoint для отметки сообщений как прочитанных
      const url = `/api/messages/read`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          messageIds,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log(
        `[ChatService] Successfully marked messages as read:`,
        result
      );

      // Обновляем статус в кеше
      try {
        const cachedMessages = await CacheService.getCachedMessages(requestId);
        const updatedMessages = cachedMessages.map((msg) => {
          if (messageIds.includes(msg._id)) {
            return { ...msg, read: true };
          }
          return msg;
        });

        await CacheService.cacheMessages(updatedMessages);
      } catch (cacheError) {
        console.error(
          "[ChatService] Error updating cache after mark as read:",
          cacheError
        );
      }

      return result;
    } catch (error) {
      console.error(
        `[ChatService] Error marking messages as read for request ${requestId}:`,
        error.response?.data || error.message || error
      );
      throw error;
    }
  }

  /**
   * Синхронизация локального кеша с сервером
   * @returns {Promise<boolean>} - Результат операции
   */
  async syncOfflineMessages() {
    try {
      // Получаем все сообщения из кеша
      const cachedMessages = await CacheService.getAllMessages();

      // Ищем сообщения со статусом pending
      const pendingMessages = cachedMessages.filter((msg) => msg.pending);

      if (pendingMessages.length === 0) {
        console.log("[ChatService] No pending messages to sync");
        return true;
      }

      console.log(
        `[ChatService] Syncing ${pendingMessages.length} pending messages`
      );

      // Отправляем каждое сообщение
      for (const msg of pendingMessages) {
        try {
          await this.sendMessage(msg.requestId, msg.message, msg.recipientId);

          // Удаляем сообщение из списка pending
          await CacheService.removeMessage(msg._id);
        } catch (error) {
          console.error(
            `[ChatService] Error syncing pending message ${msg._id}:`,
            error
          );
        }
      }

      return true;
    } catch (error) {
      console.error("[ChatService] Error syncing offline messages:", error);
      return false;
    }
  }
}

const ChatService = new ChatServiceClass();
export default ChatService;
