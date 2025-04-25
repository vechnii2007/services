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
import PromotedOffersSlider from "../components/PromotedOffersSlider";
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
  width: "100%",
  marginBottom: theme.spacing(6),
  position: "relative",
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(2, 0),
  "& .swiper-button-prev, & .swiper-button-next": {
    color: theme.palette.primary.main,
  },
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: "100%",
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
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
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [counts, setCounts] = useState({});
  const [favorites, setFavorites] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [totalResults, setTotalResults] = useState(0);
  const isFetchingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const params = {
        page,
        limit: PAGINATION.OFFERS_PER_PAGE,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        location: locationFilter || undefined,
        category: selectedCategory || undefined,
      };

      let response;
      if (searchQuery?.trim()) {
        response = await searchService.searchOffers(searchQuery, params);
      } else {
        response = await OfferService.getAll(params);
      }

      setOffers(response.offers || []);
      setTotalPages(response.pages || 1);
      setTotalResults(response.total || 0);

      if (
        response.filteredTotal !== undefined &&
        response.originalTotal !== undefined
      ) {
        const filteredCount = response.filteredTotal;
        const totalCount = response.originalTotal;

        if (filteredCount < totalCount) {
          toast.success(
            t("search.results_count", {
              filtered: filteredCount,
              total: totalCount,
              query: searchQuery,
            })
          );
        }
      }
    } catch (error) {
      setMessage(error.response?.data?.error || "Error loading offers");
      toast.error(t("errors.loading_failed"));
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [
    page,
    searchQuery,
    minPrice,
    maxPrice,
    locationFilter,
    selectedCategory,
    t,
  ]);

  const handleCategoryClick = useCallback(
    (category) => {
      const newCategory =
        category.name === selectedCategory ? null : category.name;
      setSelectedCategory(newCategory);
      setPage(1);
    },
    [selectedCategory]
  );

  const handleSearch = useCallback(() => {
    setPage(1);
    fetchData();
  }, [fetchData]);

  const handlePageChange = useCallback((event, value) => {
    setPage(value);
  }, []);

  // Эффект для начальной загрузки категорий
  useEffect(() => {
    // Функция-помощник для получения категорий
    const getFetchCategories = async () => {
      try {
        if (typeof OfferService.fetchCategories === "function") {
          return await OfferService.fetchCategories();
        } else {
          console.warn("[Offers] Using fallback for categories");
          return [];
        }
      } catch (error) {
        console.error("[Offers] Error fetching categories:", error);
        return [];
      }
    };

    // Функция-помощник для получения счетчиков категорий
    const getFetchCategoryCounts = async () => {
      try {
        if (typeof OfferService.fetchCategoryCounts === "function") {
          return await OfferService.fetchCategoryCounts();
        } else {
          console.warn("[Offers] Using fallback for category counts");
          return {};
        }
      } catch (error) {
        console.error("[Offers] Error fetching category counts:", error);
        return {};
      }
    };

    // Функция-помощник для получения избранных предложений
    const getFavorites = async () => {
      try {
        if (!isAuthenticated) {
          return {};
        }

        if (typeof OfferService.fetchFavorites === "function") {
          const favoritesData = await OfferService.fetchFavorites();
          return favoritesData || {};
        } else {
          console.warn("[Offers] fetchFavorites is not a function");
          return {};
        }
      } catch (error) {
        console.error("[Offers] Error fetching favorites:", error);
        return {};
      }
    };

    // Функция-помощник для получения промо-предложений
    const getPromotedOffers = async () => {
      try {
        if (typeof OfferService.getPromotedOffers === "function") {
          const response = await OfferService.getPromotedOffers();
          return response;
        } else {
          console.warn("[Offers] getPromotedOffers is not a function");
          return { offers: [], total: 0, hasMore: false };
        }
      } catch (error) {
        console.error("[Offers] Error fetching promoted offers:", error);
        return { offers: [], total: 0, hasMore: false };
      }
    };

    const loadInitialData = async () => {
      const loadStart = Date.now();

      try {
        const [categoriesResponse, countsResponse] = await Promise.all([
          getFetchCategories(),
          getFetchCategoryCounts(),
        ]);

        const transformedCounts = {};
        categoriesResponse?.forEach((category) => {
          transformedCounts[category.name] =
            countsResponse?.[category.name] || 0;
        });

        setCategories(categoriesResponse || []);
        setCounts(transformedCounts);

        // Загружаем промо-оферы, если они не загружены ранее
        if (!window.promotedOffersLoaded) {
          try {
            const promotedOffersResponse = await getPromotedOffers();
            window.promotedOffersLoaded = true;
            window.promotedOffersData = promotedOffersResponse.offers || [];
          } catch (error) {
            console.error("[Offers] Error loading promoted offers:", error);
          }
        } else {
          console.log(
            "[Offers] Skipping promoted offers load - already loaded"
          );
        }

        // Загружаем избранные, если пользователь авторизован
        const favoritesData = await getFavorites();
        setFavorites(favoritesData);

        const loadTime = Date.now() - loadStart;
        console.log(`[Offers] Initial data load completed in ${loadTime}ms`);
      } catch (error) {
        console.error("[Offers] Error loading initial data:", error);
        toast.error(t("errors.loadingFailed"));
      }
    };

    loadInitialData();
  }, [isAuthenticated, t]);

  // Эффект для обновления данных при изменении фильтров
  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        fetchData();
      },
      page !== 1 ? 0 : 300
    );

    return () => clearTimeout(timeoutId);
  }, [fetchData, page, searchQuery, minPrice, maxPrice, locationFilter]);

  // Мемоизируем фильтрованные оферы и сортируем их, чтобы промо оферы были вверху
  const filteredOffers = useMemo(() => {
    // Сначала фильтруем по поисковому запросу
    const filtered = filterOffers(offers, { searchQuery });

    // Затем сортируем, чтобы промо-оферы были первыми
    return [...filtered].sort((a, b) => {
      const aIsPromoted =
        a?.promoted?.isPromoted &&
        new Date(a.promoted.promotedUntil) > new Date();
      const bIsPromoted =
        b?.promoted?.isPromoted &&
        new Date(b.promoted.promotedUntil) > new Date();

      // Если оба промо или оба не промо, сохраняем оригинальный порядок
      if (aIsPromoted === bIsPromoted) return 0;

      // Если a - промо, но b - нет, то a должен быть первым
      if (aIsPromoted) return -1;

      // Если b - промо, но a - нет, то b должен быть первым
      return 1;
    });
  }, [offers, searchQuery]);

  const toggleFavorite = useCallback(
    async (offerId, offerType = "offer") => {
      if (!isAuthenticated) {
        toast.error(t("offer.loginRequired"));
        return;
      }

      try {
        console.log("[toggleFavorite] Starting toggle for offer:", {
          offerId,
          offerType,
          currentFavoriteStatus: favorites[offerId]
            ? "в избранном"
            : "не в избранном",
        });

        const serverOfferType =
          offerType === "service_offer" ? "ServiceOffer" : "Offer";
        const wasInFavorites = Boolean(favorites[offerId]);

        // Оптимистичное обновление
        setFavorites((prev) => {
          const newFavorites = {
            ...prev,
            [offerId]: !prev[offerId],
          };
          console.log("[toggleFavorite] Updated favorites state:", {
            wasInFavorites,
            newStatus: !wasInFavorites,
            offerId,
          });
          return newFavorites;
        });

        const result = await OfferService.toggleFavorite(
          offerId,
          serverOfferType
        );

        console.log("[toggleFavorite] Server response:", {
          success: result.success,
          isFavorite: result.isFavorite,
          message: result.message,
        });

        // Обновляем состояние в соответствии с ответом сервера
        setFavorites((prev) => ({
          ...prev,
          [offerId]: result.isFavorite,
        }));

        // Показываем уведомление об успешном действии
        if (result.isFavorite) {
          toast.success(t("added_to_favorites"));
        } else {
          toast.success(t("removed_from_favorites"));
        }

        if (!result.success && result.error) {
          // Откат при ошибке
          setFavorites((prev) => ({
            ...prev,
            [offerId]: wasInFavorites,
          }));
          toast.error(t("errors.toggle_favorite"));
        }
      } catch (error) {
        console.error("[toggleFavorite] Error:", error);
        toast.error(t("errors.toggle_favorite"));
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
          counts={counts}
        />
      </CategoriesSection>

      {/* Отображаем слайдер с промо-офферами */}
      <PromotedOffersSlider
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />

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
