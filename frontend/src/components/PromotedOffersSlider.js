import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Skeleton,
  useTheme,
  useMediaQuery,
  Chip,
} from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { styled } from "@mui/material/styles";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useTranslation } from "react-i18next";
import OfferCard from "./OfferCard";
import OfferService from "../services/OfferService";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const StyledSwiper = styled(Swiper)(({ theme, isMobile }) => ({
  width: "100%",
  marginBottom: theme.spacing(3),
  "& .swiper-button-next, & .swiper-button-prev": {
    color: theme.palette.primary.main,
    display: isMobile ? "none" : "flex",
  },
  "& .swiper-pagination": {
    bottom: isMobile ? -5 : 5,
  },
  "& .swiper-pagination-bullet": {
    backgroundColor: theme.palette.grey[400],
    opacity: 0.5,
    width: isMobile ? 6 : 8,
    height: isMobile ? 6 : 8,
  },
  "& .swiper-pagination-bullet-active": {
    backgroundColor: theme.palette.error.main,
    opacity: 1,
  },
}));

// Заголовок с акцентом для промо-предложений
const PromotedHeading = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    marginBottom: theme.spacing(1.5),
  },
}));

const HeadingText = styled(Typography)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  fontWeight: 600,
  "& svg": {
    color: theme.palette.error.main,
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: "1.1rem",
  },
}));

const PromoChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.common.white,
  fontWeight: 600,
  height: 24,
  "& .MuiChip-label": {
    paddingLeft: 8,
    paddingRight: 8,
  },
  [theme.breakpoints.down("sm")]: {
    height: 20,
    fontSize: "0.7rem",
  },
}));

const PromotedOffersSlider = ({ favorites, toggleFavorite }) => {
  const { t } = useTranslation();
  const [promoted, setPromoted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topCategories, setTopCategories] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const swiperRef = useRef(null);

  useEffect(() => {
    const fetchPromotedOffers = async () => {
      // Функция-помощник для получения топ-категорий
      const fetchTopCategories = async (limit = 5) => {
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
        return data;
      };

      // Функция-помощник для получения промо-предложений
      const fetchPromotedOffersData = async (limit = 5) => {
        if (typeof OfferService.getPromotedOffers !== "function") {
          console.warn(
            "[PromotedOffersSlider] getPromotedOffers is not a function, using empty data"
          );
          return { offers: [], total: 0, hasMore: false };
        }
        const response = await OfferService.getPromotedOffers(limit);
        return response;
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
        setPromoted(window.promotedOffersData);
        setLoading(false);

        // Также проверяем закешированные топ-категории
        if (window.topCategoriesData) {
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
            setPromoted(cachedOffers);
            window.promotedOffersData = cachedOffers;
          }

          if (cachedCategories && cachedCategories.length > 0) {
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
          const response = await fetchPromotedOffersData(5);

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
          const categoriesResponse = await fetchTopCategories(5);

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

  // Если нет промо-предложений, мы всё равно показываем секцию с топ-категориями
  const hasContent = promoted.length > 0 || topCategories.length > 0;

  if (!hasContent && !loading) {
    return null;
  }

  return (
    <Box sx={{ mb: isMobile ? 4 : 6 }}>
      {/* Секция с промо-предложениями */}
      {promoted.length > 0 && (
        <>
          <PromotedHeading>
            <HeadingText variant={isMobile ? "subtitle1" : "h6"}>
              <TrendingUpIcon />
              {t("promoted_offers")}
            </HeadingText>
            <PromoChip
              label={t("top_offers")}
              size={isMobile ? "small" : "medium"}
            />
          </PromotedHeading>

          <StyledSwiper
            slidesPerView={1}
            spaceBetween={isMobile ? 8 : 16}
            pagination={{ clickable: true, dynamicBullets: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            modules={[Pagination, Autoplay]}
            isMobile={isMobile}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            breakpoints={{
              0: {
                slidesPerView: 1.2,
                spaceBetween: 8,
              },
              400: {
                slidesPerView: 1.5,
                spaceBetween: 10,
              },
              600: {
                slidesPerView: 2,
                spaceBetween: 12,
              },
              960: {
                slidesPerView: 3,
                spaceBetween: 16,
              },
              1280: {
                slidesPerView: 4,
                spaceBetween: 16,
              },
            }}
          >
            {loading
              ? Array.from(new Array(isMobile ? 2 : 4)).map((_, index) => (
                  <SwiperSlide key={`skeleton-${index}`}>
                    <Card
                      sx={{
                        m: isMobile ? 0.5 : 1,
                        borderRadius: isMobile ? 1 : 2,
                      }}
                    >
                      <Skeleton
                        variant="rectangular"
                        height={isMobile ? 100 : 140}
                      />
                      <CardContent sx={{ p: isMobile ? 1 : 2 }}>
                        <Skeleton variant="text" height={24} width="80%" />
                        <Skeleton variant="text" height={20} width="60%" />
                        {!isMobile && (
                          <Skeleton variant="text" height={20} width="40%" />
                        )}
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
