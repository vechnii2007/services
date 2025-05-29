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
import { getCategoryDisplayName } from "../helpers/category";

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
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "ru";

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

  const getId = (val) =>
    typeof val === "object" && val !== null ? val._id : val;
  const isCustomer =
    user && request.userId && user._id === getId(request.userId);
  const isExecutor =
    user && request.providerId && user._id === getId(request.providerId);

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

  // Новый обработчик для взятия в работу
  const handleTakeInWork = async () => {
    try {
      await api.put(`/services/requests/${request._id}/status`, {
        status: "in_progress",
      });
      setSnackbar({
        open: true,
        message: "Заявка взята в работу",
        severity: "success",
      });
      const res = await api.get(`/services/requests/${request._id}`);
      setRequest(res.data);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || "Ошибка при взятии в работу",
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
              {getCategoryDisplayName(request.serviceType, lang)}
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
                label={
                  request.status === "pending"
                    ? isCustomer
                      ? t("waiting_for_executor", "Ожидает исполнителя")
                      : t(request.status)
                    : request.status === "in_progress"
                    ? isCustomer
                      ? t("in_progress", "В работе")
                      : t("in_progress", "В работе")
                    : request.status === "confirmed"
                    ? t("completed", "Завершен")
                    : t(request.status)
                }
                color={
                  request.status === "confirmed"
                    ? "success"
                    : statusColor[request.status] || "default"
                }
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
                {getCategoryDisplayName(request.offerId?.serviceType, lang)}
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
            {/* Если статус confirmed — обоим показываем лейбл 'Завершен' */}
            {request.status === "confirmed" && (
              <Chip
                label={t("completed", "Завершено")}
                color="success"
                variant="filled"
                sx={{
                  fontSize: 18,
                  px: 3,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 600,
                  letterSpacing: 1,
                  height: 44,
                  minWidth: 160,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
            )}
            {/* Кнопка 'Взять в работу' — только для исполнителя, только если статус pending */}
            {isExecutor && request.status === "pending" && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleTakeInWork}
                sx={{
                  minWidth: 160,
                  height: 44,
                  borderRadius: 3,
                  fontSize: 16,
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  boxShadow: 2,
                  textTransform: "none",
                }}
              >
                {t("take_in_work", "Взять в работу")}
              </Button>
            )}
            {/* Кнопка завершения заказа — только для исполнителя, только если статус in_progress */}
            {isExecutor && request.status === "in_progress" && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleComplete}
                sx={{
                  minWidth: 160,
                  height: 44,
                  borderRadius: 3,
                  fontSize: 16,
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  boxShadow: 2,
                  textTransform: "none",
                }}
              >
                {t("complete_order", "Завершить заказ")}
              </Button>
            )}
            {/* Кнопка подтверждения выполнения — только для заказчика, только если статус completed */}
            {isCustomer && request.status === "completed" && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleConfirm}
                startIcon={<CheckCircleIcon />}
                sx={{
                  minWidth: 160,
                  height: 44,
                  borderRadius: 3,
                  fontSize: 16,
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  boxShadow: 2,
                  textTransform: "none",
                }}
              >
                {t("confirm_completion", "Подтвердить выполнение")}
              </Button>
            )}
            {/* Остальные кнопки (чат, связаться, позвонить) оставляем как есть */}
            {(isCustomer || isExecutor) && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<ChatIcon />}
                onClick={() => openChat(request._id)}
                sx={{
                  minWidth: 150,
                  mb: { xs: 1.5, sm: 0 },
                  width: { xs: "100%", sm: "auto" },
                  borderRadius: 3,
                  boxShadow: 2,
                  fontSize: 16,
                  py: 1.5,
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
                  borderRadius: 3,
                  fontSize: 16,
                  py: 1.5,
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
                  borderRadius: 3,
                  fontSize: 16,
                  py: 1.5,
                }}
              >
                {t("call", "Позвонить")}
              </Button>
            )}
          </Stack>
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
