import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";
import { formatDistance } from "date-fns";
import SendIcon from "@mui/icons-material/Send";
import styled from "@emotion/styled";
import ChatService from "../../services/ChatService";

const MessageContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
  padding: 20px;
`;

const Message = styled(Paper)`
  padding: 10px;
  margin: 5px;
  max-width: 70%;
  align-self: ${(props) => (props.isMine ? "flex-end" : "flex-start")};
  background-color: ${(props) => (props.isMine ? "#e3f2fd" : "#f5f5f5")};
`;

const TypingIndicator = styled(Typography)`
  font-style: italic;
  color: #666;
  font-size: 0.8rem;
  margin: 5px;
`;

const Chat = ({ recipientId, recipientName, requestId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket, isConnected, lastError } = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatInitializedRef = useRef(false);

  const logDebugInfo = useCallback(() => {
    console.log("[Chat Component] Debug state:", {
      requestId,
      recipientId,
      socketConnected: isConnected,
      socketError: lastError,
      messagesCount: messages.length,
      userInfo: user?.id,
    });
  }, [requestId, recipientId, isConnected, lastError, messages.length, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Проверка параметров при инициализации
  useEffect(() => {
    if (chatInitializedRef.current) return;

    if (!requestId) {
      console.error("[Chat Component] Missing required prop: requestId");
      setError("Отсутствует ID запроса (requestId)");
      setIsLoading(false);
      return;
    }

    if (!recipientId) {
      console.error("[Chat Component] Missing required prop: recipientId");
      setError("Отсутствует ID получателя (recipientId)");
      setIsLoading(false);
      return;
    }

    if (!user) {
      console.error("[Chat Component] No user information available");
      setError("Информация о пользователе недоступна");
      setIsLoading(false);
      return;
    }

    logDebugInfo();
    chatInitializedRef.current = true;
  }, [requestId, recipientId, user, logDebugInfo]);

  // Эффект для подключения к комнате чата
  useEffect(() => {
    if (!socket || !isConnected || !requestId) return;

    console.log(`[Chat Component] Joining chat room for request: ${requestId}`);
    socket.emit("joinRoom", requestId);

    return () => {
      console.log(
        `[Chat Component] Leaving chat room for request: ${requestId}`
      );
      socket.emit("leaveRoom", requestId);
    };
  }, [socket, isConnected, requestId]);

  // Эффект для загрузки сообщений и подписки на события
  useEffect(() => {
    if (!socket || !requestId) return;

    // Загрузка истории сообщений через ChatService
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log(
          `[Chat Component] Loading messages for request: ${requestId}, recipient: ${recipientId}`
        );
        const data = await ChatService.getMessages(requestId);
        console.log(
          `[Chat Component] Loaded ${
            data?.length || 0
          } messages for chat ${requestId}:`,
          data
        );
        if (Array.isArray(data)) {
          setMessages(data);
          scrollToBottom();
        } else {
          console.error(
            "[Chat Component] Received invalid messages data:",
            data
          );
          setError("Получены некорректные данные сообщений");
        }
      } catch (error) {
        console.error("[Chat Component] Error loading messages:", error);
        setError(`Не удалось загрузить сообщения: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    // Подписка на новые сообщения
    const handleNewMessage = (message) => {
      console.log("[Chat Component] Received new message:", message);

      try {
        // Получаем ID из сообщения
        const messageRequestId = message.requestId || message.chatId;
        const messageSenderId = message.senderId?.toString();
        const messageRecipientId = message.recipientId?.toString();
        const currentUserId = user?.id?.toString();

        console.log("[Chat Component] Message validation:", {
          messageRequestId,
          currentRequestId: requestId,
          messageSenderId,
          messageRecipientId,
          currentUserId,
          recipientId,
        });

        if (!messageSenderId || !messageRecipientId) {
          console.warn(
            "[Chat Component] Message missing sender or recipient:",
            message
          );
          return;
        }

        // Проверяем принадлежность сообщения к текущему чату
        const isRelatedToCurrentChat =
          messageRequestId === requestId ||
          (messageSenderId === currentUserId &&
            messageRecipientId === recipientId) ||
          (messageSenderId === recipientId &&
            messageRecipientId === currentUserId);

        if (!isRelatedToCurrentChat) {
          console.log(
            `[Chat Component] Message not related to current chat, ignoring. Current chat: ${requestId}, message chat: ${messageRequestId}`
          );
          return;
        }

        console.log(
          `[Chat Component] Message belongs to this chat, processing...`
        );

        setMessages((prev) => {
          // Проверяем, не дублируется ли сообщение
          const msgId = message._id?.toString();
          if (!msgId) {
            console.warn("[Chat Component] Message missing _id:", message);
            return [...prev, message];
          }

          const exists = prev.some((m) => m._id?.toString() === msgId);
          if (exists) {
            console.log(
              `[Chat Component] Message ${msgId} already exists, skipping`
            );
            return prev;
          }

          console.log(`[Chat Component] Adding new message ${msgId} to chat`);
          return [...prev, message];
        });

        scrollToBottom();
      } catch (error) {
        console.error(
          "[Chat Component] Error processing incoming message:",
          error
        );
      }
    };

    socket.on("private_message", handleNewMessage);

    // Подписка на индикатор печатания
    socket.on("typing", (data) => {
      if (data.userId === recipientId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    // Подписка на ошибки сокета
    const handleSocketError = (err) => {
      console.error("[Chat Component] Socket error:", err);
      setError(
        `Ошибка соединения: ${typeof err === "object" ? err.message : err}`
      );
    };

    socket.on("error", handleSocketError);

    return () => {
      socket.off("private_message", handleNewMessage);
      socket.off("typing");
      socket.off("error", handleSocketError);
    };
  }, [socket, requestId, recipientId]);

  // Эффект для логирования при обновлении сообщений
  useEffect(() => {
    console.log(`[Chat Component] Messages updated: ${messages.length} total`);

    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      console.log("[Chat Component] Last message:", {
        id: lastMsg._id,
        text: lastMsg.message,
        sender: lastMsg.senderId,
        time: lastMsg.timestamp || lastMsg.createdAt,
      });
    }
  }, [messages]);

  const handleTyping = () => {
    if (!socket || !isConnected) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socket.emit("typing", { recipientId, requestId });

    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !isConnected || !requestId) return;

    // Создаем уникальный временный ID для сообщения
    const tempId = `temp-${Date.now()}`;

    try {
      // Получаем идентификаторы из состояния
      const normalizedRequestId = requestId.toString();
      const normalizedRecipientId = recipientId.toString();
      const normalizedSenderId = user.id.toString();

      console.log("[Chat Component] Preparing to send message with IDs:", {
        requestId: normalizedRequestId,
        senderId: normalizedSenderId,
        recipientId: normalizedRecipientId,
      });

      const messageData = {
        _id: tempId,
        recipientId: normalizedRecipientId,
        message: newMessage.trim(),
        requestId: normalizedRequestId,
        senderId: normalizedSenderId,
        timestamp: new Date().toISOString(),
        // Добавляем информацию о пользователе для корректного отображения
        userId: {
          _id: user.id,
          name: user.name,
        },
      };

      console.log("[Chat Component] Sending message:", messageData);

      // Оптимистичное обновление UI
      const tempMessage = {
        ...messageData,
        isSending: true,
      };

      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage("");
      scrollToBottom();

      // Отправка через сокет
      socket.emit("private_message", messageData);
      console.log(
        "[Chat Component] Message sent via socket with requestId:",
        normalizedRequestId
      );

      // Запасной вариант через REST API если соединение не стабильно
      if (!isConnected) {
        console.log(
          "[Chat Component] Socket not connected, sending via REST API"
        );
        await ChatService.sendMessage(
          normalizedRequestId,
          newMessage.trim(),
          normalizedRecipientId
        );
      }

      // Обновляем статус сообщения как отправленное
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempId ? { ...msg, isSending: false } : msg
          )
        );
      }, 500);
    } catch (error) {
      console.error("[Chat Component] Error sending message:", error);
      setError("Ошибка отправки сообщения. Проверьте соединение.");

      // Помечаем сообщение как ошибочное
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId
            ? { ...msg, isSending: false, hasError: true }
            : msg
        )
      );
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <CircularProgress size={24} sx={{ mb: 1 }} />
        <Typography>Загрузка сообщений...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="h6">Чат с {recipientName}</Typography>
        {!isConnected && (
          <Typography variant="caption" color="error">
            Соединение отсутствует. Переподключение...
          </Typography>
        )}
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mx: 2, mt: 1 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <MessageContainer>
        {messages.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
            <Typography>
              Нет сообщений. Начните общение прямо сейчас!
            </Typography>
          </Box>
        ) : (
          messages.map((msg, index) => (
            <Message
              key={msg._id || index}
              isMine={msg.senderId === user.id}
              elevation={1}
              sx={
                msg.hasError
                  ? {
                      borderColor: "error.main",
                      borderWidth: 1,
                      borderStyle: "solid",
                    }
                  : {}
              }
            >
              <Typography variant="body1">{msg.message}</Typography>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 1,
                }}
              >
                <Typography variant="caption" color="textSecondary">
                  {formatDistance(new Date(msg.timestamp), new Date(), {
                    addSuffix: true,
                  })}
                </Typography>
                {msg.isSending && (
                  <Typography variant="caption" color="text.secondary">
                    отправляется...
                  </Typography>
                )}
                {msg.hasError && (
                  <Typography variant="caption" color="error">
                    ошибка отправки
                  </Typography>
                )}
              </Box>
            </Message>
          ))
        )}
        {isTyping && (
          <TypingIndicator>{recipientName} печатает...</TypingIndicator>
        )}
        <div ref={messagesEndRef} />
      </MessageContainer>

      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: "divider",
          display: "flex",
          gap: 1,
          mt: "auto",
        }}
      >
        <TextField
          fullWidth
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            handleTyping();
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
          placeholder="Введите сообщение..."
          variant="outlined"
          size="small"
          disabled={!isConnected}
          multiline
          maxRows={3}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!newMessage.trim() || !isConnected}
          endIcon={<SendIcon />}
        >
          Отправить
        </Button>
      </Box>
    </Box>
  );
};

export default Chat;
