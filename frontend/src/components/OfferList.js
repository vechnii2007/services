import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { Box, Typography, CircularProgress, Button } from "@mui/material";
import OfferCard from "./OfferCard";
import OfferCardSkeleton from "./OfferCardSkeleton";
import styled from "@emotion/styled";
import { useTranslation } from "react-i18next";
import { PAGINATION } from "../config";

const WINDOW_SIZE = PAGINATION.OFFERS_PER_PAGE;

const OfferListContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  width: "100%",
  marginLeft: "auto",
  marginRight: "auto",
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "200px",
}));

const EmptyStateContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "200px",
}));

const ListInner = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: theme.spacing(2),
  width: "100%",
}));

const OfferList = ({
  offers,
  favorites,
  loading,
  toggleFavorite,
  searchQuery,
  hasMore,
  loadingMore,
  onLoadMore,
}) => {
  const { t } = useTranslation();
  const [windowEnd, setWindowEnd] = useState(WINDOW_SIZE);

  useEffect(() => {
    setWindowEnd(WINDOW_SIZE);
  }, [offers]);

  const handleLoadMore = useCallback(() => {
    if (onLoadMore) {
      setWindowEnd((prev) => prev + WINDOW_SIZE);
      onLoadMore();
    }
  }, [onLoadMore]);

  if (loading && offers.length === 0) {
    return (
      <OfferListContainer>
        <LoadingContainer>
          <CircularProgress />
        </LoadingContainer>
      </OfferListContainer>
    );
  }

  if (offers.length === 0) {
    return (
      <OfferListContainer>
        <EmptyStateContainer>
          <Typography variant="h6" color="textSecondary">
            {searchQuery ? t("no_results_found") : t("no_offers_available")}
          </Typography>
        </EmptyStateContainer>
      </OfferListContainer>
    );
  }

  // Генерируем массив для отображения: только карточки, скелетоны только при loadingMore
  const items = offers.map((offer) => (
    <Box key={offer._id} sx={{ minWidth: 320, maxWidth: 360 }}>
      <OfferCard
        offer={offer}
        isFavorite={favorites[offer._id]}
        onFavoriteClick={() => toggleFavorite(offer._id, offer.type)}
      />
    </Box>
  ));

  // Добавляем скелетоны только если loadingMore
  if (loadingMore) {
    const skeletonCount = WINDOW_SIZE;
    for (let i = 0; i < skeletonCount; i++) {
      items.push(
        <Box key={`skeleton-${i}`} sx={{ minWidth: 320, maxWidth: 360 }}>
          <OfferCardSkeleton />
        </Box>
      );
    }
  }

  return (
    <OfferListContainer>
      <ListInner>{items}</ListInner>
      {!loadingMore && hasMore && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Button variant="contained" color="primary" onClick={handleLoadMore}>
            {t("load_more")}
          </Button>
        </Box>
      )}
      {!hasMore && !loadingMore && (
        <EmptyStateContainer>
          <Typography variant="body2" color="textSecondary">
            {t("no_more_offers")}
          </Typography>
        </EmptyStateContainer>
      )}
    </OfferListContainer>
  );
};

OfferList.propTypes = {
  offers: PropTypes.array.isRequired,
  favorites: PropTypes.object,
  loading: PropTypes.bool,
  toggleFavorite: PropTypes.func,
  searchQuery: PropTypes.string,
  hasMore: PropTypes.bool,
  loadingMore: PropTypes.bool,
  onLoadMore: PropTypes.func,
};

OfferList.defaultProps = {
  offers: [],
  favorites: {},
  loading: false,
  hasMore: true,
  loadingMore: false,
  toggleFavorite: () => {},
  onLoadMore: null,
};

export default OfferList;
