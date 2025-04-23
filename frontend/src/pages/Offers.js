import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { useTranslation } from "react-i18next";
import { Typography, Box, Container } from "@mui/material";
import { styled } from "@mui/material/styles";
import OfferFilters from "../components/OfferFilters";
import CategoryCard from "../components/CategoryCard";
import CategorySlider from "../components/CategorySlider";
import OfferList from "../components/OfferList";
import OfferService from "../services/OfferService";
import { searchService } from "../services/searchService";
import { filterOffers } from "../utils/filterOffers";
import { PAGINATION } from "../config";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-hot-toast";

const PageTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.h1.fontSize,
  fontWeight: theme.typography.h1.fontWeight,
  lineHeight: theme.typography.h1.lineHeight,
  letterSpacing: theme.typography.h1.letterSpacing,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(4),
  position: "relative",
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: -12,
    left: 0,
    width: 60,
    height: 4,
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
    borderRadius: theme.shape.borderRadius,
  },
}));

const CategoriesSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(6),
  position: "relative",
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2, 0),
  "& .swiper-button-prev, & .swiper-button-next": {
    color: theme.palette.primary.main,
  },
}));

const ContentContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(8),
  [theme.breakpoints.up("sm")]: {
    paddingTop: theme.spacing(5),
    paddingBottom: theme.spacing(10),
  },
  [theme.breakpoints.up("md")]: {
    paddingTop: theme.spacing(6),
    paddingBottom: theme.spacing(12),
  },
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "50vh",
  color: theme.palette.text.secondary,
}));

