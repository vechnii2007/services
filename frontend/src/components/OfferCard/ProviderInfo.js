import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, Avatar } from "@mui/material";
import { motion } from "framer-motion";

const ProviderInfo = ({ provider }) => {
  if (!provider || !provider.name) return null;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        mb: 2,
      }}
    >
      <Avatar
        src={provider.avatar}
        alt={provider.name}
        sx={{
          width: 32,
          height: 32,
          border: "2px solid",
          borderColor: "primary.main",
        }}
      />
      <Box>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: "text.primary",
            lineHeight: 1.2,
          }}
        >
          {provider.name}
        </Typography>
        {provider.rating && (
          <Typography
            variant="caption"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              color: "text.secondary",
            }}
          >
            ⭐ {provider.rating.toFixed(1)}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

ProviderInfo.propTypes = {
  provider: PropTypes.shape({
    name: PropTypes.string,
    avatar: PropTypes.string,
    rating: PropTypes.number,
  }),
};

export default ProviderInfo;
