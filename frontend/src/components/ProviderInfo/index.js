import React, { memo } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { Avatar, Box, Typography, Rating, Tooltip, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  marginRight: theme.spacing(1),
  border: `2px solid ${theme.palette.primary.main}`,
  transition: "transform 0.2s",
  "&:hover": {
    transform: "scale(1.1)",
  },
}));

const ProviderInfo = memo(({ provider }) => {
  if (!provider) return null;

  const { name, avatar, rating, reviewCount } = provider;

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
      <StyledAvatar
        src={avatar}
        alt={name}
        component={motion.div}
        whileHover={{ scale: 1.1 }}
      />
      <Stack spacing={0.5}>
        <Typography
          variant="subtitle1"
          component="span"
          sx={{
            fontWeight: "medium",
            color: "text.primary",
          }}
        >
          {name}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tooltip title={`Рейтинг: ${rating} из 5`}>
            <Rating
              value={rating}
              readOnly
              size="small"
              precision={0.5}
              sx={{ mr: 1 }}
            />
          </Tooltip>
          <Typography
            variant="caption"
            color="text.secondary"
            component={motion.span}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            ({reviewCount} отзывов)
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
});

ProviderInfo.propTypes = {
  provider: PropTypes.shape({
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    rating: PropTypes.number,
    reviewCount: PropTypes.number,
  }),
};

ProviderInfo.defaultProps = {
  provider: null,
};

export default ProviderInfo;
