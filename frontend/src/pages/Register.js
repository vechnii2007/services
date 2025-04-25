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

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("providerInfo.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        providerInfo: {
          ...prev.providerInfo,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleContactPreferenceChange = (preference) => {
    setFormData((prev) => ({
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
      setFormData((prev) => ({
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
      setFormData((prev) => ({
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
    setFormData((prev) => ({
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
    setFormData((prev) => ({
      ...prev,
      providerInfo: {
        ...prev.providerInfo,
        languages: prev.providerInfo.languages.filter(
          (lang) => lang !== languageToDelete
        ),
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/users/register", formData);
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
                    value={formData.name}
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
                    value={formData.email}
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
                    value={formData.password}
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
                      value={formData.role}
                      onChange={handleChange}
                      label={t("role")}
                    >
                      <MenuItem value="user">{t("user")}</MenuItem>
                      <MenuItem value="provider">{t("provider")}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Collapse in={formData.role === "provider"}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {t("provider_details")}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label={t("phone")}
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label={t("address")}
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label={t("description")}
                        name="providerInfo.description"
                        value={formData.providerInfo.description}
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
                        value={formData.providerInfo.workingHours}
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
                        {formData.providerInfo.specialization.map((spec) => (
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
                        {formData.providerInfo.languages.map((lang) => (
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
                                formData.providerInfo.contactPreferences.email
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
                                formData.providerInfo.contactPreferences.phone
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
                                formData.providerInfo.contactPreferences.chat
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
                sx={{ mt: 2 }}
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
