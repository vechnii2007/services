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
      return null;
    }

    // Поддерживаем оба формата полей: text и message
    const messageText = message.message || message.text || "";
    if (!messageText) {
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
      type: message.type || "text", // Поддержка разных типов сообщений (text, file)
      fileName: message.fileName || null, // Имя файла для type: 'file'
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

  return isDuplicate;
};

/**
 * Возвращает id собеседника (не текущего пользователя) из ServiceRequest
 */
export function getCompanionId(chatInfo, currentUserId) {
  const ids = [
    chatInfo.userId?._id || chatInfo.userId,
    chatInfo.providerId?._id || chatInfo.providerId,
    chatInfo.adminId?._id || chatInfo.adminId,
  ].filter(Boolean);
  return ids.find((id) => id && id !== currentUserId);
}
