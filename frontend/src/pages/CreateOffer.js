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
  Divider,
  Alert,
  Stack,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Autocomplete, LoadScript } from "@react-google-maps/api";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CategoryIcon from "@mui/icons-material/Category";
import DescriptionIcon from "@mui/icons-material/Description";
import EuroIcon from "@mui/icons-material/Euro";
import { useDropzone } from "react-dropzone";

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

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  marginBottom: theme.spacing(3),
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
  width: "100%",
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
    serviceType: "",
    location: "",
    description: "",
    price: "",
    images: [],
    providerId: "", // Добавляем поле для выбора провайдера
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [message, setMessage] = useState("");
  const [autocomplete, setAutocomplete] = useState(null);
  const [providers, setProviders] = useState([]);
  const [userRole, setUserRole] = useState("");

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

        // Если пользователь — администратор, загружаем список провайдеров
        if (userRes.data.role === "admin") {
          const providersRes = await axios.get(`/services/providers`);
          setProviders(providersRes.data);
        }
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onLoad = (autoC) => {
    setAutocomplete(autoC);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        setFormData({
          ...formData,
          location: place.formatted_address,
        });
      }
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
      data.append("title", t(formData.serviceType) || formData.serviceType);
      data.append("category", formData.serviceType);
      data.append("location", formData.location);
      data.append("description", formData.description);
      data.append("price", formData.price);

      // Если админ указал providerId, используем его
      if (userRole === "admin" && formData.providerId) {
        data.append("providerId", formData.providerId);
        console.log(`Admin setting providerId: ${formData.providerId}`);
      }

      // Добавляем все изображения с именем "images"
      formData.images.forEach((image) => {
        data.append("images", image);
      });

      console.log("Sending offer data:", {
        title: t(formData.serviceType) || formData.serviceType,
        category: formData.serviceType,
        location: formData.location,
        description: formData.description.substring(0, 30) + "...",
        price: formData.price,
        providerId:
          userRole === "admin" ? formData.providerId : "using current user",
        imagesCount: formData.images.length,
      });

      const res = await axios.post(`/services/offers`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Offer created successfully:", res.data);
      setMessage(t("offer_created"));
      setFormData({
        serviceType: "",
        location: "",
        description: "",
        price: "",
        images: [],
        providerId: "",
      });
      setImagePreviews([]);
      setTimeout(() => navigate("/offers"), 2000);
    } catch (error) {
      console.error(
        "Error creating offer:",
        error.response?.data || error.message
      );
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

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Основная информация */}
          <StyledPaper elevation={0}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}
            >
              <CategoryIcon color="primary" />
              {t("basic_information")}
            </Typography>

            {userRole === "admin" && (
              <StyledFormControl fullWidth>
                <InputLabel>{t("provider")}</InputLabel>
                <Select
                  name="providerId"
                  value={formData.providerId}
                  onChange={handleChange}
                  label={t("provider")}
                  required
                >
                  {providers.map((provider) => (
                    <MenuItem key={provider._id} value={provider._id}>
                      {provider.name} ({provider.email})
                    </MenuItem>
                  ))}
                </Select>
              </StyledFormControl>
            )}

            <StyledFormControl fullWidth>
              <InputLabel>{t("service_type")}</InputLabel>
              <Select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                label={t("service_type")}
                required
              >
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
              </Select>
            </StyledFormControl>
          </StyledPaper>

          {/* Местоположение */}
          <StyledPaper elevation={0}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}
            >
              <LocationOnIcon color="primary" />
              {t("location")}
            </Typography>

            <LoadScript
              googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
              libraries={["places"]}
            >
              <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                <TextField
                  label={t("location")}
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Autocomplete>
            </LoadScript>
          </StyledPaper>

          {/* Описание и цена */}
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

            <TextField
              label={t("price")}
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              fullWidth
              required
              InputProps={{
                startAdornment: <EuroIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          </StyledPaper>

          {/* Изображения */}
          <StyledPaper elevation={0}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}
            >
              <CloudUploadIcon color="primary" />
              {t("images")}
            </Typography>

            {imagePreviews.length === 0 ? (
              <DropzoneArea {...getRootProps()} isDragActive={isDragActive}>
                <input {...getInputProps()} />
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      backgroundColor: "primary.light",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 2,
                    }}
                  >
                    <CloudUploadIcon
                      sx={{ fontSize: 30, color: "primary.main" }}
                    />
                  </Box>
                  {isDragActive ? (
                    <Typography variant="h6" color="primary.main">
                      {t("drop_files_here")}
                    </Typography>
                  ) : (
                    <>
                      <Typography
                        variant="h6"
                        color="text.primary"
                        sx={{ fontWeight: 500 }}
                      >
                        {t("drag_drop_images")}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {t("or")}
                      </Typography>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="large"
                        sx={{
                          borderStyle: "dashed",
                          px: 4,
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
                <Box {...getRootProps()} sx={{ mb: 3 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                    sx={{
                      py: 2,
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

                <Grid container spacing={2}>
                  {imagePreviews.map((preview, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                      <ImagePreviewCard>
                        <ImageContainer>
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
                              p: 1,
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
                                mr: 1,
                                "&:hover": {
                                  backgroundColor: "rgba(255,255,255,0.2)",
                                },
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
              !formData.serviceType || !formData.location || !formData.price
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
        </Stack>
      </form>
    </Box>
  );
};

export default CreateOffer;
