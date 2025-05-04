import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import {
  useTheme,
  useMediaQuery,
  Box,
  Typography,
  Avatar,
  Tooltip,
  CircularProgress,
  Paper,
  TextField,
  List as MUIList,
  Alert,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { styled, alpha } from "@mui/material/styles";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../context/AuthContext";
import ChatService from "../../services/ChatService";
import { getRelativeTime } from "../../utils/dateUtils";
import {
  normalizeMessage,
  isMessageBelongsToChat,
  normalizeId,
} from "../../utils/messageUtils";
import ChatInput from "./ChatInput";
import MessagesList from "./MessagesList";
import InfoPanel from "./InfoPanel";

const HEADER_HEIGHT = 64;

const ChatLayout = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  width: "100%",
  height: "100%",
  background: `linear-gradient(135deg, ${theme.palette.background.default} 60%, ${theme.palette.grey[100]} 100%)`,
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    height: "auto",
    marginTop: 0,
  },
}));

const ChatPanel = styled(Box)(({ theme }) => ({
  flex: "0 0 65%",
  minWidth: 0,
  minHeight: 0,
  height: "100%",
  display: "flex",
  flexDirection: "column",
  borderRight: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.down("md")]: {
    flex: "1 1 100%",
    borderRight: "none",
    borderBottom: `1px solid ${theme.palette.divider}`,
    height: "auto",
  },
}));

const ChatContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  background: `linear-gradient(135deg, ${theme.palette.background.default} 60%, ${theme.palette.grey[100]} 100%)`,
  height: "100%",
  minHeight: 0,
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
  position: "relative",
}));

const ChatParticipant = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginLeft: theme.spacing(0.5),
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: "1 1 auto",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  background: "transparent",
  padding: theme.spacing(1, 0),
  minHeight: 0,
}));

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

