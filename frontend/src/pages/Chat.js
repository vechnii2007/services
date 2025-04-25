import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSocket } from "../hooks/useSocket";
import ChatService from "../services/ChatService";
import {
  Box,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  CircularProgress,
  Alert,
  Avatar,
  Divider,
  IconButton,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { styled } from "@mui/material/styles";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/dateUtils";
import {
  normalizeMessage,
  isMessageBelongsToChat,
  isDuplicateMessage,
  normalizeId,
} from "../utils/messageUtils";

// Стилизованные компоненты
const ChatContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "calc(100vh - 64px)",
  overflow: "hidden",
  backgroundColor: theme.palette.background.default,
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: "auto",
  padding: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

const MessageInputContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  gap: theme.spacing(1),
}));

const MessageBubble = styled(Paper)(({ theme, isUser }) => ({
  padding: theme.spacing(1.5),
  maxWidth: "70%",
  alignSelf: isUser ? "flex-end" : "flex-start",
  backgroundColor: isUser
    ? theme.palette.primary.light
    : theme.palette.background.paper,
  color: isUser
    ? theme.palette.primary.contrastText
    : theme.palette.text.primary,
  borderRadius: "16px",
  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  position: "relative",
  wordBreak: "break-word",
}));

const MessageTime = styled(Typography)(({ theme }) => ({
  fontSize: "0.7rem",
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
  textAlign: "right",
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  zIndex: 1,
}));

const TypingIndicator = styled(Typography)(({ theme }) => ({
  fontStyle: "italic",
  color: theme.palette.text.secondary,
  fontSize: "0.8rem",
  padding: theme.spacing(0.5, 2),
}));

