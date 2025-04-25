import React from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { motion } from "framer-motion";
import SearchIcon from "@mui/icons-material/Search";
import HandshakeIcon from "@mui/icons-material/Handshake";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PaymentsIcon from "@mui/icons-material/Payments";

// Анимированные компоненты
const MotionBox = styled(motion.div)({});

// Стили
const SectionContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(10, 2),
  background: `linear-gradient(45deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[50]} 100%)`,
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(12, 4),
  },
}));

const StepNumber = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 50,
  height: 50,
  borderRadius: "50%",
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontWeight: "bold",
  fontSize: 24,
  marginBottom: theme.spacing(2),
}));

const StepIcon = styled(Box)(({ theme, color = "primary.main" }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 70,
  height: 70,
  borderRadius: "50%",
  backgroundColor: `${
    theme.palette[color.split(".")[0]][color.split(".")[1] || "main"]
  }15`, // 15% opacity
  color: theme.palette[color.split(".")[0]][color.split(".")[1] || "main"],
  marginBottom: theme.spacing(2),
}));

const StepCard = styled(Card)(({ theme }) => ({
  height: "100%",
  borderRadius: theme.spacing(2),
  boxShadow: "0 5px 20px rgba(0, 0, 0, 0.05)",
  padding: theme.spacing(4),
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 12px 25px rgba(0, 0, 0, 0.1)",
  },
}));

const HowItWorksSection = () => {
  const { t } = useTranslation();
  const theme = useTheme();

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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  // Шаги работы
  const steps = [
    {
      number: 1,
      title: "landing.how_it_works.steps.search.title",
      description: "landing.how_it_works.steps.search.description",
      icon: <SearchIcon sx={{ fontSize: 36 }} />,
      color: "primary.main",
    },
    {
      number: 2,
      title: "landing.how_it_works.steps.connect.title",
      description: "landing.how_it_works.steps.connect.description",
      icon: <HandshakeIcon sx={{ fontSize: 36 }} />,
      color: "info.main",
    },
    {
      number: 3,
      title: "landing.how_it_works.steps.complete.title",
      description: "landing.how_it_works.steps.complete.description",
      icon: <AssignmentTurnedInIcon sx={{ fontSize: 36 }} />,
      color: "success.main",
    },
    {
      number: 4,
      title: "landing.how_it_works.steps.pay.title",
      description: "landing.how_it_works.steps.pay.description",
      icon: <PaymentsIcon sx={{ fontSize: 36 }} />,
      color: "warning.main",
    },
  ];

  return (
    <SectionContainer component="section">
      <Container maxWidth="lg">
        <MotionBox
          sx={{ textAlign: "center", mb: 8 }}
          variants={titleVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <Typography
            variant="overline"
            color="primary"
            fontWeight={600}
            sx={{ letterSpacing: 2, mb: 1, display: "block" }}
          >
            {t("landing.how_it_works.overline")}
          </Typography>
          <Typography
            variant="h2"
            component="h2"
            fontWeight={700}
            sx={{ mb: 2 }}
          >
            {t("landing.how_it_works.title")}
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{
              maxWidth: "800px",
              mx: "auto",
              lineHeight: 1.6,
              fontWeight: 400,
            }}
          >
            {t("landing.how_it_works.subtitle")}
          </Typography>
        </MotionBox>

        <MotionBox
          component={Grid}
          container
          spacing={4}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {steps.map((step) => (
            <Grid item xs={12} sm={6} md={3} key={step.number}>
              <MotionBox variants={itemVariants}>
                <StepCard>
                  <Box sx={{ textAlign: "center" }}>
                    <StepNumber>{step.number}</StepNumber>
                    <StepIcon color={step.color}>{step.icon}</StepIcon>
                    <Typography
                      variant="h5"
                      component="h3"
                      gutterBottom
                      fontWeight={600}
                      sx={{ mb: 2 }}
                    >
                      {t(step.title)}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ lineHeight: 1.7 }}
                    >
                      {t(step.description)}
                    </Typography>
                  </Box>
                </StepCard>
              </MotionBox>
            </Grid>
          ))}
        </MotionBox>
      </Container>
    </SectionContainer>
  );
};

export default HowItWorksSection;
