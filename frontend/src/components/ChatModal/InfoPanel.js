import React from "react";
import { InfoPanel as StyledInfoPanel } from "./ChatModal.styled";
import { Box, Avatar, Typography } from "@mui/material";

const InfoPanel = ({ chatInfo, user, theme }) => {
  if (!chatInfo || !user) return null;
  const currentUserId = user._id;
  let contact = null;
  if (chatInfo.userId && chatInfo.providerId) {
    if (chatInfo.userId._id === currentUserId) {
      contact = chatInfo.providerId;
    } else {
      contact = chatInfo.userId;
    }
  }
  if (!contact) return null;
  return (
    <StyledInfoPanel>
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
          {contact.name ? contact.name.charAt(0).toUpperCase() : "?"}
        </Avatar>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
          {contact.name}
        </Typography>
        {contact.email && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            <b>Email:</b> {contact.email}
          </Typography>
        )}
        {contact.phone && contact.phone !== "" && (
          <Typography variant="body2" color="text.secondary">
            <b>Телефон:</b> {contact.phone}
          </Typography>
        )}
        {contact.status && (
          <Typography
            variant="body2"
            color={
              contact.status === "online" ? "success.main" : "text.secondary"
            }
          >
            <b>Статус:</b>{" "}
            {contact.status === "online" ? "В сети" : "Не в сети"}
          </Typography>
        )}
        <Box sx={{ mt: 2 }}>
          <a
            href={`/profile/${contact._id}`}
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
