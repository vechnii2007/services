/**
 * Сервис для локального кеширования данных
 * Используется для повышения производительности и работы в офлайн-режиме
 */
class CacheService {
  constructor() {
    this.DB_NAME = "uniserv_cache";
    this.DB_VERSION = 1;
    this.STORES = {
      MESSAGES: "messages",
      NOTIFICATIONS: "notifications",
      CHATS: "chats",
      USER_DATA: "userData",
    };

    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Инициализация IndexedDB
   * @returns {Promise<IDBDatabase>} - Промис с инициализированной БД
   */
  async initDB() {
    if (this.isInitialized) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.error(
          "[CacheService] IndexedDB is not supported in this browser"
        );
        reject(new Error("IndexedDB is not supported"));
        return;
      }

      const request = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = (event) => {
        console.error(
          "[CacheService] Error opening IndexedDB:",
          event.target.error
        );
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isInitialized = true;
        console.log("[CacheService] IndexedDB initialized successfully");
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Создаем хранилища объектов при первой инициализации или обновлении версии
        if (!db.objectStoreNames.contains(this.STORES.MESSAGES)) {
          const messagesStore = db.createObjectStore(this.STORES.MESSAGES, {
            keyPath: "_id",
          });
          messagesStore.createIndex("requestId", "requestId", {
            unique: false,
          });
          messagesStore.createIndex("timestamp", "timestamp", {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains(this.STORES.NOTIFICATIONS)) {
          const notificationsStore = db.createObjectStore(
            this.STORES.NOTIFICATIONS,
            { keyPath: "_id" }
          );
          notificationsStore.createIndex("createdAt", "createdAt", {
            unique: false,
          });
          notificationsStore.createIndex("read", "read", { unique: false });
        }

        if (!db.objectStoreNames.contains(this.STORES.CHATS)) {
          const chatsStore = db.createObjectStore(this.STORES.CHATS, {
            keyPath: "_id",
          });
          chatsStore.createIndex("updatedAt", "updatedAt", { unique: false });
        }

        if (!db.objectStoreNames.contains(this.STORES.USER_DATA)) {
          db.createObjectStore(this.STORES.USER_DATA, { keyPath: "key" });
        }

        console.log("[CacheService] Database structure updated");
      };
    });
  }

  /**
   * Сохранение сообщений в кеш
   * @param {Array} messages - Массив сообщений для сохранения
   * @returns {Promise<void>}
   */
  async cacheMessages(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
      return;
    }

