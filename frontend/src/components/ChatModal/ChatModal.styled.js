import { styled, alpha } from "@mui/material/styles";
import {
  Box,
  Typography,
  Avatar,
  Paper,
  TextField,
  List as MUIList,
} from "@mui/material";

export const ChatLayout = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  width: "100%",
  height: "100%",
  background: theme.palette.background.default,
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    height: "auto",
    marginTop: 0,
  },
}));

export const ChatPanel = styled(Box)(({ theme }) => ({
  flex: "0 0 65%",
  minWidth: 0,
  minHeight: 0,
  height: "100%",
  display: "flex",
  flexDirection: "column",
  borderRight: `1px solid ${theme.palette.divider}`,
  background: theme.palette.background.default,
  [theme.breakpoints.down("md")]: {
    flex: "1 1 100%",
    borderRight: "none",
    borderBottom: `1px solid ${theme.palette.divider}`,
    height: "auto",
  },
}));

export const InfoPanel = styled(Box)(({ theme }) => ({
  flex: "0 0 35%",
  minWidth: 260,
  maxWidth: 420,
  background: theme.palette.background.paper,
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  padding: theme.spacing(3, 2),
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}));

export const ChatContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  background: theme.palette.background.default,
  height: "100%",
  minHeight: 0,
}));

export const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.2, 1.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: "flex",
  alignItems: "center",
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  zIndex: 10,
  minHeight: 48,
  position: "relative",
}));

export const ChatParticipant = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginLeft: theme.spacing(0.5),
}));

export const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: "1 1 auto",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  background: theme.palette.background.default,
  padding: theme.spacing(1, 0),
  minHeight: 0,
}));

export const MessagesList = styled(MUIList)(({ theme }) => ({
  padding: 0,
  display: "flex",
  flexDirection: "column",
  width: "100%",
  maxWidth: "100%",
}));

export const ChatInputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: "flex",
  gap: theme.spacing(0.5),
  backgroundColor: theme.palette.background.paper,
  position: "relative",
  flexShrink: 0,
}));

export const Message = styled(Paper)(({ theme, isUser }) => ({
  padding: theme.spacing(1, 1.5),
  margin: theme.spacing(0.25, 0.5),
  maxWidth: "80%",
  alignSelf: isUser ? "flex-end" : "flex-start",
  background: isUser
    ? `linear-gradient(120deg, ${theme.palette.primary.main} 60%, ${theme.palette.primary.dark} 100%)`
    : theme.palette.mode === "dark"
    ? theme.palette.background.level2
    : `linear-gradient(120deg, ${theme.palette.grey[200]} 60%, ${theme.palette.background.paper} 100%)`,
  color: isUser
    ? theme.palette.primary.contrastText
    : theme.palette.mode === "dark"
    ? theme.palette.text.primary
    : theme.palette.text.primary,
  borderRadius: isUser
    ? theme.spacing(2, 2, 0.5, 2)
    : theme.spacing(2, 2, 2, 0.5),
  boxShadow: `0 1px 4px ${alpha(theme.palette.common.black, 0.07)}`,
  position: "relative",
  wordBreak: "break-word",
  fontSize: "0.97rem",
  minHeight: 28,
}));

export const MessageGroup = styled(Box)(({ theme, isUser }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: isUser ? "flex-end" : "flex-start",
  marginBottom: theme.spacing(0.5),
  width: "100%",
}));

export const MessageItem = styled(Box)(({ theme, isUser }) => ({
  display: "flex",
  alignItems: "flex-end",
  marginBottom: theme.spacing(0.25),
  width: "100%",
  justifyContent: isUser ? "flex-end" : "flex-start",
}));

export const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.spacing(2.5),
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    fontSize: "0.97rem",
    minHeight: 36,
    padding: 0,
    height: 40,
    "&.Mui-focused": {
      boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.13)}`,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: alpha(theme.palette.divider, 0.7),
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.light,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
    },
  },
  input: {
    color: theme.palette.text.primary,
  },
}));

export const TypingIndicator = styled(Typography)(({ theme }) => ({
  fontStyle: "italic",
  color: theme.palette.text.secondary,
  fontSize: "0.8rem",
  margin: theme.spacing(0, 0, 0, 2),
  display: "flex",
  alignItems: "center",
  "& .dot": {
    display: "inline-block",
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    backgroundColor: theme.palette.text.secondary,
    marginLeft: "3px",
    animation: "typing-dot 1.5s infinite ease-in-out",
  },
  "& .dot:nth-of-type(2)": {
    animationDelay: "0.2s",
  },
  "& .dot:nth-of-type(3)": {
    animationDelay: "0.4s",
  },
  "@keyframes typing-dot": {
    "0%, 60%, 100%": {
      transform: "translateY(0)",
    },
    "30%": {
      transform: "translateY(-4px)",
    },
  },
}));

export const OfferCardChat = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  padding: theme.spacing(2, 2.5),
  margin: theme.spacing(2, 2, 1, 2),
  minHeight: 80,
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: theme.spacing(1.5, 1),
    margin: theme.spacing(1, 0.5, 1, 0.5),
  },
}));
