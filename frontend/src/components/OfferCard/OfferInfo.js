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
  gap: theme.spacing(1),
}));

const PriceTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: theme.typography.fontWeightBold,
  fontSize: theme.typography.h6.fontSize,
  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  display: "inline-block",
}));

const MetaInfo = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  color: theme.palette.text.secondary,
  "& .MuiSvgIcon-root": {
    fontSize: "1rem",
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
        <Stack spacing={1}>
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
                lineHeight: 1.2,
                cursor: "default",
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
                minHeight: "2.4em",
                lineHeight: 1.2,
                cursor: "default",
              })}
            >
              {description}
            </Typography>
          </Tooltip>
        </Stack>

        <PriceTypography>{priceDisplay}</PriceTypography>

        <Stack spacing={0.5} sx={{ mt: "auto" }}>
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
