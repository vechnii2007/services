import React from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import { ChatInputContainer, StyledTextField } from "./ChatModal.styled";
import ChatTextarea from "./ChatTextarea";
import { Box } from "@mui/material";

const ChatInput = ({
  newMessage,
  setNewMessage,
  sendMessage,
  isConnected,
  handleKeyPress,
}) => (
  <Box sx={{ width: "100%" }}>
    <ChatTextarea
      value={newMessage}
      onChange={setNewMessage}
      onSend={sendMessage}
      disabled={!isConnected}
    />
  </Box>
);

export default ChatInput;
