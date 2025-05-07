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
import { useForm } from "../hooks/useForm";
import AddressAutocomplete from "../components/AddressAutocomplete";

const ROLE_OPTIONS = [
  { value: "user", label: "Пользователь" },
  { value: "provider", label: "Провайдер" },
];

const OauthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refetch, user, updateProfile } = useContext(AuthContext);
  console.log("[OauthSuccess] updateProfile:", updateProfile);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const { values, handleChange, setValues } = useForm({
    role: "user",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);

  useEffect(() => {
    // Лог только для отладки
    console.log("[OauthSuccess] useEffect fired", {
      user,
      profileCompleted,
      showProfileDialog,
    });
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      if (typeof refetch === "function" && !user) {
        refetch();
      }
    } else {
      navigate("/login", { replace: true });
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    console.log("[OauthSuccess] user in useEffect:", user);
    console.log(
      "[OauthSuccess] user:",
      user,
      "profileCompleted:",
      profileCompleted,
      "showProfileDialog:",
      showProfileDialog,
      "socialLogin:",
      user && user.socialLogin
    );
    if (user && user.socialLogin === true) {
      setShowProfileDialog(true);
      setValues({
        role: user.role || "user",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
    // Убираем автоматический navigate и setShowProfileDialog — теперь это в handleSubmit
  }, [user]);

  useEffect(() => {
    if (user && user.socialLogin === false && !showProfileDialog) {
      navigate("/offers", { replace: true });
    }
  }, [user, showProfileDialog, navigate]);

  const onLoad = (autoC) => setAutocomplete(autoC);
  const onPlaceChanged = () => {
    if (autocomplete !== null && window.google) {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        setValues((prev) => ({ ...prev, address: place.formatted_address }));
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = { ...values, socialLogin: false };
      const updatedUser = await updateProfile(payload);
      if (typeof refetch === "function") {
        await refetch();
      }
      setShowProfileDialog(false);
      navigate("/offers", { replace: true });
    } catch (err) {
      setError("Ошибка при обновлении профиля");
      console.error("[OauthSuccess] handleSubmit: error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>Авторизация через Google... Пожалуйста, подождите.</div>
      {/* MUI Dialog для UX */}
      <Dialog open={showProfileDialog} disableEscapeKeyDown>
        <DialogTitle>Завершите регистрацию</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} minWidth={300}>
            <TextField
              select
              label="Роль"
              name="role"
              value={values.role}
              onChange={handleChange}
              fullWidth
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
              value={values.phone}
              onChange={handleChange}
              fullWidth
            />
            <AddressAutocomplete
              value={values.address}
              onChange={handleChange}
              name="address"
              label="Адрес"
              required
              fullWidth
            />
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            Сохранить профиль
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OauthSuccess;
