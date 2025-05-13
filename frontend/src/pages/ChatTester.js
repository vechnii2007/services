import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Chat from "./Chat";
import { useAuth } from "../hooks/useAuth";
import { SocketContext } from "../context/SocketContext";
import ChatService from "../services/ChatService";

const ChatTester = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected, lastError, sendTestMessage } =
    useContext(SocketContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestInfo, setRequestInfo] = useState(null);
  const [recipientId, setRecipientId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [manualRequestId, setManualRequestId] = useState(requestId || "");
  const [manualRecipientId, setManualRecipientId] = useState("");
  const [allChats, setAllChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [testMessage, setTestMessage] = useState("Тестовое сообщение");

  // Получение информации о запросе
  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      return;
    }

    const fetchRequestInfo = async () => {
      try {
        setLoading(true);
        const request = await ChatService.get(`/requests/${requestId}`);

        if (!request) {
          throw new Error("Запрос не найден");
        }

        setRequestInfo(request);

        // Определение получателя в зависимости от роли
        const currentUserId = user?.id;
        if (!currentUserId) {
          throw new Error("Информация о пользователе недоступна");
        }

        let recipient;
        let recipientName;

        // Если пользователь - провайдер, то получатель - клиент
        if (
          currentUserId === request.providerId?._id ||
          currentUserId === request.providerId
        ) {
          recipient = request.userId?._id || request.userId;
          recipientName = request.userId?.name || "Клиент";
        }
        // Если пользователь - клиент, то получатель - провайдер
        else {
          recipient = request.providerId?._id || request.providerId;
          recipientName = request.providerId?.name || "Провайдер";
        }

        setRecipientId(recipient.toString());
        setRecipientName(recipientName);
      } catch (err) {
        setError(`Ошибка загрузки данных: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRequestInfo();
  }, [requestId, user]);

  // Загрузка всех чатов пользователя для отладки
  const fetchAllChats = async () => {
    try {
      setLoadingChats(true);

      // Получаем чаты в зависимости от роли пользователя
      let chats = [];
      if (user?.role === "provider") {
        chats = await ChatService.getProviderChats();
      } else {
        chats = await ChatService.getMyChats();
      }

      setAllChats(chats);
    } catch (err) {
      setError(`Ошибка загрузки чатов: ${err.message}`);
    } finally {
      setLoadingChats(false);
    }
  };

  // Обработчик для ручного ввода requestId
  const handleManualStart = () => {
    if (manualRequestId && manualRecipientId) {
      setRecipientId(manualRecipientId);
      setRecipientName("Получатель");
      setLoading(false);
      navigate(`/chat-tester/${manualRequestId}`, { replace: true });
    }
  };

  // Навигация назад
  const handleBack = () => {
    navigate(-1);
  };

  // Тестирование подключения
  const testSocketConnection = () => {
    if (!socket) {
      return "Сокет не инициализирован";
    }

    if (!isConnected) {
      return "Сокет не подключен";
    }

    return "Сокет подключен";
  };

  // Отправка тестового сообщения напрямую через сокет
  const handleSendTestMessage = () => {
    if (!isConnected || !requestId || !recipientId) {
      setError(
        "Невозможно отправить тестовое сообщение: проверьте подключение и наличие получателя"
      );
      return;
    }

    try {
      const success = sendTestMessage(requestId, recipientId, testMessage);

      if (success) {
        alert(
          `Тестовое сообщение отправлено:\nПолучатель: ${recipientId}\nЗапрос: ${requestId}\nСообщение: ${testMessage}`
        );
      } else {
        setError("Не удалось отправить тестовое сообщение");
      }
    } catch (err) {
      setError(`Ошибка отправки тестового сообщения: ${err.message}`);
    }
  };

  // Выбор чата из списка для тестирования
  const handleSelectChat = (chat) => {
    if (chat.requestId) {
      navigate(`/chat-tester/${chat.requestId}`, { replace: true });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">Тестирование чата</Typography>
      </Box>

      {/* Отображение статуса соединения */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Статус соединения</Typography>
        <Box display="flex" alignItems="center" mt={1}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: isConnected ? "success.main" : "error.main",
              mr: 1,
            }}
          />
          <Typography>{testSocketConnection()}</Typography>
        </Box>
        {lastError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Последняя ошибка: {lastError.message} ({lastError.time})
          </Alert>
        )}
      </Paper>

      {/* Инструменты тестирования */}
      {requestId && recipientId && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" mb={2}>
            Инструменты тестирования
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Текст тестового сообщения"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid
              item
              xs={12}
              md={4}
              sx={{ display: "flex", alignItems: "center", mt: 2 }}
            >
              <Button
                variant="contained"
                color="secondary"
                onClick={handleSendTestMessage}
                disabled={!isConnected}
              >
                Отправить тестовое сообщение напрямую
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Список всех чатов для отладки */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">Все чаты пользователя</Typography>
          <Button
            variant="outlined"
            onClick={fetchAllChats}
            disabled={loadingChats}
          >
            {loadingChats ? "Загрузка..." : "Обновить список"}
          </Button>
        </Box>

        {loadingChats ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
          </Box>
        ) : allChats.length === 0 ? (
          <Alert severity="info">
            Нет доступных чатов или список не загружен
          </Alert>
        ) : (
          <List>
            {allChats.map((chat, index) => (
              <React.Fragment key={chat._id || index}>
                <ListItem
                  button
                  onClick={() =>
                    handleSelectChat({ ...chat, requestId: chat._id })
                  }
                  selected={chat._id === requestId}
                >
                  <ListItemText
                    primary={
                      chat.serviceType ||
                      chat.description ||
                      `Чат #${index + 1}`
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{ display: "block", fontSize: "0.7rem" }}
                      >
                        ChatID: {chat._id}
                        <br />
                        ProviderID: {chat.providerId?._id || chat.providerId}
                        <br />
                        UserID: {chat.userId?._id || chat.userId}
                        <br />
                        Service: {chat.serviceType}
                        <br />
                        Status: {chat.status}
                        <br />
                        Обновлен: {new Date(chat.createdAt).toLocaleString()}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < allChats.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Ручной ввод параметров */}
      {!requestId && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" mb={2}>
            Ручной ввод параметров
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ID запроса (requestId)"
                value={manualRequestId}
                onChange={(e) => setManualRequestId(e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ID получателя (recipientId)"
                value={manualRecipientId}
                onChange={(e) => setManualRecipientId(e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                disabled={!manualRequestId || !manualRecipientId}
                onClick={handleManualStart}
              >
                Запустить чат с ручными параметрами
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Компонент чата */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : requestId && recipientId ? (
        <Paper sx={{ height: 600, overflow: "hidden" }}>
          <Box height="100%">
            <Chat
              requestId={requestId}
              recipientId={recipientId}
              recipientName={recipientName}
            />
          </Box>
        </Paper>
      ) : (
        <Alert severity="info">
          Выберите чат или введите параметры вручную.
        </Alert>
      )}

      {/* Информация о запросе */}
      {requestInfo && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" mb={2}>
            Информация о запросе
          </Typography>
          <Typography
            variant="body2"
            component="pre"
            sx={{
              overflowX: "auto",
              p: 2,
              bgcolor: "grey.100",
              borderRadius: 1,
            }}
          >
            {JSON.stringify(requestInfo, null, 2)}
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default ChatTester;
