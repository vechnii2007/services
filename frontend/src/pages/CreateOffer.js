import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Card,
  Grid,
  IconButton,
  Paper,
  Alert,
  InputAdornment,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Autocomplete, LoadScript } from "@react-google-maps/api";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DescriptionIcon from "@mui/icons-material/Description";
import { useDropzone } from "react-dropzone";
import OfferService from "../services/OfferService";
import AddressAutocomplete from "../components/AddressAutocomplete";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
}));

const ImagePreviewCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  borderRadius: theme.shape.borderRadius * 1.5,
  overflow: "hidden",
  transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.shadows[8],
  },
}));

const ImageContainer = styled(Box)({
  width: "100%",
  height: 200, // фиксированная высота
  position: "relative",
  overflow: "hidden",
});

const StyledImage = styled("img")({
  width: "100%",
  height: "100%",
  objectFit: "cover",
});

const DropzoneArea = styled(Box)(({ theme, isDragActive }) => ({
  border: `2px dashed ${
    isDragActive ? theme.palette.primary.main : theme.palette.grey[300]
  }`,
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: isDragActive
    ? theme.palette.primary.light + "10"
    : theme.palette.grey[50],
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  minHeight: 300,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(3),
  "&:hover": {
    backgroundColor: theme.palette.primary.light + "10",
    borderColor: theme.palette.primary.light,
  },
}));

