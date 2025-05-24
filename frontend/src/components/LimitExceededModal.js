import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";
import UserTariffsTab from "./UserTariffsTab";

const LimitExceededModal = ({ open, onClose, message }) => {
  const { t } = useTranslation();
  const [showTariffs, setShowTariffs] = useState(false);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: "center", fontWeight: 700 }}>
        {t("limit_exceeded.title", "Лимит превышен")}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body1"
          color="text.secondary"
          align="center"
          sx={{ mb: 2 }}
        >
          {message ||
            t(
              "limit_exceeded.message",
              "Вы достигли лимита по вашему тарифу. Оформите подписку для расширения возможностей."
            )}
        </Typography>
        {showTariffs && (
          <Box mt={3}>
            <UserTariffsTab />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        {!showTariffs && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowTariffs(true)}
            sx={{ minWidth: 180 }}
          >
            {t("limit_exceeded.subscribe_button", "Оформить подписку")}
          </Button>
        )}
        <Button onClick={onClose} color="secondary">
          {t("close", "Закрыть")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LimitExceededModal;
