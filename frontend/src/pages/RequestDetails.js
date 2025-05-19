import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
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
  Snackbar,
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import ChatIcon from "@mui/icons-material/Chat";
import PhoneIcon from "@mui/icons-material/Phone";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useAuth } from "../hooks/useAuth";
import { useChatModal } from "../context/ChatModalContext";
import MuiAlert from "@mui/material/Alert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useTranslation } from "react-i18next";

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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const { t } = useTranslation();

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
  const isRequestProvider =
    user && request.providerId && user._id === request.providerId._id;

  const handleComplete = async () => {
    try {
      await api.put(`/services/requests/${request._id}/status`, {
        status: "completed",
      });
      setSnackbar({
        open: true,
        message: "Статус изменён на 'выполнено'",
        severity: "success",
      });
      const res = await api.get(`/services/requests/${request._id}`);
      setRequest(res.data);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || "Ошибка при смене статуса",
        severity: "error",
      });
    }
  };

  const handleConfirm = async () => {
    try {
      await api.put(`/services/requests/${request._id}/confirm`);
      setSnackbar({
        open: true,
        message: "Выполнение подтверждено!",
        severity: "success",
      });
      const res = await api.get(`/services/requests/${request._id}`);
      setRequest(res.data);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || "Ошибка при подтверждении",
        severity: "error",
      });
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", py: 6 }}>
      <Paper
        sx={{
          p: 4,
          boxShadow: 3,
          background: (theme) => theme.palette.background.paper,
          borderRadius: "20px",
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{ color: (theme) => theme.palette.text.primary }}
        >
          {t("request_details", "Детали запроса")}
        </Typography>
        <Stack spacing={2}>
          <Box>
            <Typography
              variant="body1"
              sx={{ color: (theme) => theme.palette.text.primary }}
            >
              <strong>{t("service_type", "Тип услуги")}:</strong>{" "}
              {t(request.serviceType)}
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: (theme) => theme.palette.text.primary }}
            >
              <strong>{t("description", "Описание")}:</strong>{" "}
              {request.description
                ? request.description
                : t("no_description", "Нет описания")}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: (theme) => theme.palette.text.primary,
              }}
            >
              <strong>{t("status", "Статус")}:</strong>
              <Chip
                label={t(request.status)}
                color={statusColor[request.status] || "default"}
                size="small"
                sx={{
                  color: (theme) =>
                    theme.palette.getContrastText(
                      theme.palette.background.paper
                    ),
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[800]
                      : theme.palette.grey[200],
                }}
              />
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: (theme) => theme.palette.text.primary }}
            >
              <strong>{t("created_at", "Создан")}:</strong>{" "}
              {new Date(request.createdAt).toLocaleString()}
            </Typography>
            {request.location && (
              <Typography
                variant="body1"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: (theme) => theme.palette.text.primary,
                }}
              >
                <LocationOnIcon fontSize="small" color="action" />
                <strong>{t("location", "Локация")}:</strong> {request.location}
              </Typography>
            )}
            {request.coordinates && (
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ color: (theme) => theme.palette.text.secondary }}
              >
                <strong>{t("coordinates", "Координаты")}:</strong>{" "}
                {request.coordinates.lat}, {request.coordinates.lng}
              </Typography>
            )}
          </Box>

          {/* --- Информация о предложении --- */}
          {request.offerId && typeof request.offerId === "object" && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                border: (theme) => `1px solid ${theme.palette.divider}`,
                borderRadius: "20px",
                background: (theme) => theme.palette.background.paper,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, color: (theme) => theme.palette.text.primary }}
              >
                <strong>{t("offer_info", "Информация о предложении")}</strong>
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: (theme) => theme.palette.text.primary }}
              >
                <strong>{t("offer_title", "Название")}:</strong>{" "}
                <Link
                  to={`/offers/${request.offerId._id}`}
                  style={{ textDecoration: "underline", color: "inherit" }}
                >
                  {request.offerId.title || t("no_title", "(без названия)")}
                </Link>
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: (theme) => theme.palette.text.secondary }}
              >
                <strong>{t("service_type", "Тип услуги")}:</strong>{" "}
                {t(request.offerId.serviceType)}
              </Typography>
              {request.offerId.location && (
                <Typography
                  variant="body2"
                  sx={{ color: (theme) => theme.palette.text.secondary }}
                >
                  <strong>{t("location", "Локация")}:</strong>{" "}
                  {request.offerId.location}
                </Typography>
              )}
              {request.offerId.price && (
                <Typography
                  variant="body2"
                  sx={{ color: (theme) => theme.palette.text.secondary }}
                >
                  <strong>{t("price", "Цена")}:</strong> {request.offerId.price}
                </Typography>
              )}
              {request.offerId.description && (
                <Typography
                  variant="body2"
                  sx={{ color: (theme) => theme.palette.text.secondary }}
                >
                  <strong>
                    {t("offer_description", "Описание предложения")}:
                  </strong>{" "}
                  {request.offerId.description}
                </Typography>
              )}
              {request.offerId.images && request.offerId.images.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <img
                    src={request.offerId.images[0]}
                    alt={request.offerId.title || "offer image"}
                    style={{ maxWidth: 180, borderRadius: 8 }}
                  />
                </Box>
              )}
            </Box>
          )}

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              <PersonIcon fontSize="small" sx={{ mr: 1 }} />{" "}
              {t("user", "Пользователь")}
            </Typography>
            <Typography variant="body2">
              <strong>{t("name", "Имя")}:</strong> {request.userId?.name || "-"}
            </Typography>
            <Typography
              variant="body2"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <MailOutlineIcon fontSize="small" />
              <strong>{t("email", "Email")}:</strong>{" "}
              {request.userId?.email || "-"}
            </Typography>
            {request.userId?.phone && (
              <Typography
                variant="body2"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <PhoneIcon fontSize="small" />
                <strong>{t("phone", "Телефон")}:</strong> {request.userId.phone}
              </Typography>
            )}
            <Typography variant="body2">
              <strong>{t("status", "Статус")}:</strong>{" "}
              {t(request.userId?.status) || "-"}
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
            alignItems="center"
            sx={{ mt: 3, flexWrap: "wrap" }}
          >
            {(isOwner || isProvider) && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<ChatIcon />}
                onClick={() => openChat(request._id)}
                sx={{
                  minWidth: 150,
                  mb: { xs: 1.5, sm: 0 },
                  width: { xs: "100%", sm: "auto" },
                  background: (theme) => theme.palette.primary.main,
                  color: (theme) => theme.palette.primary.contrastText,
                  boxShadow: 2,
                  borderRadius: 3,
                  "&:hover": {
                    background: (theme) => theme.palette.primary.dark,
                  },
                }}
              >
                {t("open_chat", "Открыть чат")}
              </Button>
            )}
            {request.userId?.email && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<MailOutlineIcon />}
                href={`mailto:${request.userId.email}`}
                sx={{
                  minWidth: 150,
                  mb: { xs: 1.5, sm: 0 },
                  width: { xs: "100%", sm: "auto" },
                  borderColor: (theme) => theme.palette.primary.main,
                  color: (theme) => theme.palette.primary.main,
                  "&:hover": {
                    borderColor: (theme) => theme.palette.primary.dark,
                    color: (theme) => theme.palette.primary.dark,
                  },
                }}
              >
                {t("contact", "Связаться")}
              </Button>
            )}
            {request.userId?.phone && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<PhoneIcon />}
                href={`tel:${request.userId.phone}`}
                sx={{
                  minWidth: 150,
                  mb: { xs: 1.5, sm: 0 },
                  width: { xs: "100%", sm: "auto" },
                  borderColor: (theme) => theme.palette.primary.main,
                  color: (theme) => theme.palette.primary.main,
                  "&:hover": {
                    borderColor: (theme) => theme.palette.primary.dark,
                    color: (theme) => theme.palette.primary.dark,
                  },
                }}
              >
                {t("call", "Позвонить")}
              </Button>
            )}
            {isRequestProvider && request.status !== "completed" && (
              <Button
                variant="contained"
                color="success"
                onClick={handleComplete}
                sx={{
                  minWidth: 180,
                  mb: { xs: 1, sm: 0 },
                  background: (theme) => theme.palette.success.main,
                  color: (theme) => theme.palette.success.contrastText,
                  boxShadow: 2,
                  borderRadius: 3,
                  "&:hover": {
                    background: (theme) => theme.palette.success.dark,
                  },
                }}
              >
                {t("complete_order", "Завершить заказ")}
              </Button>
            )}
          </Stack>

          {/* Кнопка подтверждения выполнения — отдельным блоком */}
          {isOwner &&
            request.status === "completed" &&
            !request.customerConfirmed && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mt: { xs: 2, sm: 2 },
                }}
              >
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleConfirm}
                  startIcon={<CheckCircleIcon />}
                  sx={{
                    minWidth: 220,
                    fontSize: 18,
                    py: 1.5,
                    width: { xs: "100%", sm: "auto" },
                    maxWidth: 400,
                    background: (theme) => theme.palette.success.main,
                    color: (theme) => theme.palette.success.contrastText,
                    boxShadow: 2,
                    borderRadius: 3,
                    "&:hover": {
                      background: (theme) => theme.palette.success.dark,
                    },
                  }}
                >
                  {t("confirm_completion", "Подтвердить выполнение")}
                </Button>
              </Box>
            )}
        </Stack>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default RequestDetails;