const CreateOffer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    serviceType: "",
    location: "",
    description: "",
    price: "",
    priceFrom: "",
    priceTo: "",
    images: [],
    providerId: "",
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [message, setMessage] = useState("");
  const [autocomplete, setAutocomplete] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [errors] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserRoleAndProviders = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setMessage(t("please_login"));
          navigate("/login");
          return;
        }

        // Получаем роль пользователя
        const userRes = await axios.get(`/users/me`);
        setUserRole(userRes.data.role);
      } catch (error) {
        setMessage(
          "Error: " + (error.response?.data?.error || t("something_went_wrong"))
        );
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      }
    };
    fetchUserRoleAndProviders();
  }, [navigate, t]);

  // Загрузка категорий с сервера
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
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
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onLoad = (autoC) => {
    setAutocomplete(autoC);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null && window.google) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        setFormData({
          ...formData,
          location: place.formatted_address,
        });
      }
    } else {
      console.error("Google Maps API не загружен (window.google отсутствует)");
    }
  };

  const onDrop = React.useCallback((acceptedFiles) => {
    // Создаем URL для превью для каждого файла
    const newPreviews = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...acceptedFiles],
    }));

    setImagePreviews((prev) => [...prev, ...newPreviews]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    multiple: true,
  });

  const handleImageDelete = (index) => {
    // Очищаем URL превью перед удалением
    URL.revokeObjectURL(imagePreviews[index].preview);

    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageEdit = (index) => (e) => {
    const file = e.target.files[0];
    if (file) {
      // Очищаем старый URL превью
      URL.revokeObjectURL(imagePreviews[index].preview);

      const newPreview = URL.createObjectURL(file);
      const newImages = [...formData.images];
      newImages[index] = file;

      setFormData((prev) => ({
        ...prev,
        images: newImages,
      }));

      setImagePreviews((prev) => {
        const newPreviews = [...prev];
        newPreviews[index] = { file, preview: newPreview };
        return newPreviews;
      });
    }
  };

  // Очистка URL объектов при размонтировании
  React.useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => {
        if (preview.preview) {
          URL.revokeObjectURL(preview.preview);
        }
      });
    };
  }, [imagePreviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage(t("please_login"));
        navigate("/login");
        return;
      }

      const data = new FormData();
      data.append("title", formData.title);
      data.append("category", formData.serviceType);
      data.append("location", formData.location);
      data.append("description", formData.description);

      // Проверяем тип цены (диапазон или фиксированная)
      if (formData.priceFrom && formData.priceTo) {
        // Отправляем диапазон цен
        data.append("priceFrom", formData.priceFrom);
        data.append("priceTo", formData.priceTo);
        data.append("isPriceRange", "true");
      } else {
        // Отправляем фиксированную цену
        data.append("price", formData.price);
        data.append("isPriceRange", "false");
      }

      // Если админ указал providerId, используем его
      if (userRole === "admin" && formData.providerId) {
        data.append("providerId", formData.providerId);
      }

      // Добавляем все изображения с именем "images"
      formData.images.forEach((image) => {
        data.append("images", image);
      });

      const res = await axios.post(`/services/offers`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage(t("offer_created"));
      setFormData({
        title: "",
        serviceType: "",
        location: "",
        description: "",
        price: "",
        priceFrom: "",
        priceTo: "",
        images: [],
        providerId: "",
      });
      setImagePreviews([]);
      setTimeout(() => navigate("/offers"), 2000);
    } catch (error) {
      if (error.response) {
        setMessage(
          "Error: " + (error.response.data.error || t("something_went_wrong"))
        );
        if (error.response.status === 401 || error.response.status === 403) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } else if (error.request) {
        setMessage(t("no_response_from_server"));
      } else {
        setMessage("Error: " + error.message);
      }
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit}>
      <TextField
        label={t("offer_title")}
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        fullWidth
        required
        margin="normal"
        error={!!errors.title}
        helperText={errors.title}
      />

      <FormControl
        fullWidth
        margin="normal"
        required
        error={!!errors.serviceType}
      >
        <InputLabel>{t("service_type")}</InputLabel>
        <Select
          name="serviceType"
          value={formData.serviceType}
          onChange={handleChange}
          label={t("service_type")}
          required
          disabled={loading}
        >
          {loading ? (
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

      <AddressAutocomplete
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        name="location"
        label={t("address")}
        required
        fullWidth
        margin="normal"
      />

      <StyledPaper elevation={0}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}
        >
          <DescriptionIcon color="primary" />
          {t("details")}
        </Typography>

        <TextField
          label={t("description")}
          name="description"
          value={formData.description}
          onChange={handleChange}
          fullWidth
          multiline
          rows={4}
          required
          sx={{ mb: 3 }}
        />

        <Typography variant="subtitle1" gutterBottom>
          {t("price_options")}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            label={t("fixed_price")}
            type="number"
            value={formData.price}
            onChange={(e) => {
              setFormData({
                ...formData,
                price: e.target.value,
                priceFrom: "",
                priceTo: "",
              });
            }}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">€</InputAdornment>
              ),
            }}
            error={!!errors.price}
            helperText={errors.price}
            placeholder={t("enter_fixed_price")}
          />
        </Box>

        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
          {t("or_price_range")}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            label={t("price_from")}
            type="number"
            value={formData.priceFrom}
            onChange={(e) => {
              setFormData({
                ...formData,
                priceFrom: e.target.value,
                price: "",
              });
            }}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">€</InputAdornment>
              ),
            }}
            error={!!errors.priceFrom}
            helperText={errors.priceFrom}
            placeholder={t("min_price")}
          />
          <TextField
            label={t("price_to")}
            type="number"
            value={formData.priceTo}
            onChange={(e) => {
              setFormData({
                ...formData,
                priceTo: e.target.value,
                price: "",
              });
            }}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">€</InputAdornment>
              ),
            }}
            error={!!errors.priceTo}
            helperText={errors.priceTo}
            placeholder={t("max_price")}
          />
        </Box>
      </StyledPaper>

      <StyledPaper elevation={0}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
        >
          <CloudUploadIcon color="primary" />
          {t("images")}
        </Typography>

        {imagePreviews.length === 0 ? (
          <DropzoneArea
            {...getRootProps()}
            isDragActive={isDragActive}
            sx={{ minHeight: 150 }}
          >
            <input {...getInputProps()} />
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                width: "100%",
                textAlign: "center",
                py: 2,
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 24, color: "primary.main" }} />
              {isDragActive ? (
                <Typography variant="body1" color="primary.main">
                  {t("drop_files_here")}
                </Typography>
              ) : (
                <>
                  <Typography variant="body1" color="text.primary">
                    {t("drag_drop_images")}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    sx={{
                      borderStyle: "dashed",
                      px: 2,
                      mt: 1,
                      "&:hover": {
                        borderStyle: "dashed",
                        backgroundColor: "primary.light",
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    {t("browse_files")}
                  </Button>
                </>
              )}
            </Box>
          </DropzoneArea>
        ) : (
          <Box sx={{ width: "100%" }}>
            <Box {...getRootProps()} sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                startIcon={<CloudUploadIcon />}
                size="small"
                sx={{
                  py: 1,
                  borderStyle: "dashed",
                  "&:hover": {
                    borderStyle: "dashed",
                    backgroundColor: "primary.light",
                    borderColor: "primary.main",
                  },
                }}
              >
                {t("add_more_images")}
              </Button>
              <input {...getInputProps()} />
            </Box>

            <Grid container spacing={1}>
              {imagePreviews.map((preview, index) => (
                <Grid item xs={6} sm={4} md={3} key={index}>
                  <ImagePreviewCard>
                    <ImageContainer sx={{ height: 120 }}>
                      <StyledImage
                        src={preview.preview}
                        alt={`Preview ${index + 1}`}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          display: "flex",
                          justifyContent: "flex-end",
                          p: 0.5,
                          background:
                            "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)",
                          zIndex: 1,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageDelete(index);
                          }}
                          sx={{
                            color: "white",
                            backgroundColor: "rgba(0,0,0,0.2)",
                            backdropFilter: "blur(4px)",
                            mr: 0.5,
                            "&:hover": {
                              backgroundColor: "rgba(255,255,255,0.2)",
                            },
                            padding: 0.5,
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          component="label"
                          size="small"
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            color: "white",
                            backgroundColor: "rgba(0,0,0,0.2)",
                            backdropFilter: "blur(4px)",
                            "&:hover": {
                              backgroundColor: "rgba(255,255,255,0.2)",
                            },
                            padding: 0.5,
                          }}
                        >
                          <EditIcon fontSize="small" />
                          <VisuallyHiddenInput
                            type="file"
                            accept="image/*"
                            onChange={handleImageEdit(index)}
                          />
                        </IconButton>
                      </Box>
                    </ImageContainer>
                  </ImagePreviewCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </StyledPaper>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        size="large"
        fullWidth
        disabled={
          (!formData.price && (!formData.priceFrom || !formData.priceTo)) ||
          !formData.serviceType ||
          !formData.location ||
          !formData.title
        }
        sx={{
          py: 1.5,
          borderRadius: 2,
          fontSize: "1.1rem",
          textTransform: "none",
        }}
      >
        {t("create_offer_button")}
      </Button>
    </form>
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 900, mx: "auto" }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          mb: 4,
          fontWeight: "bold",
          textAlign: "center",
          color: (theme) => theme.palette.primary.main,
        }}
      >
        {t("create_offer")}
      </Typography>

      {message && (
        <Alert
          severity={message.includes("Error") ? "error" : "success"}
          sx={{ mb: 3 }}
        >
          {message}
        </Alert>
      )}

      {renderForm()}
    </Box>
  );
};

export default CreateOffer;
