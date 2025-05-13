import React, { useEffect, useState } from "react";
import { InfoPanel as StyledInfoPanel } from "./ChatModal.styled";
import { Box, Avatar, Typography } from "@mui/material";
import { UserService } from "../../services/UserService";

const InfoPanel = ({ chatInfo, user, theme }) => {
  const [companion, setCompanion] = useState(null);
  useEffect(() => {
    if (!chatInfo || !user) return;
    let companionId = null;
    if (chatInfo.userId && chatInfo.providerId) {
      if (chatInfo.userId._id === user._id) {
        companionId = chatInfo.providerId._id || chatInfo.providerId;
      } else {
        companionId = chatInfo.userId._id || chatInfo.userId;
      }
    }
    if (companionId) {
      UserService.getById(companionId)
        .then(setCompanion)
        .catch(() => setCompanion(null));
    }
  }, [chatInfo, user]);

  if (!companion) return null;
  return (
    <StyledInfoPanel>
      {/* Блок с предложением (offer) */}
      {chatInfo && (chatInfo.offer || chatInfo.offerId) && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            background: theme.palette.background.paper,
            boxShadow: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar
            variant="rounded"
            src={chatInfo.offer?.images?.[0] || chatInfo.offerId?.images?.[0]}
            sx={{ width: 80, height: 80, mb: 1, borderRadius: 2 }}
          >
            {chatInfo.offer?.title?.charAt(0).toUpperCase() ||
              chatInfo.offerId?.title?.charAt(0).toUpperCase() ||
              "?"}
          </Avatar>
          <Typography variant="subtitle1" fontWeight={600} align="center">
            {chatInfo.offer?.title || chatInfo.offerId?.title || "Оффер"}
          </Typography>
          {chatInfo.offer?.price || chatInfo.offerId?.price ? (
            <Typography variant="body2" color="primary" fontWeight={500}>
              {chatInfo.offer?.price || chatInfo.offerId?.price} €
            </Typography>
          ) : null}
        </Box>
      )}
      {/* Контакты собеседника */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Avatar
          sx={{
            width: 64,
            height: 64,
            mb: 1,
            bgcolor: theme.palette.primary.main,
          }}
        >
          {companion.name ? companion.name.charAt(0).toUpperCase() : "?"}
        </Avatar>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
          {companion.name}
        </Typography>
        {companion.email && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            <b>Email:</b> {companion.email}
          </Typography>
        )}
        {companion.phone && companion.phone !== "" && (
          <Typography variant="body2" color="text.secondary">
            <b>Телефон:</b> {companion.phone}
          </Typography>
        )}
        {companion.status && (
          <Typography
            variant="body2"
            color={
              companion.status === "online" ? "success.main" : "text.secondary"
            }
          >
            <b>Статус:</b>{" "}
            {companion.status === "online" ? "В сети" : "Не в сети"}
          </Typography>
        )}
        <Box sx={{ mt: 2 }}>
          <a
            href={`/profile/${companion._id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: "none",
              color: theme.palette.primary.main,
              fontWeight: 500,
              fontSize: 16,
              border: `1px solid ${theme.palette.primary.main}`,
              borderRadius: 8,
              padding: "4px 16px",
              transition: "background 0.2s",
            }}
          >
            Профиль
          </a>
        </Box>
      </Box>
    </StyledInfoPanel>
  );
};

export default InfoPanel;
