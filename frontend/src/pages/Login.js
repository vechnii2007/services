import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../context/AuthContext";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
} from "@mui/material";

// Google SVG Icon
const GoogleIcon = (props) => (
  <svg width="22" height="22" viewBox="0 0 48 48" {...props}>
    <g>
      <path
        fill="#4285F4"
        d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C35.64 2.36 30.18 0 24 0 14.82 0 6.71 5.82 2.69 14.09l7.98 6.19C12.13 14.16 17.56 9.5 24 9.5z"
      />
      <path
        fill="#34A853"
        d="M46.1 24.55c0-1.64-.15-3.22-.43-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.02l7.19 5.6C43.98 37.36 46.1 31.45 46.1 24.55z"
      />
      <path
        fill="#FBBC05"
        d="M10.67 28.28A14.5 14.5 0 0 1 9.5 24c0-1.49.25-2.93.7-4.28l-7.98-6.19A23.93 23.93 0 0 0 0 24c0 3.77.9 7.34 2.5 10.47l8.17-6.19z"
      />
      <path
        fill="#EA4335"
        d="M24 48c6.18 0 11.36-2.05 15.14-5.59l-7.19-5.6c-2 1.36-4.56 2.19-7.95 2.19-6.44 0-11.87-4.66-13.33-10.91l-8.17 6.19C6.71 42.18 14.82 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </g>
  </svg>
);

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData.email.trim(), formData.password.trim());
      setMessage(t("login_successful"));
      navigate("/offers");
    } catch (error) {
      console.error("Login error:", error);
      if (error.response?.data?.error) {
        const errorMessage = error.response.data.error;
        setMessage(
          t(errorMessage.toLowerCase().replace(/ /g, "_"), errorMessage)
        );
      } else if (error.request) {
        setMessage(t("no_response_from_server"));
      } else {
        setMessage(error.message || t("something_went_wrong"));
      }
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
      }}
    >
      <Card sx={{ maxWidth: 400, width: "100%", m: 2 }}>
        <CardContent>
          <Typography variant="h5" component="h1" gutterBottom align="center">
            {t("login")}
          </Typography>
          {message && (
            <Typography color="error" align="center" gutterBottom>
              {message}
            </Typography>
          )}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label={t("email")}
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={t("password")}
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{
                mt: 3,
                mb: 2,
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
              {t("login")}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              sx={{
                mb: 2,
                background: "#fff",
                color: "#222",
                borderColor: "#dadce0",
                fontWeight: 600,
                fontSize: 16,
                borderRadius: 2,
                textTransform: "none",
                "&:hover": {
                  background: "#f7f7f7",
                  borderColor: "#4285F4",
                  color: "#222",
                },
                boxShadow: "0 1px 2px rgba(60,64,67,.08)",
              }}
              startIcon={<GoogleIcon style={{ marginRight: 8 }} />}
              onClick={() => {
                window.location.href =
                  process.env.REACT_APP_API_URL + "/users/auth/google" ||
                  "http://localhost:5001/api/users/auth/google";
              }}
            >
              Войти через Google
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
