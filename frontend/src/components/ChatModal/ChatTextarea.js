import React, { useRef, useState } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  InputAdornment,
  Avatar,
  Typography,
} from "@mui/material";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import TextareaAutosize from "react-textarea-autosize";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import SendIcon from "@mui/icons-material/Send";
import { useTheme } from "@mui/material/styles";

const MAX_FILES = 3;

const ChatTextarea = ({ value, onChange, onSend, disabled }) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const [files, setFiles] = useState([]);
  const textareaRef = useRef();
  const fileInputRef = useRef();
  const theme = useTheme();

  const handleEmojiSelect = (emoji) => {
    // emoji-mart v5+: emoji.unified, emoji.native, emoji.skins, emoji.shortcodes, emoji.id
    let symbol = "";
    if (emoji.native) {
      symbol = emoji.native;
    } else if (emoji.unified) {
      // unified: '1F600' или '1F1FA-1F1F8' (флаг)
      symbol = emoji.unified
        .split("-")
        .map((u) => String.fromCodePoint(parseInt(u, 16)))
        .join("");
    } else if (emoji.skins && emoji.skins[0]?.native) {
      symbol = emoji.skins[0].native;
    } else if (emoji.shortcodes) {
      symbol = emoji.shortcodes;
    } else if (emoji.id) {
      symbol = emoji.id;
    }
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.slice(0, start) + symbol + value.slice(end);
    onChange(newValue);
    setShowEmoji(false);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + symbol.length;
    }, 0);
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).slice(
      0,
      MAX_FILES - files.length
    );
    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const handleRemoveFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).slice(
      0,
      MAX_FILES - files.length
    );
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleSend = () => {
    if ((value.trim() || files.length) && !disabled) {
      onSend(files, value);
      onChange("");
      setFiles([]);
    }
  };

  return (
    <Box
      sx={{ display: "flex", alignItems: "flex-end", gap: 1, width: "100%" }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <Box sx={{ position: "relative" }}>
        <IconButton
          onClick={() => setShowEmoji((v) => !v)}
          size="small"
          sx={(theme) => ({
            color:
              theme.palette.mode === "dark"
                ? theme.palette.text.primary
                : theme.palette.grey[700],
          })}
        >
          <EmojiEmotionsIcon
            sx={(theme) => ({
              color:
                theme.palette.mode === "dark"
                  ? theme.palette.text.primary
                  : theme.palette.grey[700],
            })}
          />
        </IconButton>
        {showEmoji && (
          <Box sx={{ position: "absolute", bottom: 40, left: 0, zIndex: 10 }}>
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme="light"
            />
          </Box>
        )}
      </Box>
      <IconButton
        onClick={() => fileInputRef.current.click()}
        size="small"
        sx={(theme) => ({
          color:
            theme.palette.mode === "dark"
              ? theme.palette.text.primary
              : theme.palette.grey[700],
        })}
      >
        <AttachFileIcon
          sx={(theme) => ({
            color:
              theme.palette.mode === "dark"
                ? theme.palette.text.primary
                : theme.palette.grey[700],
          })}
        />
      </IconButton>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
        disabled={files.length >= MAX_FILES}
      />
      <Box
        sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "flex-end" }}
      >
        <TextareaAutosize
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          minRows={1}
          maxRows={8}
          style={{
            width: "100%",
            borderRadius: 16,
            border: `1.5px solid ${theme.palette.divider}`,
            padding: "10px 14px",
            fontSize: 16,
            resize: "none",
            background:
              theme.palette.mode === "dark"
                ? theme.palette.background.paper
                : disabled
                ? "#f5f5f5"
                : "#fff",
            outline: "none",
            boxShadow: "none",
            color:
              theme.palette.mode === "dark"
                ? theme.palette.text.primary
                : disabled
                ? "#aaa"
                : undefined,
          }}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <IconButton
          color="primary"
          disabled={disabled || (!value.trim() && files.length === 0)}
          onClick={handleSend}
          sx={(theme) => ({
            ml: 1,
            alignSelf: "flex-end",
            color:
              theme.palette.mode === "dark"
                ? theme.palette.primary.main
                : undefined,
          })}
        >
          <SendIcon
            sx={(theme) => ({
              color:
                theme.palette.mode === "dark"
                  ? theme.palette.primary.main
                  : undefined,
            })}
          />
        </IconButton>
      </Box>
      {/* Предпросмотр файлов */}
      {files.length > 0 && (
        <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
          {files.map((file, idx) => (
            <Box
              key={idx}
              sx={(theme) => ({
                display: "flex",
                alignItems: "center",
                bgcolor:
                  theme.palette.mode === "dark"
                    ? theme.palette.background.level2
                    : "#f0f0f0",
                borderRadius: 2,
                px: 2,
                py: 1,
                color:
                  theme.palette.mode === "dark"
                    ? theme.palette.common.white
                    : theme.palette.text.primary,
                minWidth: 120,
              })}
            >
              <Typography variant="body2" sx={{ mr: 1, color: "inherit" }}>
                {file.name}
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleRemoveFile(idx)}
                sx={{ color: "inherit" }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ChatTextarea;
