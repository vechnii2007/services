import React, { useEffect, useState } from "react";
import { Grid, Box, Pagination, Typography } from "@mui/material";
import PropTypes from "prop-types";
import OfferCard from "./OfferCard/index";
import styled from "@emotion/styled";
import { useTranslation } from "react-i18next";
import { CircularProgress } from "@mui/material";

const OfferListContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  "& .MuiGrid-container": {
    width: "100%",
    margin: 0,
  },
  "& .MuiGrid-item": {
    display: "flex",
    justifyContent: "center",
    [theme.breakpoints.up("sm")]: {
      maxWidth: "50%",
      flexBasis: "50%",
    },
    [theme.breakpoints.up("md")]: {
      maxWidth: "33.333%",
      flexBasis: "33.333%",
    },
    [theme.breakpoints.up("lg")]: {
      maxWidth: "25%",
      flexBasis: "25%",
    },
  },
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

const PaginationContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const OfferList = ({
  offers,
  favorites,
  page,
  totalPages,
  onPageChange,
  loading,
  toggleFavorite,
  searchQuery,
}) => {
  const { t } = useTranslation();
  const [safeOffers, setSafeOffers] = useState([]);

  useEffect(() => {
    setSafeOffers(offers.filter((offer) => offer && offer._id));
  }, [offers]);

  if (loading) {
    return (
      <OfferListContainer>
        <LoadingContainer>
          <CircularProgress />
        </LoadingContainer>
      </OfferListContainer>
    );
  }

  if (safeOffers.length === 0) {
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

  return (
    <OfferListContainer>
      <Grid container spacing={3}>
        {safeOffers.map((offer) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            key={offer._id}
            sx={{ width: { xs: "100%", md: "auto" } }}
          >
            <OfferCard
              offer={offer}
              isFavorite={favorites[offer._id]}
              onFavoriteClick={() => toggleFavorite(offer._id, offer.type)}
            />
          </Grid>
        ))}
      </Grid>
      {totalPages > 1 && (
        <PaginationContainer>
          <Pagination
            count={totalPages}
            page={page}
            onChange={onPageChange}
            color="primary"
            size="large"
          />
        </PaginationContainer>
      )}
    </OfferListContainer>
  );
};

OfferList.propTypes = {
  offers: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      price: PropTypes.number,
      image: PropTypes.string,
      location: PropTypes.string,
      createdAt: PropTypes.string,
      type: PropTypes.string,
    })
  ),
  favorites: PropTypes.object,
  page: PropTypes.number,
  totalPages: PropTypes.number,
  onPageChange: PropTypes.func,
  loading: PropTypes.bool,
  toggleFavorite: PropTypes.func,
  searchQuery: PropTypes.string,
};

OfferList.defaultProps = {
  offers: [],
  favorites: {},
  page: 1,
  totalPages: 1,
  loading: false,
  onPageChange: () => {},
  toggleFavorite: () => {},
};

export default OfferList;
