import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import ChatService from "../services/ChatService";
import {
  Box,
  TextField,
  Typography,
  List as MUIList,
  Paper,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { styled } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { useAuth } from "../context/AuthContext";
import { getRelativeTime } from "../utils/dateUtils";
import {
  normalizeMessage,
  isMessageBelongsToChat,
  normalizeId,
} from "../utils/messageUtils";

const HEADER_HEIGHT = 64; // px, если у вас другой — поменяйте здесь

// Новый layout для двухпанельного чата
const ChatLayout = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  height: `calc(100vh - ${HEADER_HEIGHT}px)`,
  marginTop: HEADER_HEIGHT,
  width: "100%",
  background: `linear-gradient(135deg, ${theme.palette.background.default} 60%, ${theme.palette.grey[100]} 100%)`,
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    height: "auto",
    marginTop: 56, // если на мобилке header меньше
  },
}));

const ChatPanel = styled(Box)(({ theme }) => ({
  flex: "0 0 65%",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  borderRight: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.down("md")]: {
    flex: "1 1 100%",
    borderRight: "none",
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const InfoPanel = styled(Box)(({ theme }) => ({
  flex: "0 0 35%",
  minWidth: 260,
  maxWidth: 420,
  background: theme.palette.background.paper,
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  padding: theme.spacing(3, 2),
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}));

// Стилизованные компоненты
const ChatContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "calc(100vh - 64px)",
  overflow: "hidden",
  background: `linear-gradient(135deg, ${theme.palette.background.default} 60%, ${theme.palette.grey[100]} 100%)`,
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.2, 1.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: "flex",
  alignItems: "center",
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  zIndex: 10,
  minHeight: 48,
}));

const ChatParticipant = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginLeft: theme.spacing(0.5),
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  background: "transparent",
  padding: theme.spacing(1, 0),
}));

const MessagesList = styled(MUIList)(({ theme }) => ({
  padding: 0,
  display: "flex",
  flexDirection: "column",
  width: "100%",
  maxWidth: "100%",
}));

const ChatInputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: "flex",
  gap: theme.spacing(0.5),
  backgroundColor: theme.palette.background.paper,
  position: "relative",
}));

// Современный стиль сообщений
const Message = styled(Paper)(({ theme, isUser }) => ({
  padding: theme.spacing(1, 1.5),
  margin: theme.spacing(0.25, 0.5),
  maxWidth: "80%",
  alignSelf: isUser ? "flex-end" : "flex-start",
  background: isUser
    ? `linear-gradient(120deg, ${theme.palette.primary.light} 60%, ${theme.palette.primary.main} 100%)`
    : `linear-gradient(120deg, ${theme.palette.grey[200]} 60%, ${theme.palette.background.paper} 100%)`,
  color: isUser
    ? theme.palette.primary.contrastText
    : theme.palette.text.primary,
  borderRadius: isUser
    ? theme.spacing(2, 2, 0.5, 2)
    : theme.spacing(2, 2, 2, 0.5),
  boxShadow: `0 1px 4px ${alpha(theme.palette.common.black, 0.07)}`,
  position: "relative",
  wordBreak: "break-word",
  fontSize: "0.97rem",
  minHeight: 28,
}));

const MessageGroup = styled(Box)(({ theme, isUser }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: isUser ? "flex-end" : "flex-start",
  marginBottom: theme.spacing(0.5),
  width: "100%",
}));

