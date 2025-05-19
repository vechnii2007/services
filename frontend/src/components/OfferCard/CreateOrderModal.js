import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { useTranslation } from "react-i18next";
import { createServiceRequest } from "../../services/api";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

const CreateOrderModal = ({ open, onClose, offer, onOrderCreated }) => {
  const { t } = useTranslation();
  const [description, setDescription] = useState("");
  const [dateTime, setDateTime] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  if (!offer) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        offerId: offer._id,
        providerId: offer.provider?._id,
        serviceType: offer.serviceType || offer.category,
        description,
        dateTime,
      };
      console.log("description to send:", description);
      console.log("payload to send:", payload);
      await createServiceRequest(payload);
      if (onOrderCreated) onOrderCreated();
      setDescription("");
      setDateTime(null);
      onClose();
      setSnackbar({
        open: true,
        message: t("request_created_successfully"),
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: t("request_create_error"),
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("create_request")}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {offer.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {offer.description}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {t("price")}: {offer.price || offer.priceFrom || "-"}
          </Typography>
          <Typography variant="body2">
            {t("provider")}: {offer.provider?.name || "-"}
          </Typography>
        </Box>
        <DateTimePicker
          label={t("date")}
          value={dateTime}
          onChange={setDateTime}
          renderInput={(params) => (
            <TextField {...params} fullWidth sx={{ mb: 2 }} />
          )}
        />
        <TextField
          label={t("description")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          sx={{ mb: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {t("common.cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || !dateTime}
        >
          {t("create_request_button")}
        </Button>
      </DialogActions>
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
    </Dialog>
  );
};

CreateOrderModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  offer: PropTypes.object,
  onOrderCreated: PropTypes.func,
};

export default CreateOrderModal;
