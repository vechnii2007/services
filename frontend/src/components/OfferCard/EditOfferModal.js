import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  Stack,
  Chip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { useTranslation } from "react-i18next";
import api from "../../middleware/api";

const EditOfferModal = ({ open, onClose, offer, onSuccess }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: offer?.title || "",
    description: offer?.description || "",
    price: offer?.price || "",
    priceFrom: offer?.priceFrom || "",
    priceTo: offer?.priceTo || "",
    isPriceRange: offer?.isPriceRange || false,
    category: offer?.category || offer?.serviceType || "",
    location: offer?.location || "",
    images: offer?.images || [],
    newImages: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setForm((prev) => ({
      ...prev,
      newImages: [...prev.newImages, ...files],
    }));
  };

  const handleRemoveImage = (img) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((i) => i !== img),
    }));
  };

  const handleRemoveNewImage = (idx) => {
    setForm((prev) => {
      const arr = [...prev.newImages];
      arr.splice(idx, 1);
      return { ...prev, newImages: arr };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = new FormData();
      data.append("title", form.title);
      data.append("description", form.description);
      data.append("location", form.location);
      data.append("category", form.category);
      data.append("isPriceRange", form.isPriceRange);
      if (form.isPriceRange) {
        data.append("priceFrom", form.priceFrom);
        data.append("priceTo", form.priceTo);
      } else {
        data.append("price", form.price);
      }
      form.images.forEach((img) => data.append("existingImages", img));
      form.newImages.forEach((file) => data.append("images", file));
      const res = await api.put(`/services/offers/${offer._id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSuccess && onSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || t("something_went_wrong"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t("edit_offer")}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} component="form" onSubmit={handleSubmit}>
          <TextField
            label={t("title")}
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            fullWidth
          />
          <TextField
            label={t("description")}
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            fullWidth
            multiline
            minRows={3}
          />
          <TextField
            label={t("location")}
            name="location"
            value={form.location}
            onChange={handleChange}
            required
            fullWidth
          />
          <TextField
            label={t("category")}
            name="category"
            value={form.category}
            onChange={handleChange}
            required
            fullWidth
          />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t("images")}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {form.images.map((img) => (
                <Chip
                  key={img}
                  label={img.split("/").pop()}
                  onDelete={() => handleRemoveImage(img)}
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              ))}
              {form.newImages.map((file, idx) => (
                <Chip
                  key={file.name + idx}
                  label={file.name}
                  onDelete={() => handleRemoveNewImage(idx)}
                  color="secondary"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              ))}
              <Button
                component="label"
                startIcon={<AddPhotoAlternateIcon />}
                variant="outlined"
                sx={{ height: 36 }}
              >
                {t("add_image")}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  multiple
                  onChange={handleImageChange}
                />
              </Button>
            </Stack>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t("price")}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label={t("price")}
                name="price"
                value={form.price}
                onChange={handleChange}
                type="number"
                fullWidth
                disabled={form.isPriceRange}
              />
              <Typography variant="body2">или</Typography>
              <TextField
                label={t("price_from")}
                name="priceFrom"
                value={form.priceFrom}
                onChange={handleChange}
                type="number"
                fullWidth
                disabled={!form.isPriceRange}
              />
              <TextField
                label={t("price_to")}
                name="priceTo"
                value={form.priceTo}
                onChange={handleChange}
                type="number"
                fullWidth
                disabled={!form.isPriceRange}
              />
              <Button
                variant={form.isPriceRange ? "contained" : "outlined"}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    isPriceRange: !prev.isPriceRange,
                  }))
                }
              >
                {t("price_range")}
              </Button>
            </Stack>
          </Box>
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("cancel")}</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {t("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditOfferModal;
