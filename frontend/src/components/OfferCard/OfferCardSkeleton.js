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
      borderRadius: "20px",
      boxShadow: "0 6px 24px rgba(80,80,120,0.10)",
      backgroundColor: "background.paper",
      p: 0.5,
    }}
  >
    <Skeleton
      variant="rectangular"
      height={220}
      sx={{
        borderTopLeftRadius: "20px",
        borderTopRightRadius: "20px",
      }}
    />
    <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
      <Box sx={{ position: "relative", pr: 4 }}>
        <Skeleton variant="text" width="80%" height={28} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="100%" height={22} />
        <Skeleton variant="text" width="60%" height={22} sx={{ mb: 1 }} />
        <Skeleton
          variant="rectangular"
          width="40%"
          height={36}
          sx={{ mb: 1, borderRadius: 2 }}
        />
        <Skeleton variant="text" width="70%" height={22} />
        <Skeleton variant="text" width="30%" height={18} sx={{ mt: 0.5 }} />
      </Box>
      <Box sx={{ mt: 2.5 }}>
        <Skeleton variant="rectangular" height={44} sx={{ borderRadius: 2 }} />
      </Box>
    </CardContent>
  </MotionCard>
);

export default OfferCardSkeleton;
