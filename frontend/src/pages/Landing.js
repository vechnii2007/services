import React from "react";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { motion } from "framer-motion";
import LanguageSwitcher from "../components/Landing/LanguageSwitcher";
import HeroSection from "../components/Landing/HeroSection";
import FeatureSection from "../components/Landing/FeatureSection";
import CategorySection from "../components/Landing/CategorySection";
import TestimonialSection from "../components/Landing/TestimonialsSection";
import HowItWorksSection from "../components/Landing/HowItWorksSection";
import CTASection from "../components/Landing/CTASection";
import Footer from "../components/Landing/Footer";

// Анимированные компоненты
const MotionContainer = styled(motion.div)(({ theme }) => ({
  width: "100%",
  overflow: "hidden",
}));

const Landing = () => {
  // Анимация для всего лендинга
  const pageVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
    exit: { opacity: 0 },
  };

  return (
    <MotionContainer
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* Языковой переключатель в верхнем правом углу */}
      <Box sx={{ position: "absolute", top: 20, right: 20, zIndex: 10 }}>
        <LanguageSwitcher />
      </Box>

      {/* Основной контент лендинга */}
      <HeroSection />
      <FeatureSection />
      <CategorySection />
      <HowItWorksSection />
      <TestimonialSection />
      <CTASection />
      <Footer />
    </MotionContainer>
  );
};

export default Landing;
