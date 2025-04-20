import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { useSocket } from "../hooks/useSocket";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../constants";
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError(t("please_login"));
          navigate("/login");
          return;
        }
        const res = await axios.get(`/api/services/messages/${requestId}`);
        setMessages(res.data);
      } catch (error) {
        setError(
          "Error fetching messages: " +
            (error.response?.data?.error || error.message)
        );
        console.error("Error fetching messages:", error);
      }
    };

    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError(t("please_login"));
          navigate("/login");
          return;
        }
        const res = await axios.get(`/api/users/me`);
        setUserId(res.data._id);
        setUserName(res.data.name);
      } catch (error) {
        setError(
          "Error fetching user: " +
            (error.response?.data?.error || error.message)
        );
        console.error("Error fetching user:", error);
        if (error.response?.status === 400 || error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchMessages(), fetchUser()]);
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

  const handleSendMessage = () => {
    if (newMessage.trim() && socket) {
      const messageData = {
        room: requestId,
        userId,
        userName,
        text: newMessage,
        timestamp: new Date(),
      };
      socket.emit("sendMessage", messageData);
      setNewMessage("");
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
              primary={message.text}
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
          disabled={!userId}
        >
          {t("send")}
        </Button>
      </Box>
    </Box>
  );
};

export default Chat;
