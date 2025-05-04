import {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  useContext,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { useTheme, useMediaQuery } from "@mui/material";
import { AuthContext } from "../context/AuthContext";
import OfferService from "../services/OfferService";
import { searchService } from "../services/searchService";
import { PAGINATION } from "../config";
import { filterOffers } from "../utils/filterOffers";

// Глобальная переменная для отслеживания, была ли выполнена начальная загрузка данных
window.__initialOffersDataLoaded = window.__initialOffersDataLoaded || false;

// Функция для чтения данных из sessionStorage
const getFromSessionStorage = (key, defaultValue) => {
  try {
    const storedData = sessionStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : defaultValue;
  } catch (error) {
    console.error(
      `[useOffersState] Error reading ${key} from sessionStorage:`,
      error
    );
    return defaultValue;
  }
};

// Функция для сохранения данных в sessionStorage
const saveToSessionStorage = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(
      `[useOffersState] Error saving ${key} to sessionStorage:`,
      error
    );
  }
};

// Кэш для хранения загруженных данных глобально
if (!window.__offersCache) {
  window.__offersCache = {
    offers: getFromSessionStorage("offersCache.offers", {}),
    categories: getFromSessionStorage("offersCache.categories", []),
    locations: getFromSessionStorage("offersCache.locations", []),
    popularSearches: getFromSessionStorage("offersCache.popularSearches", []),
    counts: getFromSessionStorage("offersCache.counts", {}),
    initialized: getFromSessionStorage("offersCache.initialized", false),
  };
}