const Chat = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [pageTitle, setPageTitle] = useState("");
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatInitializedRef = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationRef = useRef(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const lastMessageRef = useRef(new Set());
  const socketRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Проверка параметров при инициализации
  useEffect(() => {
    if (chatInitializedRef.current) return;

    if (!requestId) {
      console.error("[Chat] Missing required prop: requestId");
      setError("Отсутствует ID запроса (requestId)");
      setLoading(false);
      return;
    }

    if (!user?._id) {
      console.error("[Chat] No user information available");
      setError("Информация о пользователе недоступна");
      setLoading(false);
      return;
    }

    console.log("[Chat] Starting initialization:", {
      requestId: normalizeId(requestId),
      userId: normalizeId(user._id),
      userRole: user.role,
    });

    chatInitializedRef.current = true;
  }, [requestId, user]);

  // Обработчик нового сообщения
  const handleNewMessage = useCallback(
    (newMsg) => {
      console.log("[Chat] Processing new message:", newMsg);

      // Проверяем, есть ли у сообщения ID
      if (!newMsg._id) {
        console.warn("[Chat] Message has no ID:", newMsg);
        return;
      }

      // Проверяем, не обрабатывали ли мы уже это сообщение
      if (lastMessageRef.current.has(newMsg._id)) {
        console.log("[Chat] Message already processed, skipping:", newMsg._id);
        return;
      }

      // Добавляем ID в Set обработанных сообщений
      lastMessageRef.current.add(newMsg._id);

      // Ограничиваем размер Set, чтобы не расходовать память
      if (lastMessageRef.current.size > 100) {
        const values = Array.from(lastMessageRef.current);
        lastMessageRef.current = new Set(values.slice(-50));
      }

      const normalizedMessage = normalizeMessage({
        ...newMsg,
        text: newMsg.message || newMsg.text,
      });

      if (!normalizedMessage) {
        console.warn("[Chat] Failed to normalize message:", newMsg);
        return;
      }

      if (
        !isMessageBelongsToChat(normalizedMessage, {
          requestId,
          currentUserId: user?._id,
          recipientId,
        })
      ) {
        console.log("[Chat] Message does not belong to this chat:", {
          messageRequestId: normalizedMessage.requestId,
          currentRequestId: requestId,
          messageSenderId: normalizedMessage.senderId,
          messageRecipientId: normalizedMessage.recipientId,
        });
        return;
      }

      setMessages((prevMessages) => {
        // Проверяем, нет ли уже такого сообщения
        const isDuplicate = prevMessages.some(
          (msg) =>
            msg._id === normalizedMessage._id ||
            (msg.timestamp === normalizedMessage.timestamp &&
              msg.message === normalizedMessage.message &&
              msg.senderId === normalizedMessage.senderId)
        );

        if (isDuplicate) {
          console.log(
            "[Chat] Duplicate message in state, skipping:",
            normalizedMessage._id
          );
          return prevMessages;
        }

        return [...prevMessages, normalizedMessage];
      });

      scrollToBottom();
    },
    [requestId, user?._id, recipientId, scrollToBottom]
  );

  // Загрузка информации о чате
  const fetchChatInfo = useCallback(async () => {
    if (!requestId || !user?._id) return;

    try {
      console.log("[Chat] Fetching chat info for request:", requestId);
      const response = await ChatService.get(`/requests/${requestId}`);

      if (!response?.userId || !response?.providerId) {
        throw new Error("Некорректные данные запроса");
      }

      const currentUserId = normalizeId(user._id);
      const isProvider = currentUserId === normalizeId(response.providerId);

      const newRecipientId = isProvider
        ? normalizeId(response.userId)
        : normalizeId(response.providerId);

      const newRecipientName = isProvider
        ? response.userId?.name || "Клиент"
        : response.providerId?.name || "Провайдер";

      console.log("[Chat] Chat info received:", {
        currentUserId,
        isProvider,
        newRecipientId,
        newRecipientName,
      });

      setRecipientId(newRecipientId);
      setRecipientName(newRecipientName);

      // Загружаем сообщения только после получения информации о чате
      await fetchMessages(newRecipientId);

      // Помечаем инициализацию как завершенную
      setIsInitialized(true);
    } catch (err) {
      console.error("[Chat] Error loading chat info:", err);
      setError("Не удалось загрузить информацию о чате");
      setLoading(false);
    }
  }, [requestId, user?._id]);

  // Загрузка сообщений
  const fetchMessages = useCallback(
    async (currentRecipientId) => {
      const recipientToUse = currentRecipientId || recipientId;

      if (!requestId || !recipientToUse) {
        console.log(
          "[Chat] Cannot fetch messages - missing requestId or recipientId:",
          {
            requestId,
            recipientId: recipientToUse,
          }
        );
        return;
      }

      try {
        setLoading(true);
        console.log(
          `[Chat] Loading messages for request: ${requestId}, recipient: ${recipientToUse}`
        );

        const fetchedMessages = await ChatService.getMessages(requestId);

        const normalizedMessages = fetchedMessages
          .map((msg) => normalizeMessage(msg))
          .filter(
            (msg) =>
              msg !== null &&
              isMessageBelongsToChat(msg, {
                requestId,
                currentUserId: user?._id,
                recipientId: recipientToUse,
              })
          );

        setMessages(normalizedMessages);
        setLoading(false);
        scrollToBottom();
      } catch (err) {
        console.error("[Chat] Error loading messages:", err);
        setError("Ошибка при загрузке сообщений");
        setLoading(false);
      }
    },
    [requestId, recipientId, user?._id, scrollToBottom]
  );

  // Инициализация чата
  useEffect(() => {
    if (!user?._id || !requestId || initializationRef.current) return;

    initializationRef.current = true;
    fetchChatInfo();
  }, [user?._id, requestId, fetchChatInfo]);

  // Эффект для подключения к сокету
  useEffect(() => {
    if (
      !socket ||
      !isConnected ||
      !requestId ||
      !user?._id ||
      !recipientId ||
      !isInitialized
    ) {
      console.log("[Chat] Waiting for required data:", {
        socketConnected: isConnected,
        requestId,
        userId: user?._id,
        recipientId,
        isInitialized,
      });
      return;
    }

    // Если уже подключены к той же комнате, не переподключаемся
    const participants = [
      normalizeId(user._id),
      normalizeId(recipientId),
    ].sort();
    const chatRoomId = participants.join("_");

    if (socketRef.current === chatRoomId) {
      console.log("[Chat] Already connected to room:", chatRoomId);
      return;
    }

    const connectToRoom = () => {
      console.log(`[Chat] Connecting to room ${chatRoomId}`, {
        userId: normalizeId(user._id),
        recipientId: normalizeId(recipientId),
        userRole: user.role,
      });

      // Отключаемся от предыдущей комнаты, если были подключены
      if (socketRef.current) {
        console.log(`[Chat] Leaving previous room: ${socketRef.current}`);
        socket.emit("leaveRoom", socketRef.current);
      }

      // Подключаемся к новой комнате
      socket.emit("joinRoom", requestId, { chatRoomId });
      socketRef.current = chatRoomId;
    };

    // Подключаемся к комнате
    connectToRoom();

    // Обработчики событий сокета
    const handleJoinedRoom = (data) => {
      console.log("[Chat] Successfully joined room:", {
        chatRoomId,
        data,
      });
    };

    const handleError = (error) => {
      console.error("[Chat] Socket error:", error);
      setError("Ошибка соединения: " + error.message);

      // Планируем переподключение только если это текущая комната
      if (socketRef.current === chatRoomId) {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(connectToRoom, 5000);
      }
    };

    socket.on("joinedRoom", handleJoinedRoom);
    socket.on("private_message", handleNewMessage);
    socket.on("error", handleError);
    socket.on("typing", (data) => {
      if (normalizeId(data.userId) === normalizeId(recipientId)) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    // Очистка при размонтировании или изменении параметров
    return () => {
      if (socketRef.current === chatRoomId) {
        console.log(`[Chat] Cleaning up room connection: ${chatRoomId}`);
        socket.emit("leaveRoom", chatRoomId);
        socket.off("joinedRoom", handleJoinedRoom);
        socket.off("private_message", handleNewMessage);
        socket.off("error", handleError);
        socket.off("typing");
        socketRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [
    socket,
    isConnected,
    requestId,
    recipientId,
    user,
    isInitialized,
    handleNewMessage,
  ]);

  // Очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socket.emit("leaveRoom", socketRef.current);
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      lastMessageRef.current.clear();
    };
  }, [socket]);

  // Отправка сообщения
  const sendMessage = async () => {
    if (
      !newMessage.trim() ||
      !socket ||
      !isConnected ||
      !requestId ||
      !user?._id ||
      !recipientId
    )
      return;

    try {
      const normalizedSenderId = normalizeId(user._id);
      const normalizedRecipientId = normalizeId(recipientId);

      // Формируем ID комнаты в том же формате
      const participants = [normalizedSenderId, normalizedRecipientId].sort();
      const chatRoomId = participants.join("_");

      // Проверяем корректность ID
      if (normalizedSenderId === normalizedRecipientId) {
        throw new Error(
          "Отправитель и получатель не могут быть одним и тем же пользователем"
        );
      }

      const messageId = `msg_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const timestamp = new Date().toISOString();

      const messageData = {
        _id: messageId, // Добавляем уникальный ID
        message: newMessage.trim(),
        senderId: normalizedSenderId,
        recipientId: normalizedRecipientId,
        requestId: normalizeId(requestId),
        timestamp,
        chatRoomId,
        userId: {
          _id: normalizedSenderId,
          name: user.name || "Unknown",
          role: user.role,
        },
      };

      console.log("[Chat] Sending message:", messageData);

      // Оптимистичное обновление UI
      const normalizedMessage = normalizeMessage({
        ...messageData,
        isSending: true,
      });

      if (normalizedMessage) {
        setMessages((prev) => [...prev, normalizedMessage]);
        scrollToBottom();
      }

      socket.emit("private_message", messageData);
      setNewMessage("");
    } catch (err) {
      console.error("[Chat] Error sending message:", err);
      setError(err.message || "Ошибка при отправке сообщения");
    }
  };

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

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      handleTyping();
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ChatContainer>
      <ChatHeader>
        <IconButton onClick={() => navigate(-1)} edge="start">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ ml: 2, flexGrow: 1 }}>
          {pageTitle || `Чат с ${recipientName}`}
        </Typography>
        {!isConnected && (
          <Typography variant="caption" color="error">
            Переподключение...
          </Typography>
        )}
      </ChatHeader>

      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <MessagesContainer>
        {messages.length === 0 ? (
          <Box sx={{ textAlign: "center", color: "text.secondary", mt: 4 }}>
            <Typography>Нет сообщений. Начните общение!</Typography>
          </Box>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.senderId === user?._id;
            return (
              <Box
                key={msg._id || index}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isUser ? "flex-end" : "flex-start",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  {!isUser && (
                    <Avatar
                      alt={msg.sender?.name || recipientName}
                      src={msg.sender?.avatar}
                      sx={{ width: 32, height: 32 }}
                    />
                  )}
                  <MessageBubble isUser={isUser}>
                    <Typography variant="body1">{msg.text}</Typography>
                    <MessageTime>
                      {formatDate(msg.createdAt)}
                      {msg.isSending && " • Отправка..."}
                    </MessageTime>
                  </MessageBubble>
                </Box>
              </Box>
            );
          })
        )}
        {isTyping && (
          <TypingIndicator>{recipientName} печатает...</TypingIndicator>
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <MessageInputContainer>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Введите сообщение..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!isConnected}
          size="small"
          multiline
          maxRows={4}
        />
        <Button
          variant="contained"
          color="primary"
          endIcon={<SendIcon />}
          onClick={sendMessage}
          disabled={!newMessage.trim() || !isConnected}
        >
          Отправить
        </Button>
      </MessageInputContainer>
    </ChatContainer>
  );
};

export default Chat;
