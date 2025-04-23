import React from "react";
import { Card, CardContent, Box, Skeleton } from "@mui/material";
import { motion } from "framer-motion";

const MotionCard = motion(Card);

const OfferCardSkeleton = () => (
  <MotionCard
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    sx={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      width: "100%",
      maxWidth: "275px",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      backgroundColor: "background.paper",
    }}
  >
    <Skeleton
      variant="rectangular"
      height={200}
      sx={{
        borderTopLeftRadius: "12px",
        borderTopRightRadius: "12px",
      }}
    />
    <CardContent sx={{ p: 2, flexGrow: 1 }}>
      <Box sx={{ position: "relative", pr: 4 }}>
        <Skeleton variant="text" width="80%" height={24} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
        <Skeleton
          variant="rectangular"
          width="40%"
          height={32}
          sx={{ mb: 1 }}
        />
        <Skeleton variant="text" width="70%" height={20} />
        <Skeleton variant="text" width="30%" height={16} sx={{ mt: 0.5 }} />
      </Box>
      <Box sx={{ mt: 2 }}>
        <Skeleton
          variant="rectangular"
          height={36}
          sx={{ borderRadius: "8px" }}
        />
      </Box>
    </CardContent>
  </MotionCard>
);

export default OfferCardSkeleton;
