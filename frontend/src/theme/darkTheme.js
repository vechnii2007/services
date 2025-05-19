import { createTheme } from "@mui/material/styles";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#6366F1",
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
      default: "#181A20",
      paper: "#23272F",
      card: "#23272F",
      level1: "#23272F",
      level2: "#282C34",
    },
    text: {
      primary: "#F3F4F6",
      secondary: "#A1A1AA",
      disabled: "#6B7280",
      hint: "#A1A1AA",
    },
    divider: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.10)",
    placeholder: "#444857",
    error: {
      main: "#F87171",
      light: "#FCA5A5",
      dark: "#B91C1C",
    },
    success: {
      main: "#34D399",
      light: "#6EE7B7",
      dark: "#059669",
    },
    action: {
      hover: "rgba(255,255,255,0.04)",
      selected: "rgba(255,255,255,0.08)",
      disabled: "rgba(255,255,255,0.18)",
      disabledBackground: "rgba(255,255,255,0.08)",
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
    borderRadius: 20,
  },
  shadows: [
    "none",
    "0px 1px 2px rgba(0, 0, 0, 0.16), 0px 1px 3px rgba(0, 0, 0, 0.22)",
    "0px 2px 4px rgba(0, 0, 0, 0.18), 0px 4px 6px rgba(0, 0, 0, 0.22)",
    "0px 4px 6px rgba(0, 0, 0, 0.15), 0px 10px 15px rgba(0, 0, 0, 0.22)",
    "0px 6px 24px rgba(80,80,120,0.18), 0px 10px 24px rgba(0, 0, 0, 0.15)",
    "0px 12px 22px rgba(0, 0, 0, 0.22), 0px 18px 35px rgba(0, 0, 0, 0.25)",
    "0px 18px 28px rgba(0, 0, 0, 0.25), 0px 24px 42px rgba(0, 0, 0, 0.18)",
    "0px 24px 38px rgba(0, 0, 0, 0.24), 0px 30px 60px rgba(0, 0, 0, 0.22)",
    "0px 24px 38px rgba(0, 0, 0, 0.26), 0px 32px 60px rgba(0, 0, 0, 0.24)",
    "0px 28px 42px rgba(0, 0, 0, 0.28), 0px 38px 75px rgba(0, 0, 0, 0.26)",
    "0px 32px 48px rgba(0, 0, 0, 0.3), 0px 42px 80px rgba(0, 0, 0, 0.28)",
    "0px 38px 56px rgba(0, 0, 0, 0.32), 0px 48px 88px rgba(0, 0, 0, 0.3)",
    "0px 42px 64px rgba(0, 0, 0, 0.34), 0px 52px 96px rgba(0, 0, 0, 0.32)",
    "0px 48px 72px rgba(0, 0, 0, 0.36), 0px 58px 104px rgba(0, 0, 0, 0.34)",
    "0px 52px 80px rgba(0, 0, 0, 0.38), 0px 64px 112px rgba(0, 0, 0, 0.36)",
    "0px 58px 88px rgba(0, 0, 0, 0.4), 0px 70px 120px rgba(0, 0, 0, 0.38)",
    "0px 64px 96px rgba(0, 0, 0, 0.42), 0px 76px 128px rgba(0, 0, 0, 0.4)",
    "0px 70px 104px rgba(0, 0, 0, 0.44), 0px 82px 136px rgba(0, 0, 0, 0.42)",
    "0px 76px 112px rgba(0, 0, 0, 0.46), 0px 88px 144px rgba(0, 0, 0, 0.44)",
    "0px 82px 120px rgba(0, 0, 0, 0.48), 0px 94px 152px rgba(0, 0, 0, 0.46)",
    "0px 88px 128px rgba(0, 0, 0, 0.5), 0px 100px 160px rgba(0, 0, 0, 0.48)",
    "0px 94px 136px rgba(0, 0, 0, 0.52), 0px 106px 168px rgba(0, 0, 0, 0.5)",
    "0px 100px 144px rgba(0, 0, 0, 0.54), 0px 112px 176px rgba(0, 0, 0, 0.52)",
    "0px 106px 152px rgba(0, 0, 0, 0.56), 0px 118px 184px rgba(0, 0, 0, 0.54)",
    "0px 112px 160px rgba(0, 0, 0, 0.58), 0px 124px 192px rgba(0, 0, 0, 0.56)",
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#181A20",
          color: "#F3F4F6",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          padding: "8px 16px",
          fontSize: "0.875rem",
          fontWeight: 500,
          transition: "all 0.18s cubic-bezier(.4,2,.6,1)",
        },
        contained: {
          boxShadow: "0 2px 8px rgba(80,80,120,0.18)",
          backgroundColor: "#23272F",
          color: "#F3F4F6",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow:
            "0 6px 24px rgba(80,80,120,0.18), 0px 1px 2px rgba(0, 0, 0, 0.16)",
          background: "#23272F",
          transition:
            "box-shadow 0.18s cubic-bezier(.4,2,.6,1), border-radius 0.18s cubic-bezier(.4,2,.6,1)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontSize: "0.875rem",
          height: 36,
          background: "#282C34",
          color: "#F3F4F6",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255,255,255,0.08)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#23272F",
          color: "#F3F4F6",
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: "#A1A1AA",
          minWidth: 36,
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: "#F3F4F6",
          fontWeight: 500,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: "background 0.2s",
          "&:hover": {
            backgroundColor: "rgba(99,102,241,0.08)",
          },
          "&.Mui-selected, &.Mui-selected:hover": {
            backgroundColor: "rgba(99,102,241,0.16)",
            color: "#818CF8",
          },
        },
      },
    },
  },
});

export default darkTheme;
