import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Box,
  Divider,
} from "@mui/material";
import { usePromotions } from "../../hooks/usePromotions";
import { PromotionPreview } from "./PromotionPreview";
import api from "../../middleware/api";

export const PromotionDialog = ({ open, onClose, offerId, onSuccess }) => {
  const [options, setOptions] = useState(null);
  const [offerDetails, setOfferDetails] = useState(null);
  const [selectedPromotionType, setSelectedPromotionType] = useState(null);
  const { loading, error, getPromotionOptions, createPromotion } =
    usePromotions();

  useEffect(() => {
    if (open) {
      loadOptions();
      loadOfferDetails();
    } else {
      // Сбрасываем выбранный тип при закрытии
      setSelectedPromotionType(null);
    }
  }, [open, offerId]);

  const loadOptions = async () => {
    const data = await getPromotionOptions();
    if (data) {
      setOptions(data);
    }
  };

  const loadOfferDetails = async () => {
    try {
      const response = await api.get(`/offers/${offerId}`);
      if (response.data) {
        setOfferDetails(response.data);
      }
    } catch (error) {
      console.error("Error loading offer details for preview:", error);
    }
  };

  const handlePromoteSelect = (type) => {
    setSelectedPromotionType(type);
  };

  const handlePromote = async () => {
    if (!selectedPromotionType) return;

    const result = await createPromotion(offerId, selectedPromotionType);
    if (result) {
      onSuccess?.();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Продвижение объявления</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
        )}

        {loading ? (
          <Grid container justifyContent="center" padding={3}>
            <CircularProgress />
          </Grid>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12} md={selectedPromotionType ? 6 : 12}>
              <Typography variant="subtitle1" gutterBottom>
                Выберите тип продвижения:
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {options &&
                  Object.entries(options).map(([type, option]) => (
                    <Grid
                      item
                      xs={12}
                      sm={selectedPromotionType ? 12 : 6}
                      md={selectedPromotionType ? 12 : 4}
                      key={type}
                    >
                      <Card
                        variant={
                          selectedPromotionType === type
                            ? "outlined"
                            : "elevation"
                        }
                        sx={{
                          border:
                            selectedPromotionType === type
                              ? "2px solid #1976d2"
                              : undefined,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
                          },
                        }}
                        onClick={() => handlePromoteSelect(type)}
                      >
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {option.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            gutterBottom
                          >
                            {option.description}
                          </Typography>
                          <Typography variant="h5" color="primary">
                            {option.price} ₽
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            на {option.duration} дней
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button
                            fullWidth
                            variant={
                              selectedPromotionType === type
                                ? "contained"
                                : "outlined"
                            }
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePromoteSelect(type);
                            }}
                          >
                            {selectedPromotionType === type
                              ? "Выбрано"
                              : "Выбрать"}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </Grid>

            {selectedPromotionType && offerDetails && (
              <Grid item xs={12} md={6}>
                <PromotionPreview
                  offer={offerDetails}
                  selectedPromotionType={selectedPromotionType}
                />
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Отмена
        </Button>
        <Button
          onClick={handlePromote}
          color="primary"
          variant="contained"
          disabled={!selectedPromotionType || loading}
        >
          {loading ? "Обработка..." : "Применить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
