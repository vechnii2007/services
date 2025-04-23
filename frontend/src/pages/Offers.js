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
    const loadInitialData = async () => {
      try {
        const [categoriesResponse, countsResponse] = await Promise.all([
          OfferService.fetchCategories(),
          OfferService.fetchCategoryCounts(),
        ]);

        const transformedCounts = {};
        categoriesResponse?.forEach((category) => {
          transformedCounts[category.name] =
            countsResponse?.[category.name] || 0;
        });

        setCategories(categoriesResponse || []);
        setCounts(transformedCounts);

        if (isAuthenticated) {
          const favoritesData = await OfferService.fetchFavorites();
          setFavorites(favoritesData || {});
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
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

  const filteredOffers = useMemo(
    () => filterOffers(offers, { searchQuery }),
    [offers, searchQuery]
  );

  const toggleFavorite = useCallback(
    async (offerId, offerType = "offer") => {
      if (!isAuthenticated) {
        toast.error(t("offer.loginRequired"));
        return;
      }

      try {
        const serverOfferType =
          offerType === "service_offer" ? "ServiceOffer" : "Offer";
        const wasInFavorites = favorites[offerId];

        // Оптимистичное обновление
        setFavorites((prev) => ({
          ...prev,
          [offerId]: !prev[offerId],
        }));

        const result = await OfferService.toggleFavorite(
          offerId,
          serverOfferType
        );

        if (!result.success) {
          // Откат при ошибке
          setFavorites((prev) => ({
            ...prev,
            [offerId]: wasInFavorites,
          }));
          toast.error(t("errors.toggle_favorite"));
        }
      } catch (error) {
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