const ChatModal = React.forwardRef(
  (
    { open, onClose, requestId, userId, providerId, request: requestProp },
    ref
  ) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
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
    // Локальное состояние для контроля открытия, чтобы не потерять состояние при обновлении пропсов
    const [localOpen, setLocalOpen] = useState(open);
    const initialOpenRef = useRef(false);

    // Синхронизируем локальное состояние с пропсами
    useEffect(() => {
      if (open) {
        console.log("[ChatModal] Opening dialog");
        setLocalOpen(true);
        initialOpenRef.current = true;
      } else if (initialOpenRef.current) {
        // Только если диалог был открыт хотя бы раз
        console.log("[ChatModal] Closing dialog");
        setLocalOpen(false);
      }
    }, [open]);

    // Добавляем логирование пропсов
    useEffect(() => {
      console.log("[ChatModal] Props received:", {
        open,
        localOpen,
        requestId,
        userId,
        providerId,
      });
    }, [open, localOpen, requestId, userId, providerId]);

    // Скролл вниз
    const scrollToBottom = useCallback(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, []);

    // Проверка параметров при инициализации
    useEffect(() => {
      if (!open) return;
      chatInitializedRef.current = false;
      initializationRef.current = false;
      setMessages([]);
      setNewMessage("");
      setRecipientId("");
      setRecipientName("");
      setError("");
      setLoading(true);
      setIsInitialized(false);
      setChatInfo(null);
    }, [open, requestId]);

    useEffect(() => {
      if (!open) return;
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
    }, [open, requestId, user]);

    // Загрузка сообщений
    const fetchMessages = useCallback(
      async (currentRecipientId) => {
        const recipientToUse = currentRecipientId || recipientId;
        if (!requestId || !recipientToUse) {
          setLoading(false);
          setError("Не удалось определить получателя для загрузки сообщений");
          return;
        }
        try {
          setLoading(true);
          console.log(
            "[ChatModal] fetchMessages вызван для requestId:",
            requestId,
            "recipientId:",
            recipientToUse
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
          setError(err.message || "Ошибка при загрузке сообщений");
          setLoading(false);
        }
      },
      [requestId, recipientId, user?._id, scrollToBottom]
    );

    // Загрузка информации о чате
    const fetchChatInfo = useCallback(async () => {
      if (!requestId || !user?._id) return;
      console.log("[ChatModal] fetchChatInfo вызван для requestId:", requestId);
      try {
        let response = requestProp;
        if (!response) {
          response = await ChatService.get(`/requests/${requestId}`);
        }
        setChatInfo(response);
        if (!response?.userId) {
          throw new Error("Некорректные данные запроса: отсутствует userId");
        }
        const currentUserId = normalizeId(user._id);
        let newRecipientId = "";
        let newRecipientName = "";
        if (userId && providerId) {
          if (currentUserId === normalizeId(providerId)) {
            newRecipientId = normalizeId(userId);
            newRecipientName = response.userId?.name || "Клиент";
          } else if (currentUserId === normalizeId(userId)) {
            newRecipientId = normalizeId(providerId);
            newRecipientName =
              response.provider?.name ||
              response.providerId?.name ||
              "Провайдер";
          }
        } else if (response.providerId && response.providerId._id) {
          const isProvider = currentUserId === normalizeId(response.providerId);
          newRecipientId = isProvider
            ? normalizeId(response.userId)
            : normalizeId(response.providerId);
          newRecipientName = isProvider
            ? response.userId?.name || "Клиент"
            : response.providerId?.name || "Провайдер";
        } else {
          if (user.role === "provider") {
            newRecipientId = normalizeId(response.userId);
            newRecipientName = response.userId?.name || "Клиент";
          } else {
            newRecipientId = "";
            newRecipientName = "";
          }
        }
        setRecipientId(newRecipientId);
        setRecipientName(newRecipientName);
        setIsInitialized(true);
      } catch (err) {
        setError(err.message || "Не удалось загрузить информацию о чате");
        setLoading(false);
      }
    }, [requestId, user?._id, user?.role, userId, providerId, requestProp]);

    // useEffect для загрузки сообщений только при изменении recipientId и open
    useEffect(() => {
      if (recipientId && open) {
        fetchMessages(recipientId);
      }
    }, [recipientId, open]);

    // Обработчик нового сообщения
    const handleNewMessage = useCallback(
      (newMsg) => {
        if (!newMsg._id) return;
        if (lastMessageRef.current.has(newMsg._id)) return;
        lastMessageRef.current.add(newMsg._id);
        if (lastMessageRef.current.size > 100) {
          const values = Array.from(lastMessageRef.current);
          lastMessageRef.current = new Set(values.slice(-50));
        }
        const normalizedMessage = normalizeMessage({
          ...newMsg,
          text: newMsg.message || newMsg.text,
        });
        if (!normalizedMessage) return;
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
          const isDuplicate = prevMessages.some(
            (msg) =>
              msg._id === normalizedMessage._id ||
              (msg.timestamp === normalizedMessage.timestamp &&
                msg.message === normalizedMessage.message &&
                msg.senderId === normalizedMessage.senderId)
          );
          if (isDuplicate) return prevMessages;
          return [...prevMessages, normalizedMessage];
        });
        scrollToBottom();
      },
      [requestId, user?._id, recipientId, scrollToBottom]
    );

    // Инициализация чата
    useEffect(() => {
      if (!open) return;
      if (!user?._id || !requestId || initializationRef.current) return;
      initializationRef.current = true;
      fetchChatInfo();
    }, [open, user?._id, requestId, fetchChatInfo]);

    // Эффект для подключения к сокету
    useEffect(() => {
      if (
        !open ||
        !socket ||
        !isConnected ||
        !requestId ||
        !user?._id ||
        !recipientId ||
        !isInitialized
      ) {
        return;
      }
      const participants = [
        normalizeId(user._id),
        normalizeId(recipientId),
      ].sort();
      const chatRoomId = participants.join("_");
      if (socketRef.current === chatRoomId) {
        return;
      }
      const connectToRoom = () => {
        if (socketRef.current) {
          socket.emit("leaveRoom", socketRef.current);
        }
        socket.emit("joinRoom", requestId, { chatRoomId });
        socketRef.current = chatRoomId;
      };
      connectToRoom();
      const handleJoinedRoom = (data) => {};
      const handleError = (error) => {
        setError("Ошибка соединения: " + error.message);
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
      open,
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
      if (!open) return;
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
    }, [open, socket]);

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
        const participants = [normalizedSenderId, normalizedRecipientId].sort();
        const chatRoomId = participants.join("_");
        const messageId = `msg_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const timestamp = new Date().toISOString();
        const messageData = {
          _id: messageId,
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

    const groupedMessages = useMemo(() => {
      const groups = [];
      let currentGroup = null;
      messages.forEach((msg, index) => {
        const isUser = msg.senderId === user?._id;
        if (!currentGroup || currentGroup.senderId !== msg.senderId) {
          currentGroup = {
            id: `group_${index}`,
            senderId: msg.senderId,
            isUser,
            messages: [msg],
          };
          groups.push(currentGroup);
        } else {
          currentGroup.messages.push(msg);
        }
      });
      return groups;
    }, [messages, user?._id]);

    useEffect(() => {
      if (open && messages.length > 0) {
        scrollToBottom();
      }
    }, [messages, open, scrollToBottom]);

    // --- Рендер ---
    return (
      <Dialog
        open={localOpen}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        ref={ref}
        scroll="paper"
        PaperProps={{
          sx: {
            height: isMobile ? "100vh" : "90vh",
            minHeight: isMobile ? 0 : 600,
            borderRadius: isMobile ? 0 : 3,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            margin: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          },
        }}
      >
        <Box sx={{ display: "flex", flex: 1, height: "100%" }}>
          {/* Левая часть: чат */}
          <Box
            sx={{
              flex: "1 1 0%",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              minWidth: 0,
              background: "#f7f9fc",
            }}
          >
            {/* Шапка и карточка предложения */}
            <ChatHeader>
              <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
                Чат
              </Typography>
              <IconButton
                aria-label="Закрыть"
                onClick={onClose}
                sx={{ ml: 1 }}
                size="large"
              >
                <CloseIcon />
              </IconButton>
            </ChatHeader>
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
                    <Typography
                      variant="body2"
                      color="primary"
                      fontWeight={500}
                    >
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
                      sx={{
                        mt: 0.5,
                        maxWidth: 320,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {chatInfo.offerId.description}
                    </Typography>
                  )}
                </Box>
              </OfferCardChat>
            )}
            {/* Сообщения */}
            <Box
              sx={{
                flex: "1 1 auto",
                overflowY: "auto",
                minHeight: 0,
                px: 2,
                pb: 1,
                pt: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {error && (
                <Alert
                  severity="error"
                  sx={{ mx: 2, mt: 1, borderRadius: 2 }}
                  onClose={() => setError("")}
                >
                  {error}
                </Alert>
              )}
              {loading ? (
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
              ) : error ? (
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
                  <Typography variant="body1" color="error" sx={{ mb: 1 }}>
                    {error}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Попробуйте обновить страницу или выбрать другой чат.
                  </Typography>
                </Box>
              ) : messages.length === 0 ? (
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
                <MessagesList
                  groupedMessages={groupedMessages}
                  recipientName={recipientName}
                  user={user}
                  theme={theme}
                  messagesEndRef={messagesEndRef}
                />
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
            </Box>
            {/* Поле ввода */}
            <Box
              sx={{
                borderTop: `1px solid ${theme.palette.divider}`,
                background: "#fff",
                px: 2,
                py: 1.5,
                flexShrink: 0,
              }}
            >
              <ChatInput
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                sendMessage={sendMessage}
                isConnected={isConnected}
                handleKeyPress={handleKeyPress}
              />
            </Box>
          </Box>
          {/* Правая часть: профиль/инфо */}
          {!isMobile && (
            <InfoPanel chatInfo={chatInfo} user={user} theme={theme} />
          )}
        </Box>
      </Dialog>
    );
  }
);

ChatModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  requestId: PropTypes.string.isRequired,
  userId: PropTypes.string,
  providerId: PropTypes.string,
  request: PropTypes.object,
};

export default ChatModal;
