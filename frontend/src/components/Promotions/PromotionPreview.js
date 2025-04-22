import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
} from "@mui/material";
import OfferCard from "../OfferCard";
import { usePromotions } from "../../hooks/usePromotions";

/**
 * Компонент для предварительного просмотра объявления с промоакцией
 *
 * @param {Object} props
 * @param {Object} props.offer - данные объявления
 * @param {string} props.selectedPromotionType - выбранный тип промоакции (TOP, HIGHLIGHT, URGENT)
 */
export const PromotionPreview = ({ offer, selectedPromotionType }) => {
  const [previewOffer, setPreviewOffer] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const { getPromotionOptions, loading } = usePromotions();
  const [promotionOptions, setPromotionOptions] = useState(null);

  // Загружаем информацию о типах промоакций при монтировании
  useEffect(() => {
    const loadOptions = async () => {
      const options = await getPromotionOptions();
      if (options) {
        setPromotionOptions(options);
      }
    };
    loadOptions();
  }, [getPromotionOptions]);

  // Создаем превью объявления с выбранной промоакцией
  useEffect(() => {
    if (offer && selectedPromotionType) {
      // Клонируем объект объявления
      const offerClone = { ...offer };

      // Добавляем информацию о промоакции
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7); // Предполагаем, что промоакция на 7 дней

      offerClone.promotion = {
        type: selectedPromotionType,
        startDate,
        endDate,
        active: true,
        price: promotionOptions?.[selectedPromotionType]?.price || 0,
      };

      // Добавляем специальный бейдж на основе типа промоакции
      if (selectedPromotionType === "HIGHLIGHT") {
        offerClone._highlightPreview = true;
      } else if (selectedPromotionType === "URGENT") {
        offerClone.badge = "sale";
      }

      setPreviewOffer(offerClone);
    } else {
      setPreviewOffer(offer);
    }
  }, [offer, selectedPromotionType, promotionOptions]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading || !previewOffer) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Предварительный просмотр
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        textColor="primary"
        indicatorColor="primary"
        sx={{ mb: 2 }}
      >
        <Tab label="В ленте" />
        <Tab label="В поиске" />
      </Tabs>

      {tabValue === 0 && (
        <Box display="flex" justifyContent="center" p={2}>
          <OfferCard offer={previewOffer} isPreview={true} />
        </Box>
      )}

      {tabValue === 1 && (
        <Box p={2}>
          <Typography variant="subtitle1" gutterBottom>
            Положение в результатах поиска:
            {selectedPromotionType === "TOP" ? (
              <Typography component="span" color="primary" fontWeight="bold">
                {" "}
                В самом верху!
              </Typography>
            ) : (
              " Обычное"
            )}
          </Typography>

          <Box
            display="flex"
            flexDirection="column"
            sx={{
              backgroundColor:
                selectedPromotionType === "HIGHLIGHT"
                  ? "rgba(156, 39, 176, 0.05)"
                  : "inherit",
              p: 1,
              borderRadius: 1,
            }}
          >
            <Typography variant="subtitle2">{previewOffer.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {previewOffer.price} ₽ - {previewOffer.location}
            </Typography>
          </Box>
        </Box>
      )}

      {selectedPromotionType && (
        <Box mt={2} p={2} bgcolor="background.default" borderRadius={1}>
          <Typography variant="body2" color="text.secondary">
            * Это предварительный просмотр. Реальное отображение может
            отличаться.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};
