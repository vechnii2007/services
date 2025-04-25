import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Grid,
  Skeleton,
  Chip,
} from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { styled } from "@mui/material/styles";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CategoryIcon from "@mui/icons-material/Category";
import StarIcon from "@mui/icons-material/Star";
import OfferService from "../services/OfferService";
import { formatPrice } from "../utils/formatters";
import FavoriteButton from "./FavoriteButton";
import OfferCard from "./OfferCard";

const StyledSwiper = styled(Swiper)(({ theme }) => ({
  width: "100%",
  marginBottom: theme.spacing(4),
  "& .swiper-button-next, & .swiper-button-prev": {
    color: theme.palette.primary.main,
  },
  "& .swiper-pagination-bullet-active": {
    backgroundColor: theme.palette.primary.main,
  },
}));

const PromotionCard = styled(Card)(({ theme }) => ({
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  borderRadius: theme.shape.borderRadius,
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  overflow: "hidden",
  position: "relative",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
  },
}));

const PromotionImage = styled(CardMedia)(({ theme }) => ({
  height: 180,
  backgroundSize: "cover",
  backgroundPosition: "center",
  position: "relative",
  backgroundColor: theme.palette.grey[100],
}));

const CategorySection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  background: "linear-gradient(45deg, #F5F7FA 0%, #E4E8EB 100%)",
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(3),
  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
}));

const CategoryChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: "#FFFFFF",
  border: `1px solid ${theme.palette.grey[300]}`,
  "&:hover": {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
  },
  "&.active": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
}));

const PromotionLabel = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 10,
  right: 10,
  background: "linear-gradient(45deg, #FF6B6B 0%, #FF8E53 100%)",
  color: "#fff",
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  fontSize: "0.75rem",
  fontWeight: "bold",
  zIndex: 10,
  display: "flex",
  alignItems: "center",
  boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
}));

