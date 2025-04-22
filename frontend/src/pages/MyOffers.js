import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../middleware/api";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Pagination,
  Stack,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Autocomplete, LoadScript } from "@react-google-maps/api";

const MyOffers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    serviceType: "",
    location: "",
    description: "",
    price: "",
    images: [],
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [autocomplete, setAutocomplete] = useState(null);

  const fetchMyOffers = async (pageNum) => {
    try {
      setLoading(true);
      const res = await api.get(`/services/my-offers`, {
        params: {
          page: pageNum,
          limit: 10,
        },
      });
      setOffers(res.data.offers);
      setTotalPages(Math.ceil(res.data.total / 10));
      setMessage(t("offers_loaded"));
    } catch (error) {
      setMessage(
        "Error: " + (error.response?.data?.error || t("something_went_wrong"))
      );
      if (error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOffers(page);
  }, [page]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleEditOpen = (offer) => {
    setCurrentOffer(offer);
    setFormData({
      serviceType: offer.serviceType,
      location: offer.location,
      description: offer.description,
      price: offer.price,
      images: [],
    });
    setImagePreviews(offer.images || []);
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setCurrentOffer(null);
    setFormData({
      serviceType: "",
      location: "",
      description: "",
      price: "",
      images: [],
    });
    setImagePreviews([]);
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

  const handleEditChange = (e) => {
    if (e.target.name === "images") {
      const files = Array.from(e.target.files);
      const newImages = [...formData.images, ...files];
      setFormData({ ...formData, images: newImages });

      const previews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews([...imagePreviews, ...previews]);
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
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

  const handleEditSubmit = async () => {
    try {
      const data = new FormData();
      data.append("serviceType", formData.serviceType);
      data.append("location", formData.location);
      data.append("description", formData.description);
      data.append("price", formData.price);
      formData.images.forEach((image) => {
        data.append("images", image);
      });

      const res = await api.put(`/services/offers/${currentOffer._id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await fetchMyOffers(page); // Перезагружаем текущую страницу
      setMessage(t("offer_updated"));
      handleEditClose();
    } catch (error) {
      setMessage(
        "Error: " + (error.response?.data?.error || t("something_went_wrong"))
      );
      if (error.response?.status === 401) {
        navigate("/login");
      }
    }
  };

  const handleDelete = async (offerId) => {
    if (!window.confirm(t("confirm_delete_offer"))) return;
    try {
      await api.delete(`/services/offers/${offerId}`);
      await fetchMyOffers(page); // Перезагружаем текущую страницу
      setMessage(t("offer_deleted"));
    } catch (error) {
      setMessage(
        "Error: " + (error.response?.data?.error || t("something_went_wrong"))
      );
      if (error.response?.status === 401) {
        navigate("/login");
      }
    }
  };

  const handleToggleStatus = async (offerId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await api.put(`/services/offers/${offerId}/status`, {
        status: newStatus,
      });
      await fetchMyOffers(page); // Перезагружаем текущую страницу
      setMessage(t("status_updated"));
    } catch (error) {
      setMessage(
        "Error: " + (error.response?.data?.error || t("something_went_wrong"))
      );
      if (error.response?.status === 401) {
        navigate("/login");
      }
    }
  };

  if (loading) {
    return <Typography>{t("loading")}</Typography>;
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t("my_offers")}
      </Typography>

      {message && (
        <Typography color="info" sx={{ mb: 2 }}>
          {message}
        </Typography>
      )}

      {loading ? (
        <Typography>{t("loading")}</Typography>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {offers.map((offer) => (
              <Grid item xs={12} sm={6} md={4} key={offer._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{offer.serviceType}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {offer.location}
                    </Typography>
                    <Typography variant="body1">{offer.description}</Typography>
                    <Typography variant="h6" color="primary">
                      {offer.price} ₽
                    </Typography>
                    <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                      <Button
                        variant="contained"
                        color={offer.status === "active" ? "error" : "primary"}
                        onClick={() =>
                          handleToggleStatus(offer._id, offer.status)
                        }
                      >
                        {offer.status === "active"
                          ? t("deactivate")
                          : t("activate")}
                      </Button>
                      <IconButton onClick={() => handleEditOpen(offer)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(offer._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Stack spacing={2} alignItems="center">
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Stack>
        </>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t("edit_offer")}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ marginBottom: 2, marginTop: 2 }}>
            <InputLabel>{t("service_type")}</InputLabel>
            <Select
              name="serviceType"
              value={formData.serviceType}
              onChange={handleEditChange}
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
              <MenuItem value="psychology">{t("psychology")}</MenuItem>
              <MenuItem value="plumbing">{t("plumbing")}</MenuItem>
              <MenuItem value="massage">{t("massage")}</MenuItem>
              <MenuItem value="cleaning">{t("cleaning")}</MenuItem>
              <MenuItem value="taro">{t("taro")}</MenuItem>
              <MenuItem value="evacuation">{t("evacuation")}</MenuItem>
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
                onChange={handleEditChange}
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
            onChange={handleEditChange}
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
            onChange={handleEditChange}
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
                name="images"
                onChange={handleEditChange}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} color="secondary">
            {t("cancel")}
          </Button>
          <Button onClick={handleEditSubmit} color="primary">
            {t("save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyOffers;
