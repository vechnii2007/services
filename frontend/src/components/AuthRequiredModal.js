import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { useTranslation } from "react-i18next";

const AuthRequiredModal = ({ open, onClose, onLogin, onRegister }) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: "center", fontWeight: 700 }}>
        {t("auth_required.title", "Требуется авторизация")}
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body1"
          color="text.secondary"
          align="center"
          sx={{ mb: 2 }}
        >
          {t(
            "auth_required.message",
            "Для этого действия необходимо войти или зарегистрироваться."
          )}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={onLogin}
          sx={{ minWidth: 120 }}
        >
          {t("auth_required.login", "Войти")}
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={onRegister}
          sx={{ minWidth: 120 }}
        >
          {t("auth_required.register", "Зарегистрироваться")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuthRequiredModal;
