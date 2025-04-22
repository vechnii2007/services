import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { useTranslation } from "react-i18next";
import { Typography, Box } from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import OfferFilters from "../components/OfferFilters";
import CategoryCard from "../components/CategoryCard";
import OfferList from "../components/OfferList";
import OfferService from "../services/OfferService";
import { filterOffers } from "../utils/filterOffers";
import { PAGINATION } from "../config";
import { AuthContext } from "../context/AuthContext";
import { styled } from "@mui/material/styles";

import "swiper/css";
import "swiper/css/navigation";

// Создаем стилизованный компонент для слайдера
const StyledSwiper = styled(Swiper)(({ theme }) => ({
  padding: "16px 48px",
  "& .swiper-button-next, & .swiper-button-prev": {
    color: theme.palette.primary.main,
    "&:after": {
      fontSize: "24px",
    },
    "&.swiper-button-disabled": {
      opacity: 0.35,
      cursor: "auto",
      pointerEvents: "none",
    },
  },
  "& .swiper-slide": {
    display: "flex",
    justifyContent: "center",
  },
}));

const Offers = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useContext(AuthContext);
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const isFetchingData = useRef(false);
  const fetchTimeoutRef = useRef(null);
  const fetchIdRef = useRef(0);
  const [categoryCounts, setCategoryCounts] = useState({});

  const fetchData = useCallback(async () => {
    if (isFetchingData.current) {
      console.log("[Offers] Skipping fetch, already fetching data");
      return;
    }

    const currentFetchId = ++fetchIdRef.current;
    const params = {
      page,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      locationFilter: locationFilter || undefined,
    };

    // Проверяем, не изменились ли параметры с прошлого запроса
    const paramsKey = JSON.stringify(params);
    if (fetchIdRef.current > 1 && fetchIdRef.lastParams === paramsKey) {
      console.log("[Offers] Skipping fetch, params haven't changed");
      return;
    }
    fetchIdRef.lastParams = paramsKey;

    console.log(`[Offers] Starting fetch #${currentFetchId}. Params:`, params);

    isFetchingData.current = true;
    setLoading(true);

    try {
      const promises = [
        OfferService.getAll({
          ...params,
          limit: PAGINATION.OFFERS_PER_PAGE,
        }),
      ];

      // Загружаем категории только если их нет
      if (categories.length === 0) {
        promises.push(OfferService.fetchCategories());
      }

      // Загружаем избранное только если пользователь авторизован
      if (isAuthenticated) {
        promises.push(OfferService.fetchFavorites());
      }

      const [offersResponse, categoriesResponse, favoritesResponse] =
        await Promise.all(promises);

      if (currentFetchId !== fetchIdRef.current) {
        console.log(
          `[Offers] Fetch #${currentFetchId} was superseded by a newer fetch`
        );
        return;
      }

      console.log(`[Offers] Fetch #${currentFetchId} completed successfully`);

      setOffers(offersResponse.offers || []);
      setTotalPages(offersResponse.totalPages || 1);

      if (categoriesResponse && categories.length === 0) {
        setCategories(categoriesResponse || []);
      }

      if (isAuthenticated && favoritesResponse) {
        setFavorites(favoritesResponse || {});
      }

      // Подсчитываем количество предложений для каждой категории
      const counts = {};
      offersResponse.offers.forEach((offer) => {
        if (offer.category) {
          counts[offer.category] = (counts[offer.category] || 0) + 1;
        }
      });
      setCategoryCounts(counts);
    } catch (error) {
      console.error(`[Offers] Fetch #${currentFetchId} failed:`, error);
      setMessage(error.response?.data?.error || "Error loading offers");
    } finally {
      isFetchingData.current = false;
      setLoading(false);
    }
  }, [
    page,
    minPrice,
    maxPrice,
    locationFilter,
    isAuthenticated,
    categories.length,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Используем разные задержки для разных типов изменений
    const delay = (() => {
      if (page !== 1) return 0; // Мгновенная загрузка при смене страницы
      if (minPrice !== "" || maxPrice !== "" || locationFilter !== "")
        return 500; // Задержка для фильтров
      return 300; // Стандартная задержка
    })();

    fetchTimeoutRef.current = setTimeout(() => {
      fetchData();
    }, delay);

    return () => {
      controller.abort();
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [fetchData]);

  const handleCategoryClick = useCallback(
    (category) => {
      setSelectedCategory(category === selectedCategory ? "" : category);
    },
    [selectedCategory]
  );

  const handlePageChange = useCallback((event, value) => {
    setPage(value);
  }, []);

  const filteredOffers = useMemo(
    () =>
      filterOffers(offers, {
        searchQuery,
        selectedCategory,
        minPrice,
        maxPrice,
        locationFilter,
        sortBy,
      }),
    [
      offers,
      searchQuery,
      selectedCategory,
      minPrice,
      maxPrice,
      locationFilter,
      sortBy,
    ]
  );

  if (loading && categories.length === 0) {
    return <Typography>{t("loading")}</Typography>;
  }

  return (
    <Box sx={{ paddingY: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t("offers")}
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

      <OfferFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        locationFilter={locationFilter}
        setLocationFilter={setLocationFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onClearFilters={() => {
          setSearchQuery("");
          setMinPrice("");
          setMaxPrice("");
          setLocationFilter("");
          setSortBy("newest");
          setSelectedCategory("");
        }}
      />

      <Typography
        variant="h6"
        gutterBottom
        sx={{
          mb: 2,
          fontWeight: 600,
          color: "text.primary",
        }}
      >
        {t("categories")}
      </Typography>

      <Box
        sx={{
          marginBottom: 4,
          "& .swiper-wrapper": {
            alignItems: "stretch",
          },
        }}
      >
        <StyledSwiper
          modules={[Navigation]}
          spaceBetween={16}
          slidesPerView={1}
          navigation
          breakpoints={{
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 5 },
          }}
        >
          {categories.map((category) => (
            <SwiperSlide key={category._id}>
              <CategoryCard
                category={category}
                selected={selectedCategory === category.name}
                onClick={handleCategoryClick}
                count={categoryCounts[category.name] || 0}
              />
            </SwiperSlide>
          ))}
        </StyledSwiper>
      </Box>

      <OfferList
        offers={filteredOffers || []}
        favorites={favorites || {}}
        setFavorites={setFavorites}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        loading={loading}
      />
    </Box>
  );
};

export default Offers;
