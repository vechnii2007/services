import React, { useState } from "react";
import axios from "../utils/axiosConfig";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../constants";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  Box,
} from "@mui/material";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const center = {
  lat: 48.3794, // Координаты по умолчанию (например, Киев, Украина)
  lng: 31.1656,
};

const ServiceRequestForm = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    serviceType: "",
    location: "",
    description: "",
    coordinates: { lat: center.lat, lng: center.lng },
  });
  const [message, setMessage] = useState("");
  const [showMap, setShowMap] = useState(false); // Состояние для отображения карты
  const [autocomplete, setAutocomplete] = useState(null); // Состояние для автодополнения

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setFormData({
      ...formData,
      coordinates: { lat, lng },
      location: `${lat}, ${lng}`,
    });
  };

  const onLoad = (autoC) => {
    setAutocomplete(autoC);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setFormData({
          ...formData,
          location: place.formatted_address,
          coordinates: { lat, lng },
        });
        setShowMap(true); // Показываем карту после выбора места
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage(t("please_login"));
        return;
      }
      const res = await axios.post(
        `${API_BASE_URL}/api/services/request`,
        formData
      );
      setMessage(t("request_created"));
      setFormData({
        serviceType: "",
        location: "",
        description: "",
        coordinates: { lat: center.lat, lng: center.lng },
      });
      setShowMap(false);
      console.log(res.data);
    } catch (error) {
      if (error.response) {
        setMessage(
          "Error: " + (error.response.data.error || "Something went wrong")
        );
      } else if (error.request) {
        setMessage("Error: No response from server. Is the backend running?");
      } else {
        setMessage("Error: " + error.message);
      }
      console.error(error);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="calc(100vh - 64px)"
    >
      <Card sx={{ maxWidth: 500, width: "100%", padding: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {t("create_request")}
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
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Select
                label={t("service_type")}
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                fullWidth
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

              <Typography variant="body1">{t("location")}</Typography>
              <LoadScript
                googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
                libraries={["places"]} // Добавляем библиотеку places для автодополнения
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

                <Button
                  variant="outlined"
                  onClick={() => setShowMap(!showMap)}
                  sx={{ marginTop: 1 }}
                >
                  {showMap ? t("hide_map") : t("show_map")}
                </Button>

                {showMap && (
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={formData.coordinates}
                    zoom={10}
                    onClick={handleMapClick}
                  >
                    <Marker position={formData.coordinates} />
                  </GoogleMap>
                )}
              </LoadScript>

              <TextField
                label={t("description")}
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                fullWidth
                required
              />
              <Button type="submit" variant="contained" color="primary">
                {t("create_request_button")}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ServiceRequestForm;
