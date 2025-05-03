import React from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import { ChatInputContainer, StyledTextField } from "./ChatModal.styled";

const ChatInput = ({
  newMessage,
  setNewMessage,
  sendMessage,
  isConnected,
  handleKeyPress,
}) => (
  <ChatInputContainer>
    <IconButton
      color="primary"
      size="small"
      sx={{ width: 36, height: 36, color: "text.secondary" }}
    >
      <EmojiEmotionsIcon fontSize="small" />
    </IconButton>
    <IconButton
      color="primary"
      size="small"
      sx={{ width: 36, height: 36, color: "text.secondary" }}
    >
      <AttachFileIcon fontSize="small" />
    </IconButton>
    <StyledTextField
      fullWidth
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      onKeyPress={handleKeyPress}
      placeholder="Введите сообщение..."
      variant="outlined"
      size="small"
      disabled={!isConnected}
      multiline
      maxRows={3}
      InputProps={{ sx: { px: 2, py: 0.75 } }}
    />
    <Tooltip title="Отправить">
      <span>
        <IconButton
          color="primary"
          disabled={!newMessage.trim() || !isConnected}
          onClick={sendMessage}
          sx={{
            bgcolor:
              newMessage.trim() && isConnected ? "primary.main" : "transparent",
            color: newMessage.trim() && isConnected ? "white" : undefined,
            width: 36,
            height: 36,
            minWidth: 36,
            "&:hover": {
              bgcolor:
                newMessage.trim() && isConnected ? "primary.dark" : undefined,
            },
          }}
        >
          <SendIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  </ChatInputContainer>
);

export default ChatInput;
