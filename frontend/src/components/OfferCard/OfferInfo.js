import React, { memo } from "react";
import { Typography, Box, Tooltip, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import { formatDate, formatPrice } from "../../utils/formatters";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PropTypes from "prop-types";

const InfoContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.7),
}));

const PriceTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: theme.typography.fontWeightBold,
  fontSize: "1.15rem",
  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  display: "inline-block",
  letterSpacing: "-0.5px",
  marginTop: theme.spacing(0.2),
  marginBottom: theme.spacing(0.2),
}));

const MetaInfo = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.2),
  color: theme.palette.text.secondary,
  "& .MuiSvgIcon-root": {
    fontSize: "0.95rem",
  },
}));

const OfferInfo = memo(
  ({
    title,
    description,
    price,
    priceFrom,
    priceTo,
    isPriceRange,
    location,
    createdAt,
  }) => {
    // Формируем отображение цены в зависимости от типа (диапазон или фиксированная)
    const priceDisplay =
      isPriceRange && priceFrom && priceTo
        ? `${formatPrice(priceFrom)} - ${formatPrice(priceTo)}`
        : formatPrice(price);

    return (
      <InfoContainer>
        <Stack spacing={0.5}>
          <Tooltip title={title} enterDelay={700}>
            <Typography
              variant="subtitle1"
              sx={(theme) => ({
                fontWeight: theme.typography.fontWeightBold,
                color: theme.palette.text.primary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                lineHeight: 1.1,
                cursor: "default",
                fontSize: "1.02rem",
                letterSpacing: "-0.5px",
              })}
            >
              {title}
            </Typography>
          </Tooltip>

          <Tooltip title={description} enterDelay={700}>
            <Typography
              variant="body2"
              sx={(theme) => ({
                color: theme.palette.text.secondary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                minHeight: "1.8em",
                lineHeight: 1.1,
                cursor: "default",
                fontSize: "0.93rem",
              })}
            >
              {description}
            </Typography>
          </Tooltip>
        </Stack>

        <PriceTypography>{priceDisplay}</PriceTypography>

        <Stack spacing={0.2} sx={{ mt: "auto" }}>
          {location && (
            <Tooltip title={location} enterDelay={700}>
              <MetaInfo>
                <LocationOnIcon />
                <Typography
                  variant="body2"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    cursor: "default",
                    fontSize: "0.93rem",
                  }}
                >
                  {location}
                </Typography>
              </MetaInfo>
            </Tooltip>
          )}

          <MetaInfo>
            <AccessTimeIcon />
            <Typography
              variant="caption"
              sx={(theme) => ({
                color: theme.palette.text.secondary,
                fontSize: "0.85rem",
              })}
            >
              {formatDate(createdAt)}
            </Typography>
          </MetaInfo>
        </Stack>
      </InfoContainer>
    );
  }
);

OfferInfo.displayName = "OfferInfo";

OfferInfo.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  price: PropTypes.number,
  priceFrom: PropTypes.number,
  priceTo: PropTypes.number,
  isPriceRange: PropTypes.bool,
  location: PropTypes.string,
  createdAt: PropTypes.string.isRequired,
};

OfferInfo.defaultProps = {
  isPriceRange: false,
  price: 0,
};

export default OfferInfo;
