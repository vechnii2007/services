import React, { useState } from "react";
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
import AddressAutocomplete from "./AddressAutocomplete";

const ROLE_OPTIONS = [
  { value: "user", label: "Пользователь" },
  { value: "provider", label: "Провайдер" },
];

const RegisterCompleteDialog = ({ open, user, onComplete, loading, error }) => {
  const [values, setValues] = useState({
    role: user?.role || "user",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [autocomplete, setAutocomplete] = useState(null);
  const handleChange = (e) => {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const onLoad = (autoC) => setAutocomplete(autoC);
  const onPlaceChanged = () => {
    if (autocomplete !== null && window.google) {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        setValues((prev) => ({ ...prev, address: place.formatted_address }));
      }
    }
  };
  const handleSubmit = () => {
    onComplete(values);
  };
  return (
    <Dialog open={open} disableEscapeKeyDown>
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
            onLoad={onLoad}
            onPlaceChanged={onPlaceChanged}
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
  );
};

export default RegisterCompleteDialog;
