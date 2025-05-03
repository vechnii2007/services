import React, { useState, useEffect } from "react";
import api from "../middleware/api";
import { useTranslation } from "react-i18next";
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
  Autocomplete as GoogleMapsAutocomplete,
} from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import MuiAutocomplete from "@mui/material/Autocomplete";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [providerId, setProviderId] = useState("");

  useEffect(() => {
    api
      .get("/services/providers")
      .then((res) => setProviders(res.data))
      .catch(() => setProviders([]));
  }, []);

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
    if (autocomplete !== null && window.google) {
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
    } else {
      console.error("Google Maps API не загружен (window.google отсутствует)");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.description) {
      setError(t("description_required"));
      return;
    }
    setLoading(true);
    try {
      await api.post("/services/requests", {
        serviceType: formData.serviceType,
        location: formData.location,
        coordinates: formData.coordinates,
        description: formData.description,
        ...(providerId ? { providerId } : {}),
      });
      setMessage(t("request_created"));
      setFormData({
        serviceType: "",
        location: "",
        description: "",
        coordinates: { lat: center.lat, lng: center.lng },
      });
      setProviderId("");
      setShowMap(false);
      navigate("/my-requests");
    } catch (error) {
      console.error("Error creating request:", error);
      setError(error.message);
    } finally {
      setLoading(false);
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
          {error && (
            <Typography
              variant="body2"
              color="error"
              align="center"
              sx={{ marginBottom: 2 }}
            >
              {error}
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
                <GoogleMapsAutocomplete
                  onLoad={onLoad}
                  onPlaceChanged={onPlaceChanged}
                >
                  <TextField
                    label={t("location")}
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </GoogleMapsAutocomplete>

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

              <MuiAutocomplete
                options={providers}
                getOptionLabel={(option) => option.name || ""}
                value={providers.find((p) => p._id === providerId) || null}
                onChange={(_, newValue) =>
                  setProviderId(newValue ? newValue._id : "")
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t("provider")}
                    placeholder={t("any_provider")}
                  />
                )}
                isOptionEqualToValue={(option, value) =>
                  option._id === value._id
                }
              />

              <TextField
                label={t("description")}
                name="description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                required
                multiline
                rows={3}
                error={!formData.description}
                helperText={
                  !formData.description ? t("description_required") : ""
                }
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? t("creating_request") : t("create_request_button")}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ServiceRequestForm;
