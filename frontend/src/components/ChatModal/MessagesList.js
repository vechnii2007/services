import React from "react";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import {
  MessagesList as StyledMessagesList,
  MessageGroup,
  MessageItem,
  Message,
} from "./ChatModal.styled";
import { getRelativeTime } from "../../utils/dateUtils";

const isImageUrl = (url = "") => /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(url);

const MessagesList = ({
  groupedMessages,
  recipientName,
  user,
  theme,
  messagesEndRef,
}) => (
  <StyledMessagesList>
    {groupedMessages.map((group) => (
      <MessageGroup key={group.id} isUser={group.isUser}>
        {!group.isUser && (
          <Typography
            variant="caption"
            sx={{
              ml: 2,
              mt: 1,
              color: theme.palette.text.secondary,
              fontSize: "0.7rem",
            }}
          >
            {recipientName}
          </Typography>
        )}
        {group.messages.map((msg, msgIndex) => (
          <MessageItem key={msg._id || msgIndex} isUser={group.isUser}>
            {!group.isUser && msgIndex === 0 && (
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  mr: 1,
                  opacity: 0.9,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                }}
              >
                {recipientName.charAt(0).toUpperCase()}
              </Avatar>
            )}
            {!group.isUser && msgIndex > 0 && <Box sx={{ width: 28, mr: 1 }} />}
            <Message isUser={group.isUser} elevation={0}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 400,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {msg.type === "file" || isImageUrl(msg.message) ? (
                  isImageUrl(msg.message) ? (
                    <a
                      href={msg.message}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={msg.message}
                        alt={msg.fileName || "file"}
                        style={{
                          maxWidth: 220,
                          maxHeight: 180,
                          borderRadius: 8,
                          margin: "4px 0",
                          display: "block",
                        }}
                      />
                    </a>
                  ) : (
                    <a
                      href={msg.message}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <InsertDriveFileIcon sx={{ fontSize: 22, mr: 0.5 }} />
                      {msg.fileName || msg.message}
                    </a>
                  )
                ) : (
                  msg.text || msg.message || ""
                )}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  mt: 0.5,
                  gap: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  color={
                    group.isUser ? "rgba(255,255,255,0.8)" : "text.secondary"
                  }
                  sx={{ fontSize: "0.65rem" }}
                >
                  {getRelativeTime(new Date(msg.timestamp || msg.createdAt))}
                </Typography>
                {group.isUser && (
                  <>
                    {msg.isSending && (
                      <Box
                        sx={{ display: "flex", ml: 0.5, alignItems: "center" }}
                      >
                        <Typography
                          variant="caption"
                          color="inherit"
                          sx={{ opacity: 0.7, fontSize: "0.65rem" }}
                        >
                          отправляется
                        </Typography>
                      </Box>
                    )}
                    {msg.hasError && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ ml: 0.5, fontSize: "0.65rem" }}
                      >
                        ошибка
                      </Typography>
                    )}
                    {msg.read && (
                      <DoneAllIcon
                        sx={{
                          fontSize: 14,
                          color: theme.palette.success.main,
                          opacity: 0.8,
                        }}
                      />
                    )}
                  </>
                )}
              </Box>
            </Message>
          </MessageItem>
        ))}
      </MessageGroup>
    ))}
    <div ref={messagesEndRef} />
  </StyledMessagesList>
);

export default MessagesList;
