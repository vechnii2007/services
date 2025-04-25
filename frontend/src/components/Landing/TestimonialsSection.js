import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Typography,
  Avatar,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { motion } from "framer-motion";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import StarIcon from "@mui/icons-material/Star";

// Анимированные компоненты
const MotionBox = styled(motion.div)({});
const MotionTypography = styled(motion.div)({});

// Стили
const TestimonialsContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(10, 2),
  background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[50]} 100%)`,
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(12, 4),
  },
}));

const TestimonialCard = styled(Box)(({ theme }) => ({
  position: "relative",
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0 5px 20px rgba(0, 0, 0, 0.05)",
  margin: theme.spacing(1),
  height: "100%",
  display: "flex",
  flexDirection: "column",
  [theme.breakpoints.up("md")]: {
    margin: theme.spacing(2),
    padding: theme.spacing(6),
  },
}));

const QuoteIcon = styled(FormatQuoteIcon)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(2),
  right: theme.spacing(2),
  fontSize: 40,
  color: theme.palette.grey[200],
  transform: "scaleX(-1)",
}));

const StyledSlider = styled(Slider)({
  ".slick-list": {
    padding: "20px 0",
  },
  ".slick-track": {
    display: "flex",
    "& .slick-slide": {
      height: "auto",
      "& > div": {
        height: "100%",
      },
    },
  },
});

const SliderArrow = styled(IconButton)(({ theme, direction }) => ({
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 2,
  [direction === "left" ? "left" : "right"]: "-30px",
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
  "&:hover": {
    backgroundColor: theme.palette.primary.light,
  },
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}));

const AvatarWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginTop: "auto",
  paddingTop: theme.spacing(2),
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 60,
  height: 60,
  border: `3px solid ${theme.palette.background.paper}`,
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
}));

const RatingStars = styled(Box)(({ theme }) => ({
  display: "flex",
  marginBottom: theme.spacing(2),
  color: theme.palette.warning.main,
}));

const TestimonialsSection = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const [sliderRef, setSliderRef] = useState(null);

  // Вариации для анимации
  const titleVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  // Примеры отзывов
  const testimonials = [
    {
      id: 1,
      nameKey: "landing.testimonials.names.1",
      role: "landing.testimonials.roles.business_owner",
      avatar: "https://i.pravatar.cc/150?img=11",
      content: "landing.testimonials.content.1",
      rating: 5,
    },
    {
      id: 2,
      nameKey: "landing.testimonials.names.2",
      role: "landing.testimonials.roles.freelancer",
      avatar: "https://i.pravatar.cc/150?img=5",
      content: "landing.testimonials.content.2",
      rating: 5,
    },
    {
      id: 3,
      nameKey: "landing.testimonials.names.3",
      role: "landing.testimonials.roles.developer",
      avatar: "https://i.pravatar.cc/150?img=12",
      content: "landing.testimonials.content.3",
      rating: 4,
    },
    {
      id: 4,
      nameKey: "landing.testimonials.names.4",
      role: "landing.testimonials.roles.designer",
      avatar: "https://i.pravatar.cc/150?img=9",
      content: "landing.testimonials.content.4",
      rating: 5,
    },
    {
      id: 5,
      nameKey: "landing.testimonials.names.5",
      role: "landing.testimonials.roles.marketing",
      avatar: "https://i.pravatar.cc/150?img=15",
      content: "landing.testimonials.content.5",
      rating: 4,
    },
  ];

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: isMobile ? 1 : isTablet ? 2 : 3,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
  };

  const renderRating = (rating) => {
    return (
      <RatingStars>
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            fontSize="small"
            sx={{
              color: i < rating ? "warning.main" : "grey.300",
              marginRight: 0.5,
            }}
          />
        ))}
      </RatingStars>
    );
  };

  return (
    <TestimonialsContainer component="section">
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
            {t("landing.testimonials.overline")}
          </Typography>
          <Typography
            variant="h2"
            component="h2"
            fontWeight={700}
            sx={{ mb: 2 }}
          >
            {t("landing.testimonials.title")}
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
            {t("landing.testimonials.subtitle")}
          </Typography>
        </MotionBox>

        <Box sx={{ position: "relative", mx: { xs: -2, md: 0 } }}>
          <SliderArrow
            direction="left"
            onClick={() => sliderRef?.slickPrev()}
            aria-label="Previous testimonial"
          >
            <NavigateBeforeIcon />
          </SliderArrow>

          <StyledSlider ref={setSliderRef} {...sliderSettings}>
            {testimonials.map((testimonial) => (
              <Box key={testimonial.id} sx={{ height: "100%" }}>
                <TestimonialCard>
                  <QuoteIcon />
                  {renderRating(testimonial.rating)}
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 3,
                      fontStyle: "italic",
                      flex: 1,
                      lineHeight: 1.8,
                    }}
                  >
                    "{t(testimonial.content)}"
                  </Typography>
                  <AvatarWrapper>
                    <StyledAvatar
                      src={testimonial.avatar}
                      alt={t(testimonial.nameKey)}
                    />
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {t(testimonial.nameKey)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t(testimonial.role)}
                      </Typography>
                    </Box>
                  </AvatarWrapper>
                </TestimonialCard>
              </Box>
            ))}
          </StyledSlider>

          <SliderArrow
            direction="right"
            onClick={() => sliderRef?.slickNext()}
            aria-label="Next testimonial"
          >
            <NavigateNextIcon />
          </SliderArrow>
        </Box>
      </Container>
    </TestimonialsContainer>
  );
};

export default TestimonialsSection;
