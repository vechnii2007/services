import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import api from "../../middleware/api";

const PromotionDialog = ({ open, onClose, offerId, onPromotionAdded }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    type: "",
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleDateChange = (field) => (date) => {
    setFormData({
      ...formData,
      [field]: date,
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      await api.post(`/offers/${offerId}/promotions`, formData);
      onPromotionAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add promotion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("add_promotion")}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel>{t("promotion_type")}</InputLabel>
          <Select
            value={formData.type}
            onChange={handleChange("type")}
            label={t("promotion_type")}
          >
            <MenuItem value="TOP">{t("top")}</MenuItem>
            <MenuItem value="HIGHLIGHT">{t("highlight")}</MenuItem>
            <MenuItem value="URGENT">{t("urgent")}</MenuItem>
          </Select>
        </FormControl>

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <FormControl fullWidth margin="normal">
            <DateTimePicker
              label={t("start_date")}
              value={formData.startDate}
              onChange={handleDateChange("startDate")}
              renderInput={(params) => <TextField {...params} fullWidth />}
              minDateTime={new Date()}
            />
          </FormControl>

          <FormControl fullWidth margin="normal">
            <DateTimePicker
              label={t("end_date")}
              value={formData.endDate}
              onChange={handleDateChange("endDate")}
              renderInput={(params) => <TextField {...params} fullWidth />}
              minDateTime={formData.startDate}
            />
          </FormControl>
        </LocalizationProvider>

        {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("cancel")}</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || !formData.type}
        >
          {t("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PromotionDialog;
