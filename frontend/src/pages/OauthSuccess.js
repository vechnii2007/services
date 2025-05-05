import React, { useEffect, useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
} from "@mui/material";

const ROLE_OPTIONS = [
  { value: "user", label: "Пользователь" },
  { value: "provider", label: "Провайдер" },
];

const OauthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refetch, user, updateUser } = useContext(AuthContext);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [form, setForm] = useState({ role: "user", phone: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      if (typeof refetch === "function") {
        refetch();
      }
    } else {
      navigate("/login", { replace: true });
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (user) {
      if (!user.role || !["user", "provider"].includes(user.role)) {
        setShowProfileDialog(true);
        setForm({
          role: "user",
          phone: user.phone || "",
          address: user.address || "",
        });
      } else {
        navigate("/offers", { replace: true });
      }
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await updateUser(form);
      setShowProfileDialog(false);
      navigate("/offers", { replace: true });
    } catch (err) {
      setError("Ошибка при обновлении профиля");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>Авторизация через Google... Пожалуйста, подождите.</div>
      <Dialog open={showProfileDialog} disableEscapeKeyDown>
        <DialogTitle>Завершите регистрацию</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Пожалуйста, выберите роль и заполните недостающие данные:
          </Typography>
          <TextField
            select
            label="Роль"
            name="role"
            value={form.role}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          >
            {ROLE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Телефон"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Адрес"
            name="address"
            value={form.address}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          {error && (
            <Typography color="error" sx={{ mb: 1 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OauthSuccess;