const Offers = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useContext(AuthContext);
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [favorites, setFavorites] = useState(() => {
    // Инициализируем состояние избранного из localStorage
    try {
      const cachedFavorites = localStorage.getItem("userFavorites");
      if (cachedFavorites) {
        const parsed = JSON.parse(cachedFavorites);
        console.log(
          "[Offers] Initialized favorites from localStorage:",
          parsed
        );
        return parsed;
      }
    } catch (e) {
      console.error("[Offers] Error parsing cached favorites:", e);
    }
    return {};
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [totalResults, setTotalResults] = useState(0);
  const isFetchingData = useRef(false);
  const fetchTimeoutRef = useRef(null);
  const fetchIdRef = useRef(0);

  const handleCategoryClick = useCallback(
    (category) => {
      console.log("[Offers] Category click handler started", {
        clickedCategory: category,
        currentSelectedCategory: selectedCategory,
        currentPage: page,
        currentSearchQuery: searchQuery,
        currentFilters: {
          minPrice,
          maxPrice,
          locationFilter,
        },
      });

      const newCategory =
        category.name === selectedCategory ? "" : category.name;
      console.log("[Offers] Setting new category:", newCategory);

      setSelectedCategory(newCategory);
      setPage(1); // Сбрасываем страницу при смене категории
      setLoading(true); // Устанавливаем состояние загрузки
    },
    [selectedCategory, page, searchQuery, minPrice, maxPrice, locationFilter]
  );

  const handlePageChange = useCallback((event, value) => {
    setPage(value);
  }, []);

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
      location: locationFilter || undefined,
      category: selectedCategory || undefined,
      limit: PAGINATION.OFFERS_PER_PAGE,
    };

    console.log("[Offers] Starting fetch with params:", {
      fetchId: currentFetchId,
      params,
      hasSearchQuery: !!searchQuery,
      searchQuery,
      isFetchingData: isFetchingData.current,
      lastParams: fetchIdRef.lastParams,
    });

    // Проверяем, не изменились ли параметры с прошлого запроса
    const paramsKey = JSON.stringify(params);
    if (fetchIdRef.current > 1 && fetchIdRef.lastParams === paramsKey) {
      console.log("[Offers] Skipping fetch, params haven't changed:", {
        currentParams: paramsKey,
        lastParams: fetchIdRef.lastParams,
      });
      return;
    }
    fetchIdRef.lastParams = paramsKey;

    console.log(`[Offers] Proceeding with fetch #${currentFetchId}`);

    isFetchingData.current = true;
    setLoading(true);

    try {
      // Используем searchService для поиска при наличии поискового запроса
      let offersResponse;
      if (searchQuery && searchQuery.trim() !== "") {
        console.log("[Offers] Using search service with query:", searchQuery);
        offersResponse = await searchService.searchOffers(searchQuery, params);
      } else {
        console.log("[Offers] Using regular offers service");
        offersResponse = await OfferService.getAll(params);
      }

      // Загружаем категории только если их нет
      if (categories.length === 0) {
        console.log("[Offers] Loading categories as they are empty");
        const categoriesResponse = await OfferService.fetchCategories();
        setCategories(categoriesResponse || []);
      }

      if (currentFetchId !== fetchIdRef.current) {
        console.log(
          `[Offers] Fetch #${currentFetchId} was superseded by a newer fetch #${fetchIdRef.current}`
        );
        return;
      }

      console.log("[Offers] Fetch completed successfully:", {
        fetchId: currentFetchId,
        offersCount: offersResponse.offers?.length,
        totalPages: offersResponse.pages,
        totalResults: offersResponse.total,
        category: selectedCategory,
      });

      setOffers(offersResponse.offers || []);
      setTotalPages(offersResponse.pages || 1);
      setTotalResults(offersResponse.total || 0);

      // Если результаты были отфильтрованы, показываем toast с количеством
      if (
        offersResponse.filteredTotal !== undefined &&
        offersResponse.originalTotal !== undefined
      ) {
        const filteredCount = offersResponse.filteredTotal;
        const totalCount = offersResponse.originalTotal;

        if (filteredCount < totalCount) {
          toast.success(
            `Найдено ${filteredCount} из ${totalCount} предложений по запросу "${searchQuery}"`
          );
        }
      }
    } catch (error) {
      console.error("[Offers] Fetch failed:", {
        fetchId: currentFetchId,
        error,
        params,
        category: selectedCategory,
      });
      setMessage(error.response?.data?.error || "Error loading offers");
      toast.error(
        `Ошибка при загрузке данных: ${error.message || "Неизвестная ошибка"}`
      );
    } finally {
      console.log("[Offers] Fetch cleanup:", {
        fetchId: currentFetchId,
        isFetchingData: false,
        loading: false,
      });
      isFetchingData.current = false;
      setLoading(false);
    }
  }, [
    page,
    minPrice,
    maxPrice,
    locationFilter,
    categories.length,
    selectedCategory,
    searchQuery,
  ]);

  const handleSearch = useCallback(() => {
    console.log("[Offers] Search initiated with query:", searchQuery);
    setPage(1); // Сбрасываем страницу при поиске
    fetchData();
  }, [searchQuery, fetchData]);

  const filteredOffers = useMemo(
    () => filterOffers(offers, { searchQuery }),
    [offers, searchQuery]
  );

  // Функция для загрузки категорий и их количества
  const loadCategoriesData = useCallback(async () => {
    try {
      console.log("[Offers] Loading categories and counts");
      const [categoriesResponse, countsResponse] = await Promise.all([
        OfferService.fetchCategories(),
        OfferService.fetchCategoryCounts(),
      ]);

      console.log("[Offers] Categories and counts loaded:", {
        categories: categoriesResponse,
        counts: countsResponse,
      });

      setCategories(categoriesResponse || []);
      setCategoryCounts(countsResponse || {});
    } catch (error) {
      console.error("[Offers] Error loading categories data:", error);
      toast.error(t("errors.categoriesLoadFailed"));
    }
  }, [t]);

  // Эффект для начальной загрузки категорий
  useEffect(() => {
    loadCategoriesData();
  }, [loadCategoriesData]);

  // Эффект для обновления данных при изменении фильтров
  useEffect(() => {
    const controller = new AbortController();

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    const delay = (() => {
      if (page !== 1) return 0;
      if (searchQuery) return 300;
      if (minPrice !== "" || maxPrice !== "" || locationFilter !== "")
        return 500;
      return 300;
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
  }, [fetchData, page, searchQuery, minPrice, maxPrice, locationFilter]);

  useEffect(() => {
    const loadFavorites = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          console.log("[Offers] Loading favorites separately");
          const favoritesData = await OfferService.fetchFavorites();
          setFavorites(favoritesData || {});
          console.log("[Offers] Favorites loaded:", favoritesData);
        } catch (error) {
          console.error("[Offers] Error loading favorites:", error);
        }
      } else {
        // Если токена нет, очищаем избранное
        console.log("[Offers] No token, clearing favorites");
        setFavorites({});
      }
    };

    loadFavorites();
  }, [isAuthenticated]);

  const toggleFavorite = useCallback(
    async (offerId, offerType) => {
      if (!isAuthenticated) {
        toast.error(t("offer.loginRequired"), {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      try {
        // Преобразуем тип предложения к формату, ожидаемому сервером
        const serverOfferType =
          offerType === "offer"
            ? "Offer"
            : offerType === "service_offer"
            ? "ServiceOffer"
            : offerType || "Offer";

        console.log(
          `[Offers] Toggling favorite for offer ${offerId} (${offerType} → ${serverOfferType})`
        );
        const wasInFavorites = favorites[offerId];

        // Оптимистичное обновление UI
        setFavorites((prev) => {
          const updated = { ...prev };
          if (updated[offerId]) {
            delete updated[offerId];
          } else {
            updated[offerId] = true;
          }
          return updated;
        });

        // Обновление на сервере
        const result = await OfferService.toggleFavorite(
          offerId,
          serverOfferType
        );
        console.log("[Offers] Toggle favorite result:", result);

        // Обновление избранного с сервера для синхронизации
        if (result.success) {
          // Кэш уже обновлен в OfferService
        } else {
          // Если запрос неуспешен, откатываем оптимистичное обновление
          console.error("[Offers] Error toggling favorite:", result.error);
          setFavorites((prev) => {
            const updated = { ...prev };
            if (wasInFavorites) {
              updated[offerId] = true;
            } else {
              delete updated[offerId];
            }
            return updated;
          });
          toast.error(result.error || t("common.errorOccurred"));
        }
      } catch (error) {
        console.error("[Offers] Error toggling favorite:", error);
        toast.error(t("common.errorOccurred"));
      }
    },
    [isAuthenticated, favorites, t]
  );

  if (loading && categories.length === 0) {
    return (
      <LoadingContainer>
        <Typography variant="h3" color="textSecondary">
          {t("loading")}
        </Typography>
      </LoadingContainer>
    );
  }

  return (
    <ContentContainer maxWidth="lg">
      <PageTitle variant="h1">{t("offers_and_services")}</PageTitle>

      <OfferFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        locationFilter={locationFilter}
        setLocationFilter={setLocationFilter}
        categories={categories}
        selectedCategories={selectedCategory ? [selectedCategory] : []}
        onCategoryChange={handleCategoryClick}
        onSearch={handleSearch}
        isSearching={loading}
      />

      <CategoriesSection>
        <Typography
          variant="h6"
          sx={{
            mb: 1,
            fontWeight: "medium",
            paddingLeft: 4,
            color: "text.primary",
          }}
        >
          {t("categories")}
        </Typography>
        <CategorySlider
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategoryClick}
          counts={categoryCounts}
        />
      </CategoriesSection>

      <OfferList
        offers={filteredOffers}
        favorites={favorites}
        setFavorites={setFavorites}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        loading={loading}
        toggleFavorite={toggleFavorite}
        searchQuery={searchQuery}
      />
    </ContentContainer>
  );
};

export default Offers;
