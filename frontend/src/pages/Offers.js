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
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [totalResults, setTotalResults] = useState(0);
  const isFetchingRef = useRef(false);

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
        providerId: providerId || undefined,
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
    providerId,
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

  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        fetchData();
      },
      page !== 1 ? 0 : 300
    );

    return () => clearTimeout(timeoutId);
  }, [fetchData, page, searchQuery, minPrice, maxPrice, locationFilter]);

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
