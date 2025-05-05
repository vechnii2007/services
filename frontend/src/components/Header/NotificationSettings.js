import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import NotificationService from "../../services/NotificationService";
import {
  Box,
  Typography,
  Switch,
  FormGroup,
  FormControlLabel,
  Divider,
  Button,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Notifications as NotificationsIcon } from "@mui/icons-material";

const NotificationSettings = () => {
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState({
    messages: true,
    offers: true,
    statusUpdates: true,
    email: true,
    push: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Загрузка настроек уведомлений при монтировании компонента
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        const data = await NotificationService.getNotificationPreferences();
        setPreferences(data);
      } catch (err) {
        console.error("Error loading notification preferences:", err);
        setError(t("error_loading_preferences"));
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [t]);

  // Обработчик изменения переключателей
  const handleToggle = (name) => async (event) => {
    const newPreferences = {
      ...preferences,
      [name]: event.target.checked,
    };

    setPreferences(newPreferences);

    try {
      await NotificationService.updateNotificationPreferences(newPreferences);
      setSuccess(t("preferences_updated"));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating preferences:", err);
      setError(t("error_updating_preferences"));
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading && Object.keys(preferences).length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <NotificationsIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">{t("notification_settings")}</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {t("notification_types")}
      </Typography>

      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={preferences.messages}
              onChange={handleToggle("messages")}
            />
          }
          label={t("message_notifications")}
        />
        <FormControlLabel
          control={
            <Switch
              checked={preferences.offers}
              onChange={handleToggle("offers")}
            />
          }
          label={t("offer_notifications")}
        />
        <FormControlLabel
          control={
            <Switch
              checked={preferences.statusUpdates}
              onChange={handleToggle("statusUpdates")}
            />
          }
          label={t("status_notifications")}
        />
      </FormGroup>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {t("notification_channels")}
      </Typography>

      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={preferences.email}
              onChange={handleToggle("email")}
            />
          }
          label={t("email_notifications")}
        />
      </FormGroup>
    </Paper>
  );
};

export default NotificationSettings;
