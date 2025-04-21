import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useUser } from "../hooks/useUser";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const Profile = () => {
  const { t } = useTranslation();
  const { user, loading, error, updateUser, updateStatus } = useUser();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [status, setStatus] = useState("offline");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
      });
      setStatus(user.status);
      setMessage(t("profile_loaded"));
    }
  }, [user, t]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    try {
      await updateStatus(newStatus);
      setMessage(t("status_updated"));
    } catch (error) {
      setMessage(
        "Error: " + (error.response?.data?.error || t("something_went_wrong"))
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUser(formData);
      setMessage(t("profile_updated"));
    } catch (error) {
      setMessage(
        "Error: " + (error.response?.data?.error || t("something_went_wrong"))
      );
    }
  };

  if (loading) {
    return <Typography>{t("loading")}</Typography>;
  }

  if (error) {
    return (
      <Typography color="error">
        {error.response?.data?.error || t("something_went_wrong")}
      </Typography>
    );
  }

  return (
    <Box sx={{ paddingY: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t("profile")}
      </Typography>
      {message && (
        <Typography
          variant="body2"
          color="textSecondary"
          align="center"
          sx={{ marginBottom: 2 }}
        >
          {message}
        </Typography>
      )}
      {user && (
        <>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ maxWidth: 600, margin: "0 auto" }}
          >
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
              <InputLabel>{t("status")}</InputLabel>
              <Select value={status} onChange={handleStatusChange}>
                <MenuItem value="online">{t("online")}</MenuItem>
                <MenuItem value="offline">{t("offline")}</MenuItem>
              </Select>
            </FormControl>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              {t("save")}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Profile;
