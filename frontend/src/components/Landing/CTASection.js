import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Container, Typography, Button, Grid } from "@mui/material";
import { styled } from "@mui/material/styles";
import { motion } from "framer-motion";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SearchIcon from "@mui/icons-material/Search";

// Анимированные компоненты
const MotionBox = styled(motion.div)({});
const MotionButton = styled(motion(Button))({});

// Стили
const CTAContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(10, 2),
  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
  color: theme.palette.common.white,
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(12, 4),
  },
}));

const CircleDecoration = styled(Box)(
  ({ theme, size = 300, top, right, bottom, left, opacity = 0.1 }) => ({
    position: "absolute",
    width: size,
    height: size,
    borderRadius: "50%",
    backgroundColor: "white",
    opacity,
    top,
    right,
    bottom,
    left,
    zIndex: 0,
    filter: "blur(60px)",
  })
);

const CTASection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Вариации для анимации
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut", delay: 0.3 },
    },
    hover: {
      scale: 1.05,
      boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  };

  const handleSignUpClick = () => {
    navigate("/register");
  };

  const handleBrowseClick = () => {
    navigate("/offers");
  };

  return (
    <CTAContainer component="section" position="relative" overflow="hidden">
      {/* Декоративные элементы */}
      <CircleDecoration size={350} top="-10%" right="-5%" opacity={0.07} />
      <CircleDecoration size={250} bottom="-5%" left="5%" opacity={0.05} />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          sx={{ textAlign: "center" }}
        >
          <MotionBox variants={textVariants}>
            <Typography
              variant="h2"
              component="h2"
              fontWeight={700}
              sx={{ mb: 3 }}
            >
              {t("landing.cta.title")}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                maxWidth: "800px",
                mx: "auto",
                mb: 6,
                opacity: 0.9,
                lineHeight: 1.6,
                fontWeight: 400,
              }}
            >
              {t("landing.cta.subtitle")}
            </Typography>
          </MotionBox>

          <Grid
            container
            spacing={3}
            justifyContent="center"
            alignItems="center"
          >
            <Grid item>
              <MotionButton
                variants={buttonVariants}
                whileHover="hover"
                component={Button}
                variant="contained"
                color="secondary"
                size="large"
                startIcon={<PersonAddIcon />}
                onClick={handleSignUpClick}
                sx={{
                  borderRadius: "50px",
                  py: 1.5,
                  px: 4,
                  fontWeight: 600,
                  fontSize: "1rem",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                  color: "white",
                }}
              >
                {t("landing.cta.sign_up_button")}
              </MotionButton>
            </Grid>
            <Grid item>
              <MotionButton
                variants={buttonVariants}
                whileHover="hover"
                component={Button}
                variant="outlined"
                size="large"
                startIcon={<SearchIcon />}
                onClick={handleBrowseClick}
                sx={{
                  borderRadius: "50px",
                  py: 1.5,
                  px: 4,
                  fontWeight: 600,
                  fontSize: "1rem",
                  borderWidth: 2,
                  borderColor: "white",
                  color: "white",
                  "&:hover": {
                    borderWidth: 2,
                    borderColor: "white",
                    backgroundColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                {t("landing.cta.browse_button")}
              </MotionButton>
            </Grid>
          </Grid>
        </MotionBox>
      </Container>
    </CTAContainer>
  );
};

export default CTASection;
