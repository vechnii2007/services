import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
} from "@mui/material";

const ProviderRequests = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [offerForms, setOfferForms] = useState({}); // Изменяем на объект для хранения форм по requestId
  const [filters, setFilters] = useState({
    serviceType: "",
    location: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setMessage(t("please_login"));
          navigate("/login");
          return;
        }

        const userRes = await axios.get(`/users/me`);
        const userRole = userRes.data.role;
        if (userRole !== "provider") {
          setMessage(t("access_denied_providers_only"));
          navigate("/my-requests");
          return;
        }

        const res = await axios.get(`/services/requests`);
        setRequests(res.data);
        setMessage(t("requests_loaded"));
      } catch (error) {
        if (error.response) {
          setMessage(
            "Error: " + (error.response.data.error || t("something_went_wrong"))
          );
          if (error.response.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
          }
        } else if (error.request) {
          setMessage(t("no_response_from_server"));
        } else {
          setMessage("Error: " + error.message);
        }
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [t, navigate]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredRequests = requests.filter((request) => {
    return (
      (!filters.serviceType || request.serviceType === filters.serviceType) &&
      (!filters.location ||
        request.location
          .toLowerCase()
          .includes(filters.location.toLowerCase())) &&
      (!filters.description ||
        request.description
          .toLowerCase()
          .includes(filters.description.toLowerCase()))
    );
  });

  const handleOfferChange = (requestId, e) => {
    const { name, value } = e.target;
    setOfferForms((prev) => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        [name]: value,
      },
    }));
  };

  const handleOfferSubmit = async (requestId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage(t("please_login"));
        navigate("/login");
        return;
      }
      const formData = offerForms[requestId] || { message: "", price: "" };
      const res = await axios.post(`/services/offer`, {
        requestId,
        message: formData.message || "",
        price: formData.price || "",
      });
      setMessage(t("offer_submitted"));
      setOfferForms((prev) => ({
        ...prev,
        [requestId]: { message: "", price: "" }, // Сбрасываем форму для данного requestId
      }));
      console.log(res.data);
    } catch (error) {
      if (error.response) {
        setMessage(
          "Error: " + (error.response.data.error || t("something_went_wrong"))
        );
        if (error.response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } else if (error.request) {
        setMessage(t("no_response_from_server"));
      } else {
        setMessage("Error: " + error.message);
      }
      console.error(error);
    }
  };

  if (loading) {
    return <Typography>{t("loading")}</Typography>;
  }

  return (
    <Box sx={{ paddingY: 4 }}>
      <Typography variant="h5" gutterBottom>
        {t("available_requests")}
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

      <Card sx={{ marginBottom: 4, padding: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>{t("service_type")}</InputLabel>
                <Select
                  name="serviceType"
                  value={filters.serviceType}
                  onChange={handleFilterChange}
                  label={t("service_type")}
                >
                  <MenuItem value="">{t("all")}</MenuItem>
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
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label={t("location")}
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label={t("description")}
                name="description"
                value={filters.description}
                onChange={handleFilterChange}
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {filteredRequests.length > 0 ? (
        <Grid container spacing={3}>
          {filteredRequests.map((request) => (
            <Grid item xs={12} sm={6} md={4} key={request._id}>
              <Card>
                <CardContent>
                  <Typography variant="body1">
                    <strong>{t("service_type")}:</strong>{" "}
                    {t(request.serviceType)}
                  </Typography>
                  <Typography variant="body1">
                    <strong>{t("location")}:</strong> {request.location}
                  </Typography>
                  <Typography variant="body1">
                    <strong>{t("description")}:</strong> {request.description}
                  </Typography>
                  <Typography variant="body1">
                    <strong>{t("status")}:</strong> {request.status}
                  </Typography>
                  <Typography variant="body1">
                    <strong>{t("created_at")}:</strong>{" "}
                    {new Date(request.createdAt).toLocaleString()}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    component={Link}
                    to={`/chat/${request._id}`}
                    sx={{ marginTop: 2 }}
                  >
                    {t("chat")}
                  </Button>
                  <Box sx={{ marginTop: 2 }}>
                    <Typography variant="h6">{t("submit_offer")}</Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        marginTop: 1,
                      }}
                    >
                      <TextField
                        label={t("offer_message")}
                        name="message"
                        value={offerForms[request._id]?.message || ""}
                        onChange={(e) => handleOfferChange(request._id, e)}
                        fullWidth
                      />
                      <TextField
                        label={t("price")}
                        name="price"
                        type="number"
                        value={offerForms[request._id]?.price || ""}
                        onChange={(e) => handleOfferChange(request._id, e)}
                        fullWidth
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleOfferSubmit(request._id)}
                      >
                        {t("submit_offer_button")}
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body1" align="center">
          {t("no_requests")}
        </Typography>
      )}
    </Box>
  );
};

export default ProviderRequests;
