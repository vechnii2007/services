import React, { memo, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Box,
  IconButton,
  Button,
  Typography,
  Rating,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { ROUTES } from "../../constants";
import PropTypes from "prop-types";
import OfferImage from "./OfferImage";
import OfferInfo from "./OfferInfo";
import ProviderInfo from "./ProviderInfo";
import OfferBadge from "./OfferBadge";
import OfferPrice from "./OfferPrice";
import { motion } from "framer-motion";
import { useUser } from "../../hooks/useUser";
import api from "../../middleware/api";
import { PromotionDialog } from "../Promotions/PromotionDialog";
import { PromotionStatus } from "../Promotions/PromotionStatus";
import { TopPromoteButton } from "../Promotions/TopPromoteButton";

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
  ({
    offer = {},
    isFavorite = false,
    onFavoriteClick = () => {},
    isOwner,
    onUpdate,
    isPreview = false,
  }) => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [openRatingDialog, setOpenRatingDialog] = useState(false);
    const [ratingValue, setRatingValue] = useState(0);
    const [comment, setComment] = useState("");
    const [userRating, setUserRating] = useState(null);
    const [promotionDialogOpen, setPromotionDialogOpen] = useState(false);

    // Безопасный доступ к свойствам
    const safeOfferId = offer?._id || "";
    const safeOfferType = offer?.type || "offer";
    const safeOfferTitle = offer?.title || "";
    const safeOfferDescription = offer?.description || "";
    const safeOfferPrice = offer?.price || 0;
    const safeOfferOldPrice = offer?.oldPrice;
    const safeOfferImage = offer?.image || "";
    const safeOfferLocation = offer?.location || "";
    const safeOfferCreatedAt = offer?.createdAt || "";
    const safeProvider = offer?.provider || {};
    const safeOfferRating = offer?.rating || 0;
    const safeOfferBadge = offer?.badge;
    const safeOfferPromotion = offer?.promotion || null;
    const isHighlighted =
      safeOfferPromotion?.type === "HIGHLIGHT" || offer?._highlightPreview;

    useEffect(() => {
      console.log("OfferCard mounted/updated with props:", {
        offerId: safeOfferId,
        offerType: safeOfferType,
        isFavorite,
        hasOnFavoriteClick: !!onFavoriteClick,
      });
    }, [safeOfferId, safeOfferType, isFavorite, onFavoriteClick]);

    useEffect(() => {
      if (user && safeOfferId) {
        // Загружаем рейтинг пользователя при монтировании
        const fetchUserRating = async () => {
          try {
            const response = await api.get(`/offers/${safeOfferId}/ratings/me`);
            if (response.data) {
              setUserRating(response.data);
              setRatingValue(response.data.rating);
              setComment(response.data.comment || "");
            }
          } catch (error) {
            console.error("Error fetching user rating:", error);
          }
        };
        fetchUserRating();
      }
    }, [safeOfferId, user]);

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
          // Преобразуем тип предложения в правильный формат
          const normalizedOfferType =
            safeOfferType === "offer" ? "Offer" : "ServiceOffer";
          onFavoriteClick(safeOfferId, normalizedOfferType);
        } else {
          console.error("onFavoriteClick is not a function");
        }
      } catch (error) {
        console.error("Error in handleFavoriteClick:", error);
      }
    };

    const handleRatingClick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!user) {
        // Если пользователь не авторизован, перенаправляем на страницу входа
        navigate(ROUTES.LOGIN);
        return;
      }
      setOpenRatingDialog(true);
    };

    const handleRatingSubmit = async () => {
      try {
        await api.post(`/offers/${safeOfferId}/ratings`, {
          rating: ratingValue,
          comment,
        });
        setOpenRatingDialog(false);
        // Обновляем рейтинг в карточке
        const response = await api.get(`/offers/${safeOfferId}/ratings/me`);
        if (response.data) {
          setUserRating(response.data);
        }
      } catch (error) {
        console.error("Error submitting rating:", error);
      }
    };

    const handleRatingDelete = async () => {
      try {
        await api.delete(`/offers/${safeOfferId}/ratings`);
        setUserRating(null);
        setRatingValue(0);
        setComment("");
        setOpenRatingDialog(false);
      } catch (error) {
        console.error("Error deleting rating:", error);
      }
    };

    return (
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{
          scale: 1.02,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        }}
        transition={{ duration: 0.2 }}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "300px",
          borderRadius: "16px",
          boxShadow: isHighlighted
            ? "0 0 0 2px rgba(156, 39, 176, 0.6), 0 4px 12px rgba(0,0,0,0.1)"
            : "0 4px 12px rgba(0,0,0,0.1)",
          position: "relative",
          cursor: isPreview ? "default" : "pointer",
          backgroundColor: isHighlighted
            ? "rgba(156, 39, 176, 0.02)"
            : "background.paper",
          overflow: "visible",
        }}
        onClick={isPreview ? undefined : handleCardClick}
      >
        {safeOfferBadge && <OfferBadge type={safeOfferBadge} />}

        <OfferImage image={safeOfferImage} title={safeOfferTitle} />

        <CardContent
          sx={{
            p: 2,
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            position: "relative",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              right: 8,
              top: -20,
              display: "flex",
              gap: 1,
              zIndex: 2,
            }}
          >
            {isOwner && (
              <TopPromoteButton offerId={safeOfferId} onSuccess={onUpdate} />
            )}
            <IconButton
              onClick={handleFavoriteClick}
              size="small"
              sx={{
                backgroundColor: "background.paper",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                "&:hover": {
                  backgroundColor: "background.paper",
                  transform: "scale(1.1)",
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

          <Box>
            <ProviderInfo provider={safeProvider} />
            <Rating
              value={userRating?.rating || safeOfferRating}
              onChange={(event, newValue) => {
                event.preventDefault();
                event.stopPropagation();
                setRatingValue(newValue);
                setOpenRatingDialog(true);
              }}
              onClick={handleRatingClick}
              size="small"
              sx={{ mt: 0.5, cursor: "pointer" }}
            />
          </Box>

          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: "1.1rem",
                mb: 1,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.2,
              }}
            >
              {safeOfferTitle}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.4,
              }}
            >
              {safeOfferDescription}
            </Typography>

            {safeOfferLocation && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mb: 1,
                }}
              >
                <LocationOnIcon
                  sx={{ fontSize: "1rem", color: "text.secondary" }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.875rem" }}
                >
                  {safeOfferLocation}
                </Typography>
              </Box>
            )}
          </Box>

          <Box
            sx={{
              mt: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <OfferPrice price={safeOfferPrice} oldPrice={safeOfferOldPrice} />

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
                background: "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
                boxShadow: "0 4px 12px rgba(33,150,243,0.2)",
                "&:hover": {
                  boxShadow: "0 6px 16px rgba(33,150,243,0.3)",
                },
              }}
            >
              Подробнее
            </Button>
          </Box>
        </CardContent>

        <Dialog
          open={openRatingDialog}
          onClose={() => setOpenRatingDialog(false)}
          onClick={(e) => e.stopPropagation()}
        >
          <DialogTitle>
            {userRating ? "Изменить отзыв" : "Оставить отзыв"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ my: 2 }}>
              <Typography component="legend">Ваша оценка</Typography>
              <Rating
                value={ratingValue}
                onChange={(e, value) => setRatingValue(value)}
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Комментарий"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            {userRating && (
              <Button
                onClick={handleRatingDelete}
                color="error"
                sx={{ mr: "auto" }}
              >
                Удалить
              </Button>
            )}
            <Button onClick={() => setOpenRatingDialog(false)}>Отмена</Button>
            <Button onClick={handleRatingSubmit} variant="contained">
              Сохранить
            </Button>
          </DialogActions>
        </Dialog>

        <PromotionDialog
          open={promotionDialogOpen}
          onClose={() => setPromotionDialogOpen(false)}
          offerId={safeOfferId}
          onSuccess={onUpdate}
        />
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
    oldPrice: PropTypes.number,
    image: PropTypes.string,
    location: PropTypes.string,
    createdAt: PropTypes.string,
    type: PropTypes.string,
    rating: PropTypes.number,
    badge: PropTypes.oneOf(["new", "popular", "sale"]),
    provider: PropTypes.object,
  }),
  isFavorite: PropTypes.bool,
  onFavoriteClick: PropTypes.func,
  isOwner: PropTypes.bool,
  onUpdate: PropTypes.func,
  isPreview: PropTypes.bool,
};

OfferCard.defaultProps = {
  offer: {},
  isFavorite: false,
  onFavoriteClick: () => {},
  isOwner: false,
  onUpdate: () => {},
  isPreview: false,
};

export default OfferCard;
