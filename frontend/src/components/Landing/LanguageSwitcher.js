import React, { useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import TranslateIcon from "@mui/icons-material/Translate";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SpainFlag from "../../assets/flags/es.svg";
import UkraineFlag from "../../assets/flags/ua.svg";
import RussiaFlag from "../../assets/flags/ru.svg";

const languages = [
  {
    code: "es",
    name: "Español",
    flag: SpainFlag,
    nativeName: "Español",
  },
  {
    code: "uk",
    name: "Українська",
    flag: UkraineFlag,
    nativeName: "Українська",
  },
  {
    code: "ru",
    name: "Русский",
    flag: RussiaFlag,
    nativeName: "Русский",
  },
];

const LanguageSwitcher = ({ colorMode = "dark" }) => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const supportedLangs = languages.map((l) => l.code);
  const langCode = (i18n.language || "").slice(0, 2);
  const currentLanguage =
    languages.find((lang) => lang.code === langCode) ||
    languages.find(
      (lang) => lang.code === (i18n.options.fallbackLng || "ru")
    ) ||
    languages[0];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    handleClose();
  };

  // Стили для кнопки и меню в зависимости от colorMode
  const isLight = colorMode === "light";
  const buttonSx = isLight
    ? {
        borderRadius: 2,
        color: "text.primary",
        borderColor: "rgba(0,0,0,0.2)",
        backgroundColor: "background.paper",
        "&:hover": {
          borderColor: "text.primary",
          backgroundColor: "rgba(0,0,0,0.04)",
        },
        boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
      }
    : {
        borderRadius: 2,
        color: "common.white",
        borderColor: "rgba(255,255,255,0.3)",
        "&:hover": {
          borderColor: "common.white",
          backgroundColor: "rgba(255,255,255,0.1)",
        },
        backdropFilter: "blur(8px)",
      };

  return (
    <>
      <Button
        onClick={handleClick}
        startIcon={<TranslateIcon />}
        endIcon={<ExpandMoreIcon />}
        variant="outlined"
        sx={buttonSx}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {currentLanguage.flag && (
            <img
              src={currentLanguage.flag}
              alt={currentLanguage.name}
              style={{
                width: 20,
                height: 15,
                marginRight: 8,
                boxShadow: "0 0 4px rgba(0,0,0,0.2)",
              }}
            />
          )}
          {currentLanguage.nativeName}
        </Box>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1,
            borderRadius: 2,
            minWidth: 150,
            backgroundColor: isLight ? "background.paper" : undefined,
            color: isLight ? "text.primary" : undefined,
          },
        }}
      >
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            selected={i18n.language === lang.code}
            sx={{
              py: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            {lang.flag && (
              <img
                src={lang.flag}
                alt={lang.name}
                style={{
                  width: 24,
                  height: 18,
                  marginRight: 12,
                  boxShadow: "0 0 4px rgba(0,0,0,0.2)",
                }}
              />
            )}
            <Typography variant="body2">{lang.nativeName}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSwitcher;
