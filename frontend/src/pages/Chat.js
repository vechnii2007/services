import React, { useState, useEffect } from "react";
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
} from "@mui/material";

const Chat = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const messagesData = await ChatService.getMessages(requestId);
        setMessages(messagesData);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setError(error.message);
      }
    };

    const fetchUserData = async () => {
      try {
        // Используем API напрямую для получения данных пользователя
        const res = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch user data");

        const userData = await res.json();
        setUserId(userData._id);
        setUserName(userData.name);

        // Определяем получателя - для простоты сделаем запрос на получение связанного запроса
        const requestData = await fetch(`/api/services/requests/${requestId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (requestData.ok) {
          const request = await requestData.json();
          // Если текущий пользователь является создателем запроса, то получатель - провайдер услуги
          // иначе получатель - создатель запроса
          if (request.userId === userData._id) {
            setRecipientId(request.providerId);
          } else {
            setRecipientId(request.userId);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError(error.message);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchMessages(), fetchUserData()]);
      setLoading(false);
    };

    fetchData();

    if (socket) {
      socket.emit("joinRoom", requestId);

      socket.on("receiveMessage", (message) => {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            ...message,
            userId: {
              _id: message.userId,
              name: message.userName || "Unknown",
            },
            timestamp: new Date(message.timestamp),
          },
        ]);
      });

      return () => {
        socket.off("receiveMessage");
      };
    }
  }, [requestId, t, navigate, socket]);

  const handleSendMessage = async () => {
    if (newMessage.trim() && recipientId) {
      try {
        // Отправляем через ChatService
        await ChatService.sendMessage(requestId, newMessage, recipientId);

        // Обновляем список сообщений локально
        const newMessageObj = {
          senderId: userId,
          recipientId: recipientId,
          requestId: requestId,
          message: newMessage,
          timestamp: new Date(),
          userId: { _id: userId, name: userName },
        };

        setMessages((prevMessages) => [...prevMessages, newMessageObj]);
        setNewMessage("");
      } catch (error) {
        console.error("Error sending message:", error);
        setError(error.message);
      }
    } else {
      setError("Message text or recipient is missing");
    }
  };

  if (loading) {
    return <Typography>{t("loading")}</Typography>;
  }

  if (error) {
    return (
      <Typography variant="body2" color="error" sx={{ marginBottom: 2 }}>
        {error}
      </Typography>
    );
  }

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h5" gutterBottom>
        {t("chat")} - Request ID: {requestId}
      </Typography>
      <List
        sx={{
          maxHeight: "400px",
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: 2,
        }}
      >
        {messages.map((message, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={message.message || message.text}
              secondary={`${message.userId?.name || "Unknown"}: ${new Date(
                message.timestamp
              ).toLocaleString()}`}
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ display: "flex", gap: 2, marginTop: 2 }}>
        <TextField
          label={t("message")}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={!userId || !recipientId}
        >
          {t("send")}
        </Button>
      </Box>
    </Box>
  );
};

export default Chat;
