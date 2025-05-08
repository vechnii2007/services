import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Typography,
  Grid,
  Link,
  IconButton,
  Divider,
  Stack,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import LanguageSwitcher from "./LanguageSwitcher";

// Стили
const FooterContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(8, 2, 6),
  backgroundColor: theme.palette.background.paper,
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(10, 4, 6),
  },
}));

const FooterLink = styled(Link)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textDecoration: "none",
  transition: "color 0.2s ease",
  fontSize: "0.9rem",
  "&:hover": {
    color: theme.palette.primary.main,
    textDecoration: "none",
  },
}));

const FooterHeading = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  fontSize: "1.1rem",
}));

const SocialIcon = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  "&:hover": {
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

const Footer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <FooterContainer component="footer">
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <FooterHeading variant="h6">
              {t("landing.footer.about.title")}
            </FooterHeading>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, lineHeight: 1.6 }}
            >
              {t("landing.footer.about.description")}
            </Typography>
            <Stack direction="row" spacing={1}>
              <SocialIcon aria-label="Facebook">
                <FacebookIcon fontSize="small" />
              </SocialIcon>
              <SocialIcon aria-label="Twitter">
                <TwitterIcon fontSize="small" />
              </SocialIcon>
              <SocialIcon aria-label="Instagram">
                <InstagramIcon fontSize="small" />
              </SocialIcon>
              <SocialIcon aria-label="LinkedIn">
                <LinkedInIcon fontSize="small" />
              </SocialIcon>
            </Stack>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <FooterHeading variant="h6">
              {t("landing.footer.links.title")}
            </FooterHeading>
            <Stack spacing={1.5}>
              <FooterLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/offers");
                }}
              >
                {t("landing.footer.links.services")}
              </FooterLink>
              <FooterLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/login");
                }}
              >
                {t("landing.footer.links.login")}
              </FooterLink>
              <FooterLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/register");
                }}
              >
                {t("landing.footer.links.register")}
              </FooterLink>
              <FooterLink href="#">{t("landing.footer.links.blog")}</FooterLink>
            </Stack>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <FooterHeading variant="h6">
              {t("landing.footer.support.title")}
            </FooterHeading>
            <Stack spacing={1.5}>
              <FooterLink href="#">
                {t("landing.footer.support.help_center")}
              </FooterLink>
              <FooterLink href="#">
                {t("landing.footer.support.contact_us")}
              </FooterLink>
              <FooterLink href="#">
                {t("landing.footer.support.privacy_policy")}
              </FooterLink>
              <FooterLink href="#">
                {t("landing.footer.support.terms")}
              </FooterLink>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FooterHeading variant="h6">
              {t("landing.footer.language.title")}
            </FooterHeading>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, lineHeight: 1.6 }}
            >
              {t("landing.footer.language.description")}
            </Typography>
            <LanguageSwitcher />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Typography variant="body2" color="text.secondary">
            &copy; {currentYear} UniServ. {t("landing.footer.rights")}
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 2,
            }}
          >
            <FooterLink href="#">{t("landing.footer.privacy")}</FooterLink>
            <FooterLink href="#">{t("landing.footer.terms")}</FooterLink>
            <FooterLink href="#">{t("landing.footer.cookies")}</FooterLink>
          </Box>
        </Box>
      </Container>
    </FooterContainer>
  );
};

export default Footer;
