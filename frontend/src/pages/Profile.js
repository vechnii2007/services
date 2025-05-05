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
  Container,
  Tabs,
  Tab,
} from "@mui/material";
import NotificationSettings from "../components/Header/NotificationSettings";

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

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
  const [tabValue, setTabValue] = useState(0);

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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
    <Container maxWidth="md" sx={{ paddingY: 4 }}>
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
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="profile tabs"
            >
              <Tab
                label={t("personal_info")}
                id="profile-tab-0"
                aria-controls="profile-tabpanel-0"
              />
              <Tab
                label={t("notifications")}
                id="profile-tab-1"
                aria-controls="profile-tabpanel-1"
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
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
              <FormControl fullWidth margin="normal">
                <InputLabel>Роль</InputLabel>
                <Select
                  name="role"
                  value={formData.role || user.role || "user"}
                  onChange={handleChange}
                  disabled={user.role === "admin"}
                >
                  <MenuItem value="user">Пользователь</MenuItem>
                  <MenuItem value="provider">Провайдер</MenuItem>
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
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <NotificationSettings />
          </TabPanel>
        </>
      )}
    </Container>
  );
};

export default Profile;
