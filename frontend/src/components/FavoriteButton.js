import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { useTranslation } from "react-i18next";

/**
 * Кнопка для добавления/удаления из избранного
 *
 * @param {Object} props - Свойства компонента
 * @param {string} props.offerId - ID предложения
 * @param {boolean} props.isFavorite - Находится ли предложение в избранном
 * @param {Function} props.onClick - Функция обработки клика
 * @param {Object} props.sx - Дополнительные стили для IconButton
 */
const FavoriteButton = ({ offerId, isFavorite, onClick, sx }) => {
  const { t } = useTranslation();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Tooltip
      title={isFavorite ? t("remove_from_favorites") : t("add_to_favorites")}
    >
      <IconButton
        onClick={handleClick}
        color={isFavorite ? "error" : "default"}
        sx={{
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "scale(1.1)",
          },
          ...sx,
        }}
        data-offer-id={offerId}
        aria-label={
          isFavorite ? t("remove_from_favorites") : t("add_to_favorites")
        }
      >
        {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default FavoriteButton;
