import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Typography, Box, Container, Alert } from "@mui/material";
import { styled } from "@mui/material/styles";
import OfferFilters from "../components/OfferFilters";
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
  maxWidth: "100%",
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(8),
  [theme.breakpoints.up("sm")]: {
    paddingTop: theme.spacing(5),
    paddingBottom: theme.spacing(10),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
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
  const location = useLocation();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [offersCache, setOffersCache] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [counts, setCounts] = useState({});
  const [favorites, setFavorites] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [providerId, setProviderId] = useState("");
  const [providerName, setProviderName] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [message, setMessage] = useState("");
  const [totalResults, setTotalResults] = useState(0);
  const isFetchingRef = useRef(false);
  const listRef = useRef();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const providerIdFromUrl = queryParams.get("providerId");

    if (providerIdFromUrl) {
      setProviderId(providerIdFromUrl);
      const fetchProviderInfo = async () => {
        try {
          const response = await OfferService.getProviderInfo(
            providerIdFromUrl
          );
          if (response && response.name) {
            setProviderName(response.name);
          }
        } catch (error) {
          console.error("Error fetching provider info:", error);
        }
      };

      fetchProviderInfo();
    }
  }, [location.search]);

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
  }, []);

  const handlePageChange = useCallback((event, value) => {
    setPage(value);
  }, []);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setLoadingMore(false);
    setOffers([]);
    setOffersCache({});
  }, [
    searchQuery,
    minPrice,
    maxPrice,
    locationFilter,
    selectedCategory,
    providerId,
  ]);

  // Загрузка офферов по страницам
  useEffect(() => {
    let cancelled = false;
    const fetchOffers = async () => {
      if (offersCache[page]) {
        setOffers((prev) => {
          const newOffers =
            page === 1 ? offersCache[page] : [...prev, ...offersCache[page]];
          return newOffers;
        });
        setLoading(false);
        setLoadingMore(false);
        setHasMore(page < totalPages);
        return;
      }
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const params = {
          page,
          limit: PAGINATION.OFFERS_PER_PAGE,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          location: locationFilter || undefined,
          category: selectedCategory || undefined,
          providerId: providerId || undefined,
        };
        let response;
        if (searchQuery?.trim()) {
          response = await searchService.searchOffers(searchQuery, params);
        } else {
          response = await OfferService.getAll(params);
        }
        if (!cancelled) {
          setOffersCache((prevCache) => ({
            ...prevCache,
            [page]: response.offers || [],
          }));
          setOffers((prev) => {
            const newOffers =
              page === 1
                ? response.offers || []
                : [...prev, ...(response.offers || [])];
            return newOffers;
          });
          setTotalPages(response.pages || 1);
          setHasMore(page < (response.pages || 1));
        }
      } catch (error) {
        if (!cancelled) setHasMore(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };
    fetchOffers();
    return () => {
      cancelled = true;
    };
  }, [
    page,
    searchQuery,
    minPrice,
    maxPrice,
    locationFilter,
    selectedCategory,
    providerId,
  ]);

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
          setFavorites({});
          return;
        }
        if (typeof OfferService.fetchFavorites === "function") {
          const favoritesData = await OfferService.fetchFavorites();
          setFavorites(favoritesData || {});
        } else {
          setFavorites({});
        }
      } catch (error) {
        setFavorites({});
        console.error("[Offers] Error fetching favorites:", error);
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
        await getFavorites();

        const loadTime = Date.now() - loadStart;
        console.log(`[Offers] Initial data load completed in ${loadTime}ms`);
      } catch (error) {
        console.error("[Offers] Error loading initial data:", error);
        toast.error(t("errors.loadingFailed"));
      }
    };

    loadInitialData();
  }, [isAuthenticated, t]);

  const filteredOffers = useMemo(() => {
    const filtered = filterOffers(offers, { searchQuery });

    return [...filtered].sort((a, b) => {
      const aIsPromoted =
        a?.promoted?.isPromoted &&
        new Date(a.promoted.promotedUntil) > new Date();
      const bIsPromoted =
        b?.promoted?.isPromoted &&
        new Date(b.promoted.promotedUntil) > new Date();

      if (aIsPromoted === bIsPromoted) return 0;

      if (aIsPromoted) return -1;

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

        setFavorites((prev) => ({
          ...prev,
          [offerId]: result.isFavorite,
        }));

        if (result.isFavorite) {
          toast.success(t("added_to_favorites"));
        } else {
          toast.success(t("removed_from_favorites"));
        }

        if (!result.success && result.error) {
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

  const clearProviderFilter = () => {
    setProviderId("");
    setProviderName("");
    const params = new URLSearchParams(location.search);
    params.delete("providerId");
    navigate({ search: params.toString() });
  };

  // Функция для кнопки "Загрузить ещё"
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMore) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, loadingMore]);

  useEffect(() => {
    if (page > 1 && listRef.current) {
      listRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [offers, page]);

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

      {providerId && providerName && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography
                variant="button"
                color="inherit"
                sx={{ mr: 1, cursor: "pointer", textDecoration: "underline" }}
                onClick={clearProviderFilter}
              >
                {t("clear_filter")}
              </Typography>
            </Box>
          }
        >
          {t("showing_offers_from_provider", { providerName })}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Box
          sx={{
            maxWidth: { xs: "calc(100vw - 32px)", sm: 500 },
            mx: "auto",
          }}
        >
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
        </Box>
      </Box>

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

      <PromotedOffersSlider
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />

      <OfferList
        ref={listRef}
        offers={offers}
        favorites={favorites}
        loading={loading && offers.length === 0}
        toggleFavorite={toggleFavorite}
        searchQuery={searchQuery}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={handleLoadMore}
      />
    </ContentContainer>
  );
};

export default Offers;
