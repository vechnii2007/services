import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../middleware/api";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Button,
  Stack,
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import ChatIcon from "@mui/icons-material/Chat";
import PhoneIcon from "@mui/icons-material/Phone";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useAuth } from "../hooks/useAuth";
import { useChatModal } from "../context/ChatModalContext";

const statusColor = {
  pending: "warning",
  accepted: "info",
  completed: "success",
  cancelled: "error",
  inactive: "default",
};

const RequestDetails = () => {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const { openChat } = useChatModal();

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/services/requests/${id}`);
        setRequest(res.data);
        setError("");
      } catch (err) {
        setError(
          err.response?.data?.error || "Запрос не найден или нет доступа"
        );
        setRequest(null);
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 6 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!request) {
    return (
      <Box sx={{ py: 6 }}>
        <Typography align="center" color="textSecondary">
          Запрос не найден
        </Typography>
      </Box>
    );
  }

  const isOwner = user && request.userId && user._id === request.userId._id;
  const isProvider = user && user.role === "provider" && !isOwner;

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", py: 6 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Детали запроса
        </Typography>
        <Stack spacing={2}>
          <Box>
            <Typography variant="body1">
              <strong>Тип услуги:</strong> {request.serviceType}
            </Typography>
            <Typography variant="body1">
              <strong>Описание:</strong>{" "}
              {request.description ? request.description : "Нет описания"}
            </Typography>
            <Typography
              variant="body1"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <strong>Статус:</strong>
              <Chip
                label={request.status}
                color={statusColor[request.status] || "default"}
                size="small"
              />
            </Typography>
            <Typography variant="body1">
              <strong>Создан:</strong>{" "}
              {new Date(request.createdAt).toLocaleString()}
            </Typography>
            {request.location && (
              <Typography
                variant="body1"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <LocationOnIcon fontSize="small" color="action" />
                <strong>Локация:</strong> {request.location}
              </Typography>
            )}
            {request.coordinates && (
              <Typography variant="body2" color="textSecondary">
                <strong>Координаты:</strong> {request.coordinates.lat},{" "}
                {request.coordinates.lng}
              </Typography>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              <PersonIcon fontSize="small" sx={{ mr: 1 }} /> Пользователь
            </Typography>
            <Typography variant="body2">
              <strong>Имя:</strong> {request.userId?.name || "-"}
            </Typography>
            <Typography
              variant="body2"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <MailOutlineIcon fontSize="small" />
              <strong>Email:</strong> {request.userId?.email || "-"}
            </Typography>
            {request.userId?.phone && (
              <Typography
                variant="body2"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <PhoneIcon fontSize="small" />
                <strong>Телефон:</strong> {request.userId.phone}
              </Typography>
            )}
            <Typography variant="body2">
              <strong>Статус:</strong> {request.userId?.status || "-"}
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            {(isOwner || isProvider) && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<ChatIcon />}
                onClick={() => openChat(request._id)}
              >
                Открыть чат
              </Button>
            )}
            {request.userId?.email && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<MailOutlineIcon />}
                href={`mailto:${request.userId.email}`}
              >
                Связаться
              </Button>
            )}
            {request.userId?.phone && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<PhoneIcon />}
                href={`tel:${request.userId.phone}`}
              >
                Позвонить
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default RequestDetails;
