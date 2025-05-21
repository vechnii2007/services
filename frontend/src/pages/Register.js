import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../middleware/api";
import { useTranslation } from "react-i18next";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Collapse,
  Chip,
  FormControlLabel,
  Switch,
  Grid,
} from "@mui/material";
import { useForm } from "../hooks/useForm";
import AddressAutocomplete from "../components/AddressAutocomplete";

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { values, handleChange, setValues } = useForm({
    name: "",
    email: "",
    password: "",
    role: "user",
    phone: "",
    address: "",
    providerInfo: {
      specialization: [],
      languages: [],
      description: "",
      workingHours: "",
      contactPreferences: {
        email: true,
        phone: true,
        chat: true,
      },
    },
  });
  const [message, setMessage] = useState("");
  const [newSpecialization, setNewSpecialization] = useState("");
  const [newLanguage, setNewLanguage] = useState("");

  const handleContactPreferenceChange = (preference) => {
    setValues((prev) => ({
      ...prev,
      providerInfo: {
        ...prev.providerInfo,
        contactPreferences: {
          ...prev.providerInfo.contactPreferences,
          [preference]: !prev.providerInfo.contactPreferences[preference],
        },
      },
    }));
  };

  const handleAddSpecialization = (e) => {
    if (e.key === "Enter" && newSpecialization.trim()) {
      setValues((prev) => ({
        ...prev,
        providerInfo: {
          ...prev.providerInfo,
          specialization: [
            ...prev.providerInfo.specialization,
            newSpecialization.trim(),
          ],
        },
      }));
      setNewSpecialization("");
    }
  };

  const handleAddLanguage = (e) => {
    if (e.key === "Enter" && newLanguage.trim()) {
      setValues((prev) => ({
        ...prev,
        providerInfo: {
          ...prev.providerInfo,
          languages: [...prev.providerInfo.languages, newLanguage.trim()],
        },
      }));
      setNewLanguage("");
    }
  };

  const handleDeleteSpecialization = (specializationToDelete) => {
    setValues((prev) => ({
      ...prev,
      providerInfo: {
        ...prev.providerInfo,
        specialization: prev.providerInfo.specialization.filter(
          (spec) => spec !== specializationToDelete
        ),
      },
    }));
  };

  const handleDeleteLanguage = (languageToDelete) => {
    setValues((prev) => ({
      ...prev,
      providerInfo: {
        ...prev.providerInfo,
        languages: prev.providerInfo.languages.filter(
          (lang) => lang !== languageToDelete
        ),
      },
    }));
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    if (newRole === "user") {
      setValues((prev) => ({
        ...prev,
        role: "user",
        phone: "",
        address: "",
        providerInfo: undefined,
      }));
    } else {
      handleChange(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...values };
      if (payload.role === "user") {
        delete payload.providerInfo;
        delete payload.phone;
        delete payload.address;
      }
      const res = await api.post("/users/register", payload);
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      if (error.response) {
        setMessage(
          "Error: " + (error.response.data.error || "Something went wrong")
        );
      } else if (error.request) {
        setMessage("Error: No response from server. Is the backend running?");
      } else {
        setMessage("Error: " + error.message);
      }
      console.error(error);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 64px)",
        py: 4,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 600, p: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {t("register")}
          </Typography>
          {message && (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ mb: 2 }}
            >
              {message}
            </Typography>
          )}
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t("name")}
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t("email")}
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t("password")}
                    name="password"
                    type="password"
                    value={values.password}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t("role")}</InputLabel>
                    <Select
                      name="role"
                      value={values.role}
                      onChange={handleRoleChange}
                      label={t("role")}
                    >
                      <MenuItem value="user">{t("user")}</MenuItem>
                      <MenuItem value="provider">{t("provider")}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Collapse in={values.role === "provider"}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {t("provider_details")}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label={t("phone")}
                        name="phone"
                        value={values.phone}
                        onChange={handleChange}
                        fullWidth
                      />
                    </Grid>
                    {values.role === "provider" && (
                      <Grid item xs={12} sm={6}>
                        <AddressAutocomplete
                          value={values.address}
                          onChange={handleChange}
                          name="address"
                          label={t("address")}
                          required
                          fullWidth
                        />
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <TextField
                        label={t("description")}
                        name="providerInfo.description"
                        value={values.providerInfo.description}
                        onChange={handleChange}
                        multiline
                        rows={3}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label={t("working_hours")}
                        name="providerInfo.workingHours"
                        value={values.providerInfo.workingHours}
                        onChange={handleChange}
                        fullWidth
                        placeholder="Пн-Пт: 9:00-18:00"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label={t("add_specialization")}
                        value={newSpecialization}
                        onChange={(e) => setNewSpecialization(e.target.value)}
                        onKeyPress={handleAddSpecialization}
                        fullWidth
                        helperText={t("press_enter_to_add")}
                      />
                      <Box
                        sx={{
                          mt: 1,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        {values.providerInfo.specialization.map((spec) => (
                          <Chip
                            key={spec}
                            label={spec}
                            onDelete={() => handleDeleteSpecialization(spec)}
                          />
                        ))}
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label={t("add_language")}
                        value={newLanguage}
                        onChange={(e) => setNewLanguage(e.target.value)}
                        onKeyPress={handleAddLanguage}
                        fullWidth
                        helperText={t("press_enter_to_add")}
                      />
                      <Box
                        sx={{
                          mt: 1,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        {values.providerInfo.languages.map((lang) => (
                          <Chip
                            key={lang}
                            label={lang}
                            onDelete={() => handleDeleteLanguage(lang)}
                          />
                        ))}
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        {t("contact_preferences")}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={
                                values.providerInfo.contactPreferences.email
                              }
                              onChange={() =>
                                handleContactPreferenceChange("email")
                              }
                            />
                          }
                          label={t("email_contact")}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={
                                values.providerInfo.contactPreferences.phone
                              }
                              onChange={() =>
                                handleContactPreferenceChange("phone")
                              }
                            />
                          }
                          label={t("phone_contact")}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={
                                values.providerInfo.contactPreferences.chat
                              }
                              onChange={() =>
                                handleContactPreferenceChange("chat")
                              }
                            />
                          }
                          label={t("chat_contact")}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Collapse>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{
                  mt: 2,
                  fontWeight: 700,
                  fontSize: 18,
                  borderRadius: 2,
                  color: "#fff",
                  boxShadow: "0 2px 8px rgba(60,64,67,.12)",
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.primary.main
                      : theme.palette.primary.main,
                  "&:hover": {
                    background: (theme) =>
                      theme.palette.mode === "dark"
                        ? theme.palette.primary.light
                        : theme.palette.primary.dark,
                  },
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                {t("register_button")}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;
