/**
 * Нормализует ID, преобразуя его в строку
 * @param {string|object} id - ID для нормализации
 * @returns {string} Нормализованный ID
 */
export const normalizeId = (id) => {
  if (!id) return "";
  if (typeof id === "object") {
    return id._id?.toString() || "";
  }
  return id.toString();
};

/**
 * Нормализует сообщение к единому формату
 * @param {object} message - Исходное сообщение
 * @returns {object} Нормализованное сообщение
 */
export const normalizeMessage = (message) => {
  if (!message) return null;

  try {
    const senderId = normalizeId(message.senderId || message.sender);
    const recipientId = normalizeId(message.recipientId || message.recipient);
    const requestId = normalizeId(message.requestId || message.chatId);

    if (!senderId || !recipientId) {
      console.warn(
        "[MessageUtils] Message missing sender or recipient:",
        message
      );
      return null;
    }

    // Поддерживаем оба формата полей: text и message
    const messageText = message.message || message.text || "";
    if (!messageText) {
      console.warn("[MessageUtils] Message has no content:", message);
      return null;
    }

    return {
      _id: message._id || message.id || `temp-${Date.now()}`,
      text: messageText,
      message: messageText, // Добавляем для совместимости с сервером
      senderId,
      recipientId,
      requestId,
      room: message.room,
      createdAt:
        message.timestamp || message.createdAt || new Date().toISOString(),
      sender: {
        _id: senderId,
        name: message.sender?.name || message.userId?.name || "Пользователь",
        avatar: message.sender?.avatar || message.userId?.avatar,
        role: message.sender?.role || message.userId?.role,
      },
      userId: message.userId || {
        _id: senderId,
        name: message.sender?.name || "Пользователь",
        role: message.sender?.role,
      },
    };
  } catch (error) {
    console.error("[MessageUtils] Error normalizing message:", error);
    return null;
  }
};

/**
 * Проверяет, принадлежит ли сообщение текущему чату
 * @param {object} message - Сообщение для проверки
 * @param {object} params - Параметры проверки
 * @returns {boolean} Принадлежит ли сообщение чату
 */
export const isMessageBelongsToChat = (
  message,
  { requestId, currentUserId, recipientId }
) => {
  if (!message || !requestId || !currentUserId || !recipientId) {
    console.warn("[MessageUtils] Missing required params for message check:", {
      message,
      requestId,
      currentUserId,
      recipientId,
    });
    return false;
  }

  const msgRequestId = normalizeId(message.requestId || message.chatId);
  const msgSenderId = normalizeId(message.senderId);
  const msgRecipientId = normalizeId(message.recipientId);
  const normalizedCurrentUserId = normalizeId(currentUserId);
  const normalizedRecipientId = normalizeId(recipientId);

  // Сообщение принадлежит чату если:
  // 1. Совпадает requestId
  // 2. Или текущий пользователь является отправителем, а получатель - собеседником
  // 3. Или текущий пользователь является получателем, а отправитель - собеседником
  const belongs =
    msgRequestId === requestId ||
    (msgSenderId === normalizedCurrentUserId &&
      msgRecipientId === normalizedRecipientId) ||
    (msgSenderId === normalizedRecipientId &&
      msgRecipientId === normalizedCurrentUserId);

  if (!belongs) {
    console.log("[MessageUtils] Message does not belong to chat:", {
      msgRequestId,
      requestId,
      msgSenderId,
      msgRecipientId,
      currentUserId: normalizedCurrentUserId,
      recipientId: normalizedRecipientId,
    });
  }

  return belongs;
};

/**
 * Проверяет, является ли сообщение дубликатом
 * @param {object} message - Новое сообщение
 * @param {Array} existingMessages - Массив существующих сообщений
 * @returns {boolean} Является ли сообщение дубликатом
 */
export const isDuplicateMessage = (message, existingMessages) => {
  const messageId = message._id?.toString();
  if (!messageId) return false;

  const isDuplicate = existingMessages.some(
    (msg) => msg._id?.toString() === messageId
  );

  if (isDuplicate) {
    console.log("[MessageUtils] Duplicate message detected:", messageId);
  }

  return isDuplicate;
};
