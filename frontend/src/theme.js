import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#4F46E5",
      light: "#818CF8",
      dark: "#3730A3",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#10B981",
      light: "#34D399",
      dark: "#059669",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F9FAFB",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#111827",
      secondary: "#6B7280",
    },
    error: {
      main: "#EF4444",
      light: "#F87171",
      dark: "#DC2626",
    },
    success: {
      main: "#10B981",
      light: "#34D399",
      dark: "#059669",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: "-0.01em",
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    subtitle1: {
      fontSize: "1.125rem",
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: "0.875rem",
      fontWeight: 500,
      lineHeight: 1.57,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.57,
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    "none",
    "0px 1px 2px rgba(0, 0, 0, 0.06), 0px 1px 3px rgba(0, 0, 0, 0.1)",
    "0px 2px 4px rgba(0, 0, 0, 0.06), 0px 4px 6px rgba(0, 0, 0, 0.1)",
    "0px 4px 6px rgba(0, 0, 0, 0.05), 0px 10px 15px rgba(0, 0, 0, 0.1)",
    "0px 6px 15px rgba(0, 0, 0, 0.1), 0px 10px 24px rgba(0, 0, 0, 0.05)",
    "0px 12px 22px rgba(0, 0, 0, 0.1), 0px 18px 35px rgba(0, 0, 0, 0.15)",
    "0px 18px 28px rgba(0, 0, 0, 0.15), 0px 24px 42px rgba(0, 0, 0, 0.1)",
    "0px 24px 38px rgba(0, 0, 0, 0.14), 0px 30px 60px rgba(0, 0, 0, 0.12)",
    "0px 24px 38px rgba(0, 0, 0, 0.16), 0px 32px 60px rgba(0, 0, 0, 0.14)",
    "0px 28px 42px rgba(0, 0, 0, 0.18), 0px 38px 75px rgba(0, 0, 0, 0.16)",
    "0px 32px 48px rgba(0, 0, 0, 0.2), 0px 42px 80px rgba(0, 0, 0, 0.18)",
    "0px 38px 56px rgba(0, 0, 0, 0.22), 0px 48px 88px rgba(0, 0, 0, 0.2)",
    "0px 42px 64px rgba(0, 0, 0, 0.24), 0px 52px 96px rgba(0, 0, 0, 0.22)",
    "0px 48px 72px rgba(0, 0, 0, 0.26), 0px 58px 104px rgba(0, 0, 0, 0.24)",
    "0px 52px 80px rgba(0, 0, 0, 0.28), 0px 64px 112px rgba(0, 0, 0, 0.26)",
    "0px 58px 88px rgba(0, 0, 0, 0.3), 0px 70px 120px rgba(0, 0, 0, 0.28)",
    "0px 64px 96px rgba(0, 0, 0, 0.32), 0px 76px 128px rgba(0, 0, 0, 0.3)",
    "0px 70px 104px rgba(0, 0, 0, 0.34), 0px 82px 136px rgba(0, 0, 0, 0.32)",
    "0px 76px 112px rgba(0, 0, 0, 0.36), 0px 88px 144px rgba(0, 0, 0, 0.34)",
    "0px 82px 120px rgba(0, 0, 0, 0.38), 0px 94px 152px rgba(0, 0, 0, 0.36)",
    "0px 88px 128px rgba(0, 0, 0, 0.4), 0px 100px 160px rgba(0, 0, 0, 0.38)",
    "0px 94px 136px rgba(0, 0, 0, 0.42), 0px 106px 168px rgba(0, 0, 0, 0.4)",
    "0px 100px 144px rgba(0, 0, 0, 0.44), 0px 112px 176px rgba(0, 0, 0, 0.42)",
    "0px 106px 152px rgba(0, 0, 0, 0.46), 0px 118px 184px rgba(0, 0, 0, 0.44)",
    "0px 112px 160px rgba(0, 0, 0, 0.48), 0px 124px 192px rgba(0, 0, 0, 0.46)",
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 16px",
          fontSize: "0.875rem",
          fontWeight: 500,
        },
        contained: {
          boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow:
            "0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: "0.875rem",
          height: 32,
        },
      },
    },
  },
});

export default theme;