    try {
      await this.initDB();
      const tx = this.db.transaction(this.STORES.MESSAGES, "readwrite");
      const store = tx.objectStore(this.STORES.MESSAGES);

      for (const message of messages) {
        if (!message._id) {
          console.warn("[CacheService] Message missing ID, skipping:", message);
          continue;
        }

        // Устанавливаем временную метку для сортировки
        if (!message.timestamp) {
          message.timestamp = new Date().toISOString();
        }

        store.put(message);
      }

      await new Promise((resolve, reject) => {
        tx.oncomplete = () => {
          console.log(
            `[CacheService] Successfully cached ${messages.length} messages`
          );
          resolve();
        };
        tx.onerror = (event) => {
          console.error(
            "[CacheService] Error caching messages:",
            event.target.error
          );
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("[CacheService] Failed to cache messages:", error);
    }
  }

  /**
   * Получение всех сообщений из кеша
   * @returns {Promise<Array>} - Массив всех сообщений
   */
  async getAllMessages() {
    try {
      await this.initDB();
      const tx = this.db.transaction(this.STORES.MESSAGES, "readonly");
      const store = tx.objectStore(this.STORES.MESSAGES);
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const messages = request.result || [];
          console.log(
            `[CacheService] Retrieved ${messages.length} cached messages`
          );
          resolve(messages);
        };
        request.onerror = (event) => {
          console.error(
            "[CacheService] Error retrieving all cached messages:",
            event.target.error
          );
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("[CacheService] Failed to get all cached messages:", error);
      return [];
    }
  }

  /**
   * Получение сообщений для конкретного запроса из кеша
   * @param {string} requestId - ID запроса
   * @returns {Promise<Array>} - Массив сообщений
   */
  async getCachedMessages(requestId) {
    if (!requestId) {
      return [];
    }

    try {
      await this.initDB();
      const tx = this.db.transaction(this.STORES.MESSAGES, "readonly");
      const store = tx.objectStore(this.STORES.MESSAGES);
      const index = store.index("requestId");
      const request = index.getAll(requestId);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const messages = request.result || [];
          // Сортируем сообщения по времени
          messages.sort((a, b) => {
            const dateA = new Date(a.timestamp || a.createdAt);
            const dateB = new Date(b.timestamp || b.createdAt);
            return dateA - dateB;
          });

          console.log(
            `[CacheService] Retrieved ${messages.length} cached messages for request ${requestId}`
          );
          resolve(messages);
        };
        request.onerror = (event) => {
          console.error(
            "[CacheService] Error retrieving cached messages:",
            event.target.error
          );
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error(
        `[CacheService] Failed to get cached messages for ${requestId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Удаление сообщения из кеша
   * @param {string} messageId - ID сообщения для удаления
   * @returns {Promise<boolean>} - Результат операции
   */
  async removeMessage(messageId) {
    if (!messageId) {
      return false;
    }

    try {
      await this.initDB();
      const tx = this.db.transaction(this.STORES.MESSAGES, "readwrite");
      const store = tx.objectStore(this.STORES.MESSAGES);

      return new Promise((resolve, reject) => {
        const request = store.delete(messageId);

        request.onsuccess = () => {
          console.log(
            `[CacheService] Successfully removed message ${messageId} from cache`
          );
          resolve(true);
        };

        request.onerror = (event) => {
          console.error(
            `[CacheService] Error removing message ${messageId}:`,
            event.target.error
          );
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error(
        `[CacheService] Failed to remove message ${messageId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Сохранение чатов в кеш
   * @param {Array} chats - Массив чатов для сохранения
   * @returns {Promise<void>}
   */
  async cacheChats(chats) {
    if (!Array.isArray(chats) || chats.length === 0) {
      return;
    }

    try {
      await this.initDB();
      const tx = this.db.transaction(this.STORES.CHATS, "readwrite");
      const store = tx.objectStore(this.STORES.CHATS);

      for (const chat of chats) {
        if (!chat._id) {
          console.warn("[CacheService] Chat missing ID, skipping:", chat);
          continue;
        }

        // Устанавливаем временную метку для сортировки
        if (!chat.updatedAt) {
          chat.updatedAt = new Date().toISOString();
        }

        store.put(chat);
      }

      await new Promise((resolve, reject) => {
        tx.oncomplete = () => {
          console.log(
            `[CacheService] Successfully cached ${chats.length} chats`
          );
          resolve();
        };
        tx.onerror = (event) => {
          console.error(
            "[CacheService] Error caching chats:",
            event.target.error
          );
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("[CacheService] Failed to cache chats:", error);
    }
  }

  /**
   * Получение кешированных чатов
   * @returns {Promise<Array>} - Массив чатов
   */
  async getCachedChats() {
    try {
      await this.initDB();
      const tx = this.db.transaction(this.STORES.CHATS, "readonly");
      const store = tx.objectStore(this.STORES.CHATS);

      // Получаем все чаты, отсортированные по дате обновления
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          let chats = request.result || [];

          // Сортируем чаты по времени обновления (новые в начале)
          chats.sort((a, b) => {
            const dateA = new Date(a.updatedAt);
            const dateB = new Date(b.updatedAt);
            return dateB - dateA;
          });

          console.log(`[CacheService] Retrieved ${chats.length} cached chats`);
          resolve(chats);
        };
        request.onerror = (event) => {
          console.error(
            "[CacheService] Error retrieving cached chats:",
            event.target.error
          );
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("[CacheService] Failed to get cached chats:", error);
      return [];
    }
  }

  /**
   * Обновление статуса уведомления (прочитано/не прочитано)
   * @param {string} notificationId - ID уведомления
   * @param {boolean} read - Статус прочтения
   * @returns {Promise<boolean>} - Результат операции
   */
  async updateNotificationStatus(notificationId, read = true) {
    if (!notificationId) {
      return false;
    }

    try {
      await this.initDB();
      const tx = this.db.transaction(this.STORES.NOTIFICATIONS, "readwrite");
      const store = tx.objectStore(this.STORES.NOTIFICATIONS);
      const request = store.get(notificationId);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const notification = request.result;
          if (!notification) {
            console.warn(
              `[CacheService] Notification ${notificationId} not found in cache`
            );
            resolve(false);
            return;
          }

          notification.read = read;
          const updateRequest = store.put(notification);

          updateRequest.onsuccess = () => {
            console.log(
              `[CacheService] Updated notification ${notificationId} read status to ${read}`
            );
            resolve(true);
          };

          updateRequest.onerror = (event) => {
            console.error(
              "[CacheService] Error updating notification status:",
              event.target.error
            );
            reject(event.target.error);
          };
        };

        request.onerror = (event) => {
          console.error(
            "[CacheService] Error getting notification:",
            event.target.error
          );
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error(
        `[CacheService] Failed to update notification ${notificationId} status:`,
        error
      );
      return false;
    }
  }

  /**
   * Очистка всех данных из кеша
   * @returns {Promise<boolean>} - Результат операции
   */
  async clearCache() {
    try {
      await this.initDB();
      const stores = Object.values(this.STORES);

      for (const storeName of stores) {
        const tx = this.db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        store.clear();

        await new Promise((resolve, reject) => {
          tx.oncomplete = resolve;
          tx.onerror = reject;
        });
      }

      console.log("[CacheService] Cache cleared successfully");
      return true;
    } catch (error) {
      console.error("[CacheService] Error clearing cache:", error);
      return false;
    }
  }
}

const cacheService = new CacheService();
export default cacheService;