// Функция дебаунса для предотвращения слишком частого вызова функций
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const useOffersState = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Референсы для отслеживания запросов в процессе выполнения
  const isFetchingRef = useRef(false);
  const isLoadingLocationsRef = useRef(false);
  const isLoadingPopularSearchesRef = useRef(false);
  const isInitializedRef = useRef(window.__offersCache.initialized);
  const didEffectMountRef = useRef(false); // Для отслеживания первого запуска эффекта

  // Основные состояния с начальными значениями из кэша
  const [offers, setOffers] = useState([]);
  const [offersCache, setOffersCache] = useState(
    window.__offersCache.offers || {}
  );
  const [categories, setCategories] = useState(
    window.__offersCache.categories || []
  );
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [counts, setCounts] = useState(window.__offersCache.counts || {});
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
  const listRef = useRef();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [locations, setLocations] = useState(
    window.__offersCache.locations || []
  );
  const [popularSearches, setPopularSearches] = useState(
    window.__offersCache.popularSearches || []
  );

  // Эффект для обработки провайдера из URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const providerIdFromUrl = queryParams.get("providerId");

    if (providerIdFromUrl) {
      setProviderId(providerIdFromUrl);
      // Избегаем запрос, если он уже выполняется
      const fetchProviderInfo = async () => {
        try {
          const response = await OfferService.getProviderInfo(
            providerIdFromUrl
          );
          if (response && response.name) {
            setProviderName(response.name);
          }
        } catch (error) {
          console.error(
            "[useOffersState] Error fetching provider info:",
            error
          );
        }
      };

      fetchProviderInfo();
    }
  }, [location.search]);

  // Обработчики для обновления фильтров - мемоизируем для предотвращения ререндеров
  const handleCategoryClick = useCallback(
    (category) => {
      const newCategory =
        category.name === selectedCategory ? null : category.name;
      setSelectedCategory(newCategory);
      setPage(1);
      setOffers([]);
      setOffersCache((prev) => prev); // Используем функциональное обновление для избежания ошибок
    },
    [selectedCategory]
  );

  // Дебаунс для поискового запроса
  const debouncedSearch = useCallback(
    debounce(() => {
      setPage(1);
      console.log("[useOffersState] Debounced search triggered");
    }, 300),
    []
  );

  // Обновляем обработчик поиска с дебаунсом
  const handleSearch = useCallback(() => {
    debouncedSearch();
  }, [debouncedSearch]);

  // Обработчик изменения поискового запроса с дебаунсом
  const handleSearchQueryChange = useCallback(
    (value) => {
      setSearchQuery(value);
      debouncedSearch();
    },
    [debouncedSearch]
  );

  const handlePageChange = useCallback((event, value) => {
    setPage(value);
  }, []);

  // Эффект для сброса данных при изменении фильтров - используем функцию для предотвращения ререндеров
  useEffect(() => {
    if (!didEffectMountRef.current) {
      didEffectMountRef.current = true;
      return;
    }

    setPage(1);
    setHasMore(true);
    setLoadingMore(false);
    setOffers([]);
  }, [
    searchQuery,
    minPrice,
    maxPrice,
    locationFilter,
    selectedCategory,
    providerId,
  ]);

  // Загрузка данных офферов с защитой от race conditions
  useEffect(() => {
    let cancelled = false;
    const requestId = uuidv4();
    window.__lastOffersRequestId = requestId;

    const fetchOffers = async () => {
      if (cancelled || isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;

      // Проверяем кэш перед запросом
      if (window.__offersCache.offers && window.__offersCache.offers[page]) {
        setOffers((prev) => {
          const newOffers =
            page === 1
              ? window.__offersCache.offers[page]
              : [...prev, ...window.__offersCache.offers[page]];
          return newOffers;
        });
        setLoading(false);
        setLoadingMore(false);
        setHasMore(page < totalPages);
        isFetchingRef.current = false;
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

        if (window.__lastOffersRequestId !== requestId || cancelled) {
          isFetchingRef.current = false;
          return;
        }

        // Обновляем глобальный кэш
        window.__offersCache.offers = {
          ...window.__offersCache.offers,
          [page]: response.offers || [],
        };

        // Обновляем локальный стейт
        setOffers((prev) => {
          const newOffers =
            page === 1
              ? response.offers || []
              : [...prev, ...(response.offers || [])];
          return newOffers;
        });

        setTotalPages(response.pages || 1);
        setHasMore(page < (response.pages || 1));
      } catch (error) {
        if (!cancelled) setHasMore(false);
        console.error("[useOffersState] Ошибка при загрузке офферов:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
        isFetchingRef.current = false;
      }
    };

    fetchOffers();

    return () => {
      cancelled = true;
      isFetchingRef.current = false;
    };
  }, [
    page,
    searchQuery,
    minPrice,
    maxPrice,
    locationFilter,
    selectedCategory,
    providerId,
    totalPages,
  ]);

  // Загрузка начальных данных (категории, локации, популярные поиски) с улучшенным кэшированием
  useEffect(() => {
    let isMounted = true;

    // Если данные уже инициализированы, используем кэш
    if (isInitializedRef.current) {
      console.log("[useOffersState] Using cached initial data");
      return;
    }

    const loadInitialData = async () => {
      if (window.__initialOffersDataLoaded || !isMounted) {
        console.log(
          "[useOffersState] Skipping initial data load - already loaded or unmounted"
        );
        return;
      }

      const loadStart = Date.now();

      try {
        // Загружаем категории и счетчики только если они не в кэше
        let categoriesResponse = window.__offersCache.categories;
        let countsResponse = window.__offersCache.counts;

        if (!categoriesResponse || categoriesResponse.length === 0) {
          categoriesResponse = await getFetchCategories();
          window.__offersCache.categories = categoriesResponse || [];
        }

        if (!countsResponse || Object.keys(countsResponse).length === 0) {
          countsResponse = await getFetchCategoryCounts();
          window.__offersCache.counts = countsResponse || {};
        }

        if (!isMounted) return;

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
            if (!isMounted) return;
            window.promotedOffersLoaded = true;
            window.promotedOffersData = promotedOffersResponse.offers || [];
          } catch (error) {
            console.error(
              "[useOffersState] Error loading promoted offers:",
              error
            );
          }
        } else {
          console.log(
            "[useOffersState] Skipping promoted offers load - already loaded"
          );
        }

        // Загружаем избранные, если пользователь авторизован
        await getFavorites();
        if (!isMounted) return;

        // Загружаем локации и популярные поиски только если они не в кэше
        if (
          !window.__offersCache.locations ||
          window.__offersCache.locations.length === 0
        ) {
          await loadLocations();
        } else {
          setLocations(window.__offersCache.locations);
        }

        if (
          !window.__offersCache.popularSearches ||
          window.__offersCache.popularSearches.length === 0
        ) {
          await loadPopularSearches();
        } else {
          setPopularSearches(window.__offersCache.popularSearches);
        }

        if (!isMounted) return;

        // Отмечаем, что начальная загрузка данных выполнена
        window.__initialOffersDataLoaded = true;
        window.__offersCache.initialized = true;
        isInitializedRef.current = true;

        const loadTime = Date.now() - loadStart;
        console.log(
          `[useOffersState] Initial data load completed in ${loadTime}ms`
        );
      } catch (error) {
        console.error("[useOffersState] Error loading initial data:", error);
        if (isMounted) {
          toast.error(t("errors.loadingFailed"));
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [t]);

  // Вспомогательные функции для загрузки данных
  const getFetchCategories = async () => {
    try {
      if (typeof OfferService.fetchCategories === "function") {
        return await OfferService.fetchCategories();
      } else {
        console.warn("[useOffersState] Using fallback for categories");
        return [];
      }
    } catch (error) {
      console.error("[useOffersState] Error fetching categories:", error);
      return [];
    }
  };

  const getFetchCategoryCounts = async () => {
    try {
      if (typeof OfferService.fetchCategoryCounts === "function") {
        return await OfferService.fetchCategoryCounts();
      } else {
        console.warn("[useOffersState] Using fallback for category counts");
        return {};
      }
    } catch (error) {
      console.error("[useOffersState] Error fetching category counts:", error);
      return {};
    }
  };

  const getPromotedOffers = async () => {
    try {
      if (typeof OfferService.getPromotedOffers === "function") {
        const response = await OfferService.getPromotedOffers();
        return response;
      } else {
        console.warn("[useOffersState] getPromotedOffers is not a function");
        return { offers: [], total: 0, hasMore: false };
      }
    } catch (error) {
      console.error("[useOffersState] Error fetching promoted offers:", error);
      return { offers: [], total: 0, hasMore: false };
    }
  };

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
      console.error("[useOffersState] Error fetching favorites:", error);
    }
  };

  const loadLocations = async () => {
    if (isLoadingLocationsRef.current) {
      return;
    }
    isLoadingLocationsRef.current = true;
    try {
      const locationsList = await searchService.getLocations();
      const locationsWithLabels = locationsList.map((location) => ({
        label: location,
        region: "",
      }));

      setLocations(locationsWithLabels);
      window.__offersCache.locations = locationsWithLabels;
    } catch (error) {
      console.error("[useOffersState] Error loading locations:", error);
    } finally {
      isLoadingLocationsRef.current = false;
    }
  };

  const loadPopularSearches = async () => {
    if (isLoadingPopularSearchesRef.current) {
      return;
    }
    isLoadingPopularSearchesRef.current = true;
    try {
      const searches = await searchService.getPopularSearches(5);
      const formattedSearches = searches.map((search) => ({
        label: search.query,
        value: search.query,
        category: search.category,
      }));

      setPopularSearches(formattedSearches);
      window.__offersCache.popularSearches = formattedSearches;
    } catch (error) {
      console.error("[useOffersState] Error loading popular searches:", error);
    } finally {
      isLoadingPopularSearchesRef.current = false;
    }
  };

  // Обработка избранного - мемоизируем для предотвращения ререндеров
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

        setFavorites((prev) => {
          const newFavorites = {
            ...prev,
            [offerId]: !prev[offerId],
          };
          return newFavorites;
        });

        const result = await OfferService.toggleFavorite(
          offerId,
          serverOfferType
        );

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
        console.error("[useOffersState] Error in toggleFavorite:", error);
        toast.error(t("errors.toggle_favorite"));
      }
    },
    [isAuthenticated, favorites, t]
  );

  // Дополнительные обработчики - мемоизируем
  const clearProviderFilter = useCallback(() => {
    setProviderId("");
    setProviderName("");
    const params = new URLSearchParams(location.search);
    params.delete("providerId");
    navigate({ search: params.toString() });
  }, [location.search, navigate]);

  // Функция для кнопки "Загрузить ещё"
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMore) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, loadingMore]);

  // Эффект для прокрутки при загрузке новых данных
  useEffect(() => {
    if (page > 1 && listRef.current) {
      listRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [offers, page]);

  // useEffect для немедленного fetch при изменении selectedCategory
  useEffect(() => {
    if (selectedCategory !== null && didEffectMountRef.current) {
      setPage(1);
      setOffers([]);
    }
  }, [selectedCategory]);

  // Фильтрация и сортировка офферов - мемоизируем для предотвращения лишних вычислений
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

  // Сохраняем данные в sessionStorage при их изменении
  useEffect(() => {
    if (window.__offersCache.categories.length > 0) {
      saveToSessionStorage(
        "offersCache.categories",
        window.__offersCache.categories
      );
    }
  }, [categories]);

  useEffect(() => {
    if (Object.keys(window.__offersCache.counts).length > 0) {
      saveToSessionStorage("offersCache.counts", window.__offersCache.counts);
    }
  }, [counts]);

  useEffect(() => {
    if (window.__offersCache.locations.length > 0) {
      saveToSessionStorage(
        "offersCache.locations",
        window.__offersCache.locations
      );
    }
  }, [locations]);

  useEffect(() => {
    if (window.__offersCache.popularSearches.length > 0) {
      saveToSessionStorage(
        "offersCache.popularSearches",
        window.__offersCache.popularSearches
      );
    }
  }, [popularSearches]);

  useEffect(() => {
    if (window.__offersCache.initialized) {
      saveToSessionStorage("offersCache.initialized", true);
    }
  }, [isInitializedRef.current]);

  return {
    // Состояние
    offers,
    filteredOffers,
    categories,
    selectedCategory,
    counts,
    favorites,
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

    // Методы
    setSearchQuery,
    handleSearchQueryChange,
    setMinPrice,
    setMaxPrice,
    setLocationFilter,
    setFiltersOpen,
    handleCategoryClick,
    handleSearch,
    handlePageChange,
    toggleFavorite,
    clearProviderFilter,
    handleLoadMore,
  };
};

export default useOffersState;
