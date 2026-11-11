import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#00ff66" },
    secondary: { main: "#38bdf8" },
    error: { main: "#ff5c7a" },
    warning: { main: "#ffd166" },
    info: { main: "#38bdf8" },
    success: { main: "#b7ffb7" },
    background: {
      default: "#000000",
      paper: "#0b120b",
    },
    text: {
      primary: "#7cff7c",
      secondary: "#b7ffb7",
    },
  },
  typography: {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid #1f3b1f",
        },
      },
    },
  },
});
