import React, { useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { Typography, Box, Alert, Drawer, Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import OfferFilters from "../components/OfferFilters";
import CategorySlider from "../components/CategorySlider";
import OfferList from "../components/OfferList";
import PromotedOffersSlider from "../components/PromotedOffersSlider";
import FilterListIcon from "@mui/icons-material/FilterList";
import useOffersState from "../hooks/useOffersState";

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
  marginBottom: theme.spacing(2),
  position: "relative",
  padding: theme.spacing(2, 0),
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

const MemoizedCategorySlider = memo(CategorySlider);
const MemoizedOfferList = memo(OfferList);
const MemoizedPromotedOffersSlider = memo(PromotedOffersSlider);
const MemoizedOfferFilters = memo(OfferFilters);

const Offers = () => {
  const { t } = useTranslation();
  const {
    // Состояние
    categories,
    selectedCategory,
    counts,
    favorites,
    favoritesLoading,
    searchQuery,
    setSearchQuery,
    minPrice,
    maxPrice,
    locationFilter,
    providerId,
    providerName,
    loading,
    loadingMore,
    hasMore,
    listRef,
    isMobile,
    filtersOpen,
    locations,
    popularSearches,
    filteredOffers,

    // Методы
    handleSearchQueryChange,
    setMinPrice,
    setMaxPrice,
    setLocationFilter,
    setFiltersOpen,
    handleCategoryClick,
    handleSearch,
    toggleFavorite,
    clearProviderFilter,
    handleLoadMore,
  } = useOffersState();

  const handleClearProviderFilter = useMemo(() => {
    return (
      <Typography
        variant="button"
        color="inherit"
        sx={{ mr: 1, cursor: "pointer", textDecoration: "underline" }}
        onClick={clearProviderFilter}
      >
        {t("clear_filter")}
      </Typography>
    );
  }, [clearProviderFilter, t]);

  const filterProps = useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      minPrice,
      setMinPrice,
      maxPrice,
      setMaxPrice,
      locationFilter,
      setLocationFilter,
      categories,
      selectedCategories: selectedCategory ? [selectedCategory] : [],
      onCategoryChange: handleCategoryClick,
      onSearch: handleSearch,
      isSearching: loading,
      locations,
      popularSearches,
    }),
    [
      searchQuery,
      setSearchQuery,
      minPrice,
      maxPrice,
      locationFilter,
      categories,
      selectedCategory,
      loading,
      locations,
      popularSearches,
      handleCategoryClick,
      handleSearch,
      handleSearchQueryChange,
    ]
  );

  const offerListProps = useMemo(
    () => ({
      offers: filteredOffers,
      favorites,
      loading: loading && categories.length === 0,
      toggleFavorite,
      searchQuery,
      hasMore,
      loadingMore,
      onLoadMore: handleLoadMore,
    }),
    [
      filteredOffers,
      favorites,
      loading,
      categories.length,
      toggleFavorite,
      searchQuery,
      hasMore,
      loadingMore,
      handleLoadMore,
    ]
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

  if (favoritesLoading) {
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
              {handleClearProviderFilter}
            </Box>
          }
        >
          {t("showing_offers_from_provider", { providerName })}
        </Alert>
      )}

      {/* Фильтры и поиск */}
      {isMobile ? (
        <>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setFiltersOpen(true)}
            sx={{ mb: 2, width: "100%" }}
          >
            {t("filters")}
          </Button>
          <Drawer
            anchor="top"
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            PaperProps={{ sx: { borderRadius: "0 0 16px 16px", top: "56px" } }}
          >
            <Box sx={{ p: 2 }}>
              {filtersOpen && (
                <MemoizedOfferFilters
                  {...filterProps}
                  onSearch={() => {
                    setFiltersOpen(false);
                    handleSearch();
                  }}
                />
              )}
              <Button
                variant="contained"
                color="primary"
                onClick={() => setFiltersOpen(false)}
                sx={{ mt: 2, width: "100%" }}
              >
                {t("close")}
              </Button>
            </Box>
          </Drawer>
        </>
      ) : (
        <Box
          sx={{
            maxWidth: { xs: "calc(100vw - 32px)", sm: 500 },
            mx: "auto",
          }}
        >
          <MemoizedOfferFilters {...filterProps} />
        </Box>
      )}

      <CategoriesSection>
        <Typography
          variant="h6"
          sx={{
            mb: 1,
            fontWeight: "medium",
            color: "text.primary",
          }}
        >
          {t("categories")}
        </Typography>
        <MemoizedCategorySlider
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategoryClick}
          counts={counts}
        />
      </CategoriesSection>

      <MemoizedPromotedOffersSlider
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />

      <MemoizedOfferList ref={listRef} {...offerListProps} />
    </ContentContainer>
  );
};

export default memo(Offers);
