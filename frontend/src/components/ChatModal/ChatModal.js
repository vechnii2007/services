import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useContext,
} from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import {
  useTheme,
  useMediaQuery,
  Box,
  Typography,
  CircularProgress,
  Paper,
  Alert,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { styled, alpha } from "@mui/material/styles";
import { useAuth } from "../../context/AuthContext";
import ChatService from "../../services/ChatService";
import {
  normalizeMessage,
  isMessageBelongsToChat,
  normalizeId,
  getCompanionId,
} from "../../utils/messageUtils";
import ChatInput from "./ChatInput";
import MessagesList from "./MessagesList";
import InfoPanel from "./InfoPanel";
import { SocketContext } from "../../context/SocketContext";
import OfferService from "../../services/OfferService";
import api from "../../services/api";

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
    const { socket, isConnected } = useContext(SocketContext);
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
    const [chatInfo, setChatInfo] = useState(null);
    // Локальное состояние для контроля открытия, чтобы не потерять состояние при обновлении пропсов
    const [localOpen, setLocalOpen] = useState(open);
    const initialOpenRef = useRef(false);

    // Синхронизируем локальное состояние с пропсами
    useEffect(() => {
      if (open) {
        setLocalOpen(true);
        initialOpenRef.current = true;
      } else if (initialOpenRef.current) {
        setLocalOpen(false);
      }
    }, [open]);

    // Добавляем логирование пропсов
    // useEffect(() => {
    //   console.log("[ChatModal] Пропсы при открытии:", {
    //     open,
    //     localOpen,
    //     requestId,
    //     userId,
    //     providerId,
    //     request: requestProp,
    //   });
    // }, [open, localOpen, requestId, userId, providerId, requestProp]);

    // Скролл вниз
    const scrollToBottom = useCallback(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, []);

    // --- ДОБАВЛЯЮ: обработчик новых сообщений ---
    const handleNewMessage = useCallback(
      (message) => {
        // Проверка на дубликаты (по id)
        if (!message || !message._id) return;
        if (lastMessageRef.current.has(message._id)) return;
        lastMessageRef.current.add(message._id);
        // Нормализация сообщения
        const normalized = normalizeMessage(message);
        if (!normalized) return;
        setMessages((prev) => {
          // Если есть временное сообщение с тем же текстом и senderId — заменяем
          const tempIndex = prev.findIndex(
            (msg) =>
              msg.isSending &&
              msg.message === normalized.message &&
              msg.senderId === normalized.senderId
          );
          if (tempIndex !== -1) {
            const newArr = [...prev];
            newArr[tempIndex] = { ...normalized, isSending: false };
            return newArr;
          }
          // Если уже есть сообщение с таким id — не добавляем
          if (prev.some((msg) => msg._id === normalized._id)) return prev;
          return [...prev, { ...normalized, isSending: false }];
        });
        scrollToBottom();
      },
      [scrollToBottom]
    );

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
      // --- ДОБАВЛЯЮ: проверка на userId и providerId ---
      // if (!userId || !providerId) {
      //   setError(
      //     "Чат не может быть открыт: отсутствует участник (userId или providerId)"
      //   );
      //   setLoading(false);
      //   console.error("[ChatModal] Открытие чата без userId или providerId", {
      //     userId,
      //     providerId,
      //     requestId,
      //   });
      //   return;
      // }
    }, [open, requestId, userId, providerId]);

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
        console.log(
          "[ChatModal] fetchMessages: requestId",
          requestId,
          "recipientToUse",
          recipientToUse,
          "currentUserId",
          user?._id
        );
        if (!requestId || !recipientToUse) {
          setLoading(false);
          setError("Не удалось определить получателя для загрузки сообщений");
          console.error(
            "[ChatModal] fetchMessages: отсутствует requestId или recipientToUse",
            { requestId, recipientToUse }
          );
          return;
        }
        try {
          setLoading(true);
          const fetchedMessages = await ChatService.getMessages(requestId);
          console.log(
            "[ChatModal] fetchMessages: получено с сервера",
            fetchedMessages
          );
          if (!fetchedMessages || fetchedMessages.length === 0) {
            setMessages([]);
            setLoading(false);
            return;
          }
          const normalizedMessages = fetchedMessages
            .map((msg) => normalizeMessage(msg))
            .filter((msg) => {
              const belongs =
                msg !== null &&
                isMessageBelongsToChat(msg, {
                  requestId,
                  currentUserId: user?._id,
                  recipientId: recipientToUse,
                });
              if (!belongs) {
                console.log("[ChatModal] ОТФИЛЬТРОВАНО", msg);
              }
              return belongs;
            });
          console.log("[ChatModal] После фильтрации:", normalizedMessages);
          setMessages(normalizedMessages);
          setLoading(false);
          scrollToBottom();
        } catch (err) {
          setError(err.message || "Ошибка при загрузке сообщений");
          setLoading(false);
          console.error("[ChatModal] Ошибка при загрузке сообщений:", err);
        }
      },
      [requestId, recipientId, user?._id, scrollToBottom]
    );

    // Загрузка информации о чате
    const fetchChatInfo = useCallback(async () => {
      if (!requestId || !user?._id) {
        console.error(
          "[ChatModal] fetchChatInfo: отсутствует requestId или user._id",
          { requestId, user }
        );
        return;
      }
      try {
        let response = requestProp;
        if (!response) {
          response = await ChatService.get(`/requests/${requestId}`);
        }
        // --- ДОБАВЛЕНО: подгрузка оффера, если его нет ---
        if (!response.offer && response.offerId) {
          let offerId = response.offerId;
          if (typeof offerId === "object" && offerId._id) {
            offerId = offerId._id;
          }
          if (typeof offerId === "string") {
            try {
              const offer = await OfferService.getById(offerId);
              response.offer = offer;
            } catch (e) {
              console.warn(
                "[ChatModal] Не удалось подгрузить offer по offerId",
                offerId,
                e
              );
            }
          }
        }
        setChatInfo(response);
        const currentUserId = normalizeId(user._id);
        const companionId = getCompanionId(response, currentUserId);
        let companionName = "Собеседник";
        if (
          companionId &&
          response.userId &&
          response.userId._id === companionId
        ) {
          companionName = response.userId.name || "Собеседник";
        } else if (
          companionId &&
          response.providerId &&
          response.providerId._id === companionId
        ) {
          companionName = response.providerId.name || "Собеседник";
        } else if (
          companionId &&
          response.adminId &&
          response.adminId._id === companionId
        ) {
          companionName = response.adminId.name || "Собеседник";
        }
        setRecipientId(companionId);
        setRecipientName(companionName);
        setIsInitialized(true);
      } catch (err) {
        setError(err.message || "Не удалось загрузить информацию о чате");
        setLoading(false);
        console.error(
          "[ChatModal] Ошибка при загрузке информации о чате:",
          err
        );
      }
    }, [requestId, user?._id, user?.role, requestProp]);

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

    // Отправка сообщения (теперь с поддержкой файлов)
    const sendMessage = async (files = [], text = "") => {
      if (
        (!text.trim() && (!files || files.length === 0)) ||
        !socket ||
        !isConnected ||
        !requestId ||
        !user?._id ||
        !recipientId
      )
        return;
      try {
        // 1. Сначала отправляем файлы (если есть)
        if (files && files.length > 0) {
          for (const file of files) {
            const formData = new FormData();
            formData.append("image", file);

            // Используем полный URL из api конфига вместо относительного пути
            const baseURL = api.defaults.baseURL;
            const url = `${baseURL}/services/img-upload`.replace(
              "/api/api/",
              "/api/"
            );

            const res = await fetch(url, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: formData,
            });
            const data = await res.json();
            if (data.success && data.url) {
              const fileUrl = data.url;
              // Отправляем ссылку на файл как отдельное сообщение
              const normalizedSenderId = normalizeId(user._id);
              const normalizedRecipientId = normalizeId(recipientId);
              const participants = [
                normalizedSenderId,
                normalizedRecipientId,
              ].sort();
              const chatRoomId = participants.join("_");
              const messageId = `msg_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;
              const timestamp = new Date().toISOString();
              const messageData = {
                _id: messageId,
                message: fileUrl,
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
                type: "file",
                fileName: file.name,
              };
              const tempId = `local-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`;
              const optimisticMessage = {
                ...messageData,
                _id: tempId,
                isSending: true,
              };
              setMessages((prev) => [...prev, optimisticMessage]);
              socket.emit("private_message", messageData);
            }
          }
        }
        // 2. Затем отправляем текст (если есть)
        if (text.trim()) {
          const normalizedSenderId = normalizeId(user._id);
          const normalizedRecipientId = normalizeId(recipientId);
          const participants = [
            normalizedSenderId,
            normalizedRecipientId,
          ].sort();
          const chatRoomId = participants.join("_");
          const messageId = `msg_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          const timestamp = new Date().toISOString();
          const messageData = {
            _id: messageId,
            message: text.trim(),
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
            type: "text",
          };
          const tempId = `local-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          const optimisticMessage = {
            ...messageData,
            _id: tempId,
            isSending: true,
          };
          setMessages((prev) => [...prev, optimisticMessage]);
          socket.emit("private_message", messageData);
        }
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

    useEffect(() => {
      if (open && recipientId && isInitialized && requestId && user?._id) {
        console.log(
          "[ChatModal] useEffect: открытие чата, recipientId",
          recipientId,
          "currentUserId",
          user._id
        );
        fetchMessages();
      }
      // eslint-disable-next-line
    }, [open, recipientId, isInitialized, requestId, user?._id]);

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
            borderRadius: isMobile ? 0 : 1,
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
