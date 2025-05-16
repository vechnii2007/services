import React, { useState, useEffect, useCallback } from "react";
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
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DescriptionIcon from "@mui/icons-material/Description";
import { styled } from "@mui/material/styles";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import OfferService from "../../services/OfferService";
import AddressAutocomplete from "../AddressAutocomplete";
import axios from "../../utils/axiosConfig";

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
  height: 200,
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

const OfferForm = ({
  mode = "create",
  offer = null,
  onSuccess,
  onCancel,
  headerOffset,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: offer?.title || "",
    serviceType: offer?.category || offer?.serviceType || "",
    location: offer?.location || "",
    description: offer?.description || "",
    price: offer?.price || "",
    priceFrom: offer?.priceFrom || "",
    priceTo: offer?.priceTo || "",
    images: [], // для новых файлов
    providerId: offer?.providerId || "",
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState(offer?.images || []);
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoriesData = await OfferService.fetchCategories();
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else {
          setCategories([]);
        }
      } catch (error) {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Для редактирования: показываем превью существующих изображений
  useEffect(() => {
    if (offer && offer.images) {
      setExistingImages(offer.images);
    }
  }, [offer]);

  const onDrop = useCallback((acceptedFiles) => {
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

  const handleImageDelete = (index, isExisting = false) => {
    if (isExisting) {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      URL.revokeObjectURL(imagePreviews[index].preview);
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleImageEdit = (index) => (e) => {
    const file = e.target.files[0];
    if (file) {
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

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => {
        if (preview.preview) {
          URL.revokeObjectURL(preview.preview);
        }
      });
    };
  }, [imagePreviews]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (e) => {
    setFormData({ ...formData, serviceType: e.target.value });
  };

  const handleLocationChange = (e) => {
    setFormData({ ...formData, location: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setErrors({});
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("category", formData.serviceType);
      data.append("location", formData.location);
      data.append("description", formData.description);
      if (formData.priceFrom && formData.priceTo) {
        data.append("priceFrom", formData.priceFrom);
        data.append("priceTo", formData.priceTo);
        data.append("isPriceRange", "true");
      } else {
        data.append("price", formData.price);
        data.append("isPriceRange", "false");
      }
      // Для редактирования: добавляем существующие изображения
      existingImages.forEach((img) => data.append("existingImages", img));
      // Новые изображения
      formData.images.forEach((image) => {
        data.append("images", image);
      });
      if (mode === "edit" && offer && offer._id) {
        const res = await axios.put(`/services/offers/${offer._id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setMessage(t("offer_updated"));
        onSuccess && onSuccess(res.data);
      } else {
        const res = await axios.post(`/services/offers`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setMessage(t("offer_created"));
        onSuccess && onSuccess(res.data);
      }
    } catch (error) {
      setMessage(
        "Error: " + (error.response?.data?.error || t("something_went_wrong"))
      );
      setErrors(error.response?.data?.errors || {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ padding: 24, paddingBottom: 32, paddingTop: headerOffset || 24 }}
    >
      <TextField
        label={t("offer_title")}
        name="title"
        value={formData.title}
        onChange={handleChange}
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
        sx={{ mt: 2, mb: 2 }}
      >
        <InputLabel>{t("service_type")}</InputLabel>
        <Select
          name="serviceType"
          value={formData.serviceType}
          onChange={handleCategoryChange}
          label={t("service_type")}
          required
          disabled={loading}
        >
          {loading ? (
            <MenuItem disabled>
              <CircularProgress size={20} /> {t("loading")}
            </MenuItem>
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
            <MenuItem value="">{t("no_categories")}</MenuItem>
          )}
        </Select>
      </FormControl>
      <AddressAutocomplete
        value={formData.location}
        onChange={handleLocationChange}
        name="location"
        label={t("address")}
        required
        fullWidth
        margin="normal"
        sx={{ mb: 3 }}
      />
      <StyledPaper elevation={0} sx={{ mb: 3 }}>
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
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
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
            name="priceFrom"
            type="number"
            value={formData.priceFrom}
            onChange={handleChange}
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
            name="priceTo"
            type="number"
            value={formData.priceTo}
            onChange={handleChange}
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
      <StyledPaper elevation={0} sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
        >
          <CloudUploadIcon color="primary" />
          {t("images")}
        </Typography>
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
        {/* Превью существующих изображений */}
        {existingImages.length > 0 && (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {existingImages.map((img, index) => (
              <Grid item xs={6} sm={4} md={3} key={img}>
                <ImagePreviewCard>
                  <ImageContainer>
                    <StyledImage src={img} alt={`existing-img-${index}`} />
                    <IconButton
                      size="small"
                      onClick={() => handleImageDelete(index, true)}
                      sx={{
                        color: "white",
                        backgroundColor: "rgba(0,0,0,0.2)",
                        backdropFilter: "blur(4px)",
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 2,
                        "&:hover": {
                          backgroundColor: "rgba(255,255,255,0.2)",
                        },
                        padding: 0.5,
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ImageContainer>
                </ImagePreviewCard>
              </Grid>
            ))}
          </Grid>
        )}
        {/* Превью новых изображений */}
        {imagePreviews.length > 0 && (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {imagePreviews.map((preview, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <ImagePreviewCard>
                  <ImageContainer>
                    <StyledImage
                      src={preview.preview}
                      alt={`preview-img-${index}`}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleImageDelete(index, false)}
                      sx={{
                        color: "white",
                        backgroundColor: "rgba(0,0,0,0.2)",
                        backdropFilter: "blur(4px)",
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 2,
                        "&:hover": {
                          backgroundColor: "rgba(255,255,255,0.2)",
                        },
                        padding: 0.5,
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ImageContainer>
                </ImagePreviewCard>
              </Grid>
            ))}
          </Grid>
        )}
      </StyledPaper>
      {message && (
        <Alert
          severity={message.startsWith("Error") ? "error" : "success"}
          sx={{ mb: 3 }}
        >
          {message}
        </Alert>
      )}
      <Box sx={{ display: "flex", gap: 2, mt: 2, mb: 1 }}>
        {onCancel && (
          <Button onClick={onCancel} variant="outlined">
            {t("cancel")}
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={loading}
          sx={{
            py: 1.5,
            borderRadius: 2,
            fontSize: "1.1rem",
            textTransform: "none",
          }}
        >
          {mode === "edit" ? t("save") : t("create_offer_button")}
        </Button>
      </Box>
    </form>
  );
};

export default OfferForm;
