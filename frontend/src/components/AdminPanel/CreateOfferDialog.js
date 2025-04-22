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

const CreateOfferDialog = ({ open, onClose, onOfferCreated }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    providerId: "",
    serviceType: "",
    location: "",
    description: "",
    price: "",
    images: [],
  });
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await api.get("/admin/users", {
          params: { role: "provider" },
        });
        setProviders(res.data.users);
      } catch (error) {
        console.error("Error fetching providers:", error);
      }
    };
    fetchProviders();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "images") {
      setFormData({ ...formData, [name]: Array.from(files) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async () => {
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "images" && Array.isArray(value)) {
        value.forEach((file, index) =>
          formDataToSend.append(`images[${index}]`, file)
        );
      } else {
        formDataToSend.append(key, value);
      }
    });
    try {
      await api.post("/admin/offers", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onOfferCreated();
      onClose();
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t("create_offer")}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel>{t("provider")}</InputLabel>
          <Select
            name="providerId"
            value={formData.providerId}
            onChange={handleChange}
          >
            {providers.map((provider) => (
              <MenuItem key={provider._id} value={provider._id}>
                {provider.name} ({provider.email})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label={t("service_type")}
          name="serviceType"
          value={formData.serviceType}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label={t("location")}
          name="location"
          value={formData.location}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label={t("description")}
          name="description"
          value={formData.description}
          onChange={handleChange}
          fullWidth
          margin="normal"
          multiline
          rows={4}
        />
        <TextField
          label={t("price")}
          name="price"
          value={formData.price}
          onChange={handleChange}
          fullWidth
          margin="normal"
          type="number"
        />
        <input
          type="file"
          name="images"
          onChange={handleChange}
          multiple
          style={{ marginTop: 16 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          {t("cancel")}
        </Button>
        <Button onClick={handleSubmit} color="primary">
          {t("create")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateOfferDialog;