const MessageItem = styled(Box)(({ theme, isUser }) => ({
  display: "flex",
  alignItems: "flex-end",
  marginBottom: theme.spacing(0.25),
  width: "100%",
  justifyContent: isUser ? "flex-end" : "flex-start",
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.spacing(2.5),
    backgroundColor: alpha(theme.palette.background.default, 0.95),
    fontSize: "0.97rem",
    minHeight: 36,
    padding: 0,
    "&.Mui-focused": {
      boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.13)}`,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: alpha(theme.palette.divider, 0.7),
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.light,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const TypingIndicator = styled(Typography)(({ theme }) => ({
  fontStyle: "italic",
  color: theme.palette.text.secondary,
  fontSize: "0.8rem",
  margin: theme.spacing(0, 0, 0, 2),
  display: "flex",
  alignItems: "center",
  "& .dot": {
    display: "inline-block",
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    backgroundColor: theme.palette.text.secondary,
    marginLeft: "3px",
    animation: "typing-dot 1.5s infinite ease-in-out",
  },
  "& .dot:nth-of-type(2)": {
    animationDelay: "0.2s",
  },
  "& .dot:nth-of-type(3)": {
    animationDelay: "0.4s",
  },
  "@keyframes typing-dot": {
    "0%, 60%, 100%": {
      transform: "translateY(0)",
    },
    "30%": {
      transform: "translateY(-4px)",
    },
  },
}));

// Карточка товара/услуги/запроса
const OfferCardChat = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  padding: theme.spacing(2, 2.5),
  margin: theme.spacing(2, 2, 1, 2),
  minHeight: 80,
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: theme.spacing(1.5, 1),
    margin: theme.spacing(1, 0.5, 1, 0.5),
  },
}));

const Chat = () => {
  const theme = useTheme();
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatInitializedRef = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationRef = useRef(false);
  const reconnectTimeoutRef = useRef(null);
  const lastMessageRef = useRef(new Set());
  const socketRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [chatInfo, setChatInfo] = useState(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Проверка параметров при инициализации
  useEffect(() => {
    if (chatInitializedRef.current) return;

    if (!requestId) {
      setError("Отсутствует ID запроса (requestId)");
      setLoading(false);
      return;
    }

    if (!user?._id) {
      setError("Информация о пользователе недоступна");
      setLoading(false);
      return;
    }

    chatInitializedRef.current = true;
  }, [requestId, user]);

  // Сбрасываем скролл при изменении количества сообщений
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Обработчик нового сообщения
  const handleNewMessage = useCallback(
    (newMsg) => {
      // Проверяем, есть ли у сообщения ID
      if (!newMsg._id) {
        return;
      }

      // Проверяем, не обрабатывали ли мы уже это сообщение
      if (lastMessageRef.current.has(newMsg._id)) {
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
        return;
      }

      if (
        !isMessageBelongsToChat(normalizedMessage, {
          requestId,
          currentUserId: user?._id,
          recipientId,
        })
      ) {
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
      const response = await ChatService.get(`/requests/${requestId}`);
      setChatInfo(response);

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

      setRecipientId(newRecipientId);
      setRecipientName(newRecipientName);

      // Загружаем сообщения только после получения информации о чате
      await fetchMessages(newRecipientId);

      // Помечаем инициализацию как завершенную
      setIsInitialized(true);
    } catch (err) {
      setError("Не удалось загрузить информацию о чате");
      setLoading(false);
    }
  }, [requestId, user?._id]);

  // Загрузка сообщений
  const fetchMessages = useCallback(
    async (currentRecipientId) => {
      const recipientToUse = currentRecipientId || recipientId;

      if (!requestId || !recipientToUse) {
        return;
      }

      try {
        setLoading(true);

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
      return;
    }

    // Если уже подключены к той же комнате, не переподключаемся
    const participants = [
      normalizeId(user._id),
      normalizeId(recipientId),
    ].sort();
    const chatRoomId = participants.join("_");

    if (socketRef.current === chatRoomId) {
      return;
    }

    const connectToRoom = () => {
      // Отключаемся от предыдущей комнаты, если были подключены
      if (socketRef.current) {
        socket.emit("leaveRoom", socketRef.current);
      }

      // Подключаемся к новой комнате
      socket.emit("joinRoom", requestId, { chatRoomId });
      socketRef.current = chatRoomId;
    };

    // Подключаемся к комнате
    connectToRoom();

    // Обработчики событий сокета
    const handleJoinedRoom = (data) => {};

    const handleError = (error) => {
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

  // Преобразуем массив сообщений в группы от одного отправителя
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentGroup = null;

    messages.forEach((msg, index) => {
      const isUser = msg.senderId === user?._id;

      // Создаем новую группу, если это первое сообщение или отправитель изменился
      if (!currentGroup || currentGroup.senderId !== msg.senderId) {
        currentGroup = {
          id: `group_${index}`,
          senderId: msg.senderId,
          isUser,
          messages: [msg],
        };
        groups.push(currentGroup);
      } else {
        // Добавляем сообщение в текущую группу
        currentGroup.messages.push(msg);
      }
    });

    return groups;
  }, [messages, user?._id]);

  if (loading) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          backgroundColor: theme.palette.background.default,
        }}
      >
        <CircularProgress
          size={32}
          sx={{ mb: 2, color: theme.palette.primary.main }}
        />
        <Typography variant="body2" color="text.secondary">
          Загрузка сообщений...
        </Typography>
      </Box>
    );
  }

  return (
    <ChatLayout>
      <ChatPanel>
        <ChatContainer>
          <ChatHeader>
            <IconButton
              size="small"
              sx={{ mr: 1 }}
              onClick={() => navigate(-1)}
            >
              <ArrowBackIcon />
            </IconButton>
            <ChatParticipant>
              <Avatar
                sx={{
                  width: 38,
                  height: 38,
                  bgcolor: theme.palette.primary.main,
                }}
              >
                {recipientName.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={500}>
                  {recipientName}
                </Typography>
                {isConnected ? (
                  <Typography
                    variant="caption"
                    color="success.main"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "success.main",
                        mr: 0.5,
                        display: "inline-block",
                      }}
                    />
                    в сети
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    не в сети
                  </Typography>
                )}
              </Box>
            </ChatParticipant>
          </ChatHeader>

          {/* Карточка товара/услуги/запроса над сообщениями */}
          {chatInfo && chatInfo.offerId && (
            <OfferCardChat>
              {chatInfo.offerId.image && (
                <Box
                  component="img"
                  src={chatInfo.offerId.image}
                  alt={chatInfo.offerId.title}
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    objectFit: "cover",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  }}
                />
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={600} noWrap>
                  {chatInfo.offerId.title}
                </Typography>
                {chatInfo.offerId.price && (
                  <Typography variant="body2" color="primary" fontWeight={500}>
                    {chatInfo.offerId.price} €
                  </Typography>
                )}
                {chatInfo.offerId.serviceType && (
                  <Typography variant="caption" color="text.secondary">
                    {chatInfo.offerId.serviceType}
                  </Typography>
                )}
                {chatInfo.offerId.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5, maxWidth: 320, whiteSpace: "pre-line" }}
                  >
                    {chatInfo.offerId.description}
                  </Typography>
                )}
                <Box sx={{ mt: 1 }}>
                  <Tooltip title="Подробнее о предложении">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() =>
                        navigate(`/offers/${chatInfo.offerId._id}`)
                      }
                    >
                      <SendIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </OfferCardChat>
          )}

          {error && (
            <Alert
              severity="error"
              sx={{ mx: 2, mt: 1, borderRadius: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          <MessagesContainer ref={messagesContainerRef}>
            {messages.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  p: 3,
                  textAlign: "center",
                  color: "text.secondary",
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    mb: 2,
                  }}
                >
                  <SendIcon
                    sx={{
                      fontSize: 32,
                      color: alpha(theme.palette.primary.main, 0.6),
                    }}
                  />
                </Box>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Нет сообщений
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Начните общение прямо сейчас!
                </Typography>
              </Box>
            ) : (
              <MessagesList>
                {groupedMessages.map((group) => (
                  <MessageGroup key={group.id} isUser={group.isUser}>
                    {!group.isUser && (
                      <Typography
                        variant="caption"
                        sx={{
                          ml: 2,
                          mt: 1,
                          color: theme.palette.text.secondary,
                          fontSize: "0.7rem",
                        }}
                      >
                        {recipientName}
                      </Typography>
                    )}

                    {group.messages.map((msg, msgIndex) => (
                      <MessageItem
                        key={msg._id || msgIndex}
                        isUser={group.isUser}
                      >
                        {!group.isUser && msgIndex === 0 && (
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              mr: 1,
                              opacity: 0.9,
                              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                            }}
                          >
                            {recipientName.charAt(0).toUpperCase()}
                          </Avatar>
                        )}

                        {!group.isUser && msgIndex > 0 && (
                          <Box sx={{ width: 28, mr: 1 }} />
                        )}

                        <Message isUser={group.isUser} elevation={0}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 400,
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                          >
                            {msg.text || msg.message || ""}
                          </Typography>

                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "flex-end",
                              alignItems: "center",
                              mt: 0.5,
                              gap: 0.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color={
                                group.isUser
                                  ? "rgba(255,255,255,0.8)"
                                  : "text.secondary"
                              }
                              sx={{ fontSize: "0.65rem" }}
                            >
                              {getRelativeTime(
                                new Date(msg.timestamp || msg.createdAt)
                              )}
                            </Typography>

                            {group.isUser && (
                              <>
                                {msg.isSending && (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      ml: 0.5,
                                      alignItems: "center",
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      color="inherit"
                                      sx={{ opacity: 0.7, fontSize: "0.65rem" }}
                                    >
                                      отправляется
                                    </Typography>
                                  </Box>
                                )}
                                {msg.hasError && (
                                  <Typography
                                    variant="caption"
                                    color="error"
                                    sx={{ ml: 0.5, fontSize: "0.65rem" }}
                                  >
                                    ошибка
                                  </Typography>
                                )}
                                {msg.read && (
                                  <DoneAllIcon
                                    sx={{
                                      fontSize: 14,
                                      color: theme.palette.success.main,
                                      opacity: 0.8,
                                    }}
                                  />
                                )}
                              </>
                            )}
                          </Box>
                        </Message>
                      </MessageItem>
                    ))}
                  </MessageGroup>
                ))}
                <div ref={messagesEndRef} />
              </MessagesList>
            )}
            {isTyping && (
              <TypingIndicator
                sx={{ position: "absolute", bottom: 4, left: 8 }}
              >
                {recipientName} печатает
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </TypingIndicator>
            )}
          </MessagesContainer>

          <ChatInputContainer>
            <IconButton
              color="primary"
              size="small"
              sx={{
                width: 36,
                height: 36,
                color: theme.palette.text.secondary,
              }}
            >
              <EmojiEmotionsIcon fontSize="small" />
            </IconButton>

            <IconButton
              color="primary"
              size="small"
              sx={{
                width: 36,
                height: 36,
                color: theme.palette.text.secondary,
              }}
            >
              <AttachFileIcon fontSize="small" />
            </IconButton>

            <StyledTextField
              fullWidth
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите сообщение..."
              variant="outlined"
              size="small"
              disabled={!isConnected}
              multiline
              maxRows={3}
              InputProps={{
                sx: {
                  px: 2,
                  py: 0.75,
                },
              }}
            />

            <Tooltip title="Отправить">
              <span>
                <IconButton
                  color="primary"
                  disabled={!newMessage.trim() || !isConnected}
                  onClick={sendMessage}
                  sx={{
                    bgcolor:
                      newMessage.trim() && isConnected
                        ? theme.palette.primary.main
                        : "transparent",
                    color:
                      newMessage.trim() && isConnected ? "white" : undefined,
                    width: 36,
                    height: 36,
                    minWidth: 36,
                    "&:hover": {
                      bgcolor:
                        newMessage.trim() && isConnected
                          ? theme.palette.primary.dark
                          : undefined,
                    },
                  }}
                >
                  <SendIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </ChatInputContainer>
        </ChatContainer>
      </ChatPanel>
      <InfoPanel>
        {/* Красивый info-блок с контактами собеседника */}
        {chatInfo &&
          user &&
          (() => {
            const currentUserId = user._id;
            let contact = null;
            if (chatInfo.userId && chatInfo.providerId) {
              if (
                normalizeId(chatInfo.userId._id) === normalizeId(currentUserId)
              ) {
                contact = chatInfo.providerId;
              } else {
                contact = chatInfo.userId;
              }
            }
            if (!contact) return null;
            return (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    mb: 1,
                    bgcolor: theme.palette.primary.main,
                  }}
                >
                  {contact.name ? contact.name.charAt(0).toUpperCase() : "?"}
                </Avatar>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                  {contact.name}
                </Typography>
                {contact.email && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    <b>Email:</b> {contact.email}
                  </Typography>
                )}
                {contact.phone && contact.phone !== "" && (
                  <Typography variant="body2" color="text.secondary">
                    <b>Телефон:</b> {contact.phone}
                  </Typography>
                )}
                {contact.status && (
                  <Typography
                    variant="body2"
                    color={
                      contact.status === "online"
                        ? "success.main"
                        : "text.secondary"
                    }
                  >
                    <b>Статус:</b>{" "}
                    {contact.status === "online" ? "В сети" : "Не в сети"}
                  </Typography>
                )}
              </Box>
            );
          })()}
      </InfoPanel>
    </ChatLayout>
  );
};

export default Chat;
