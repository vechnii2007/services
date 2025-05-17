import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useContext,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { useTheme, useMediaQuery } from "@mui/material";
import { AuthContext } from "../context/AuthContext";
import OfferService from "../services/OfferService";
import { searchService } from "../services/searchService";
import { PAGINATION } from "../config";
import { filterOffers } from "../utils/filterOffers";

const WINDOW_SIZE = PAGINATION.OFFERS_PER_PAGE;

// --- Debounce хук ---
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// Утилита для очистки params
function cleanParams(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null)
  );
}

const useOffersState = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Основные состояния
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [counts, setCounts] = useState({});
  const [favorites, setFavorites] = useState({});
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [providerName, setProviderName] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const listRef = useRef();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const initialProviderId =
    new URLSearchParams(location.search).get("providerId") || "";
  const [providerId, setProviderId] = useState(initialProviderId);

  // --- Дебаунсим фильтры ---
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const debouncedMinPrice = useDebounce(minPrice, 400);
  const debouncedMaxPrice = useDebounce(maxPrice, 400);
  const debouncedLocationFilter = useDebounce(locationFilter, 400);
  const debouncedSelectedCategory = useDebounce(selectedCategory, 400);

  // --- Загрузка данных ---
  // Категории и счётчики
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await OfferService.fetchCategories();
        setCategories(cats || []);
        const countsResp = await OfferService.fetchCategoryCounts();
        setCounts(countsResp || {});
      } catch (error) {
        setCategories([]);
        setCounts({});
      }
    };
    fetchCategories();
  }, []);

  // Локации
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locs = await searchService.getLocations();
        setLocations(locs.map((l) => ({ label: l, region: "" })));
      } catch (error) {
        setLocations([]);
      }
    };
    fetchLocations();
  }, []);

  // Популярные поиски
  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const searches = await searchService.getPopularSearches(5);
        setPopularSearches(
          searches.map((s) => ({
            label: s.query,
            value: s.query,
            category: s.category,
          }))
        );
      } catch (error) {
        setPopularSearches([]);
      }
    };
    fetchPopular();
  }, []);

  // Избранное
  const getFavorites = useCallback(async () => {
    setFavoritesLoading(true);
    try {
      if (!isAuthenticated) {
        setFavorites({});
        setFavoritesLoading(false);
        return;
      }
      const favoritesData = await OfferService.fetchFavorites();
      setFavorites(favoritesData || {});
    } catch (error) {
      setFavorites({});
    } finally {
      setFavoritesLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    getFavorites();
  }, [getFavorites]);

  // --- Загрузка офферов ---
  useEffect(() => {
    let cancelled = false;
    const fetchOffers = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const providerIdFromQuery =
          new URLSearchParams(location.search).get("providerId") || undefined;
        const params = cleanParams({
          page,
          limit: WINDOW_SIZE,
          minPrice: debouncedMinPrice || undefined,
          maxPrice: debouncedMaxPrice || undefined,
          location:
            typeof debouncedLocationFilter === "object" &&
            debouncedLocationFilter !== null
              ? debouncedLocationFilter.label
              : debouncedLocationFilter || undefined,
          category: debouncedSelectedCategory || undefined,
          providerId: providerIdFromQuery,
        });

        let response;
        if (debouncedSearchQuery?.trim()) {
          response = await searchService.searchOffers(
            debouncedSearchQuery,
            params
          );
        } else {
          response = await OfferService.getAll(params);
        }
        if (cancelled) return;
        setOffers((prev) =>
          page === 1
            ? response.offers || []
            : [...prev, ...(response.offers || [])]
        );
        setTotalPages(response.pages || 1);
        setHasMore(page < (response.pages || 1));
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
    debouncedSearchQuery,
    debouncedMinPrice,
    debouncedMaxPrice,
    debouncedLocationFilter,
    debouncedSelectedCategory,
    location.search, // теперь зависим от location.search
  ]);

  // --- Фильтры и обработчики ---
  const handleCategoryClick = useCallback(
    (categoryId) => {
      const newCategory = categoryId === selectedCategory ? null : categoryId;
      setSelectedCategory(newCategory);
      setPage(1);
      setOffers([]);
    },
    [selectedCategory]
  );

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const handleSearchQueryChange = useCallback((value) => {
    setSearchQuery(value);
    setPage(1);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMore) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, loadingMore]);

  const toggleFavorite = useCallback(
    async (offerId, offerType = "offer") => {
      if (!isAuthenticated) {
        toast.error(t("offer.loginRequired"));
        return;
      }
      try {
        const serverOfferType =
          offerType === "service_offer" ? "ServiceOffer" : "Offer";
        const wasInFavorites = Boolean(favorites[offerId]);
        setFavorites((prev) => ({ ...prev, [offerId]: !prev[offerId] }));
        const result = await OfferService.toggleFavorite(
          offerId,
          serverOfferType
        );
        setFavorites((prev) => ({ ...prev, [offerId]: result.isFavorite }));
        if (result.isFavorite) {
          toast.success(t("added_to_favorites"));
        } else {
          toast.success(t("removed_from_favorites"));
        }
        if (!result.success && result.error) {
          setFavorites((prev) => ({ ...prev, [offerId]: wasInFavorites }));
          toast.error(t("errors.toggle_favorite"));
        }
      } catch (error) {
        toast.error(t("errors.toggle_favorite"));
      }
    },
    [isAuthenticated, favorites, t]
  );

  const clearProviderFilter = useCallback(() => {
    setProviderId("");
    setProviderName("");
    const params = new URLSearchParams(location.search);
    params.delete("providerId");
    navigate({ search: params.toString() });
  }, [location.search, navigate]);

  // --- Мемоизированные значения ---
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

  // --- Синхронизация selectedCategory с query-параметром ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryFromQuery = params.get("category");
    if (categoryFromQuery && categoryFromQuery !== selectedCategory) {
      setSelectedCategory(categoryFromQuery);
      setPage(1);
      setOffers([]);
    }
    if (!categoryFromQuery && selectedCategory) {
      setSelectedCategory(null);
      setPage(1);
      setOffers([]);
    }
  }, [location.search]);

  // --- Синхронизация providerId с query-параметром ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const providerIdFromQuery = params.get("providerId");
    if (providerIdFromQuery && providerIdFromQuery !== providerId) {
      setProviderId(providerIdFromQuery);
      setPage(1);
      setOffers([]);
    }
    if (!providerIdFromQuery && providerId) {
      setProviderId("");
      setPage(1);
      setOffers([]);
    }
  }, [location.search]);

  // Подгрузка имени провайдера по providerId
  useEffect(() => {
    let cancelled = false;
    async function fetchProviderName() {
      if (providerId) {
        try {
          const provider = await OfferService.getProviderInfo(providerId);
          if (!cancelled) setProviderName(provider?.name || "");
        } catch {
          if (!cancelled) setProviderName("");
        }
      } else {
        setProviderName("");
      }
    }
    fetchProviderName();
    return () => {
      cancelled = true;
    };
  }, [providerId]);

  return {
    offers,
    filteredOffers,
    categories,
    selectedCategory,
    counts,
    favorites,
    favoritesLoading,
    searchQuery,
    minPrice,
    maxPrice,
    locationFilter,
    providerId,
    providerName,
    page,
    loading,
    loadingMore,
    hasMore,
    listRef,
    isMobile,
    filtersOpen,
    locations,
    popularSearches,
    setSearchQuery,
    handleSearchQueryChange,
    setMinPrice,
    setMaxPrice,
    setLocationFilter,
    setFiltersOpen,
    handleCategoryClick,
    handleSearch,
    handleLoadMore,
    toggleFavorite,
    clearProviderFilter,
  };
};

export default useOffersState;
