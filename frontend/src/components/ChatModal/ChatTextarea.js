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

const MAX_FILES = 3;

const ChatTextarea = ({ value, onChange, onSend, disabled }) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const [files, setFiles] = useState([]);
  const textareaRef = useRef();
  const fileInputRef = useRef();

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
        <IconButton onClick={() => setShowEmoji((v) => !v)} size="small">
          <EmojiEmotionsIcon />
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
      <IconButton onClick={() => fileInputRef.current.click()} size="small">
        <AttachFileIcon />
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
            border: "1.5px solid #d0d7de",
            padding: "10px 14px",
            fontSize: 16,
            resize: "none",
            background: disabled ? "#f5f5f5" : "#fff",
            outline: "none",
            boxShadow: "none",
            color: disabled ? "#aaa" : undefined,
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
          sx={{ ml: 1, alignSelf: "flex-end" }}
        >
          <SendIcon />
        </IconButton>
      </Box>
      {/* Предпросмотр файлов */}
      {files.length > 0 && (
        <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
          {files.map((file, idx) => (
            <Box
              key={idx}
              sx={{
                display: "flex",
                alignItems: "center",
                bgcolor: "#f0f0f0",
                borderRadius: 2,
                px: 1,
                py: 0.5,
              }}
            >
              <Typography variant="body2" sx={{ mr: 1 }}>
                {file.name}
              </Typography>
              <IconButton size="small" onClick={() => handleRemoveFile(idx)}>
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
