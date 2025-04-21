import React, { memo, useEffect } from "react";
import {
  Card,
  CardContent,
  Box,
  IconButton,
  Button,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { ROUTES } from "../../constants";
import PropTypes from "prop-types";
import OfferImage from "./OfferImage";
import OfferInfo from "./OfferInfo";
import ProviderInfo from "./ProviderInfo";
import { motion } from "framer-motion";

// Оборачиваем Card в motion компонент
const MotionCard = motion(Card);

// Фолбэк-компонент, который показывается вместо ошибки
const EmptyOfferCard = () => {
  return (
    <MotionCard
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "300px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        backgroundColor: "background.paper",
      }}
    >
      <Box
        sx={{
          height: "160px",
          backgroundColor: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="body2" color="textSecondary">
          Изображение недоступно
        </Typography>
      </Box>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="subtitle1">Предложение недоступно</Typography>
        <Typography variant="body2" color="textSecondary">
          Информация о предложении отсутствует или недоступна
        </Typography>
      </CardContent>
    </MotionCard>
  );
};

const OfferCard = memo(
  ({ offer = {}, isFavorite = false, onFavoriteClick = () => {} }) => {
    const navigate = useNavigate();

    // Безопасный доступ к свойствам
    const safeOfferId = offer?._id || "";
    const safeOfferType = offer?.type || "offer";
    const safeOfferTitle = offer?.title || "";
    const safeOfferDescription = offer?.description || "";
    const safeOfferPrice = offer?.price || 0;
    const safeOfferImage = offer?.image || "";
    const safeOfferLocation = offer?.location || "";
    const safeOfferCreatedAt = offer?.createdAt || "";
    const safeProvider = offer?.provider || {};

    useEffect(() => {
      console.log("OfferCard mounted/updated with props:", {
        offerId: safeOfferId,
        offerType: safeOfferType,
        isFavorite,
        hasOnFavoriteClick: !!onFavoriteClick,
      });
    }, [safeOfferId, safeOfferType, isFavorite, onFavoriteClick]);

    // Если нет ID, показываем пустую карточку
    if (!safeOfferId) {
      console.warn("OfferCard received offer without ID:", offer);
      return <EmptyOfferCard />;
    }

    const handleCardClick = (e) => {
      if (!safeOfferId || e.target.closest("button")) {
        return;
      }
      navigate(ROUTES.OFFER_DETAILS.replace(":id", safeOfferId));
    };

    const handleViewClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!safeOfferId) return;
      navigate(ROUTES.OFFER_DETAILS.replace(":id", safeOfferId));
    };

    const handleFavoriteClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!safeOfferId) return;

      try {
        if (typeof onFavoriteClick === "function") {
          onFavoriteClick();
        } else {
          console.error("onFavoriteClick is not a function");
        }
      } catch (error) {
        console.error("Error in handleFavoriteClick:", error);
      }
    };

    return (
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.2 }}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "300px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          position: "relative",
          cursor: "pointer",
          backgroundColor: "background.paper",
        }}
        onClick={handleCardClick}
      >
        <OfferImage image={safeOfferImage} title={safeOfferTitle} />
        <CardContent
          sx={{
            p: 2,
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <Box
            component={motion.div}
            whileHover={{ scale: 1.1 }}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              zIndex: 2,
            }}
          >
            <IconButton
              onClick={handleFavoriteClick}
              size="small"
              sx={{
                transition: "transform 0.2s",
                backgroundColor: "background.paper",
                "&:hover": {
                  transform: "scale(1.1)",
                  backgroundColor: "background.paper",
                },
              }}
            >
              {isFavorite ? (
                <FavoriteIcon
                  color="error"
                  component={motion.svg}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                />
              ) : (
                <FavoriteBorderIcon
                  component={motion.svg}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                />
              )}
            </IconButton>
          </Box>

          <Box sx={{ mb: 2 }}>
            <ProviderInfo provider={safeProvider} />
          </Box>

          <Box
            sx={{
              position: "relative",
              pr: 4,
            }}
          >
            <OfferInfo
              title={safeOfferTitle}
              description={safeOfferDescription}
              price={safeOfferPrice}
              location={safeOfferLocation}
              createdAt={safeOfferCreatedAt}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Button
              component={motion.button}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              variant="contained"
              fullWidth
              startIcon={<VisibilityIcon />}
              onClick={handleViewClick}
              sx={{
                textTransform: "none",
                borderRadius: "8px",
                transition: "all 0.2s",
              }}
            >
              Подробнее
            </Button>
          </Box>
        </CardContent>
      </MotionCard>
    );
  }
);

OfferCard.displayName = "OfferCard";

OfferCard.propTypes = {
  offer: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    price: PropTypes.number,
    image: PropTypes.string,
    location: PropTypes.string,
    createdAt: PropTypes.string,
    type: PropTypes.string,
  }),
  isFavorite: PropTypes.bool,
  onFavoriteClick: PropTypes.func,
};

OfferCard.defaultProps = {
  offer: {},
  isFavorite: false,
  onFavoriteClick: () => {},
};

export default OfferCard;