const PromotedOffersSlider = ({ favorites, toggleFavorite }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [promoted, setPromoted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topCategories, setTopCategories] = useState([]);

  useEffect(() => {
    const fetchPromotedOffers = async () => {
      // Функция-помощник для получения топ-категорий
      const fetchTopCategories = async (limit = 5) => {
        try {
          console.log(
            `[PromotedOffersSlider] Fetching top ${limit} categories`
          );
          if (typeof OfferService.getTopCategories !== "function") {
            console.warn(
              "[PromotedOffersSlider] getTopCategories is not a function, using mock data"
            );
            return {
              categories: [
                {
                  id: "1",
                  name: "healthcare",
                  label: "Медицина",
                  count: 12,
                  hasImage: true,
                  imageUrl: "/uploads/images/healthcare.jpg",
                },
                {
                  id: "2",
                  name: "household",
                  label: "Бытовые услуги",
                  count: 8,
                  hasImage: true,
                  imageUrl: "/uploads/images/household.jpg",
                },
                {
                  id: "3",
                  name: "finance",
                  label: "Финансы",
                  count: 6,
                  hasImage: true,
                  imageUrl: "/uploads/images/finance.jpg",
                },
                {
                  id: "4",
                  name: "education",
                  label: "Образование",
                  count: 5,
                  hasImage: true,
                  imageUrl: "/uploads/images/education.jpg",
                },
                {
                  id: "5",
                  name: "transport",
                  label: "Транспорт",
                  count: 3,
                  hasImage: true,
                  imageUrl: "/uploads/images/transport.jpg",
                },
              ],
              totalCategories: 5,
              timestamp: new Date().toISOString(),
            };
          }
          const data = await OfferService.getTopCategories(limit);
          console.log("[PromotedOffersSlider] Top categories response:", data);
          return data;
        } catch (error) {
          console.error(
            "[PromotedOffersSlider] Error fetching top categories:",
            error
          );
          return {
            categories: [],
            totalCategories: 0,
            timestamp: new Date().toISOString(),
          };
        }
      };

      // Функция-помощник для получения промо-предложений
      const fetchPromotedOffersData = async (limit = 5) => {
        try {
          console.log(
            `[PromotedOffersSlider] Fetching promoted offers (limit: ${limit})`
          );
          if (typeof OfferService.getPromotedOffers !== "function") {
            console.warn(
              "[PromotedOffersSlider] getPromotedOffers is not a function, using empty data"
            );
            return { offers: [], total: 0, hasMore: false };
          }
          const response = await OfferService.getPromotedOffers(limit);
          console.log(
            "[PromotedOffersSlider] Promoted offers response:",
            response
          );
          return response;
        } catch (error) {
          console.error(
            "[PromotedOffersSlider] Error fetching promoted offers:",
            error
          );
          return { offers: [], total: 0, hasMore: false };
        }
      };

      // Проверяем, был ли уже запрос за последние 5 минут
      const cacheKey = "promoted_offers_data";
      const topCategoriesKey = "top_categories_data";
      const lastLoadTime = sessionStorage.getItem(cacheKey);
      const currentTime = Date.now();

      // Кеш действителен 5 минут
      const CACHE_DURATION = 5 * 60 * 1000;

      // Если данные есть в window, используем их
      if (window.promotedOffersData) {
        console.log(
          "[PromotedOffersSlider] Using cached promoted offers from window"
        );
        setPromoted(window.promotedOffersData);
        setLoading(false);

        // Также проверяем закешированные топ-категории
        if (window.topCategoriesData) {
          console.log(
            "[PromotedOffersSlider] Using cached top categories from window"
          );
          setTopCategories(window.topCategoriesData);
          return;
        }
      }

      // Если данные были загружены недавно, используем кеш
      if (
        lastLoadTime &&
        currentTime - parseInt(lastLoadTime) < CACHE_DURATION
      ) {
        try {
          const cachedOffers = JSON.parse(
            sessionStorage.getItem("promoted_offers_cache")
          );
          const cachedCategories = JSON.parse(
            sessionStorage.getItem("top_categories_cache")
          );

          if (cachedOffers && cachedOffers.length > 0) {
            console.log(
              "[PromotedOffersSlider] Using cached promoted offers from sessionStorage"
            );
            setPromoted(cachedOffers);
            window.promotedOffersData = cachedOffers;
          }

          if (cachedCategories && cachedCategories.length > 0) {
            console.log(
              "[PromotedOffersSlider] Using cached top categories from sessionStorage"
            );
            setTopCategories(cachedCategories);
            window.topCategoriesData = cachedCategories;
          }

          setLoading(false);

          // Если оба кеша действительны, выходим
          if (cachedOffers && cachedCategories) {
            return;
          }
        } catch (e) {
          console.error("[PromotedOffersSlider] Error parsing cache:", e);
        }
      }

      setLoading(true);

      // Загружаем отсутствующие данные
      try {
        // Если нет промо-предложений, загружаем их
        if (!window.promotedOffersData) {
          console.log(
            "[PromotedOffersSlider] Fetching promoted offers from API"
          );
          // Используем метод экземпляра для getPromotedOffers
          const response = await fetchPromotedOffersData(5);
          console.log(
            "[PromotedOffersSlider] Fetched promoted offers:",
            response
          );

          const offers = response.offers || [];
          setPromoted(offers);
          window.promotedOffersData = offers;
          window.promotedOffersLoaded = true;

          // Сохраняем в sessionStorage
          sessionStorage.setItem(
            "promoted_offers_cache",
            JSON.stringify(offers)
          );
          sessionStorage.setItem(cacheKey, currentTime.toString());
        }

        // Если нет топ-категорий, загружаем их
        if (!window.topCategoriesData) {
          console.log(
            "[PromotedOffersSlider] Fetching top categories from API"
          );
          const categoriesResponse = await fetchTopCategories(5);
          console.log(
            "[PromotedOffersSlider] Fetched top categories:",
            categoriesResponse
          );

          const categories = categoriesResponse.categories || [];
          setTopCategories(categories);
          window.topCategoriesData = categories;

          // Сохраняем в sessionStorage
          sessionStorage.setItem(
            "top_categories_cache",
            JSON.stringify(categories)
          );
          sessionStorage.setItem(topCategoriesKey, currentTime.toString());
        }
      } catch (error) {
        console.error("[PromotedOffersSlider] Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotedOffers();
  }, []);

  const handleClickOffer = (id) => {
    navigate(`/offers/${id}`);
  };

  const handleCategoryClick = (category) => {
    navigate(`/offers?category=${category.name}`);
  };

  // Если нет промо-предложений, мы всё равно показываем секцию с топ-категориями
  const hasContent = promoted.length > 0 || topCategories.length > 0;

  if (!hasContent && !loading) {
    return null;
  }

  return (
    <Box sx={{ mb: 6 }}>
      {/* Секция с промо-предложениями */}
      {promoted.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "medium" }}>
            {t("promoted_offers")}
          </Typography>

          <StyledSwiper
            slidesPerView={1}
            spaceBetween={16}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            modules={[Navigation, Pagination, Autoplay]}
            breakpoints={{
              600: {
                slidesPerView: 2,
              },
              960: {
                slidesPerView: 3,
              },
              1280: {
                slidesPerView: 4,
              },
            }}
          >
            {loading
              ? Array.from(new Array(4)).map((_, index) => (
                  <SwiperSlide key={`skeleton-${index}`}>
                    <Card sx={{ m: 1 }}>
                      <Skeleton variant="rectangular" height={140} />
                      <CardContent>
                        <Skeleton variant="text" height={24} width="80%" />
                        <Skeleton variant="text" height={20} width="60%" />
                        <Skeleton variant="text" height={20} width="40%" />
                      </CardContent>
                    </Card>
                  </SwiperSlide>
                ))
              : promoted.map((offer) => (
                  <SwiperSlide key={offer._id}>
                    <OfferCard
                      offer={offer}
                      isFavorite={Boolean(favorites?.[offer._id])}
                      onFavoriteClick={() =>
                        toggleFavorite?.(offer._id, offer.type)
                      }
                    />
                  </SwiperSlide>
                ))}
          </StyledSwiper>
        </>
      )}
    </Box>
  );
};

export default PromotedOffersSlider;
