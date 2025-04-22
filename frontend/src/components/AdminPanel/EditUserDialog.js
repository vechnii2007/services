import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../../middleware/api";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const EditUserDialog = ({ open, onClose, userId, onUserUpdated }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    role: "user",
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/admin/users/${userId}`);
        setFormData({
          name: res.data.name,
          email: res.data.email,
          phone: res.data.phone,
          address: res.data.address,
          role: res.data.role,
        });
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    if (userId) fetchUser();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      await api.patch(`/admin/users/${userId}`, formData);
      onUserUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t("edit_user")}</DialogTitle>
      <DialogContent>
        <TextField
          label={t("name")}
          name="name"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label={t("email")}
          name="email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label={t("phone")}
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label={t("address")}
          name="address"
          value={formData.address}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>{t("role")}</InputLabel>
          <Select name="role" value={formData.role} onChange={handleChange}>
            <MenuItem value="user">{t("user")}</MenuItem>
            <MenuItem value="provider">{t("provider")}</MenuItem>
            <MenuItem value="admin">{t("admin")}</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          {t("cancel")}
        </Button>
        <Button onClick={handleSubmit} color="primary">
          {t("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserDialog;
