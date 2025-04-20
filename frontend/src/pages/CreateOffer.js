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
  CardContent,
  Grid,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Autocomplete, LoadScript } from "@react-google-maps/api";

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
        const userRes = await axios.get(`/api/users/me`);
        setUserRole(userRes.data.role);

        // Если пользователь — администратор, загружаем список провайдеров
        if (userRes.data.role === "admin") {
          const providersRes = await axios.get(`/api/services/providers`);
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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [...formData.images, ...files];
    setFormData({ ...formData, images: newImages });

    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...previews]);
  };

  const handleImageDelete = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
    setImagePreviews(newPreviews);
  };

  const handleImageEdit = (index) => (e) => {
    const newImage = e.target.files[0];
    if (newImage) {
      const newImages = [...formData.images];
      newImages[index] = newImage;
      setFormData({ ...formData, images: newImages });

      const newPreviews = [...imagePreviews];
      newPreviews[index] = URL.createObjectURL(newImage);
      setImagePreviews(newPreviews);
    }
  };

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
      data.append("serviceType", formData.serviceType);
      data.append("location", formData.location);
      data.append("description", formData.description);
      data.append("price", formData.price);
      if (userRole === "admin" && formData.providerId) {
        data.append("providerId", formData.providerId);
      }
      formData.images.forEach((image) => {
        data.append("images", image);
      });

      const res = await axios.post(`/api/services/offers`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
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
    <Box sx={{ paddingY: 4 }}>
      <Typography variant="h5" gutterBottom>
        {t("create_offer")}
      </Typography>
      {message && (
        <Typography
          variant="body2"
          color="textSecondary"
          align="center"
          sx={{ marginBottom: 2 }}
        >
          {message}
        </Typography>
      )}
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {userRole === "admin" && (
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
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
              </FormControl>
            )}
            <FormControl fullWidth sx={{ marginBottom: 2 }}>
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
            </FormControl>
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
                  sx={{ marginBottom: 2 }}
                />
              </Autocomplete>
            </LoadScript>
            <TextField
              label={t("description")}
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
              required
              sx={{ marginBottom: 2 }}
            />
            <TextField
              label={t("price")}
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              fullWidth
              required
              sx={{ marginBottom: 2 }}
            />
            <Box sx={{ marginBottom: 2 }}>
              <Button variant="contained" component="label">
                {t("upload_images")}
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>
            </Box>
            {imagePreviews.length > 0 && (
              <Grid container spacing={2} sx={{ marginBottom: 2 }}>
                {imagePreviews.map((preview, index) => (
                  <Grid item xs={4} key={index}>
                    <Box sx={{ position: "relative" }}>
                      <img
                        src={preview}
                        alt={`Preview ${index}`}
                        style={{
                          width: "100%",
                          height: "100px",
                          objectFit: "cover",
                        }}
                      />
                      <IconButton
                        sx={{ position: "absolute", top: 0, right: 0 }}
                        onClick={() => handleImageDelete(index)}
                      >
                        <DeleteIcon color="error" />
                      </IconButton>
                      <IconButton
                        sx={{ position: "absolute", top: 0, left: 0 }}
                        component="label"
                      >
                        <EditIcon />
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleImageEdit(index)}
                        />
                      </IconButton>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
            <Button type="submit" variant="contained" color="primary">
              {t("create_offer")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateOffer;
