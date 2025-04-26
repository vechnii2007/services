import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../../utils/axiosConfig";
import OfferService from "../../services/OfferService";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  MenuItem,
  Select,
  Box,
  IconButton,
  Typography,
  FormControl,
  InputLabel,
  Alert,
  InputAdornment,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const EditOfferDialog = ({ open, onClose, offerId, onOfferUpdated }) => {
  const { t } = useTranslation();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Состояние для редактируемых полей
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [isPriceRange, setIsPriceRange] = useState(false);
  const [location, setLocation] = useState("");
  const [images, setImages] = useState([]); // Текущие изображения
  const [newImages, setNewImages] = useState([]); // Новые загружаемые изображения

  // Загрузка категорий с сервера
  useEffect(() => {
    const fetchCategories = async () => {
      if (!open) return;

      try {
        setLoadingCategories(true);
        const categoriesData = await OfferService.fetchCategories();
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else {
          console.error("Unexpected categories data format:", categoriesData);
          setCategories([]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [open]);

  useEffect(() => {
    if (open && offerId) {
      const fetchOffer = async () => {
        try {
          setLoading(true);
          const res = await axios.get(`/admin/offers/${offerId}`);
          const offerData = res.data;
          if (!offerData) {
            throw new Error("Offer not found");
          }
          setOffer(offerData);
          setType(offerData.type || "Offer");
          setTitle(offerData.title || "");
          setServiceType(offerData.serviceType || "");
          setDescription(offerData.description || "");

          // Устанавливаем значения цен в зависимости от типа (диапазон или фиксированная)
          if (offerData.isPriceRange) {
            setIsPriceRange(true);
            setPriceFrom(offerData.priceFrom || "");
            setPriceTo(offerData.priceTo || "");
            setPrice("");
          } else {
            setIsPriceRange(false);
            setPrice(offerData.price || "");
            setPriceFrom("");
            setPriceTo("");
          }

          setLocation(offerData.location || "");
          console.log(123123, offerData);
          // Проверяем наличие images или image и устанавливаем в состояние
          if (offerData.images.length && Array.isArray(offerData.images)) {
            setImages(offerData.images);
          } else if (offerData.image) {
            console.log(777);
            setImages([offerData.image]);
          } else {
            setImages([]);
          }
          console.log("Images set:", offerData.images || offerData.image); // Отладка
        } catch (err) {
          if (err.response?.status === 404) {
            setError(t("offer_not_found"));
          } else if (err.response?.status === 403) {
            setError(t("access_denied"));
          } else if (err.response?.status === 500) {
            setError(t("server_error"));
          } else {
            setError(t("error_fetching_offer"));
          }
          console.error("Error fetching offer:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchOffer();
    }
  }, [offerId, open, t]);

  // Обработка выбора новых изображений
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setNewImages([...newImages, ...files]);
  };

  // Удаление существующего изображения
  const handleDeleteImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Удаление нового загруженного изображения
  const handleDeleteNewImage = (index) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  // Обработка ошибки загрузки изображения
  const handleImageError = (index) => {
    console.error(`Failed to load image at index ${index}: ${images[index]}`);
  };

  // Обработчик переключения типа цены
  const handlePriceTypeChange = (isRange) => {
    setIsPriceRange(isRange);
    if (isRange) {
      setPrice("");
    } else {
      setPriceFrom("");
      setPriceTo("");
    }
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("title", title);
      formData.append("serviceType", serviceType);
      formData.append("description", description);

      // Добавляем ценовую информацию в зависимости от типа
      if (isPriceRange) {
        formData.append("priceFrom", priceFrom ? Number(priceFrom) : "");
        formData.append("priceTo", priceTo ? Number(priceTo) : "");
        formData.append("isPriceRange", "true");
      } else {
        formData.append("price", price ? Number(price) : "");
        formData.append("isPriceRange", "false");
      }

      formData.append("location", location);

      // Добавляем существующие изображения (пути) в formData
      images.forEach((image, index) => {
        formData.append(`existingImages[${index}]`, image);
      });

      // Добавляем новые изображения в formData
      newImages.forEach((image) => {
        formData.append("images", image);
      });

      await axios.patch(`/admin/offers/${offerId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      onOfferUpdated();
      onClose();
    } catch (err) {
      if (err.response?.status === 404) {
        setError(t("offer_not_found"));
      } else if (err.response?.status === 403) {
        setError(t("access_denied"));
      } else if (err.response?.status === 500) {
        setError(t("server_error"));
      } else {
        setError(t("error_updating_offer"));
      }
      console.error("Error updating offer:", err);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>{t("edit_offer")}</DialogTitle>
        <DialogContent>
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>{t("edit_offer")}</DialogTitle>
        <DialogContent>
          <p>{error}</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t("close")}</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t("edit_offer")}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <FormControl fullWidth margin="normal">
          <InputLabel>{t("type")}</InputLabel>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            label={t("type")}
          >
            <MenuItem value="Offer">{t("offer")}</MenuItem>
            <MenuItem value="ServiceOffer">{t("service_offer")}</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label={t("offer_title")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          margin="normal"
          required
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>{t("service_type")}</InputLabel>
          <Select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            label={t("service_type")}
            disabled={loadingCategories}
          >
            {loadingCategories ? (
              <MenuItem disabled>{t("loading")}</MenuItem>
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <MenuItem
                  key={category._id || category.name}
                  value={category.name}
                >
                  {category.label || t(category.name)}
                </MenuItem>
              ))
            ) : (
              // Временные захардкоженные категории на случай ошибки загрузки
              <>
                <MenuItem value="translation">{t("translation")}</MenuItem>
                <MenuItem value="legal">{t("legal")}</MenuItem>
                <MenuItem value="real_estate">{t("real_estate")}</MenuItem>
                <MenuItem value="healthcare">{t("healthcare")}</MenuItem>
                <MenuItem value="education">{t("education")}</MenuItem>
                <MenuItem value="cultural_events">
                  {t("cultural_events")}
                </MenuItem>
                <MenuItem value="finance">{t("finance")}</MenuItem>
                <MenuItem value="transport">{t("transport")}</MenuItem>
                <MenuItem value="household">{t("household")}</MenuItem>
                <MenuItem value="shopping">{t("shopping")}</MenuItem>
                <MenuItem value="travel">{t("travel")}</MenuItem>
              </>
            )}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label={t("description")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={4}
          margin="normal"
        />

        {/* Переключатель типа цены */}
        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            {t("price_options")}
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant={!isPriceRange ? "contained" : "outlined"}
              onClick={() => handlePriceTypeChange(false)}
              size="small"
            >
              {t("fixed_price")}
            </Button>
            <Button
              variant={isPriceRange ? "contained" : "outlined"}
              onClick={() => handlePriceTypeChange(true)}
              size="small"
            >
              {t("price_range")}
            </Button>
          </Box>
        </Box>

        {/* Отображаем соответствующие поля в зависимости от типа цены */}
        {isPriceRange ? (
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label={t("price_from")}
              value={priceFrom}
              onChange={(e) => setPriceFrom(e.target.value)}
              type="number"
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">€</InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label={t("price_to")}
              value={priceTo}
              onChange={(e) => setPriceTo(e.target.value)}
              type="number"
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">€</InputAdornment>
                ),
              }}
            />
          </Box>
        ) : (
          <TextField
            fullWidth
            label={t("price")}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">€</InputAdornment>
              ),
            }}
          />
        )}

        <TextField
          fullWidth
          label={t("location")}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          margin="normal"
        />

        {/* Отображение текущих изображений */}
        {["ServiceOffer", "Offer"].includes(type) && (
          <>
            <Typography variant="subtitle1" sx={{ marginBottom: 1 }}>
              {t("current_images")}
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                marginBottom: 2,
              }}
            >
              {images && images.length > 0 ? (
                images.map((image, index) => (
                  <Box key={index} sx={{ position: "relative" }}>
                    <img
                      src={`http://localhost:5001${image}`}
                      alt={`Offer ${index}`}
                      style={{ width: 100, height: 100, objectFit: "cover" }}
                      onError={() => handleImageError(index)}
                    />
                    <IconButton
                      sx={{ position: "absolute", top: 0, right: 0 }}
                      onClick={() => handleDeleteImage(index)}
                    >
                      <DeleteIcon color="error" />
                    </IconButton>
                  </Box>
                ))
              ) : (
                <Typography>{t("no_images")}</Typography>
              )}
            </Box>

            {/* Отображение новых загруженных изображений */}
            {newImages.length > 0 && (
              <>
                <Typography variant="subtitle1" sx={{ marginBottom: 1 }}>
                  {t("new_images")}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                    marginBottom: 2,
                  }}
                >
                  {newImages.map((image, index) => (
                    <Box key={index} sx={{ position: "relative" }}>
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`New ${index}`}
                        style={{ width: 100, height: 100, objectFit: "cover" }}
                      />
                      <IconButton
                        sx={{ position: "absolute", top: 0, right: 0 }}
                        onClick={() => handleDeleteNewImage(index)}
                      >
                        <DeleteIcon color="error" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </>
            )}

            {/* Поле для загрузки новых изображений */}
            <Box sx={{ marginBottom: 2 }}>
              <Button variant="contained" component="label">
                {t("upload_images")}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleImageChange}
                />
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("cancel")}</Button>
        <Button onClick={handleSave} color="primary">
          {t("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditOfferDialog;
