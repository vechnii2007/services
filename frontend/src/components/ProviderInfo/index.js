import React, { memo } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import {
  Avatar,
  Box,
  Typography,
  Rating,
  Tooltip,
  Stack,
  Badge,
  Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import VerifiedIcon from "@mui/icons-material/Verified";
import StarIcon from "@mui/icons-material/Star";

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  marginRight: theme.spacing(1),
  border: `2px solid ${theme.palette.primary.main}`,
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "scale(1.1)",
    boxShadow: theme.shadows[4],
  },
}));

const OnlineBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
}));

const RatingWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  "& .MuiRating-root": {
    color: theme.palette.warning.main,
  },
}));

const ProviderInfo = memo(
  ({ provider, rating, reviewCount, variant = "full" }) => {
    if (!provider) return null;

    const {
      name,
      avatar,
      isOnline,
      badges = [],
      isVerified,
      providerInfo = {},
    } = provider;

    const displayRating =
      typeof rating === "number"
        ? rating
        : providerInfo?.rating !== undefined
        ? providerInfo.rating
        : provider.rating !== undefined
        ? provider.rating
        : 0;

    const displayReviewCount =
      typeof reviewCount === "number"
        ? reviewCount
        : providerInfo?.reviewCount !== undefined
        ? providerInfo.reviewCount
        : provider.reviewCount !== undefined
        ? provider.reviewCount
        : 0;

    const ratingColor =
      displayRating >= 4.5
        ? "success.main"
        : displayRating >= 3.5
        ? "warning.main"
        : "error.main";

    return (
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        sx={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <OnlineBadge
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          variant="dot"
          invisible={!isOnline}
        >
          <StyledAvatar
            src={avatar}
            alt={name}
            component={motion.div}
            whileHover={{ scale: 1.1 }}
          />
        </OnlineBadge>

        <Stack spacing={0.5}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant={variant === "full" ? "subtitle1" : "subtitle2"}
              component="span"
              sx={{
                fontWeight: "medium",
                color: "text.primary",
              }}
            >
              {name}
            </Typography>
            {isVerified && (
              <Tooltip title="Проверенный поставщик">
                <VerifiedIcon color="primary" fontSize="small" />
              </Tooltip>
            )}
          </Box>

          {variant === "full" ? (
            <>
              <RatingWrapper>
                <Tooltip title={`Рейтинг: ${displayRating} из 5`}>
                  <Rating
                    value={displayRating}
                    readOnly
                    size="small"
                    precision={0.5}
                    sx={{ mr: 1 }}
                  />
                </Tooltip>
                <Typography
                  variant="caption"
                  sx={{ color: ratingColor }}
                  component={motion.span}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {displayRating !== undefined && displayRating !== null
                    ? displayRating.toFixed(1)
                    : "0.0"}{" "}
                  ({displayReviewCount} отзывов)
                </Typography>
              </RatingWrapper>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                {badges.map((badge, index) => (
                  <Chip
                    key={index}
                    label={badge}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20 }}
                  />
                ))}
              </Stack>
            </>
          ) : (
            <Typography
              variant="caption"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: ratingColor,
              }}
            >
              <StarIcon fontSize="inherit" />
              {displayRating !== undefined && displayRating !== null
                ? displayRating.toFixed(1)
                : "0.0"}
            </Typography>
          )}
        </Stack>
      </Box>
    );
  }
);

ProviderInfo.propTypes = {
  provider: PropTypes.shape({
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    rating: PropTypes.number,
    reviewCount: PropTypes.number,
    isOnline: PropTypes.bool,
    isVerified: PropTypes.bool,
    badges: PropTypes.arrayOf(PropTypes.string),
  }),
  variant: PropTypes.oneOf(["full", "compact"]),
};

ProviderInfo.defaultProps = {
  provider: null,
  variant: "full",
};

export default ProviderInfo;
