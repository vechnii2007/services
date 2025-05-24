import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useUser } from "../hooks/useUser";
import { useForm } from "../hooks/useForm";
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
import AddressAutocomplete from "../components/AddressAutocomplete";
import UserSubscriptionTab from "../components/Profile/UserSubscriptionTab";
import UserOffersTableTab from "../components/Profile/UserOffersTableTab";

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
  const { user, loading, error, updateUser } = useUser();
  const { values, handleChange, setValues } = useForm({
    name: "",
    email: "",
    phone: "",
    address: "",
    role: "user",
  });
  const [message, setMessage] = useState("");
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (user) {
      setValues({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        role: user.role || "user",
      });
    }
  }, [user, t, setValues]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUser(values);
      setMessage(t("profile_updated"));
    } catch (error) {
      setMessage(
        "Error: " + (error.response?.data?.error || t("something_went_wrong"))
      );
    }
  };

  const handleTabChange = (_, newValue) => {
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

  // Определяем количество вкладок
  const isProvider = values.role === "provider";

  return (
    <Container maxWidth="lg" sx={{ paddingY: 4 }}>
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
                label={t("my_subscription")}
                id="profile-tab-1"
                aria-controls="profile-tabpanel-1"
              />
              {isProvider && (
                <Tab
                  label={t("my_offers")}
                  id="profile-tab-2"
                  aria-controls="profile-tabpanel-2"
                />
              )}
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
                value={values.name}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label={t("email")}
                name="email"
                value={values.email}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label={t("phone")}
                name="phone"
                value={values.phone}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
              <AddressAutocomplete
                value={values.address}
                onChange={handleChange}
                name="address"
                label={t("address")}
                fullWidth
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>{t("role")}</InputLabel>
                <Select name="role" value={values.role} onChange={handleChange}>
                  <MenuItem value="user">{t("user")}</MenuItem>
                  <MenuItem value="provider">{t("provider")}</MenuItem>
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
            <UserSubscriptionTab userId={user._id} />
          </TabPanel>

          {isProvider && (
            <TabPanel value={tabValue} index={2}>
              <UserOffersTableTab userId={user._id} />
            </TabPanel>
          )}
        </>
      )}
    </Container>
  );
};

export default Profile;
